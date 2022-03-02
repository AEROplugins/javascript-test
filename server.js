const app = require('express')()
const express = require('express')
const { clearInterval } = require('timers')
const http = require('http').createServer(app)
const io = require('socket.io')(http)
let players = []
const sockets = []
let spawn_interval = 1000
let foods = []

app.use(express.static(`${__dirname}/html`))
app.use(express.static(`${__dirname}/html/audios`))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/html/index.html')
})

// Eventos

io.on('connection', (socket) => {

    if (socket === undefined || socket === null) return

    logNewConnection(socket)
    socket.emit('connected', "Voce esta conectado no token: " + socket.id)
    socket.broadcast.emit('player-join', socket.id)
    sockets.push(socket)

    setInterval(() => {
        socket.emit('game-state', {
            "players": players,
            "foods": foods
        })
    }, 1000 / 30)

    socket.on('disconnect', (reason) => {
        if (reason !== null || reason !== undefined) {
            logDisconnect(socket, reason)
        }
        socket.broadcast.emit("player-leave", socket.id)
        let player = getPlayerFromID(socket.id)
        players.splice(getArrayPositionPlayerFromID(socket.id), 1)
    })

    socket.on('chat-msg', (msg, info) => {

        if (msg === undefined || msg === null) return
        if (info === undefined || msg === null) return

        let transmitedID

        if (info.username === "" || info.username === undefined || info.username === null) {
            transmitedID = info.id
        } else transmitedID = info.username

        if (transmitedID === null || transmitedID === undefined) {
            return
        }

        if (msg === "*clear") {
            foods = []
        }
        if (msg === "*crazy") {
            for (let i = 0; i < getRandomInt(50, 100); i++) {
                foodGeneration()
            }
        }
        if (msg === "*start_spawn") {
            setInterval(foodGeneration, spawn_interval)
        }
        if (msg === "*reload") {
            socket.broadcast.emit('reinicio')
            socket.emit('reinicio')
        }

        socket.emit('chat-msg', msg, transmitedID, socket.id)
        socket.broadcast.emit('chat-msg', msg, transmitedID, socket.id)
    })

    socket.on('request-player', (id) => {
        let newPlayer = {
            "x": getRandomInt(0, 500),
            "y": getRandomInt(0, 500),
            "up": false,
            "down": false,
            "left": false,
            "right": false,
            "width": 30,
            "height": 30,
            "id": id,
            "speed": 4
        }
        players.push(newPlayer)
    })

    socket.on('key-up', (key) => {
        try {
            let player = getPlayerFromID(socket.id)
            if (key === "w") {
                player.up = false
            }
            if (key === "s") {
                player.down = false
            }
            if (key === "d") {
                player.right = false
            }
            if (key === "a") {
                player.left = false
            }
        } catch (e) {

        }
    })

    socket.on('key-down', (key) => {
        try {
            let player = getPlayerFromID(socket.id)
            if (key === "w") {
                player.up = true
            }
            if (key === "s") {
                player.down = true
            }
            if (key === "d") {
                player.right = true
            }
            if (key === "a") {
                player.left = true
            }
        } catch (e) {

        }
    })

})

setInterval(gameLoop, 1000 / 60)

function foodGeneration() {
    let food = createFood(getRandomInt(0, 500), getRandomInt(0, 500), 12, 12)
    foods.push(food)
}

function createFood(x, y, width, height) {
    return {
        "x": x,
        "y": y,
        "width": width,
        "height": height
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gameLoop() {

    for (let i = 0; i < players.length; i++) {
        let player = players[i]

        if (player.up) {
            player.y -= player.speed
        } else if (player.down) {
            player.y += player.speed
        }
        if (player.left) {
            player.x -= player.speed
        } else if (player.right) {
            player.x += player.speed
        }

        if (player.x > 500) {
            player.x = 500
        } else if (player.x < 0) {
            player.x = 0
        }
        if (player.y > 500) {
            player.y = 500
        } else if (player.y < 0) {
            player.y = 0
        }

        for (let i = 0; i < foods.length; i++) {
            let food = foods[i]

            let circle1 = { radius: food.width, x: food.x, y: food.y };
            let circle2 = { radius: player.width, x: player.x, y: player.y };

            let dx = circle1.x - circle2.x;
            let dy = circle1.y - circle2.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < circle1.radius + circle2.radius) {
                player.width += 2
                player.height += 2
                if (player.speed > 0.2) player.speed -= 0.03
                if (player.speed < 0.1) player.speed = 0.1
                foods.splice(i, 1)
                return
            }

        }

        for (let i = 0; i < players.length; i++) {
            let otherplayer = players[i]

            if (otherplayer.id === player.id) continue

            if (player.width > otherplayer.width + 2) {

                let circle1 = { radius: otherplayer.width, x: otherplayer.x, y: otherplayer.y };
                let circle2 = { radius: player.width, x: player.x, y: player.y };

                let dx = circle1.x - circle2.x;
                let dy = circle1.y - circle2.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < circle1.radius + circle2.radius) {
                    player.width += otherplayer.width
                    player.height += otherplayer.height
                    if (player.speed > 0.2) player.speed -= 0.03
                    if (player.speed < 0.1) player.speed = 0.1
                    players.splice(i, 1)
                    return
                }
            }
        }

    }

}

//

http.listen(3000, () => {
    console.log('Servidor Rodando porta 3000')
})

function logNewConnection(socket) {
    console.log(`🌎 Nova Conexão 🌎`)
    console.log(`  📡 TOKEN = ${socket.id} `)
}

function logDisconnect(socket, reason) {
    console.log(`🌑 Perda de Conexão 🌑`)
    console.log(`  📡 TOKEN = ${socket.id} `)
    console.log(`  👉 ${reason}`)
}

function getPlayerFromID(id) {

    for (let i = 0; i < players.length; i++) {
        let player = players[i]
        if (player.id === id) return player
    }

    return undefined
}

function getArrayPositionPlayerFromID(id) {
    for (let i = 0; i < players.length; i++) {
        let player = players[i]
        if (player.id === id) return i
    }

    return undefined
}