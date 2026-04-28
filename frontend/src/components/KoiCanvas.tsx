import { useEffect, useRef } from 'react'

interface Koi {
  x: number
  y: number
  angle: number
  speed: number
  wobble: number
  wobbleSpeed: number
  length: number
  bodyColor: string
  patchColor: string
  finColor: string
  turnBias: number
  turnTimer: number
}

const KOI_CONFIGS = [
  { bodyColor: '#f4a827', patchColor: '#c94f0a', finColor: '#e07010' }, // gold/orange
  { bodyColor: '#f5ddd5', patchColor: '#cc3333', finColor: '#e05555' }, // white/red (kohaku)
  { bodyColor: '#dde4f0', patchColor: '#334477', finColor: '#8899bb' }, // white/blue (asagi)
]

function createKoi(w: number, h: number, cfg: typeof KOI_CONFIGS[0]): Koi {
  return {
    x: w * 0.2 + Math.random() * w * 0.6,
    y: h * 0.2 + Math.random() * h * 0.6,
    angle: Math.random() * Math.PI * 2,
    speed: 1.2 + Math.random() * 0.8,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.05 + Math.random() * 0.02,
    length: 65 + Math.random() * 25,
    ...cfg,
    turnBias: (Math.random() - 0.5) * 0.02,
    turnTimer: 80 + Math.random() * 120,
  }
}

function steer(current: number, target: number, strength: number): number {
  let diff = target - current
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return current + diff * strength
}

function updateKoi(koi: Koi, w: number, h: number): void {
  koi.wobble += koi.wobbleSpeed
  koi.turnTimer--

  if (koi.turnTimer <= 0) {
    koi.turnBias = (Math.random() - 0.5) * 0.025
    koi.turnTimer = 100 + Math.random() * 180
  }

  const margin = 100
  const nearLeft   = koi.x < margin
  const nearRight  = koi.x > w - margin
  const nearTop    = koi.y < margin
  const nearBottom = koi.y > h - margin

  if (nearLeft || nearRight || nearTop || nearBottom) {
    const targetAngle = Math.atan2(h / 2 - koi.y, w / 2 - koi.x)
    const urgency = Math.max(
      nearLeft   ? (margin - koi.x) / margin            : 0,
      nearRight  ? (koi.x - (w - margin)) / margin      : 0,
      nearTop    ? (margin - koi.y) / margin             : 0,
      nearBottom ? (koi.y - (h - margin)) / margin       : 0,
    )
    koi.angle = steer(koi.angle, targetAngle, 0.04 + urgency * 0.07)
  } else {
    koi.angle += koi.turnBias
  }

  koi.x += Math.cos(koi.angle) * koi.speed
  koi.y += Math.sin(koi.angle) * koi.speed
}

function drawKoi(ctx: CanvasRenderingContext2D, koi: Koi): void {
  const { x, y, angle, length: L, wobble } = koi
  const w = Math.sin(wobble)
  const bw = L * 0.26

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)

  // Soft glow
  ctx.shadowColor = koi.bodyColor
  ctx.shadowBlur = 10

  // Caudal (tail) fins
  const tailBase  = L * 0.42
  const tailWobble = w * L * 0.13

  ctx.beginPath()
  ctx.moveTo(-tailBase, 0)
  ctx.bezierCurveTo(-tailBase - L * 0.14, -bw * 0.5 + tailWobble,  -tailBase - L * 0.28, -bw + tailWobble,    -tailBase - L * 0.2, -bw * 1.25 + tailWobble)
  ctx.bezierCurveTo(-tailBase - L * 0.1,  -bw * 0.75 + tailWobble, -tailBase,             -bw * 0.35,           -tailBase, 0)
  ctx.bezierCurveTo(-tailBase,              bw * 0.35,               -tailBase - L * 0.1,   bw * 0.75 + tailWobble, -tailBase - L * 0.2, bw * 1.25 + tailWobble)
  ctx.bezierCurveTo(-tailBase - L * 0.28,  bw + tailWobble,         -tailBase - L * 0.14,  bw * 0.5 + tailWobble, -tailBase, 0)
  ctx.fillStyle = koi.patchColor
  ctx.globalAlpha = 0.7
  ctx.fill()

  // Body
  ctx.beginPath()
  ctx.moveTo(L * 0.48, 0)
  ctx.bezierCurveTo( L * 0.36, -bw * 0.6,  L * 0.1,  -bw,       -L * 0.1,  -bw * 0.85)
  ctx.bezierCurveTo(-L * 0.25, -bw * 0.7, -L * 0.38, -bw * 0.4, -L * 0.42,  0)
  ctx.bezierCurveTo(-L * 0.38,  bw * 0.4, -L * 0.25,  bw * 0.7, -L * 0.1,   bw * 0.85)
  ctx.bezierCurveTo( L * 0.1,   bw,        L * 0.36,  bw * 0.6,  L * 0.48,  0)
  ctx.fillStyle = koi.bodyColor
  ctx.globalAlpha = 0.9
  ctx.fill()

  ctx.shadowBlur = 0

  // Color patch
  ctx.beginPath()
  ctx.ellipse(-L * 0.05, -bw * 0.35, L * 0.18, bw * 0.44, Math.PI / 5, 0, Math.PI * 2)
  ctx.fillStyle = koi.patchColor
  ctx.globalAlpha = 0.4
  ctx.fill()

  // Pectoral fin
  const finW = w * L * 0.05
  ctx.beginPath()
  ctx.moveTo(L * 0.1, bw * 0.55)
  ctx.bezierCurveTo(L * 0.05, bw * 0.95 + finW, -L * 0.1, bw * 1.1 + finW, -L * 0.16, bw * 0.72)
  ctx.bezierCurveTo(-L * 0.08, bw * 0.52, L * 0.04, bw * 0.42, L * 0.1, bw * 0.55)
  ctx.fillStyle = koi.finColor
  ctx.globalAlpha = 0.45
  ctx.fill()

  // Dorsal fin
  ctx.beginPath()
  ctx.moveTo(L * 0.14, -bw * 0.62)
  ctx.bezierCurveTo(L * 0.04, -bw * 1.1, -L * 0.1, -bw * 1.0, -L * 0.2, -bw * 0.72)
  ctx.bezierCurveTo(-L * 0.1, -bw * 0.56, L * 0.04, -bw * 0.5, L * 0.14, -bw * 0.62)
  ctx.fillStyle = koi.finColor
  ctx.globalAlpha = 0.4
  ctx.fill()

  // Eye
  ctx.beginPath()
  ctx.arc(L * 0.35, -bw * 0.28, L * 0.036, 0, Math.PI * 2)
  ctx.fillStyle = '#111'
  ctx.globalAlpha = 0.9
  ctx.fill()
  ctx.beginPath()
  ctx.arc(L * 0.356, -bw * 0.295, L * 0.013, 0, Math.PI * 2)
  ctx.fillStyle = '#fff'
  ctx.globalAlpha = 0.55
  ctx.fill()

  ctx.globalAlpha = 1
  ctx.restore()
}

export default function KoiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const koi = KOI_CONFIGS.map(cfg => createKoi(canvas.width, canvas.height, cfg))

    let raf: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const k of koi) {
        updateKoi(k, canvas.width, canvas.height)
        drawKoi(ctx, k)
      }
      raf = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0.45,
        zIndex: 1,
      }}
    />
  )
}
