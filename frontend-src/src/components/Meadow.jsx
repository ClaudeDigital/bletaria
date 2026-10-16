// Livadh: fije bari në dy shtresa (pas dhe para kosheres) dhe lule të egra.
// Fijet gjenerohen një herë me "random" të përcaktuar, që faqja të duket njëlloj çdo herë.

function rng(seed) {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

function blades({ seed, width, height, count, min, max, colors }) {
  const r = rng(seed)
  const out = []
  for (let i = 0; i < count; i++) {
    const x = r() * width
    const h = min + r() * (max - min)
    const w = 2.2 + r() * 3.2
    const bend = (r() - 0.5) * h * 0.55
    const top = height - h
    const d = `M${(x - w / 2).toFixed(1)} ${height} Q${(x + bend * 0.3).toFixed(1)} ${(height - h * 0.55).toFixed(1)} ${(x + bend).toFixed(1)} ${top.toFixed(1)} Q${(x + bend * 0.25 + w * 0.4).toFixed(1)} ${(height - h * 0.5).toFixed(1)} ${(x + w / 2).toFixed(1)} ${height} Z`
    out.push(<path key={i} d={d} fill={colors[Math.floor(r() * colors.length)]} />)
  }
  return out
}

const TILE = 520

// Shtresa e pasme: më e lartë, më e errët, rri pas kosheres
export function GrassBack({ height = 56 }) {
  return (
    <svg className="meadow-layer meadow-back" width="100%" height={height} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <pattern id="grass-back" width={TILE} height={height} patternUnits="userSpaceOnUse">
          {blades({ seed: 11, width: TILE, height, count: 140, min: height * 0.45, max: height, colors: ['var(--grass-3)', 'var(--grass-4)', 'var(--grass-2)'] })}
        </pattern>
      </defs>
      <rect width="100%" height={height} fill="url(#grass-back)" />
    </svg>
  )
}

// Shtresa e përparme: mbulon këmbët e kosheres, me lule
export function GrassFront({ height = 46, flowers = true }) {
  const r = rng(29)
  const fl = []
  if (flowers) {
    for (let i = 0; i < 13; i++) {
      const x = 12 + r() * (TILE - 24)
      const y = 10 + r() * (height * 0.45)
      const kind = r()
      const petal = kind < 0.45 ? '#FBFAF3' : kind < 0.75 ? '#F2C94C' : '#C9B6E4'
      const size = 2.6 + r() * 1.6
      fl.push(
        <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
          <path d={`M0 ${size} Q${(r() - 0.5) * 4} ${(height - y) / 2} 0 ${height - y}`} stroke="var(--grass-3)" strokeWidth="1.2" fill="none" />
          {[0, 72, 144, 216, 288].map(a => (
            <ellipse key={a} cx="0" cy={-size * 0.9} rx={size * 0.55} ry={size * 0.95} fill={petal} transform={`rotate(${a})`} />
          ))}
          <circle r={size * 0.55} fill={petal === '#F2C94C' ? '#B7791F' : '#E3A21A'} />
        </g>
      )
    }
  }
  return (
    <svg className="meadow-layer meadow-front" width="100%" height={height} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <pattern id="grass-front" width={TILE} height={height} patternUnits="userSpaceOnUse">
          {blades({ seed: 7, width: TILE, height, count: 190, min: height * 0.3, max: height * 0.95, colors: ['var(--grass-1)', 'var(--grass-2)', 'var(--grass-3)'] })}
          {fl}
        </pattern>
      </defs>
      <rect width="100%" height={height} fill="url(#grass-front)" />
    </svg>
  )
}

// Kodra të largëta pas oborrit
export function Hills({ height = 120 }) {
  return (
    <svg className="meadow-hills" viewBox="0 0 1440 120" preserveAspectRatio="none" width="100%" height={height} aria-hidden="true">
      <path d="M0 70 C 160 30, 300 40, 430 62 S 700 20, 860 46 S 1160 70, 1280 38 S 1400 30, 1440 44 L1440 120 L0 120 Z" fill="var(--grass-1)" opacity=".28" />
      <path d="M0 92 C 200 62, 340 74, 520 86 S 820 58, 1000 78 S 1300 92, 1440 70 L1440 120 L0 120 Z" fill="var(--grass-2)" opacity=".32" />
    </svg>
  )
}
