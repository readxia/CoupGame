import {useState} from 'react'
import ChoosePlayerMenu from './ChoosePlayerMenu'

function ActionMenu(props) {
    const [showChoosePlayerMenu, setShowChoosePlayerMenu] = useState(false)
    const [action, setAction] = useState('')
    const [player, setPlayer] = useState('')

    const showMenu = () => {
        setShowChoosePlayerMenu(true)
    }

    const hideMenu = () => {
        setShowChoosePlayerMenu(false)
    }

    return(
        <div>
            <hr />
            <h2>Action Menu</h2>
            <h6>It's your turn!</h6>
            <button onClick={() => {
                props.selectAction('', 'Income')
                // clsoe itself
                props.closeActionMenu()
                }}>Income</button>
            <button onClick={() => {
                props.selectAction('', 'Foreign Aid')
                //close itself
                props.closeActionMenu()
                }}>Foreign Aid</button>
            <button onClick={() => {
                props.selectAction('', 'Tax')
                props.closeActionMenu()
                }}>Tax</button>
            <button onClick={() => {
                props.selectAction('', 'Exchange')
                props.closeActionMenu()
                }}>Exchange</button>
            <button onClick={(e) => {
                setAction(e.target.textContent)
                showMenu()
            }}>
                Assassinate
            </button>

            {showChoosePlayerMenu && (
                <ChoosePlayerMenu 
                    // passes down the selectAction function to send back above
                    selectAction={(player, action) => {
                        props.selectAction(player, action)
                    }} 
                    // gives the turn order passed above (basically the player list)
                    turnOrder={props.turnOrder} 
                    // allows the menu to close itself
                    hideMenu={hideMenu}
                    // making dynamic buttons by passing down what action was pressed
                    action={action}
                    // passing down user id to have the user self NOT show up as an option to KILL STEAL ETC
                    userID={props.userID}
                    
                    />
            )}
        </div>

    )
}
export default ActionMenu