import React from 'react'

function ChallengeMenu(props) {
    return(
        <div>
            <h3>{props.challengePrompt[0]} is trying to {props.challengePrompt[2]}</h3>

            <button onClick={() => {
                props.closeChallengeMenu()
                props.challenge()
            }}>Challenge!</button> 
                
            <button onClick={() => {
                props.closeChallengeMenu()
                props.pass()
            }}>Pass...</button>

            {/* make more ternary operators about BLOCKING like foreign aid */}
        </div>

    )
}
export default ChallengeMenu