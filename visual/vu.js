const createOpcPacket = require('../utils/create-opc-packet')
const { makeRgbGradientArray } = require('./visual-utils')
const LineIn = require('line-in')
const VUmeter = require('vu-meter')
const through2 = require('through2')

function getVuBgPixels(stripLength) {
    const startColor = '#00FF00'
    const endColor = '#FF0000'

    return makeRgbGradientArray(startColor, endColor, stripLength)
}

function normalizeVolume(volume) {
    return volume > 100 ? 100 : Math.floor(volume)
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

    return [
        ...pixels,
        ...pixels.reverse()
    ]
}

function toOpcPacket(stripLength, meter) {
    return through2.obj((data, enc, cb) => {
        const leftChannel = data[0]
        const micStrength = (Math.max(leftChannel + 60, 0) / 60) * 100
        const pixels = meter(stripLength, micStrength)

        cb(null, createOpcPacket(stripLength, pixels))
    });
}

function getVuMicPacketStream(stripLength, meter) {
    const lineIn = new LineIn()
    const vuMeter = new VUmeter()
    const opcPipe = toOpcPacket(stripLength, meter)

    return lineIn.pipe(vuMeter).pipe(opcPipe)
}

module.exports = {
    meter,
    virtualMeter,
    getVuMicPacketStream
}
