const { createSocket } = require('dgram')
const WebSocket = require('ws')

const { clearPixels, fillPixelsWithSingleColor, randomRgbColor } = require('./visual/visual-utils')
const { getVuMicPacketStream, virtualMeter, meter, easeIn, travellingDots } = require('./visual/vu')
const { getSendPixels } = require('./utils')

const CONFIG = require('./config')
const { portal3bar } = CONFIG.portals

const sendPixels = getSendPixels(createSocket('udp4'), portal3bar)

// easeIn(STRIP_LENGTH, udpClient)
// travellingDots(STRIP_LENGTH, udpClient)

// const vuMicPacketStream = getVuMicPacketStream(portal3bar.LENGTH, virtualMeter)
// const vuMicPacketStream = getVuMicPacketStream(portal3bar.LENGTH, meter)
// vuMicPacketStream.on('data', sendPixels)

const wss = new WebSocket.Server({ port: 8080 })
wss.on('connection', (ws) => {
    let lastGamma = 0

    ws.on('message', (message) => {
        const pixels = fillPixelsWithSingleColor(STRIP_LENGTH, [0, 0, 0])
        const pixelPos = (message/100) * STRIP_LENGTH

        for (let i = 0; i < 5; i++) {
         pixels[pixelPos] = [255, 255, 255]
        }
        const packet = createOpcPacket(STRIP_LENGTH, flattenDeep(pixels))
        udpClient.send(packet, 0, packet.length, 2342, 'portal3.bar')
    })
})
