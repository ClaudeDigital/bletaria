import { useEffect, useRef } from 'react'

// Simplified world land polygons [lon, lat]
const LANDS = [
  // North America
  [[-168,71],[-155,70],[-145,60],[-130,55],[-125,49],[-122,46],
   [-117,32],[-105,22],[-88,16],[-83,10],[-80,26],[-75,35],
   [-64,44],[-55,56],[-65,65],[-75,63],[-88,58],[-95,60],
   [-110,65],[-120,68],[-145,65],[-165,68]],
  // Greenland
  [[-74,76],[-52,83],[-18,76],[-24,68],[-44,64],[-58,66],[-66,72]],
  // South America
  [[-80,12],[-75,10],[-65,0],[-52,-5],[-35,-8],[-35,-55],
   [-65,-55],[-75,-48],[-80,-30],[-78,-2]],
  // Europe (incl. Iberian, Scandinavia)
  [[-8,36],[0,36],[12,36],[14,38],[22,38],[28,42],[30,48],
   [28,55],[18,58],[12,56],[8,58],[5,62],[10,64],[20,68],
   [28,68],[30,62],[22,56],[18,44],[6,44],[0,50],[-8,42]],
  // British Isles
  [[-6,50],[-2,59],[0,58],[-2,52]],
  // Scandinavia tip
  [[5,58],[8,62],[18,68],[28,70],[30,65],[20,58]],
  // Africa
  [[-18,16],[0,22],[15,22],[38,18],[42,12],[50,10],
   [44,-12],[34,-20],[28,-34],[18,-34],[12,-22],[2,-6],
   [-2,4],[-8,4],[-18,8]],
  // Madagascar
  [[44,-12],[50,-18],[50,-25],[44,-24],[44,-16]],
  // Asia (main)
  [[26,42],[38,38],[50,30],[58,22],[65,22],[72,26],[78,32],
   [85,28],[92,28],[100,22],[105,12],[110,2],[120,2],[128,2],
   [130,34],[140,36],[145,42],[148,46],[140,48],[132,50],
   [122,58],[110,60],[88,58],[68,58],[48,60],[38,64],[28,60],[22,52]],
  // Japan
  [[130,32],[132,33],[136,34],[140,38],[140,42],[132,44],[130,40]],
  // Sri Lanka
  [[80,10],[82,8],[82,6],[80,8]],
  // SE Asia peninsula
  [[100,20],[102,12],[104,2],[100,4],[100,10],[98,16]],
  // Borneo
  [[108,2],[116,4],[118,2],[116,-2],[110,-4],[108,0]],
  // Sumatra
  [[96,5],[104,2],[106,-4],[100,-4],[96,2]],
  // Australia
  [[114,-22],[122,-18],[128,-14],[136,-12],[140,-14],[142,-10],
   [146,-14],[150,-22],[152,-26],[154,-28],[152,-36],[146,-38],
   [140,-36],[134,-32],[126,-28],[118,-26],[114,-22]],
  // New Zealand North
  [[174,-36],[178,-38],[176,-41],[172,-40],[172,-36]],
  // New Zealand South
  [[172,-42],[174,-44],[172,-46],[168,-46],[168,-42]],
  // Iceland
  [[-24,64],[-14,66],[-14,64],[-18,62],[-24,62]],
]

