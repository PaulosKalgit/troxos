import { useState } from 'react'

const MAX_PLAYERS = 5

export default function SideMenu({
  open,
  onToggle,
  players,
  onAddPlayer,
  onRemovePlayer,
  onPlayWord,
  onSkip,
  onResetScores,
  onHint,
}) {
  const [newName, setNewName] = useState('')
  const [word, setWord] = useState('')
  const [showWord, setShowWord] = useState(false)

  const addPlayer = () => {
    onAddPlayer(newName)
    setNewName('')
  }

  const playWord = () => {
    if (!word.trim()) return
    onPlayWord(word)
    setWord('')
    setShowWord(false)
  }

  return (
    <>
      <button className="menu-toggle" onClick={onToggle} aria-label="Menu">
        ☰
      </button>

      <div className={`sidemenu ${open ? 'open' : ''}`}>
        <button className="menu-close" onClick={onToggle} aria-label="Close">
          ×
        </button>

        <h3>Players</h3>
        <ul className="menu-players">
          {players.map((p, i) => (
            <li key={i}>
              <span>{p.name}</span>
              <button
                className="remove"
                aria-label={`Remove ${p.name}`}
                onClick={() => onRemovePlayer(i)}
                disabled={players.length <= 1}
              >
                −
              </button>
            </li>
          ))}
        </ul>

        <div className="menu-add">
          <input
            type="text"
            value={newName}
            maxLength={16}
            placeholder="New player name"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
          />
          <button onClick={addPlayer} disabled={players.length >= MAX_PLAYERS}>
            + Add
          </button>
        </div>

        <h3>Type own word</h3>
        <p className="menu-hint">
          Starts a round with your phrase (keeps players &amp; scores). If it
          exists in the word list, its category &amp; description are used.
        </p>
        <div className="word-field">
          <input
            type={showWord ? 'text' : 'password'}
            value={word}
            placeholder="Custom word / phrase"
            onChange={(e) => setWord(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && playWord()}
          />
          <button className="eye" onClick={() => setShowWord((s) => !s)}>
            {showWord ? 'Hide' : 'Show'}
          </button>
        </div>
        <button
          className="primary-btn"
          onClick={playWord}
          disabled={!word.trim()}
        >
          Play this word
        </button>

        <h3>Round</h3>
        <button className="menu-btn" onClick={onHint}>
          💡 Hint (reveal a letter)
        </button>
        <button className="menu-btn" onClick={onSkip}>
          Skip word →
        </button>
        <button className="menu-btn" onClick={onResetScores}>
          Reset scores
        </button>
      </div>
    </>
  )
}
