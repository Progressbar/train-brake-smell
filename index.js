const { getSendPixels } = require('opc-via-udp')
const WebSocket = require('ws')
const { flatten } = require('lodash')
const { clearPixels, fillPixelsWithSingleColor, randomRgbColor } = require('./visual/visual-utils')
const { getVuMicPacketStream, virtualMeter, meter, easeIn } = require('./visual/vu')

const portalConfig = require('./config').portals.portal3bar

const sendPixels = getSendPixels({
    port: portalConfig.PORT,
    length: portalConfig.LENGTH,
    host: portalConfig.HOST
})

// easeIn(portalConfig.LENGTH, sendPixels)

// const vuMicPacketStream = getVuMicPacketStream(portalConfig.LENGTH, virtualMeter)
const vuMicPacketStream = getVuMicPacketStream(portalConfig.LENGTH, meter)
vuMicPacketStream.on('data', pixels => sendPixels(flatten(pixels)))

// const wss = new WebSocket.Server({ port: 8080 })
// wss.on('connection', (ws) => {
//     ws.on('message', (message) => {
//         const pixels = fillPixelsWithSingleColor(portalConfig.LENGTH, [0, 0, 0])
//         const pixelPos = (message/100) * portalConfig.LENGTH
//
//         for (let i = 0; i < 5; i++) {
//          pixels[pixelPos] = [255, 255, 255]
//         }
//         sendPixels(flatten(pixels))
//     })
// })
