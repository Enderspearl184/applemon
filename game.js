import Gameboy from "serverboy"
import fs from "fs"
import { PNG } from 'pngjs';

const scaleFactor = 3
let inputData = {}

let romName = process.env.romName || './roms/crystal'
let romExt = process.env.romExt || '.gbc'
let savExt = process.env.savExt || '.sav'
let buttonHoldFrames = process.env.buttonHoldFrames || 30

console.log(`loading rom ${romName}${romExt} with save ext ${savExt}`)
let gameboy = new Gameboy();
let rom = fs.readFileSync(romName + romExt);

let save


if (fs.existsSync(romName + savExt)) {
    save = fs.readFileSync(romName + savExt)
}

let lastSave = []
function arraysEqual(a, b) {
    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

gameboy.loadRom(rom,save);

let isSaving=false
function saveFile() {
    if (!isSaving) {
        console.log('saving file')
        isSaving=true
        lastSave = gameboy.getSaveData()
        fs.writeFileSync(romName + savExt, Buffer.from(lastSave))
        isSaving=false
    }
}

async function getFrame() {
    console.log('drawing frame')
    let screen = gameboy.getScreen()

    //super great integer scaling fr
    let resizedArr = []
    let resizedRow = []
    let index = 0
    for (let i = 0; i < 144; i++) {
        for (let j = 0; j < 160; j++) {
            for (let k = 0; k < scaleFactor; k++) {
                resizedRow.push(screen[index])
                resizedRow.push(screen[index+1])
                resizedRow.push(screen[index+2])
                resizedRow.push(screen[index+3])
            }
            index+=4
        }
        for (let k = 0; k < scaleFactor; k++) {
            resizedArr = resizedArr.concat(resizedRow)
        }
        resizedRow = []
    }

    var png = new PNG({ width: 160 * scaleFactor, height: 144 * scaleFactor});
    for (let i=0; i<resizedArr.length; i++) {
       png.data[i] = resizedArr[i];
    }
    
    let buf = PNG.sync.write(png);

    return buf
}

function reset() {
    saveFile()
    if (fs.existsSync(romName + savExt)) {
        save = fs.readFileSync(romName + savExt)
    } else {
        save = undefined
    }
    gameboy.loadRom(rom,save)
}

function input(button) {
    inputData[button] = true
}

async function advanceFrames(frameCount) {
    let inputs = inputData
    inputData = {}
    console.log(`advancing with buttons: ${Object.keys(inputs).join()}`)
    let buttonTimer = buttonHoldFrames
    for (let i = 0; i < frameCount; i++){
        for (let pressed in inputs) {
            gameboy.pressKey(Gameboy.KEYMAP[pressed])
        }
        buttonTimer --
        if (buttonTimer <= 0) {
            inputs = {}
        }
        gameboy.doFrame();
    }

    //check sram
    let sram = gameboy.getSaveData()
    if (!arraysEqual(sram, lastSave)) {
        saveFile()
    }
}


process.on("SIGINT", function() {
    console.log("saving before shutdown");
    process.exit();
});

process.on("exit", function() {
    saveFile()
});

export default { advanceFrames, saveFile, input, reset, getFrame }