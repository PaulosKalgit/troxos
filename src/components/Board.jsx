export default function Board({ grid, revealed, flashing }) {
  return (
    <div className="board">
      {grid.map((row, r) => (
        <div className="board-row" key={r}>
          {row.map((cell, c) => {
            if (cell.type === 'letter') {
              const key = `${r}-${c}`
              const isRevealed = revealed.has(key)
              const isFlashing = flashing.has(key)
              return (
                <div
                  className={`tile letter ${isFlashing ? 'flash' : ''}`}
                  key={c}
                >
                  {isRevealed ? cell.char : ''}
                </div>
              )
            }
            return <div className="tile blue" key={c} />
          })}
        </div>
      ))}
    </div>
  )
}
