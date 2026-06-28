import { useState } from 'react'

const MAX_PLAYERS = 5

export default function Setup({ onStart }) {
  const [names, setNames] = useState([''])

  const update = (i, value) =>
    setNames((n) => n.map((x, idx) => (idx === i ? value : x)))
  const add = () =>
    setNames((n) => (n.length < MAX_PLAYERS ? [...n, ''] : n))
  const remove = (i) =>
    setNames((n) => n.filter((_, idx) => idx !== i))

  const cleaned = names.map((n) => n.trim()).filter(Boolean)
  const canStart = cleaned.length >= 1

  const start = () => {
    if (canStart) onStart(cleaned)
  }

  return (
    <div className="setup">
      <div className="setup-card">
        <h1>Add players</h1>
        <p className="hint">1 to {MAX_PLAYERS} players</p>

        {names.map((name, i) => (
          <div className="player-input" key={i}>
            <input
              type="text"
              placeholder={`Player ${i + 1} name`}
              value={name}
              maxLength={16}
              autoFocus={i === names.length - 1}
              onChange={(e) => update(i, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && start()}
            />
            {names.length > 1 && (
              <button
                className="remove"
                aria-label="Remove player"
                onClick={() => remove(i)}
              >
                ×
              </button>
            )}
          </div>
        ))}

        {names.length < MAX_PLAYERS && (
          <button className="add-btn" onClick={add}>
            + Add player
          </button>
        )}

        <button className="primary-btn" disabled={!canStart} onClick={start}>
          Start game
        </button>
      </div>
    </div>
  )
}
