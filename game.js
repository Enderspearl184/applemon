import Gameboy from "serverboy"
import fs from "fs"
import sharp from "sharp"

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
let saveTick = 120 // every 120 doFrame calls we check if sram is different

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
async function saveFile() {
    if (!isSaving) {
        console.log('saving file')
        isSaving=true
        lastSave = gameboy.getSaveData()
        await fs.promises.writeFile(romName + savExt, Buffer.from(lastSave))
        isSaving=false
    }
}

async function getFrame() {
    //console.log('drawing frame')
    let screen = gameboy.getScreen()

    return await sharp(Uint8Array.from(screen), {
        raw: {
            width: 160,
            height: 144,
            channels: 4
        }
    })
    .resize({
        width: 160 * scaleFactor,
        height: 144 * scaleFactor,
        kernel: "nearest"
    })
    .png()
    .toBuffer()
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
    inputData[button] = buttonHoldFrames
}

/*
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
*/

async function advanceFrame() {
    //anti soft reset
    if (inputData["A"] && inputData["B"] && inputData["START"] && inputData["SELECT"]) {
        console.log('prevented soft reset!')
        inputData["A"] = 0
        inputData["B"] = 0
        inputData["START"] = 0
        inputData["SELECT"] = 0
    }

    for (let button in inputData) {
        if (inputData[button] > 0) {
            inputData[button]--
            gameboy.pressKey(Gameboy.KEYMAP[button])
        }
    }
    gameboy.doFrame()

    saveTick--
    if (saveTick <= 0) {
        //console.log('sram check')
        saveTick = 120
        let sram = gameboy.getSaveData()
        if (!arraysEqual(sram, lastSave)) {
            saveFile()
        }
    }
}

process.on("SIGINT", function() {
    console.log("saving before shutdown");
    process.exit();
});

process.on("exit", function() {
    saveFile()
});

//run by default.
setInterval(advanceFrame, 1000/120)

export default { saveFile, input, reset, getFrame }