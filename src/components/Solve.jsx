import { useState } from 'react'

export default function Solve({ onSolve }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [result, setResult] = useState(null) // 'correct' | 'wrong' | null

  const submit = () => {
    if (result) return
    const ok = onSolve(text)
    // Brief flash (green on win, red on miss), then close.
    setResult(ok ? 'correct' : 'wrong')
    setTimeout(() => {
      setResult(null)
      setText('')
      setOpen(false)
    }, 700)
  }

  if (!open) {
    return (
      <button className="solve-btn" onClick={() => setOpen(true)}>
        Solve
      </button>
    )
  }

  return (
    <div className="solve-panel">
      <input
        autoFocus
        value={text}
        disabled={!!result}
        className={result || ''}
        placeholder="Type the full title…"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') setOpen(false)
        }}
      />
      <button className="solve-btn" onClick={submit}>
        Enter
      </button>
      <button className="solve-cancel" onClick={() => setOpen(false)}>
        ✕
      </button>
    </div>
  )
}