export default function SpinningGlobe({ size = 200 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId

    const R = Math.round(size * 0.38)
    const cx = size / 2
    const cy = size / 2
    const mapW = R * 4   // full 360° → R*4 px wide
    const mapH = R * 2   // full 180° → R*2 px tall

    const project = (lon, lat, off) => [
      cx - R + (lon + 180) * mapW / 360 - off,
      cy - R + (90 - lat) * mapH / 180,
    ]

    const drawPoly = (pts, off) => {
      if (pts.length < 3) return
      const [sx, sy] = project(pts[0][0], pts[0][1], off)
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      for (let i = 1; i < pts.length; i++) {
        const [x, y] = project(pts[i][0], pts[i][1], off)
        ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }

    const frame = (ts) => {
      const t = ts * 0.001
      const off = (ts * 0.022) % mapW

      ctx.clearRect(0, 0, size, size)

      // Off-white background
      ctx.fillStyle = '#F5F5F0'
      ctx.fillRect(0, 0, size, size)

      // ── WHIRL EFFECT ──────────────────────────────────────
      // 3 spiral arms rotating around the globe
      const arms = 3
      const steps = 22
      for (let arm = 0; arm < arms; arm++) {
        const baseAngle = t * 1.1 + (arm * Math.PI * 2) / arms
        for (let i = 0; i < steps - 1; i++) {
          const f0 = i / steps
          const f1 = (i + 1) / steps
          const a0 = baseAngle + f0 * Math.PI * 1.9
          const a1 = baseAngle + f1 * Math.PI * 1.9
          const r0 = R + 5 + f0 * 32
          const r1 = R + 5 + f1 * 32
          ctx.beginPath()
          ctx.moveTo(cx + Math.cos(a0) * r0, cy + Math.sin(a0) * r0)
          ctx.lineTo(cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1)
          ctx.strokeStyle = `rgba(25,25,25,${(1 - f0) * 0.16})`
          ctx.lineWidth = (1 - f0) * 2.2
          ctx.lineCap = 'round'
          ctx.stroke()
        }
      }

      // Extra outer soft rings
      for (let i = 0; i < 4; i++) {
        const angle = t * (0.4 + i * 0.15) + i * 1.3
        const ri = R + 18 + i * 9
        ctx.beginPath()
        ctx.arc(cx, cy, ri, angle, angle + Math.PI * (0.6 + i * 0.1))
        ctx.strokeStyle = `rgba(30,30,30,${0.06 - i * 0.01})`
        ctx.lineWidth = 1
        ctx.setLineDash([4, 6])
        ctx.stroke()
        ctx.setLineDash([])
      }

      // ── GLOBE ─────────────────────────────────────────────
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.clip()

      // Ocean fill
      ctx.fillStyle = '#D6D6D2'
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2)

      // Graticule
      ctx.strokeStyle = 'rgba(160,160,155,0.7)'
      ctx.lineWidth = 0.4
      ctx.setLineDash([2, 4])
      for (const lat of [-60, -30, 0, 30, 60]) {
        const y = cy - R + (90 - lat) * mapH / 180
        ctx.beginPath()
        ctx.moveTo(cx - R, y)
        ctx.lineTo(cx + R, y)
        ctx.stroke()
      }
      for (let lon = -180; lon < 180; lon += 30) {
        for (let w = -1; w <= 1; w++) {
          const x = cx - R + (lon + 180) * mapW / 360 - off + w * mapW
          if (x >= cx - R && x <= cx + R) {
            ctx.beginPath()
            ctx.moveTo(x, cy - R)
            ctx.lineTo(x, cy + R)
            ctx.stroke()
          }
        }
      }
      ctx.setLineDash([])

      // Land masses (draw 3 passes for wrap-around)
      ctx.fillStyle = '#1A1A1A'
      ctx.strokeStyle = '#111'
      ctx.lineWidth = 0.35
      for (const poly of LANDS) {
        for (const w of [-1, 0, 1]) {
          drawPoly(poly, off - w * mapW)
        }
      }

      // Sphere edge vignette
      const vign = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R)
      vign.addColorStop(0, 'rgba(0,0,0,0)')
      vign.addColorStop(0.72, 'rgba(0,0,0,0)')
      vign.addColorStop(1, 'rgba(0,0,0,0.42)')
      ctx.fillStyle = vign
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()

      // Globe border
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(80,80,80,0.8)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Specular highlight
      const shine = ctx.createRadialGradient(
        cx - R * 0.32, cy - R * 0.32, 0,
        cx, cy, R
      )
      shine.addColorStop(0, 'rgba(255,255,255,0.22)')
      shine.addColorStop(0.45, 'rgba(255,255,255,0)')
      ctx.fillStyle = shine
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fill()

      animId = requestAnimationFrame(frame)
    }

    animId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(animId)
  }, [size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: 'block' }}
    />
  )
}
