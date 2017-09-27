const { throttle } = require('lodash')
const { createSocket } = require('dgram')
const createOpcPacket = require('./utils/create-opc-packet')
const { clearPixels, fillPixelsWithSingleColor } = require('./visual/visual-utils')
const { getVuMicPacketStream, virtualMeter, meter } = require('./visual/vu')

const STRIP_LENGTH = 120
const STRIP_LENGTH_V = STRIP_LENGTH/2

const udpClient = createSocket('udp4')
const throttledUdpSend = throttle(udpClient.send.bind(udpClient), 80)

// const vuMicPacketStream = getVuMicPacketStream(STRIP_LENGTH_V, virtualMeter)

// const vuMicPacketStream = getVuMicPacketStream(STRIP_LENGTH, meter)
// vuMicPacketStream.on('data', (packet) => {
//     throttledUdpSend(packet, 0, packet.length, 2342, 'portal3.bar', (error) => {
//         console.error(error)
//     })
// })

function clearStrip(stripLength) {
    const packet = createOpcPacket(STRIP_LENGTH, clearPixels(STRIP_LENGTH))
    throttledUdpSend(packet, 0, packet.length, 2342, 'portal3.bar')
}

clearStrip(STRIP_LENGTH);


