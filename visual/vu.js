const { flatten } = require('lodash')
const { createOpcPacket } = require('opc-via-udp')
const { makeRgbGradientArray, fillPixelsWithSingleColor, convertHexColorToRgbArray, clearPixels, randomRgbColor } = require('./visual-utils')
const VUmeter = require('vu-meter')
const through2 = require('through2')
const mic = require('mic')
const _ = require('lodash')
const bezier = require('cubic-bezier')
const http = require('http')
const fetch = require('node-fetch')

function getVuBgPixels(stripLength) {
    const startColor = '#00FF00'
    const endColor = '#FF0000'

    return makeRgbGradientArray(startColor, endColor, stripLength)
}

function normalizeVolume(volume) {
    return volume > 100 ? 100 : Math.floor(volume)
}

function calcMicStrength(micData) {
    const magicNumber = 50; // 60
    const strength = (Math.max(micData + magicNumber, 0) / magicNumber) * 100;

    // return strength < 3 ? 0 : strength;
    return strength;
}

function calcNeededStripLength(stripLength, volume) {
    return Math.floor((stripLength)*(volume/100))
}

function meter(stripLength, rawVolume) {
    const volume = normalizeVolume(rawVolume)
    const pixels = getVuBgPixels(stripLength)
    const neededStripLength = calcNeededStripLength(stripLength, volume)

    pixels.fill([0, 0 ,0], neededStripLength, stripLength)

    return pixels;
}

function virtualMeter(stripLength, rawVolume) {
    const virtualLength = stripLength/2
    const volume = normalizeVolume(rawVolume)
    const pixels = getVuBgPixels(virtualLength)
    const neededStripLength = calcNeededStripLength(stripLength, volume)

    pixels.fill([0, 0, 0], neededStripLength, stripLength)

    return [ ...pixels, ...pixels.reverse() ]
}

function getMicVuOpcPipe(stripLength, meter) {
    return through2.obj({ objectMode: true }, (data, enc, cb) => {
    
        const micStrength = calcMicStrength(data[0])
        const pixels = meter(stripLength, micStrength)

        cb(null, pixels)
    })
}

function getVuMicPacketStream(stripLength, meter) {
    const vuMeter = new VUmeter()
    const micVuOpcPipe = getMicVuOpcPipe(stripLength, meter)
    const micInstance = mic({
        debug: false,
        rate: '32000',
        bitwidth: '16',
        buffer: 300,
        device: 'hw:1,0',
    })
    const micStream = micInstance.getAudioStream()

    micInstance.start()

    return micStream.pipe(vuMeter).pipe(micVuOpcPipe)
}

function easeIn(stripLength, sendPixels) {
    // const easeIn = bezier(0.42, 0, 1.0, 1.0, 1000)
    // const easeIn = bezier(0.455, 0, 0.515, 0.955)
    const easeIn = bezier(0, 0, 1, 1, 1000)
    for (let t = 0; t <= 1; t += 0.001) {
        const pixels = clearPixels(stripLength)
        const timing = Math.round(easeIn(t) * 100)
        const position = (stripLength / 100) * timing
        console.log(position)
        pixels[position] = [255, 255, 0];
        sendPixels(flatten(pixels))
    }
}


module.exports = {
    meter,
    virtualMeter,
    getVuMicPacketStream,
    easeIn
}
