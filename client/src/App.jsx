import { useRef, useEffect, useState } from 'react'
import './App.css'
import ActionMenu from './components/ActionMenu'
import LoseCardMenu from './components/LoseCardMenu'
import ChallengeMenu from './components/ChallengeMenu'
import io from 'socket.io-client'
const socket = io.connect('http://localhost:3001')

function App() {
  const [message, setMessage] = useState({username: '', text: ''})
  const [chatLog, setChatLog] = useState([])
  const [user, setUser] = useState('')
  const [userID, setUserID] = useState('')
  const [turnOrder, setTurnOrder] = useState([{username:'', cards:[{char: '', alive: true}, {char: '', alive: true}], coins:0, id:''}]) 
  //{username: 'Rojo', cards: [{char: 'captain', alive: true}, {char: 'duke', alive: false}], id: '47239487234'}
  const [turn, setTurn] = useState(0)
  const [challengePrompt, setChallengePrompt] = useState(['', ''])
  const [showLoseCardMenu, setShowLoseCardMenu] = useState(false)
  const [showChallengeMenu, setShowChallengeMenu] = useState(false)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [currTurnID, setCurrTurnID] = useState('')
  const [currTurnName, setCurrTurnName] = useState('')
  const [challengedChar, setChallengedChar] = useState('')
  const [challengerID, setChallengerID] = useState('')

  const selectAction = (player, action) => {
    console.log('Action Selected')
    console.log(player)
    console.log(action)
    socket.emit('actionRequest', player, action)
  }

  const challenge = () => {
    // person challenging, person being challenged, prompt
    socket.emit('challenge', userID, challengePrompt[1], challengePrompt[2])
  }

  const pass = () => {
    socket.emit('pass', challengePrompt[1], challengePrompt[2])
  }

  const discardChar = (char) => {
    //character chosen, the challenged character, person who challenged
    socket.emit('discardChar', char, challengedChar, challengerID)
  }

  //close the action menu
  const closeActionMenu = () => {
    setShowActionMenu(false)
  }

  //Close the challenge menu
  const closeChallengeMenu = () => {
    setShowChallengeMenu(false)
  }

  //close the lose card menu
  const closeLoseCardMenu = () => {
    setShowLoseCardMenu(false)
  }

  //show deck command
  const showdeck = () => {
    socket.emit('showdeck')
  }

  // start game command
  const start = (e) => {
    socket.emit('startGame')
  }

  // Send message
  const send = (e) => {
    e.preventDefault()
    let clearedMessage = message.text.split(' ').join('')
    if (clearedMessage) {
      socket.emit('sendChat', message)
      setChatLog((chatLog) => [...chatLog, message])
      // Clears the message box (to pretend like msg was sent)
      setMessage({...message, text: ''})
    }
  }

  // Run on Mount ONLY
  useEffect(() => {
    // ask user to create a username
    let temp = ''
    while (temp === '' || temp === 'server') {
      temp = window.prompt("Enter your name: ")
    }
    // set username for messaging
    setMessage((msg) => ({...message, username: temp}))
    setUser(temp)
    // send username to server to compile turn order
    socket.emit('sendUsername', temp)
    // set turn order
    // .................
    // if (turnOrder[turn % (turnOrder.length)].id === userID) {
    //   setShowActionMenu(true)
    // }

  }, [])

  //specific use effect for setting the currentTurn, because there is a bug where the
  //userID state variable is not set yet on the FIRST turn
  useEffect(() => {
    if (currTurnID !== '' && userID !== '' && currTurnID === userID) {
      setShowActionMenu(true)
    }
    socket.on('currTurn', (currTurnID, currTurnName) => {
      setCurrTurnID(currTurnID)
      setCurrTurnName(currTurnName)
      if (currTurnID === userID) {
        setShowActionMenu(true)
      }
    })
  }, [currTurnID, userID, socket])

  // Listen to changes in SOCKET
  useEffect(() => {
    socket.on('receiveChat', (data) => {
      setChatLog((chatLog) => [...chatLog, data])
    })
    socket.on('receiveTurnOrder', (data) => {
      setTurnOrder(data)
    })
    socket.on('id', (id) => {
      setUserID(id)
    })
    socket.on('getTurn', (data) => {
      setTurn(data)
      // setCurrentUsersTurn(turnOrder[data % (turnOrder.length)])
    })
    socket.on('loseCard', (challengedChar, challengerID) => {
      // sets challengedchar in state variable to match later
      setChallengedChar(challengedChar)
      setChallengerID(challengerID)
      console.log('loseCard received')
      setShowLoseCardMenu(true)
    })

    //REQUESTS FOR ACTIONS
    socket.on('taxRequest', (requestor, requestorID) => {
      setChallengePrompt([requestor, requestorID, 'TAX'])
      //turn on CHALLENGE menu
      setShowChallengeMenu(true)
    })
    socket.on('exchangeRequest', (requestor, requestorID) => {
      setChallengePrompt([requestor, requestorID, 'EXCHANGE'])
      setShowChallengeMenu(true)
    })



  }, [socket])

  // const chatLogRef = useRef(null)
  // useEffect(() => {
  //   chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight
  // }, [chatLog])

  // Map through chatLog to render
  const chatRender = chatLog.map( obj => {
    return (
    <li>
      <span className='username'>{obj.username}:</span> {obj.text}
    </li>
    )
  })

  // Map through turnOrder to render
  const turnOrderRender = turnOrder.map( obj => {
    return (
    <div key={obj.id} className='box'>
      <h3>{obj.username}</h3>
      {/* FINISH THIS LATER */}
      <p>Cards: ??</p> 
      <p>Coins: {obj.coins}</p>
    </div>)
  })

  const currentCards = turnOrder.map((obj) => {
    if (obj.id === userID) {
      return (
        <div className='char-container'>
          {obj.cards[0].alive ? <p className='char-card-alive'>
            {obj.cards[0].char}
          </p>
          :
          <p className='char-card-dead'>
            {obj.cards[0].char}
          </p>
          }
          
          {obj.cards[1].alive ? <p className='char-card-alive'>
            {obj.cards[1].char}
          </p>
          :
          <p className='char-card-dead'>
            {obj.cards[1].char}
          </p>
          }
        </div>
      )
    }
  })

  return (
    <div className='container'>

      <div className="header-container">
        <h3>Welcome {user}</h3>
        <button onClick={start}>Start Game</button>
        <button onClick={showdeck}>show deck</button>
      </div>

      <div className='game-container'>
        <h3>Players</h3>
        <div className='UserList'>{turnOrderRender}</div>

        <h3>Turn {turn}</h3>
        <h4>It is {currTurnName}'s turn</h4>
        <h1>Your Cards:</h1>
        <div>
          {currentCards}
        </div>

        {showChallengeMenu ? 
          <ChallengeMenu 
            challengePrompt={challengePrompt}
            challenge={challenge}
            pass={pass}
            closeChallengeMenu={closeChallengeMenu}
            /> : ''
        }

        {showLoseCardMenu ? 
        <LoseCardMenu 
          //pass down user id to allow to find itself
          userID={userID} 
          //allow the losecardmenu to close itself
          closeLoseCardMenu={closeLoseCardMenu}
          // pass down turn order or player list
          turnOrder={turnOrder}
          // pass up which character to discard
          discardChar={(char) => {discardChar(char)}}
          /> : ''
        }

        {showActionMenu ? 
        <ActionMenu 
          //allow action menu to close itself when picked action
          closeActionMenu={closeActionMenu}
          //passing down turn order
          turnOrder={turnOrder} 
          // pass down the user ID to allow menu to NOT show itself as an option to STEAL, KILL, ETC
          userID={userID}
          // passing down function to allow user to pass up data selected in the menus
          selectAction={(player, action) => {selectAction(player, action)}}/> 
          : '' 
        }
      </div>

      <div className="chat-container">
        <h1>Chat Log</h1>
        <div className="chat-log">
          
          <div className="log-content">
            <ul>
              {chatRender}
            </ul>
          </div>
        </div>
        <form onSubmit={send} className='message-form'>
          <input placeholder='type your message...' value={message.text} onChange={(e) => {
            setMessage({...message, text: e.target.value})
          }}/>

          <button style={{display: 'none'}} type='submit'>Send!</button>
        </form>
      </div>

    </div>
  )
}

export default App
