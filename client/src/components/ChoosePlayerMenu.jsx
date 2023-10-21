import React from 'react'

function ChoosePlayerMenu(props) {
    return(
        <div>
            <h2>Choose a player to {props.action}</h2>
            {props.turnOrder.map((obj) => {
                if (obj.id !== props.userID) {
                    return (
                        <button onClick={() => {
                            // on click is an anon function so that i can pass parameters in
                            props.selectAction(obj.id, props.action)
                            // if it was just hideMenu, i wouldn't have had to use an anon func
                            props.hideMenu()
                        }}>
                            {obj.username}
                        </button>
                    )
                }
            }
            )}
        </div>

    )
}
export default ChoosePlayerMenu