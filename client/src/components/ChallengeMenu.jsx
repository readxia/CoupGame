import React from 'react'

function ChallengeMenu(props) {
    return(
        <div>
            <h3>{props.challengePrompt[0]} is trying to {props.challengePrompt[2]} {props.challengePrompt === 'ASSASSINATE' ? props.challengePrompt[3] : ''}</h3>

            {props.challengePrompt[2] === 'FOREIGN AID' ? '' : 
                <button onClick={() => {
                    // close the menu for everyone else NEED TOD O
                    props.closeChallengeMenu()
                    if (props.challengePrompt[2] === 'ASSASSINATE' || props.challengePrompt[2] === 'STEAL') {
                        props.challenge(props.challengePrompt[4])
                    }
                    else {
                        props.challenge('')
                    }
                    
                }}>Challenge!</button> 
            }

                
            <button onClick={() => {
                props.closeChallengeMenu()
                if (props.challengePrompt[2] === 'ASSASSINATE' || props.challengePrompt[2] === 'STEAL') {
                    props.pass(props.challengePrompt[4])
                }
                else {
                    props.pass('')
                }
                
            }}>Pass...</button>


            {props.challengePrompt[2] === 'ASSASSINATE' && props.challengePrompt[4] === props.userID ? 
            <button onClick={() => {
                //CLOSE the menu for everyone else NEEEEED TO DO!!!!!!!!!!!!!!!!!!
                props.closeChallengeMenu()
                props.block('contessa')
            }}>Block with Contessa</button> : ''}

            {props.challengePrompt[2] === 'STEAL' && props.challengePrompt[4] === props.userID ? 
            <button onClick={() => {
                //CLOSE the menu for everyone else NEEEEED TO DO!!!!!!!!!!!!!!!!!!
                props.closeChallengeMenu()
                props.block('captain')
            }}>Block with Captain</button> : ''}

            {props.challengePrompt[2] === 'STEAL' && props.challengePrompt[4] === props.userID ? 
            <button onClick={() => {
                //CLOSE the menu for everyone else NEEEEED TO DO!!!!!!!!!!!!!!!!!!
                props.closeChallengeMenu()
                props.block('ambassador')
            }}>Block with Ambassador</button> : ''}


            {props.challengePrompt[2] === 'FOREIGN AID' ? 
            <button onClick={() => {
                //close the menu for everyone else NEED TO DO
                props.closeChallengeMenu()
                //open the block challenge menu for everyone else 
                props.block('duke')
            }}>Block with Duke</button>
            : ''}
        </div>

    )
}
export default ChallengeMenu