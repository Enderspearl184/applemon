import Gameboy from "serverboy"
import fs from "fs"
import { PNG } from 'pngjs';

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

gameboy.loadRom(rom,save);

let isSaving=false
function saveFile() {
    if (!isSaving) {
        console.log('saving file')
        isSaving=true
        fs.writeFileSync(romName + savExt, Buffer.from(gameboy.getSaveData()))
        isSaving=false
    }
}

function getFrame() {
    console.log('drawing frame')
    let screen = gameboy.getScreen()
    var png = new PNG({ width: 160, height: 144 });
    for (let i=0; i<screen.length; i++) {
       png.data[i] = screen[i];
    }
    
    return PNG.sync.write(png);
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

function advanceFrames(frameCount) {
    let inputs = inputData
    inputData = {}
    console.log('advancing')
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
}


process.on("SIGINT", function() {
    console.log("saving before shutdown");
    process.exit();
});

process.on("exit", function() {
    saveFile()
});

export default { advanceFrames, saveFile, input, reset, getFrame }