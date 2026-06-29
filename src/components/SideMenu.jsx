import { useState } from 'react'

const MAX_PLAYERS = 5

function GreekFlag() {
  return (
    <svg viewBox="0 0 27 18" className="flag" aria-hidden="true">
      <rect width="27" height="18" fill="#0d5eaf" />
      <rect y="2" width="27" height="2" fill="#fff" />
      <rect y="6" width="27" height="2" fill="#fff" />
      <rect y="10" width="27" height="2" fill="#fff" />
      <rect y="14" width="27" height="2" fill="#fff" />
      <rect width="10" height="10" fill="#0d5eaf" />
      <rect x="4" width="2" height="10" fill="#fff" />
      <rect y="4" width="10" height="2" fill="#fff" />
    </svg>
  )
}

function UkFlag() {
  return (
    <svg viewBox="0 0 27 18" className="flag" aria-hidden="true">
      <rect width="27" height="18" fill="#012169" />
      <path d="M0,0 L27,18 M27,0 L0,18" stroke="#fff" strokeWidth="3.6" />
      <path d="M0,0 L27,18 M27,0 L0,18" stroke="#c8102e" strokeWidth="1.8" />
      <path d="M13.5,0 V18 M0,9 H27" stroke="#fff" strokeWidth="6" />
      <path d="M13.5,0 V18 M0,9 H27" stroke="#c8102e" strokeWidth="3.6" />
    </svg>
  )
}

export default function SideMenu({
  open,
  onToggle,
  lang,
  setLang,
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

  // UI strings per language.
  const t = {
    el: {
      players: 'Παίχτες',
      newPlayer: 'Νέος παίχτης',
      add: '+ Προσθήκη',
      ownWord: 'Δική σου λέξη',
      customPlaceholder: 'Λέξη / φράση',
      show: 'Εμφάνιση',
      hide: 'Απόκρυψη',
      playWord: 'Παίξε τη λέξη',
      round: 'Γύρος',
      hint: '💡 Βοήθεια (αποκάλυψη γράμματος)',
      skip: 'Παράλειψη λέξης →',
      reset: 'Μηδενισμός σκορ',
    },
    en: {
      players: 'Players',
      newPlayer: 'New player name',
      add: '+ Add',
      ownWord: 'Type own word',
      customPlaceholder: 'Custom word / phrase',
      show: 'Show',
      hide: 'Hide',
      playWord: 'Play this word',
      round: 'Round',
      hint: '💡 Hint (reveal a letter)',
      skip: 'Skip word →',
      reset: 'Reset scores',
    },
  }[lang]

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
        <div className="menu-top">
          <div className="lang-toggle">
            <button
              className={`lang-btn ${lang === 'el' ? 'active' : ''}`}
              onClick={() => setLang('el')}
              aria-label="Greek"
            >
              <GreekFlag />
            </button>
            <button
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
              aria-label="English"
            >
              <UkFlag />
            </button>
          </div>
          <button className="menu-close" onClick={onToggle} aria-label="Close">
            ×
          </button>
        </div>

        <h3>{t.players}</h3>
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
            placeholder={t.newPlayer}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
          />
          <button onClick={addPlayer} disabled={players.length >= MAX_PLAYERS}>
            {t.add}
          </button>
        </div>

        <h3>{t.ownWord}</h3>
        <div className="word-field">
          <input
            type={showWord ? 'text' : 'password'}
            value={word}
            placeholder={t.customPlaceholder}
            onChange={(e) => setWord(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && playWord()}
          />
          <button className="eye" onClick={() => setShowWord((s) => !s)}>
            {showWord ? t.hide : t.show}
          </button>
        </div>
        <button
          className="primary-btn"
          onClick={playWord}
          disabled={!word.trim()}
        >
          {t.playWord}
        </button>

        <h3>{t.round}</h3>
        <button className="menu-btn" onClick={onHint}>
          {t.hint}
        </button>
        <button className="menu-btn" onClick={onSkip}>
          {t.skip}
        </button>
        <button className="menu-btn" onClick={onResetScores}>
          {t.reset}
        </button>
      </div>
    </>
  )
}
