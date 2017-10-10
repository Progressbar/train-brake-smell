const { flattenDeep } = require('lodash')
const { createOpcPacket } = require('opc-via-udp')

function knightRider(stripLength, bg, eyePos, cb) {
    let newEyePos;

    if (eyePos <= stripLength) {
        newEyePos = eyePos + 1;
    }

    if (eyePos >= stripLength) {
        newEyePos = 0;
    }

    for (let i = 0; i <= 3; i++) {
        bg[newEyePos + i] = [255, 0, 0]
    }

    setTimeout(() => {
        knightRider(stripLength, bg, newEyePos, cb)
    }, 5)

    cb(createOpcPacket(stripLength, flattenDeep(bg)))
}

module.exports = knightRider
