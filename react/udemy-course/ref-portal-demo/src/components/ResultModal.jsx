import React from 'react'

export default function ResultModal({ result, targetTime }) {
  return (
    <dialog className="result-modal" open>
      <h2>You {result}</h2>
      <p>The tartget time was <string>{targetTime} seconds.</string></p>
      <p>You stopped the timer with <strong>X seconds left.</strong></p>
      <form method="dialog">
        <button>Close</button>
      </form>
    </dialog>
  )
}
