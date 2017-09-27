const { throttle } = require('lodash')
const { createSocket } = require('dgram')
const { createOpcPacket } = require('opc-via-udp')
const { clearPixels, fillPixelsWithSingleColor } = require('./visual/visual-utils')
const { getVuMicPacketStream, virtualMeter, meter } = require('./visual/vu')

const STRIP_LENGTH = 120

const udpClient = createSocket('udp4')
const throttledUdpSend = throttle(udpClient.send.bind(udpClient))

// const vuMicPacketStream = getVuMicPacketStream(STRIP_LENGTH, virtualMeter)
const vuMicPacketStream = getVuMicPacketStream(STRIP_LENGTH, meter)
vuMicPacketStream.on('data', (packet) => {
    throttledUdpSend(packet, 0, packet.length, 2342, 'portal3.bar')
})

// function clearStrip(send, stripLength) {
//     const packet = createOpcPacket(stripLength, clearPixels(stripLength))
//     send(packet, 0, packet.length, 2342, 'portal3.bar')
// }
// clearStrip(throttledUdpSend, STRIP_LENGTH);

// const packet = createOpcPacket(STRIP_LENGTH, fillPixelsWithSingleColor(STRIP_LENGTH))
// throttledUdpSend(packet, 0, packet.length, 2342, 'portal3.bar')

