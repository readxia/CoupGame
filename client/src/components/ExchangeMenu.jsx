import {useState, useEffect} from 'react'

function ExchangeMenu(props) {
    //find number of cards chosen and number of alive cards to know how many chars
    // this user can choose, and when to close the menu
    const [aliveCards, setAliveCards] = useState(2)
    const [numChosenCards, setNumChosenCards] = useState(0)
    const [chosenCards, setChosenCards] = useState([])
    const [cards, setCards] = useState([])

    // RUN ONLY ON MOUNT
    useEffect(() => {
        //find how many alive cards the user has
        setNumChosenCards(0)
        console.log(props.turnOrder)
        let temp = 0
        props.turnOrder.map((obj) => {
            console.log(obj.id)
            console.log(props.userID)
            if (obj.id === props.userID) {
                if (obj.cards[0].alive) {
                    temp += 1
                    setCards((cards) => [...cards, obj.cards[0].char])
                }
                if (obj.cards[1].alive) {
                    temp += 1
                    setCards((cards) => [...cards, obj.cards[1].char])
                }

            }
        })
        console.log('these were the cards chosen from the deck: ')
        console.log(props.exchangeChars[0], props.exchangeChars[1])
        setAliveCards(temp)
        setCards((cards) => [...cards, props.exchangeChars[0], props.exchangeChars[1]])
      }, [])

      // handleClick (MAYBE MAKE THIS ASYNC IF DOESNT WORK)
      const handleClick = (char) => {
        //set chosenCards
        console.log(`HANDLING click of: ${char}`)
        setChosenCards([...chosenCards, char])
        // get rid of the button
        let temp = cards.slice() // Create a copy of the cards array
        setCards((prevCards) => {
          let removed = false
          return prevCards.filter((card) => {
            if (card !== char || removed) {
              return true; // Keep the card in the array
            } else {
              removed = true;
              return false; // Remove the card
            }
          })
        })


      }

      // runs whenever numChosenCards is updated
      useEffect(() => {
        // if enough cards were chosen and exchanging is complete
        if (aliveCards === numChosenCards) {
            //send back chosenCards
            props.chosenCards(chosenCards, cards)
            //close the menu
            props.closeExchangeMenu()
        }
      }, [numChosenCards])
    
    return(
        <div>
            <h3>Choose Cards: </h3>
            {cards.map((card) => {
                return(
                    <button onClick={() => {
                        setNumChosenCards(numChosenCards + 1)
                        handleClick(card)
                    }}>{card}</button>
                )
                
            })}

        </div>

    )
}
export default ExchangeMenu