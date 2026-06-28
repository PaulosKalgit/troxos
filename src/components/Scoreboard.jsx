export default function Scoreboard({ players, current, active }) {
  return (
    <div className="scoreboard">
      {players.map((p, i) => (
        <div
          key={i}
          className={`score-card player-${i} ${
            active && i === current ? 'current' : ''
          }`}
        >
          <div className="score-name">{p.name}</div>
          <div className="score-value">
            {p.banked}
            {p.round > 0 && <span className="round-add">(+{p.round})</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
