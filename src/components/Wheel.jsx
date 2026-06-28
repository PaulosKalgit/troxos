const CX = 130
const CY = 130
const R = 125
const R_LABEL = 88

// Polar (degrees from top, clockwise) -> SVG cartesian.
function point(angleDeg, radius) {
  const rad = (angleDeg * Math.PI) / 180
  return [CX + radius * Math.sin(rad), CY - radius * Math.cos(rad)]
}

export default function Wheel({
  segments,
  rotation,
  spinning,
  onSpinEnd,
  onSpin,
  canSpin,
}) {
  const step = 360 / segments.length

  return (
    <div className="wheel">
      <div className="wheel-pointer" />
      <svg
        viewBox="0 0 260 260"
        className="wheel-svg"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning
            ? 'transform 1s cubic-bezier(0.22, 0.61, 0.36, 1)'
            : 'none',
        }}
        onTransitionEnd={onSpinEnd}
      >
        <defs>
          {segments.map((seg, i) => (
            <linearGradient key={i} id={`wg${i}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={seg.c1} />
              <stop offset="100%" stopColor={seg.c2} />
            </linearGradient>
          ))}
        </defs>

        {segments.map((seg, i) => {
          const [x0, y0] = point(i * step - step / 2, R)
          const [x1, y1] = point(i * step + step / 2, R)
          const d = `M ${CX} ${CY} L ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1} Z`
          return (
            <g key={i}>
              <path
                d={d}
                fill={`url(#wg${i})`}
                stroke="#0a1f47"
                strokeWidth="1.5"
              />
              {/* Radial label: positioned at the slice, then turned 90deg so it
                  reads along the slice (rim -> center), like the real wheel. */}
              <text
                x={CX}
                y={CY - R_LABEL}
                fill={seg.small ? seg.textColor : '#000000'}
                stroke={seg.small ? 'none' : '#ffffff'}
                strokeWidth={seg.small ? 0 : 3}
                paintOrder="stroke"
                strokeLinejoin="round"
                fontSize={seg.small ? 11 : 22}
                fontWeight="800"
                textAnchor="middle"
                dominantBaseline="central"
                xmlSpace="preserve"
                transform={`rotate(${i * step} ${CX} ${CY}) rotate(90 ${CX} ${CY - R_LABEL})`}
              >
                {seg.label}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Center hub doubles as a spin button (stays put while wheel turns). */}
      <button className="wheel-hub" onClick={onSpin} disabled={!canSpin}>
        SPIN
      </button>
    </div>
  )
}
