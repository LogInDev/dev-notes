import React from 'react'

export default function TimerChanllenger({ title, targetTime }) {
  return (
    <section className="challenge">
      <h2>{title}</h2>
      <p className="challenge-time">
        {targetTime} second{targetTime > 1 ? 's' : ''}
      </p>
      <p>
        <button>
          Start Challenge
        </button>
      </p>
      <p className="">
        Time is running...
      </p>
    </section>
  )
}
