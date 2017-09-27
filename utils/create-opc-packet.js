/**
 * @param {Number} stripLength
 * @param {Number[]} pixels
 * @returns {Buffer}
 */
function createOpcPacket(stripLength = 1, pixels = [255, 255, 255]) {
    const header = [
        0, // channel
        0, // commands
        0, // high byte
        0, // low byte
    ]

    const packet = [
        ...header,
        ...pixels
    ]

    packet[2] = pixels.length >> 8 // high byte
    packet[3] = pixels.length & 255 // low byte

    return new Buffer(packet)
}

module.exports = createOpcPacket
