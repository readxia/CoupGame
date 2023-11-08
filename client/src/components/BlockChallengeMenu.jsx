import {useState, useEffect} from 'react'


function BlockChallengeMenu(props) {
    const [action, setAction] = useState('')

    //run ONLY on MOUNT
    useEffect(() => {
        if (props.challengePrompt[2] === 'duke') {
            setAction('FOREIGN AID')
        }
    }, [])

    return(
        <div>
            <h3>{props.challengePrompt[0]} is blocking {action} with {props.challengePrompt[2]}</h3>
            <button onClick={() => {
                //Close the menu for everyone else NEED TO DO
                props.challenge()
                props.closeBlockChallengeMenu()
            }}>Challenge!</button>
            <button onClick={() => {
                props.pass()
                props.closeBlockChallengeMenu()
            }}>Pass...</button>
        </div>

    )
}
export default BlockChallengeMenu