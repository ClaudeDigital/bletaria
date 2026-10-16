// Kosherja si kuti e lyer: një kuti për çdo kat, kapak sipër, këmbë poshtë.
// Ngjyra e bojës është e qëndrueshme për çdo koshere (sipas id-së),
// statusi lexohet nga hyrja, kapaku dhe bojëra e zbehur.

const PAINTS = ['--paint-blue', '--paint-yellow', '--paint-green', '--paint-white', '--paint-sky', '--paint-sage']

export function paintFor(seed = 0) {
  const n = typeof seed === 'number' ? seed : String(seed).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return `var(${PAINTS[Math.abs(n * 7 + 3) % PAINTS.length]})`
}

export const STATUS = {
  good:    { label: 'Mirë',        color: 'var(--meadow)' },
  problem: { label: 'Me probleme', color: 'var(--honey)' },
  dead:    { label: 'E vdekur',    color: 'var(--propolis)' },
  empty:   { label: 'Bosh',        color: 'var(--line-strong)' },
}

export default function HiveStack({ floors = 1, seed = 0, status = 'good', queenless = false, width = 56, title }) {
  const f = Math.max(1, Math.min(5, floors || 1))
  const BOX = 15, ROOF = 9, LEGS = 6
  const H = ROOF + f * BOX + LEGS + 1
  const height = (width / 60) * H
  const empty = status === 'empty'
  const dead = status === 'dead'
  const paint = paintFor(seed)

  const boxFill = empty ? 'transparent' : paint
  const boxes = []
  for (let i = 0; i < f; i++) {
    const y = ROOF + i * BOX
    const bottom = i === f - 1
    boxes.push(
      <g key={i}>
        <rect x="6" y={y} width="48" height={BOX} rx="1.5"
          fill={boxFill}
          stroke={empty ? 'var(--line-strong)' : 'rgba(30,43,34,.55)'}
          strokeWidth="1.2"
          strokeDasharray={empty ? '3 2.5' : undefined} />
        {!empty && <line x1="9" y1={y + 3.5} x2="51" y2={y + 3.5} stroke="rgba(255,255,255,.35)" strokeWidth="1" />}
        {!empty && <rect x="24" y={y + 5} width="12" height="2.2" rx="1.1" fill="rgba(30,43,34,.28)" />}
        {bottom && !empty && (
          <rect x="17" y={y + BOX - 4.5} width="26" height="3" rx="1.2"
            fill={dead ? 'var(--propolis)' : '#1E2B22'} />
        )}
      </g>
    )
  }

  return (
    <svg className="hive-svg" width={width} height={height} viewBox={`0 0 60 ${H}`} role="img" aria-label={title}>
      {title && <title>{title}</title>}
      <g style={dead ? { filter: 'grayscale(.85) brightness(.92)' } : undefined}>
        {/* kapaku */}
        <rect x="2" y="2" width="56" height={ROOF - 2} rx="1.5"
          fill={empty ? 'transparent' : 'var(--ink)'}
          stroke={empty ? 'var(--line-strong)' : 'none'} strokeWidth="1.2"
          strokeDasharray={empty ? '3 2.5' : undefined} />
        {boxes}
      </g>
      {/* këmbët */}
      <rect x="9" y={ROOF + f * BOX} width="4" height={LEGS} fill="var(--ink-2)" opacity={empty ? .35 : .8} />
      <rect x="47" y={ROOF + f * BOX} width="4" height={LEGS} fill="var(--ink-2)" opacity={empty ? .35 : .8} />
      {/* shenjë problemi mbi kapak */}
      {status === 'problem' && <circle cx="52" cy="3.5" r="4.2" fill="var(--honey)" stroke="var(--paper)" strokeWidth="1.5" />}
      {queenless && status !== 'empty' && status !== 'dead' && (
        <circle cx="8" cy="3.5" r="4.2" fill="var(--paper)" stroke="var(--propolis)" strokeWidth="2" />
      )}
    </svg>
  )
}
