const { createSocket } = require('dgram')
const { getSendPixels } = require('../utils')
const { randomRgbColor } = require('../visual/visual-utils')
const WebSocketServer = require('ws').Server
const portalConfig = require('../config').portals.portal3bar

const sendPixels = getSendPixels(createSocket('udp4'), portalConfig)
const { LENGTH } = portalConfig
const SV_TICK_RATE = 20
const DANGERS = [
    {
        start: 90,
        length: 20,
        triggerSpeed: 7,
        color: [255, 255, 0],
    },
    {
        start: 190,
        color: [255, 0, 0],
        triggerSpeed: 8,
        length: 20,
    }
]
const cars = []

class Car {
    constructor(props) {
        const { id, color } = props

        this.id = id
        this.color = color
        this.position = 0
        this.acceleration = 1.1
        this.speed = 0
        this.speedDecay = 0.98
        this.maxSpeed = 10
    }

    isMoving() {
        return this.speed > 0
    }

    getPosition() {
        return Math.round(this.position)
    }

    updatePosition() {
        this.position += this.speed

        if (this.position > LENGTH) {
            this.position = 0
        }

        return this
    }

    shouldBeKicked() {
        let should = false

        DANGERS.forEach((danger) => {
            if (this.position >= danger.start &&
                this.position <= (danger.start + danger.length)) {
                if (this.speed > danger.triggerSpeed) {
                    should = true
                }
            }
        })

        return should
    }

    accelerate() {
        if (this.speed > this.maxSpeed) {
            return this
        }

        if (this.speed === 0) {
            this.speed = 0.4
        }

        if (this.speed > 0) {
            this.speed *= this.acceleration
        }

        return this
    }

    decelarate() {
        if (this.speed < 0.1) {
            this.speed = 0

            return this
        }

        this.speed *= this.speedDecay

        return this
    }
}

function getCar(id) {
    return cars.find(car => car.id === id)
}

function addCar(id, color) {
    cars.push(new Car({ id, color }))
}

function removeCar(id) {
    const carIndex = cars.findIndex(car => car.id === id)

    if (carIndex) {
        cars.splice(carIndex, 1)
    }
}

function step(car) {
    if (!car.isMoving()) {
        car.speed = 0
    } else {
        car.decelarate()
    }

    car.updatePosition()

    if (car.shouldBeKicked()) {
        car.position = 0
    }
}

function drawDangers(pixels) {
    DANGERS.forEach((danger) => {
        for (let i = danger.start; i <= (danger.start + danger.length); i++) {
            pixels[i] = danger.color
        }
    })

    return pixels
}

function getPixels() {
    let pixels = new Array(LENGTH).fill([0, 0, 0])

    pixels = drawDangers(pixels)

    cars.forEach((car) => {
        const position = car.getPosition()
        pixels[position] = car.color
    })

    return pixels
}

/**
 * game is running @ SV_TICK_RATE
 * meaning game can update+output state that many times
 *
 */
function updateGame() {
    cars.forEach((car) => {
        step(car)
        // console.log(car)
    })
}

setInterval(() => {
    updateGame()
    sendPixels(getPixels())
}, SV_TICK_RATE)

const wss = new WebSocketServer({ port: 1337 })
wss.on('connection', (ws) => {
    addCar(ws._ultron.id, randomRgbColor())

    ws.on('message', () => {
        const car = getCar(ws._ultron.id)
        car.accelerate()
    })
})
// wss.on('close', (ws) => {
//     removeCar(ws._ultron.id)
// })
