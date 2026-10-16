// Disa bletë që fluturojnë mbi livadh. Lëvizja X dhe Y kanë kohëzgjatje të ndryshme,
// kështu rruga s'përsëritet dukshëm. Fshihen kur përdoruesi kërkon pak lëvizje.

function Bee() {
  return (
    <svg width="22" height="18" viewBox="0 0 22 18" aria-hidden="true">
      <g className="bee-wings">
        <ellipse cx="9" cy="5" rx="4.2" ry="3.4" fill="rgba(255,255,255,.85)" stroke="rgba(30,43,34,.35)" strokeWidth=".6" />
        <ellipse cx="13" cy="5.4" rx="3.6" ry="3" fill="rgba(255,255,255,.75)" stroke="rgba(30,43,34,.3)" strokeWidth=".6" />
      </g>
      <ellipse cx="11" cy="11" rx="7" ry="4.6" fill="#E9B42C" />
      <path d="M8.2 6.8 v8.4 M11.4 6.5 v9 M14.4 7.2 v7.6" stroke="#2A2116" strokeWidth="1.6" />
      <circle cx="18.2" cy="10.4" r="2.6" fill="#2A2116" />
      <path d="M3.6 11 l-2.4 .8" stroke="#2A2116" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

const FLIGHTS = [
  { top: '18%', x: 26, y: 3.1, delay: 0 },
  { top: '34%', x: 34, y: 2.3, delay: -9 },
  { top: '8%',  x: 41, y: 3.7, delay: -21 },
]

export default function Bees() {
  return (
    <div className="bees" aria-hidden="true">
      {FLIGHTS.map((f, i) => (
        <div key={i} className="bee-x" style={{ top: f.top, animationDuration: `${f.x}s`, animationDelay: `${f.delay}s` }}>
          <div className="bee-y" style={{ animationDuration: `${f.y}s` }}>
            <div className="bee-face" style={{ animationDuration: `${f.x * 2}s`, animationDelay: `${f.delay}s` }}>
              <Bee />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export const BEES_CSS = `
.bees { position: absolute; inset: 0 0 30% 0; pointer-events: none; z-index: 4; overflow: hidden; }
.bee-x { position: absolute; left: 0; animation: bee-x linear infinite alternate; }
.bee-y { animation: bee-y ease-in-out infinite alternate; }
.bee-face { animation: bee-face steps(1) infinite; }
.bee-wings { transform-origin: 11px 7px; animation: bee-wing .09s linear infinite alternate; }
@keyframes bee-x { from { left: 2%; } to { left: 94%; } }
@keyframes bee-y { from { transform: translateY(-14px) rotate(-6deg); } to { transform: translateY(16px) rotate(5deg); } }
@keyframes bee-face { 0% { transform: scaleX(1); } 50% { transform: scaleX(-1); } }
@keyframes bee-wing { to { transform: scaleY(.35); } }
@media (prefers-reduced-motion: reduce) { .bees { display: none; } }
`
