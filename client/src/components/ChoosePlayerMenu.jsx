import {useState} from 'react'
import CoupMenu from './CoupMenu'

function ChoosePlayerMenu(props) {
    const [showCoupMenu, setShowCoupMenu] = useState(false)

    const hideCoupMenu = () => {
        setShowCoupMenu(false)
    }

    return(
        <div>
            <h2>Choose a player to {props.action}</h2>
            {props.turnOrder.map((obj) => {
                if (obj.id !== props.userID) {
                    return (
                        <div>

                            <button onClick={() => {
                                // if action is coup, open the coup menu instead of sending back player info
                                if (props.action === 'Coup') {
                                    setShowCoupMenu(true)
                                }
                                else {
                                    props.selectAction(obj.id, props.action, '')
                                    props.closeActionMenu()
                                }
                            }}>
                                {obj.username}
                            </button>
                            {showCoupMenu ? <CoupMenu 
                                    // pass down the plaeyr that was chosen
                                    player={obj.id}
                                    hideCoupMenu={hideCoupMenu}
                                    selectChar={(char) => {
                                        //send back the character and chosen player
                                        props.selectAction(obj.id, 'Coup', char)
                                        //hides the menu as well
                                        props.hideMenu()
                                    }}/>
                                : ''}

                        </div>
                    )
                }
            }
            )}
        </div>

    )
}
export default ChoosePlayerMenu