const { flattenDeep } = require('lodash')
const { createOpcPacket } = require('opc-via-udp')

function getSendPixels(client, portalConfig) {
	return (pixels) => {
		const packet = createOpcPacket(portalConfig.LENGTH, flattenDeep(pixels))
		client.send(packet, 0, packet.length, portalConfig.PORT, portalConfig.HOST)
	}
}

module.exports = {
	getSendPixels
}
