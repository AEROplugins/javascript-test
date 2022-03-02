const socket = io()

const consoleInput = document.getElementById('console-input')
const consoleInputButton = document.getElementById('console-input-sender')
const consoleUsernameInput = document.getElementById('username')
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
const c_width = 500
const c_height = 500
let gameState;

socket.on('connected',(welcome) => {
    console.log(welcome)
    $('#token-header').html(socket.id)
    serverLog(`<span class="chat-sucess">${welcome}</span>`)
    console.log(`TOKEN = ${socket.id}`)

    socket.emit('request-player', socket.id) // criando player
})

socket.on('disconnect', (reason) => {
    console.log(reason)
    $('#token-header').html('VOCE ESTA OFFLINE')
    serverLog(`<span class="chat-erro">Voce caiu do Servidor</span>`)
})

socket.on('chat-msg', (msg,transmitedID,id) => {

    if(id !== socket.id) {
        playSound('/audios/zap.mp3')
    }

    playerMSG(`<span class="chat-msg">${transmitedID} <span style="color: blue;">>></span> ${msg}</span>`)
})

socket.on('player-join', (otherID) => {
    serverLog(`<span class="chat-notify">${otherID} Entrou no Servidor!</span>`)
})

socket.on('player-leave',(otherID) => {
    serverLog(`<span class="chat-notify">${otherID} Saiu do Servidor!</span>`)
})

socket.on('game-state',(game) => {
    resetCanvas()
    console.log(game)
    let players = game.players
    let foods = game.foods

    for(let i=0;i < foods.length;i++) {
        let food = foods[i]
        drawFood(food)
    }

    for(let i=0;i < players.length;i++) {
        let player = players[i]
        drawPlayer(player)
    }

})

socket.on('reinicio',() => {
    socket.disconnect()
    socket.connect()
})

function resetCanvas() {
    ctx.fillStyle = "black"
    ctx.fillRect(0,0,c_width,c_height)
}

function drawPlayer(player) {
    let circle = new Path2D();
    ctx.fillStyle = "white"
    circle.arc(player.x, player.y, player.width, 0, 2 * Math.PI);
    ctx.fill(circle);
}

function drawFood(food) {
    let circle = new Path2D();
    ctx.fillStyle = "#ccc"
    circle.arc(food.x, food.y, food.width, 0, 2 * Math.PI);
    ctx.fill(circle);
}

consoleInput.addEventListener('keyup', (event) => {
    console.log(event.key)
    if(event.key === "Enter") {
        consoleInputButton.onclick()
    }

})


document.addEventListener('keyup',(event) => {
    socket.emit('key-up',event.key)
})

document.addEventListener('keydown',(event) => {
    socket.emit('key-down',event.key)
})

consoleInput.addEventListener('keypress', (event) => {
    if(!checkChar(event)) {
        event.preventDefault();
    }
})

consoleUsernameInput.addEventListener('keypress', (event) => {
    if(!checkChar(event)) {
        event.preventDefault();
    }
})

consoleInput.addEventListener('paste', (event) => {
    event.preventDefault();
})

consoleUsernameInput.addEventListener('paste', (event) => {
    event.preventDefault();
})

consoleInputButton.onclick = () => {
    let inputContent = consoleInput.value
    if(inputContent === undefined || inputContent === "") {
        return
    }
    consoleInput.value = "" // resetar texto do input

    console.log(inputContent)
    playSound('/audios/sendmsg.mp3')

    socket.emit('chat-msg',inputContent,{
        "id": socket.id,
        "username": consoleUsernameInput.value
    })

}

function checkChar(e) {
    let char = String.fromCharCode(e.keyCode)

    console.log(char)
    let pattern = /^[a-zA-Z\s-_.,'-9?]*$/
    if(char.match(pattern)) {
        return true;
    }
}


function serverLog(msg) {
    $('#chat-log').append(`<p>${msg}</p>`)
}

function playerMSG(msg) {
    $('#chat-log').append(`<p>${msg}</p>`)
}

function playSound(path) {
    let audio = new Audio(path)
    audio.play()
}