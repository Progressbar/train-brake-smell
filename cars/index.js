const { flatten, isFunction } = require('lodash')
const { getSendPixels } = require('opc-via-udp')
const { randomRgbColor } = require('../visual/visual-utils')
const WebSocketServer = require('ws').Server
const { portal3bar, portal2bar } = require('../config').portals
const { EventEmitter } = require('events')

const TRACK_LENGTH = portal3bar.LENGTH + portal2bar.LENGTH
const IS_PLAYING_TIMEOUT = 5000

const sendPortal3Pixels = getSendPixels({
    port: portal3bar.PORT,
    length: portal3bar.LENGTH,
    host: portal3bar.HOST
})

const sendPortal2Pixels = getSendPixels({
    port: portal2bar.PORT,
    length: portal2bar.LENGTH,
    host: portal2bar.HOST
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
        length: 20,
        triggerSpeed: 8,
        color: [255, 0, 0],
    },
    {
        start: 390,
        length: 20,
        triggerSpeed: 7,
        color: [255, 0, 0],
    },
    {
        start: 440,
        length: 20,
        triggerSpeed: 8,
        color: [255, 0, 0],
    },
    {
        start: 490,
        length: 20,
        triggerSpeed: 8,
        color: [255, 0, 0],
    }
]
let cars = []

class Car extends EventEmitter {
    constructor(props) {
        super(props)
        const { id, color } = props

        this.id = id
        this.color = color
        this.health = 15
        this.position = 0
        this.lap = 0
        this.acceleration = 2
        this.speed = 0
        this.speedDecay = 0.98
        this.isBeingKilled = false
        this.maxSpeed = 8
        this.lastReceivedActionAt = Date.now()
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
            this.lap++
            this.emit('lap-change')
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

    killCar() {
        if (this.isBeingKilled) {
            return
        }

        this.isBeingKilled = true

        const stop = setInterval(() => {
            this.takeHealth()

            if (this.health < 0) {
                if (isFunction(stop)) {
                    stop()
                    console.log('Killed car')
                }
            }
        }, 100)
    }

    isDead() {
        return this.health <= 0
    }

    receivedAction() {
        this.lastReceivedActionAt = Date.now()
    }

    isPlaying() {
        return (Date.now() - this.lastReceivedActionAt) < IS_PLAYING_TIMEOUT
    }

    accelerate() {
        this.receivedAction()

        if (this.speed > this.maxSpeed) {
            return this
        }

        if (this.speed === 0) {
            this.speed = 0.5
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
    const car = new Car({ id, color })
    cars.push(car)
    return car
}

function removeCar(id) {
    cars = cars.filter(car => car.id !== id)
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

    if (!car.isPlaying()) {
        car.killCar()
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
    // console.log(cars.length)
}

const SV_TICK_RATE = 10
setInterval(() => {
    updateGame()
    const pixels = flatten(getPixels())
    const middle = pixels.length / 2
    const firstHalf = pixels.slice(0, middle)
    const secondHalf = pixels.slice(middle, pixels.length)

    sendPortal3Pixels(firstHalf)
    sendPortal2Pixels(secondHalf)
}, SV_TICK_RATE)

const wss = new WebSocketServer({ port: 1337 })
wss.on('connection', (ws) => {
    const id = ws._ultron.id

    const mainCar = addCar(id, randomRgbColor())

    ws.on('message', (data) => {
        const car = getCar(id)

        if (car) {
            car.accelerate()
        }
    })

    const handleLapChange = () => {
        const car = getCar(id)
        if (car) {
            ws.send(car.lap, (e) => {
                if (e) {
                    console.error('ERR:', e.message)
                }
            })
        }
    }
    mainCar.on('lap-change', handleLapChange)

})
