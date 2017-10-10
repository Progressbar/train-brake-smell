const tinycolor = require('tinycolor2')
const tinygradient = require('tinygradient')

function toRgbArray(rgbObject) {
    return [ rgbObject.r, rgbObject.g, rgbObject.b ]
}

function randomRgbColor() {
    return toRgbArray(tinycolor.random().toRgb())
}

function makeRgbGradientArray(startColor, endColor, steps) {
    const colors = tinygradient([startColor, endColor]).rgb(steps)

    return colors.map(color => toRgbArray(color.toRgb()))
}

function convertHexColorToRgbArray(color) {
    return toRgbArray(tinycolor(color).toRgb())
}

function fillPixelsWithSingleColor(stripLength = 1, color = randomRgbColor()) {
    return new Array(stripLength).fill(color)
}

function clearPixels(stripLength) {
    return fillPixelsWithSingleColor(stripLength, [0, 0, 0])
}

module.exports = {
    clearPixels,
    toRgbArray,
    convertHexColorToRgbArray,
    fillPixelsWithSingleColor,
    makeRgbGradientArray,
    randomRgbColor,
}
