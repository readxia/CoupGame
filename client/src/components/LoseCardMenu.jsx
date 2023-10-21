import {useState} from 'react'

function LoseCardMenu(props) {
    const [index, setIndex] = useState(0)

    const findIndex = () => {
        for (let i = 0; i < props.turnOrder.length; i++) {
            if (props.turnOrder[i].id === props.userID) {
                console.log('index found')
                return i
            }
        } 
        console.log('something went wrong with finding index')
    }

    return(
        <div>
            <h3>Choose a card to show</h3>
            {console.log(props.turnOrder[findIndex()].cards)}
            {props.turnOrder[findIndex()].cards.map((card) => {
                if (card.alive) {
                    return (
                        <button onClick={() => {
                            props.closeLoseCardMenu()
                            props.discardChar(card.char)
                        }}>
                            {card.char}
                        </button>
                    )
                }

            })}
        </div>

    )
}
export default LoseCardMenu