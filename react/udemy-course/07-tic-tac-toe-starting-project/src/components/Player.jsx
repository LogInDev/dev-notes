import React from 'react'

export default function Player({ name, symbol }) {
    return (
        <li>
            <span className="player">
                <span className="player-name">{name}</span>
                <span className="player-symboe">{symbol}</span>
            </span>
            <button>Edit</button>
        </li>
    )
}
