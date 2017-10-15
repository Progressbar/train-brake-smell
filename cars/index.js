const { flatten } = require('lodash')
const { getSendPixels } = require('opc-via-udp')
const { randomRgbColor } = require('../visual/visual-utils')
const WebSocketServer = require('ws').Server
const portalConfig = require('../config').portals.portal3bar

const TRACK_LENGTH = portalConfig.LENGTH

const sendPixels = getSendPixels({
    port: portalConfig.PORT,
    length: portalConfig.LENGTH,
    host: portalConfig.HOST
})

const DANGERS = [
    {
        start: 90,
        length: 20,
        triggerSpeed: 7,
        color: [255, 0, 0],
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
        this.health = 15
        this.position = 0
        this.acceleration = 1.2
        this.speed = 0
        this.speedDecay = 0.98
        this.maxSpeed = 8
    }

    isMoving() {
        return this.speed > 0
    }

    getPosition() {
        return Math.round(this.position)
    }

    updatePosition() {
        this.position += this.speed

        if (this.position > TRACK_LENGTH) {
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

    takeHealth() {
        this.health -= 1
    }

    isDead() {
        return this.health <= 0
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
        car.takeHealth()
        car.position = 0
    }

    if (car.isDead()) {
        removeCar(car.id)
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
    let pixels = new Array(TRACK_LENGTH).fill([0, 0, 0])

    pixels = drawDangers(pixels)

    cars.forEach((car) => {
        const pos = car.getPosition()

        for (let i = 0; i < car.health; i++) {
            pixels[pos + i] = car.color
        }
    })

    return pixels
}

function updateGame() {
    cars.forEach(car => step(car))
}

const SV_TICK_RATE = 10
setInterval(() => {
    updateGame()
    sendPixels(flatten(getPixels()))
}, SV_TICK_RATE)

const wss = new WebSocketServer({ port: 1337 })
wss.on('connection', (ws) => {
    const id = ws._ultron.id

    addCar(id, randomRgbColor())

    ws.on('message', () => {
        const car = getCar(id)

        if (car) {
            car.accelerate()
        }
    })
})
// wss.on('close', (ws) => {
//     removeCar(ws._ultron.id)
// })
