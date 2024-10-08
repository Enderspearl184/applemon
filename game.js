import fs from "fs"
import { PNG } from 'pngjs';
import {start, GameBoyJoyPadEvent, saveSRAM, saveRTC} from "./emulator/GameBoyIO.js"
import { createCanvas } from "canvas"
const scaleFactor = 3
let inputData = {}

let romName = process.env.romName || './roms/crystal'
let romExt = process.env.romExt || '.gbc'
let savExt = process.env.savExt || '.sav'
let buttonHoldFrames = process.env.buttonHoldFrames || 15

console.log(`loading rom ${romName}${romExt} with save ext ${savExt}`)

let rom = fs.readFileSync(romName + romExt);
let romArrayBuf = new Uint8Array(rom.buffer.slice(rom.byteOffset, rom.byteOffset + rom.byteLength))

let canvas = createCanvas(160, 144)
let scaleCanvas = createCanvas(160 * scaleFactor, 144 * scaleFactor)
let scaleContext = scaleCanvas.getContext('2d')
scaleContext.imageSmoothingEnabled = false
scaleContext.scale(scaleFactor, scaleFactor)

let save

if (fs.existsSync(romName + savExt)) {
    save = fs.readFileSync(romName + savExt)
    save = new Uint8Array(save.buffer.slice(save.byteOffset, save.byteOffset + save.byteLength))
}


//start the gameboy
start(canvas, romArrayBuf, save, [])

let lastSave = []
async function arraysEqual(a, b) {
    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

let isSaving=false
async function saveFile() {
    if (!isSaving) {
        console.log('saving file')
        isSaving=true
        lastSave = saveSRAM()
        await fs.promises.writeFile(romName + savExt, Buffer.from(lastSave))
        await fs.promises.writeFile(romName + '.rtc.json', JSON.stringify(saveRTC()))
        isSaving=false
    }
}

async function getFrame() {
    scaleContext.drawImage(canvas, 0, 0)
    return scaleCanvas.toBuffer('image/png')
}

function reset() {
    saveFile()
    if (fs.existsSync(romName + savExt)) {
        save = fs.readFileSync(romName + savExt)
        save = new Uint8Array(save.buffer.slice(save.byteOffset, save.byteOffset + save.byteLength))
    } else {
        save = undefined
    }
    
}

function input(button) {
    //don't allow soft resetting.
    let anti_sr = Object.keys(inputData)
    anti_sr.push(button)
    if (anti_sr.includes('A') && anti_sr.includes('B') && anti_sr.includes('START') && anti_sr.includes('SELECT')) {
        return
    }
    console.log(`pressing button ${button}`)
    clearTimeout(inputData[button])
    GameBoyJoyPadEvent(button, true)
    inputData[button] = setTimeout(()=>{
        console.log(`unpressing button ${button}`)
        GameBoyJoyPadEvent(button, false)
    }, 1000/buttonHoldFrames)
}

setInterval(async()=>{
    if (!await arraysEqual(lastSave, saveSRAM())) {
        saveFile()
    }
}, 1000/60)

process.on("SIGINT", function() {
    console.log("saving before shutdown");
    process.exit();
});

process.on("exit", function() {
    saveFile()
});

//run by default.
//setInterval(advanceFrame, 1000/120)

export default { saveFile, input, reset, getFrame }