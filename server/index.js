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
let passCount = 0
let currTurnID = ''
let turnOrder = []
let turn = 0

let blockedID = ''
let vicID = ''
let doubleKill = false



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

    socket.on('block', (blockingChar, blockerID) => {
        //emit to everyone to open the blockchallengemenu
        //reset the pass count because there's going to be another vote
        passCount = 0
        socket.broadcast.emit('blockChallengeMenu', blockingChar, blockerID, getUsername(blockerID))
    })

    socket.on('discardChar', (char, challengedChar, challengerID, isThisABlock) => {
        // if the user picks the RIGHT character
        if (char === challengedChar) {
            io.to(challengerID).emit('loseCard', '', '', false)
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
                                if (!isThisABlock) {
                                    tax(id, false)
                                }
                            }
                            else if (challengedChar === 'ambassador') {
                                exchange(id, false)
                            }
                            else if (challengedChar === 'assassin') {
                                doubleKill = true
                                assassinate(id, vicID, false)
                            }






                            break
                        }
                    }
                }
                return obj
            })
            turnOrder = newTurnOrder
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
            
            // if an action was attempted to be blocked but WRONGED, make sure teh action still goes through
            if (isThisABlock) {
                // making sure FOREIGN AID still goes through
                if (challengedChar === 'duke') {
                    let newTurnOrder = turnOrder.map((obj) => {
                        if (obj.id === blockedID) {
                            obj.coins += 2
                        }
                        return obj
                    })
                    turnOrder = newTurnOrder
                }
            }
            turnOrder = newTurnOrder

            incrementTurn()

            io.sockets.emit('receiveTurnOrder', turnOrder)

        }

    })

    socket.on('challenge', (challengerID, personBeingChallengedID, prompt, victimID) => {
        io.sockets.emit('receiveChat', {username: 'server', text: `${getUsername(challengerID)} has challenged the ${prompt} from ${getUsername(personBeingChallengedID)}!`})
        //close the challengeMenu's for everyone
        //IMPLEMENT THIS LATER ^^^^^^^^^^^
        if (prompt === 'TAX') {
            io.to(personBeingChallengedID).emit('loseCard', 'duke', challengerID, false)
        }
        else if (prompt === 'EXCHANGE') {
            io.to(personBeingChallengedID).emit('loseCard', 'ambassador', challengerID, false)
        }
        else if (prompt === 'duke') {
            io.to(personBeingChallengedID).emit('loseCard', 'duke', challengerID, true)
        }
        else if (prompt === 'ASSASSINATE') {
            io.to(personBeingChallengedID).emit('loseCard', 'assassin', challengerID, false)
            vicID = victimID
        }
        







    })

    socket.on('pass', (requestorID, prompt, victimID) => {
        console.log('passed')
        passCount += 1
        if (passCount === (usersAlive() - 1)) {
            if (prompt === 'TAX') {
                tax(requestorID, true)
            }
            else if (prompt === 'EXCHANGE') {
                exchange(requestorID, true)
            }
            else if (prompt === 'FOREIGN AID') {
                foreignAid(requestorID, true)
            }
            else if (prompt === 'duke') {
                io.sockets.emit('receiveChat', {username: 'server', text: `${getUsername(requestorID)}'s FOREIGN AID has been blocked`})
                incrementTurn()
            }
            else if (prompt === 'ASSASSINATE') {
                assassinate(requestorID, victimID, true)
            }
            else if (prompt === 'STEAL') {
                steal(requestorID, victimID, true)
            }








        }
    })

    //ACTION REQUESTS
    socket.on('actionRequest', (player, action, char) => {
        // reset variables to prep for an action vote
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
        else if (action === 'Foreign Aid') {
            blockedID = id
            io.sockets.emit('receiveChat', {username: 'server', text: `${getUsername(id)} is attempting to FOREIGN AID`})
            socket.broadcast.emit('foreignAidRequest', getUsername(id), id)
        }
        else if (action === 'Coup') {
            coup(id, player, char)
        }
        else if (action === 'Assassinate') {
            io.sockets.emit('receiveChat', {username: 'server', text: `${getUsername(id)} is attempting to ASSASSINATE ${getUsername(player)}`})
            socket.broadcast.emit('assassinateRequest', getUsername(id), id, getUsername(player), player)
        }
        else if (action === 'Steal') {
            io.sockets.emit('receiveChat', {username: 'server', text: `${getUsername(id)} is attempting to STEAL from ${getUsername(player)}`})
            socket.broadcast.emit('stealRequest', getUsername(id), id, getUsername(player), player)

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

    // HANDLES ALL ACTIONS WHEN SUCCESSFULLY ACTED UPON (except exchange, exchange will send a new menu to the user to pick)
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
        // because discarding the card will increment the turn, else turn will increment twice
        if (endTurn) {
            incrementTurn()
        }
    }

    function exchange(requestorID, endTurn) {
        io.sockets.emit('receiveChat', {username: 'server', text: `${getUsername(requestorID)} used EXCHANGE`})
        deck = shuffle(deck)
        io.to(requestorID).emit('openExchangeMenu', deck.pop(), deck.pop(), endTurn)
    }

    function foreignAid(requestorID, endTurn) {
        let newTurnOrder = turnOrder.map((obj) => {
            if (obj.id === requestorID) {
                obj.coins += 2
                io.sockets.emit('receiveChat', {username: 'server', text: `${getUsername(requestorID)} used FOREIGN AID`})
            }
            return obj
        })

        //send new turnOrder data to everyone
        turnOrder = newTurnOrder
        io.sockets.emit('receiveTurnOrder', turnOrder)
        // check if you want the turn to end, or if you are still waiting on someone to discard a card
        // because discarding the card will increment the turn, else turn will increment twice
        if (endTurn) {
           incrementTurn()
        }
    }

    function coup(couperID, coupeeID, char) {
        // make the couper lose 7 coins
        let newTurnOrder = turnOrder.map((obj) => {
            if (obj.id === couperID) {
                obj.coins -= 7
                io.sockets.emit('receiveChat', {username: 'server', text: `${getUsername(couperID)} has launched a COUP at ${getUsername(coupeeID)}`})
            }
            return obj
        })
        turnOrder = newTurnOrder
        // make the coupee lose a card if guessed right
        newTurnOrder = turnOrder.map((obj) => {
            if (obj.id === coupeeID) {
                if (obj.cards[0].alive && obj.cards[0].char === char) {
                    io.sockets.emit('receiveChat', {username: 'server', text: `${getUsername(couperID)} successfully COUPed ${getUsername(coupeeID)} for ${char}`})
                    obj.cards[0].alive = false
                }
                else if (obj.cards[1].alive && obj.cards[1].char === char) {
                    io.sockets.emit('receiveChat', {username: 'server', text: `${getUsername(couperID)} successfully COUPed ${getUsername(coupeeID)} for ${char}`})
                    obj.cards[1].alive = false
                }
                else {
                    io.sockets.emit('receiveChat', {username: 'server', text: `${getUsername(couperID)} missed their COUP on ${getUsername(coupeeID)} for ${char}`})
                }
            }
            return obj
        })
        //send new turnOrder data to everyone
        turnOrder = newTurnOrder
        io.sockets.emit('receiveTurnOrder', turnOrder)

        incrementTurn()

    }

    function assassinate(requestorID, victimID, endTurn) {
        //lose 3 coins
        let newTurnOrder = turnOrder.map((obj) => {
            if (obj.id === requestorID) {
                obj.coins -= 3
                io.sockets.emit('receiveChat', {username: 'server', text: `${getUsername(requestorID)} ASSASSINATED ${getUsername(victimID)}`})
            }
            return obj
        })
        turnOrder = newTurnOrder
        io.sockets.emit('receiveTurnOrder', turnOrder)
        io.to(victimID).emit('loseCard', '', '', false)
    }

    function steal(requestorID, victimID, endTurn) {
        //lose 2 coins for victim
        let newTurnOrder = turnOrder.map((obj) => {
            if (obj.id === victimID) {
                obj.coins -= 2
                io.sockets.emit('receiveChat', {username: 'server', text: `${getUsername(requestorID)} used STEAL on ${getUsername(victimID)}`})
            }
            return obj
        })
        turnOrder = newTurnOrder
        // gain 2 coins for requestor
        newTurnOrder = turnOrder.map((obj) => {
            if (obj.id === requestorID) {
                obj.coins += 2
            }
            return obj
        })
        turnOrder = newTurnOrder
        io.sockets.emit('receiveTurnOrder', turnOrder)
        incrementTurn()
    }

    // just a function that will end the turn
    function incrementTurn() {
        turn += 1
        currTurnID = turnOrder[turn % (turnOrder.length)].id
        io.sockets.emit('currTurn', currTurnID, getUsername(currTurnID))
        io.sockets.emit('getTurn', turn)
    }

    socket.on('exchangedCards', (chosenCards, unchosenCards, requestorID, endTurn) => {
        //add unchosen cards back to the deck
        deck.push(unchosenCards[0], unchosenCards[1])
        //set chosen cards as the new cards for the user
        let newTurnOrder = turnOrder.map((obj) => {
            if (obj.id === requestorID) {
                let i = 0
                for (let card of obj.cards) {
                    if (card.alive) {
                        card.char = chosenCards[i]
                        i += 1
                    }
                }
                io.sockets.emit('receiveChat', {username: 'server', text: `${getUsername(requestorID)} has finally finished exchanging`})

            }
            return obj
        })

        //send new turnOrder data to everyone
        turnOrder = newTurnOrder
        io.sockets.emit('receiveTurnOrder', turnOrder)

        //check if you want to end the turn or if youre still waiting on someone to discard a card
        if (endTurn) {
            incrementTurn()
        }
    })
})

server.listen(port, ()=> console.log(`server on port ${port}`))