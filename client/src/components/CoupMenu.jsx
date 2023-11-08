import React from 'react'

function CoupMenu(props) {
    return(
        <div>
            <h2>Choose a character to COUP for: </h2>

            <button onClick={() => {
                props.selectChar('duke')
                props.hideCoupMenu()
            }}>Duke</button>

            <button onClick={() => {
                props.selectChar('contessa')
                props.hideCoupMenu()
            }}>Contessa</button>

            <button onClick={() => {
                props.selectChar('assassin')
                props.hideCoupMenu()
            }}>Assassin</button>

            <button onClick={() => {
                props.selectChar('ambassador')
                props.hideCoupMenu()
            }}>Ambassador</button>

            <button onClick={() => {
                props.selectChar('captain')
                props.hideCoupMenu()
            }}>Captain</button>

        </div>

    )
}
export default CoupMenu