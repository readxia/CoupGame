const express = require('express')
const app = express()
const http = require('http')
const { Server } = require('socket.io')
const port = process.env.PORT || 3001
const cors = require('cors')
const server = http.createServer(app)

app.use(cors())
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
    }
})

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = arr[i]
        arr[i] = arr[j]
        arr[j] = temp
    }
    return arr
}

function usersAlive() {
    let ret = 0
    for (let obj of turnOrder) {
        for (let card of obj.cards) {
            if (card.alive) {
                ret += 1
                console.log('this should fire once per each ALIVE person')
                break
            }
        }
    }
    console.log(`users alive: ${ret}`)
    return ret
}

let deck = ['duke', 'duke', 'duke',
            'captain', 'captain', 'captain',
            'assassin', 'assassin', 'assassin',
            'contessa', 'contessa', 'contessa',
            'ambassador', 'ambassador', 'ambassador']
deck = shuffle(deck)
console.log(deck)

let aliveCount = 0

//NEED TO RESET passCount and queuedPlayerAction
// playerid, action made, receipient player
let queuedPlayerAction = {id: '', action: '', player: ''}
let passCount = 0
let currTurnID = ''
let turnOrder = []
let turn = 0


io.on('connection', (socket) => {
    console.log(`user connected: ${socket.id}`)

    const id = socket.id
    //emit the id to the connected client
    socket.emit('id', id)

    // gets username right when someone connects, and returns the players list
    socket.on('sendUsername', (username) => {
        turnOrder.push({username: username, cards: [{char: deck.pop(), alive: true}, {char: deck.pop(), alive: true}], coins: 2, id: id})
        io.sockets.emit('receiveTurnOrder', turnOrder)
        // console.log(turnOrder)
        // console.log(turnOrder[0].cards)
    })

    //WORK IN PROGRESS
    socket.on('startGame', () => {
        //set current turn on the person in first
        currTurnID = turnOrder[0].id
        // send everyone the ID of the player with the current turn, and their username
        io.sockets.emit('currTurn', currTurnID, getUsername(currTurnID))
        console.log('Game started')
    })

    socket.on('sendChat', (message) => {
        socket.broadcast.emit('receiveChat', message)
    })

    socket.on('showdeck', () => {
        console.log(deck)
        for (let obj of turnOrder) {
            console.log(obj.cards)
        }
        aliveCount = usersAlive()
    })

    socket.on('discardChar', (char, challengedChar, challengerID) => {
        // if the user picks the RIGHT character
        if (char === challengedChar) {
            io.to(challengerID).emit('loseCard', '', '')
            //make the challenger lose a card
            //give the user a new card
            let newTurnOrder = turnOrder.map((obj) => {
                if (obj.id === id) {
                    for (let card of obj.cards) {
                        if (card.char === char && card.alive) {
                            deck = shuffle(deck)
                            let temp = card.char
                            card.char = deck.pop()
                            deck.push(temp)
                            // run the action that the user was supposed to get
                            if (challengedChar === 'duke') {
                                tax(id, false)
                            }
                            else if (challengedChar === 'ambassador') {
                                exchange(id)
                            }







                            break
                        }
                    }
                }
                return obj
            })
        }
        // if the user picks the WRONG character
        else {
            let newTurnOrder = turnOrder.map((obj) => {
                if (obj.id === id) {
                    for (let card of obj.cards) {
                        if (card.char === char && card.alive) {
                            card.alive = false
                            console.log(`${card.char} has been killed`)
                            io.sockets.emit('receiveChat', {username: 'server', text: `${getUsername(id)}'s ${card.char} has been killed`})
                            break
                        }
                    }
                }
                return obj
            })
            turnOrder = newTurnOrder
            turn += 1
            currTurnID = turnOrder[turn % (turnOrder.length)].id
            io.sockets.emit('currTurn', currTurnID, getUsername(currTurnID))
            io.sockets.emit('getTurn', turn)
            io.sockets.emit('receiveTurnOrder', turnOrder)
        }

    })

    socket.on('challenge', (challengerID, personBeingChallengedID, prompt) => {
        io.sockets.emit('receiveChat', {username: 'server', text: `${getUsername(challengerID)} has challenged the ${prompt} from ${getUsername(personBeingChallengedID)}!`})
        //close the challengeMenu's for everyone
        if (prompt === 'TAX') {
            io.to(personBeingChallengedID).emit('loseCard', 'duke', challengerID)
        }
        if (prompt === 'EXCHANGE') {
            io.to(personBeingChallengedID).emit('loseCard', 'ambassador', challengerID)
        }







    })

    socket.on('pass', (requestorID, prompt) => {
        console.log('passed')
        passCount += 1
        if (passCount === (usersAlive() - 1)) {
            if (prompt === 'TAX') {
                tax(requestorID, true)
            }
            else if (prompt === 'EXCHANGE') {
                exchange(requestorID)
            }








        }
    })

    //ACTION REQUESTS
    socket.on('actionRequest', (player, action) => {
        // reset variables to prep for an action vote
        // queuedPlayerAction = {id: id, action: action, player: player}
        passCount = 0

        if (action === 'Income') {
            income(id)
        }
        else if (action === 'Tax') {
            io.sockets.emit('receiveChat', {username: 'server', text: `${getUsername(id)} is attempting to TAX`})
            socket.broadcast.emit('taxRequest', getUsername(id), id)
        }
        else if (action === 'Exchange') {
            io.sockets.emit('receiveChat', {username: 'server', text: `${getUsername(id)} is attempting to EXCHANGE`})
            socket.broadcast.emit('exchangeRequest', getUsername(id), id)
        }














    })

    // handles users disconnecting from game, puts cards back in deck and shuffles them
    socket.on('disconnect', (reason) => {
        console.log(`${id} has disconnected`)
        for (let obj of turnOrder) {
            if (obj.id === id) {
                deck.push(obj.cards[0].char)
                deck.push(obj.cards[1].char)
            }
        }
        // console.log(deck)
        deck = shuffle(deck)

        socket.broadcast.emit('receiveChat', {username: 'server', text: `${getUsername(id)} has disconnected...`})
        //deletes user with matching id from turn order list
        let deletedList = turnOrder.filter((obj) => {
            if (obj.id !== id) {
                return obj
            }
        })
        console.log(deletedList)
        turnOrder = deletedList

        io.sockets.emit('receiveTurnOrder', turnOrder)
    })

    function getUsername(id) {
        let username = ''
        for (let obj of turnOrder) {
            if (obj.id === id) {
                username = obj.username
                break
            }
        }
        return username
    }

    function income(requestorID) {
        let newTurnOrder = turnOrder.map((obj) => {
            if (obj.id === requestorID) {
                obj.coins += 1
                io.sockets.emit('receiveChat', {username: 'server', text: `${getUsername(id)} used INCOME`})
            }
            return obj
        })
        turnOrder = newTurnOrder
        //INCREMENT THE TURN
        turn += 1
        io.sockets.emit('getTurn', turn)

        currTurnID = turnOrder[turn % (turnOrder.length)].id
        io.sockets.emit('currTurn', currTurnID, getUsername(currTurnID))
        io.sockets.emit('receiveTurnOrder', turnOrder)
        
    }

    function tax(requestorID, endTurn) {
        let newTurnOrder = turnOrder.map((obj) => {
            if (obj.id === requestorID) {
                obj.coins += 3
                io.sockets.emit('receiveChat', {username: 'server', text: `${getUsername(requestorID)} used TAX`})

            }
            return obj
        })

        //send new turnOrder data to everyone
        turnOrder = newTurnOrder
        io.sockets.emit('receiveTurnOrder', turnOrder)
        
        // check if you want the turn to end, or if you are still waiting on someone to discard a card
        if (endTurn) {
            turn += 1
            currTurnID = turnOrder[turn % (turnOrder.length)].id
            io.sockets.emit('currTurn', currTurnID, getUsername(currTurnID))
            io.sockets.emit('getTurn', turn)
        }
    }

    function exchange(requestorID, endTurn) {
        
    }
})

server.listen(port, ()=> console.log(`server on port ${port}`))