const { flattenDeep } = require('lodash')
const { createOpcPacket } = require('opc-via-udp')
const { createSocket } = require('dgram')
const WSServer = require('ws').Server

const STRIP_LENGTH = 120

const udpClient = createSocket('udp4')

// function beatMaker(stripLength) {
//
// }

const panels = [
    new Array(STRIP_LENGTH).fill([0, 0, 0]),
    new Array(STRIP_LENGTH).fill([0, 0, 0]),
    new Array(STRIP_LENGTH).fill([0, 0, 0]),
]

const wss = new WSServer({ port: 14044 })
wss.on('connection', (ws) => {
    console.log('CONNECTION')

    ws.on('message', (rawMessage) => {
        const message = JSON.parse(rawMessage)
        const { cmd } = message

        if (cmd === 'toggle') {

        }

        if (cmd === 'getpanel') {
            const { panel } = message
            console.log('panel', panels[panel])
            return ws.send(JSON.parse(panels[panel]))
        }
    })
})

// module.exports = beatMaker
