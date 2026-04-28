import { useEffect, useRef } from 'react'

interface Cfg {
  freqX: number; freqY: number; phase: number; speed: number; sizeM: number; yM: number
  waveFreq: number
  bodyTop: string; bodyBot: string
  tailU0: string; tailU1: string
  tailL0: string; tailL1: string
  dorsalBase: string; dorsalMid: string
  pecBase: string
  scaleHi: string
  glow: string
  patches: Array<{ x: number; y: number; rx: number; ry: number; a: number; c0: string; c1: string }>
}

const FISH: Cfg[] = [
  {
    freqX:1.000, freqY:1.618, phase:0.00, speed:1.00, sizeM:1.00, yM:0.65, waveFreq:0.0020,
    bodyTop:'#f9f4ee', bodyBot:'#ede0cc',
    tailU0:'#cc2200', tailU1:'rgba(165,22,0,0.22)',
    tailL0:'#f0e4d2', tailL1:'rgba(224,206,182,0.22)',
    dorsalBase:'rgba(238,168,132,0.90)', dorsalMid:'rgba(200,68,26,0.64)',
    pecBase:'rgba(246,226,206,0.92)', scaleHi:'rgba(255,250,238,0.34)',
    glow:'rgba(228,140,60,0.55)',
    patches:[
      {x:82, y:-14,rx:28,ry:22,a:-0.15,c0:'#d42200',c1:'rgba(170,20,0,0)'},
      {x:28, y:-18,rx:42,ry:32,a:-0.28,c0:'#d42200',c1:'rgba(170,20,0,0)'},
      {x:-20,y: 22,rx:48,ry:36,a: 0.22,c0:'#cc2000',c1:'rgba(162,18,0,0)'},
    ],
  },
  {
    freqX:0.890, freqY:1.414, phase:2.10, speed:0.82, sizeM:0.86, yM:0.62, waveFreq:0.0017,
    bodyTop:'#f8df58', bodyBot:'#d48808',
    tailU0:'#e8a818', tailU1:'rgba(200,136,10,0.22)',
    tailL0:'#f6d850', tailL1:'rgba(240,208,55,0.22)',
    dorsalBase:'rgba(252,230,80,0.92)', dorsalMid:'rgba(210,148,12,0.68)',
    pecBase:'rgba(250,228,80,0.90)', scaleHi:'rgba(255,248,155,0.42)',
    glow:'rgba(255,200,35,0.55)',
    patches:[
      {x: 38,y:-16,rx:36,ry:28,a:-0.20,c0:'rgba(185,108,0,0.55)',c1:'rgba(165,85,0,0)'},
      {x:-26,y: 18,rx:44,ry:34,a: 0.18,c0:'rgba(170,95,0,0.50)', c1:'rgba(148,72,0,0)'},
    ],
  },
  {
    freqX:1.130, freqY:1.732, phase:4.20, speed:1.14, sizeM:0.78, yM:0.66, waveFreq:0.0023,
    bodyTop:'#f5f0e8', bodyBot:'#e0d6c4',
    tailU0:'#252535', tailU1:'rgba(28,28,50,0.22)',
    tailL0:'#e8e0d0', tailL1:'rgba(218,208,188,0.22)',
    dorsalBase:'rgba(200,195,188,0.88)', dorsalMid:'rgba(32,32,52,0.62)',
    pecBase:'rgba(244,238,228,0.90)', scaleHi:'rgba(255,254,250,0.30)',
    glow:'rgba(140,145,215,0.55)',
    patches:[
      {x: 75,y:-12,rx:32,ry:24,a:-0.12,c0:'#252535',c1:'rgba(24,24,45,0)'},
      {x: 18,y:-20,rx:46,ry:34,a:-0.26,c0:'#1e1e2e',c1:'rgba(18,18,38,0)'},
      {x:-28,y: 20,rx:50,ry:38,a: 0.20,c0:'#252535',c1:'rgba(24,24,45,0)'},
    ],
  },
  {
    freqX:0.770, freqY:2.058, phase:1.30, speed:0.94, sizeM:0.90, yM:0.64, waveFreq:0.0021,
    bodyTop:'#fde8bc', bodyBot:'#f0ae58',
    tailU0:'#d84200', tailU1:'rgba(195,50,0,0.22)',
    tailL0:'#fddea0', tailL1:'rgba(244,208,136,0.22)',
    dorsalBase:'rgba(252,210,140,0.90)', dorsalMid:'rgba(210,78,16,0.66)',
    pecBase:'rgba(252,224,168,0.90)', scaleHi:'rgba(255,242,200,0.36)',
    glow:'rgba(255,118,26,0.55)',
    patches:[
      {x: 80,y:-14,rx:28,ry:20,a:-0.14,c0:'#e04600',c1:'rgba(182,48,0,0)'},
      {x: 24,y:-18,rx:44,ry:32,a:-0.26,c0:'#d83e00',c1:'rgba(176,42,0,0)'},
      {x:-22,y: 22,rx:50,ry:36,a: 0.22,c0:'#cc3a00',c1:'rgba(172,38,0,0)'},
    ],
  },
]

// Pre-render dimensions — fish local coords + shadow padding
const FW = 360, FH = 260   // offscreen canvas size
const FOX = 172, FOY = 148  // fish local origin (0,0) inside offscreen canvas
const NFRAMES = 20           // animation frames per wobble cycle

function tracebody(ctx: CanvasRenderingContext2D, wb: number): void {
  ctx.beginPath()
  ctx.moveTo(140, 0)
  ctx.bezierCurveTo(140,-20, 126,-44, 112,-52)
  ctx.bezierCurveTo( 98,-60,  76,-70,  52,-73)
  ctx.bezierCurveTo( 40,-74,  32,-74,  24,-74)
  ctx.bezierCurveTo( 20,-82,  16,-110, 16,-124+wb*5)
  ctx.bezierCurveTo( 16,-110, 12, -80,  0, -72)
  ctx.bezierCurveTo(-16,-66, -44, -58,-72, -44)
  ctx.bezierCurveTo(-88,-36,-100, -24,-106,-10)
  ctx.bezierCurveTo(-110,0, -124,-40,-148,-78+wb*7)
  ctx.bezierCurveTo(-142,-48,-130,-20,-122,  -4)
  ctx.bezierCurveTo(-114, 14,-128, 44,-148, 80+wb*7)
  ctx.bezierCurveTo(-138, 52,-118, 32,-106, 18)
  ctx.bezierCurveTo( -92, 30, -68, 46, -40, 56)
  ctx.bezierCurveTo( -12, 64,  28, 68,  62, 66)
  ctx.bezierCurveTo(  86, 62, 108, 52, 120, 38)
  ctx.bezierCurveTo( 132, 26, 140, 14, 140,  0)
  ctx.closePath()
}

function drawKoi(ctx: CanvasRenderingContext2D, t: number, c: Cfg): void {
  const wb = Math.sin(t * c.waveFreq)
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'

  // Tail fins (behind body)
  ctx.save(); ctx.globalAlpha = 0.80

  ctx.beginPath()
  ctx.moveTo(-106,-10)
  ctx.bezierCurveTo(-110,0,-124,-40,-148,-78+wb*7)
  ctx.bezierCurveTo(-142,-48,-130,-20,-122,-4)
  ctx.closePath()
  const gTU = ctx.createLinearGradient(-106,-10,-148,-76)
  gTU.addColorStop(0,c.tailU0); gTU.addColorStop(1,c.tailU1)
  ctx.fillStyle=gTU; ctx.fill()

  ctx.beginPath()
  ctx.moveTo(-122,-4)
  ctx.bezierCurveTo(-114,14,-128,44,-148,80+wb*7)
  ctx.bezierCurveTo(-138,52,-118,32,-106,18)
  ctx.closePath()
  const gTL = ctx.createLinearGradient(-106,18,-148,78)
  gTL.addColorStop(0,c.tailL0); gTL.addColorStop(1,c.tailL1)
  ctx.fillStyle=gTL; ctx.fill()
  ctx.restore()

  // Body base
  tracebody(ctx,wb)
  const gB = ctx.createLinearGradient(0,-92,0,76)
  gB.addColorStop(0,c.bodyTop); gB.addColorStop(0.38,c.bodyTop)
  gB.addColorStop(0.72,c.bodyBot); gB.addColorStop(1,c.bodyBot)
  ctx.fillStyle=gB; ctx.fill()

  // Belly shadow overlay
  tracebody(ctx,wb)
  const gSh=ctx.createLinearGradient(0,36,0,76)
  gSh.addColorStop(0,'rgba(0,0,0,0)'); gSh.addColorStop(1,'rgba(0,0,0,0.10)')
  ctx.fillStyle=gSh; ctx.fill()

  // Patches (no clip — tiny overflow is fine at screen scale)
  c.patches.forEach(({x,y,rx,ry,a,c0,c1})=>{
    ctx.beginPath(); ctx.ellipse(x,y,rx,ry,a,0,Math.PI*2)
    const g=ctx.createRadialGradient(x,y-4,2,x,y,rx*1.12)
    g.addColorStop(0,c0); g.addColorStop(1,c1)
    ctx.fillStyle=g; ctx.fill()
  })

  // Scale texture — one row of arcs along the lateral line only (fast)
  const scaleY=[-34,-17,0,17,34]
  scaleY.forEach(yc=>{
    const shift=(Math.abs(yc/17)%2)*11
    for(let col=-6;col<=5;col++){
      const xc=col*22+shift
      if(xc<-120||xc>120) continue
      ctx.save(); ctx.translate(xc,yc)
      ctx.beginPath(); ctx.arc(0,0,8,Math.PI,0); ctx.closePath()
      const sg=ctx.createLinearGradient(0,-8,0,3)
      sg.addColorStop(0,c.scaleHi)
      sg.addColorStop(1,'rgba(0,0,0,0.04)')
      ctx.fillStyle=sg; ctx.fill()
      ctx.restore()
    }
  })

  // Specular dorsal highlight
  ctx.beginPath()
  ctx.moveTo(-55,-52)
  ctx.bezierCurveTo(-18,-64,22,-71,60,-70)
  ctx.bezierCurveTo(88,-67,108,-58,118,-46)
  ctx.bezierCurveTo(108,-52,92,-62,64,-64)
  ctx.bezierCurveTo(28,-66,-10,-60,-50,-50)
  ctx.closePath()
  const gSp=ctx.createLinearGradient(30,-72,30,-40)
  gSp.addColorStop(0,'rgba(255,255,255,0.60)'); gSp.addColorStop(1,'rgba(255,255,255,0)')
  ctx.fillStyle=gSp; ctx.fill()

  // Body outline
  tracebody(ctx,wb)
  ctx.strokeStyle='rgba(100,58,18,0.18)'; ctx.lineWidth=1.2; ctx.stroke()

  // Dorsal fin
  ctx.beginPath()
  ctx.moveTo(52,-73)
  ctx.bezierCurveTo(40,-74,30,-74,24,-74)
  ctx.bezierCurveTo(20,-82,16,-110,16,-124+wb*5)
  ctx.bezierCurveTo(16,-110,12,-80,0,-72)
  ctx.lineTo(52,-73); ctx.closePath()
  const gDor=ctx.createLinearGradient(28,-72,16,-118)
  gDor.addColorStop(0,c.dorsalBase); gDor.addColorStop(0.44,c.dorsalMid)
  gDor.addColorStop(1,'rgba(0,0,0,0.04)')
  ctx.fillStyle=gDor; ctx.globalAlpha=0.78; ctx.fill()
  ctx.globalAlpha=0.20; ctx.strokeStyle=c.dorsalMid; ctx.lineWidth=0.9
  for(let i=0;i<6;i++){
    const fx=46-i*9
    ctx.beginPath(); ctx.moveTo(fx,-73)
    ctx.lineTo(16+(fx-16)*0.15,-73-(i*7+18)); ctx.stroke()
  }
  ctx.globalAlpha=1

  // Pectoral fin — ventral
  ctx.beginPath()
  ctx.moveTo(88,28)
  ctx.bezierCurveTo(76,52,52,76,26,80)
  ctx.bezierCurveTo(8,82,-2,70,8,56)
  ctx.bezierCurveTo(22,44,56,40,76,32)
  ctx.closePath()
  const gPV=ctx.createLinearGradient(88,28,18,78)
  gPV.addColorStop(0,c.pecBase); gPV.addColorStop(1,'rgba(220,200,170,0.06)')
  ctx.fillStyle=gPV; ctx.globalAlpha=0.70; ctx.fill(); ctx.globalAlpha=1

  // Pectoral fin — dorsal
  ctx.beginPath()
  ctx.moveTo(88,-28)
  ctx.bezierCurveTo(72,-54,46,-68,22,-64)
  ctx.bezierCurveTo(6,-60,2,-48,14,-36)
  ctx.bezierCurveTo(28,-24,62,-26,78,-30)
  ctx.closePath()
  const gPD=ctx.createLinearGradient(88,-28,18,-62)
  gPD.addColorStop(0,c.pecBase); gPD.addColorStop(1,'rgba(220,200,170,0.05)')
  ctx.fillStyle=gPD; ctx.globalAlpha=0.62; ctx.fill(); ctx.globalAlpha=1

  // Eye
  const ex=110,ey=-24
  ctx.beginPath(); ctx.arc(ex,ey,7.5,0,Math.PI*2)
  ctx.fillStyle='#f6ede2'; ctx.fill()
  ctx.beginPath(); ctx.arc(ex,ey,5.0,0,Math.PI*2)
  const gi=ctx.createRadialGradient(ex-1.2,ey-1.2,0.5,ex,ey,5.0)
  gi.addColorStop(0,'#7a4e00'); gi.addColorStop(1,'#1c0800')
  ctx.fillStyle=gi; ctx.fill()
  ctx.beginPath(); ctx.arc(ex,ey,2.8,0,Math.PI*2)
  ctx.fillStyle='#060100'; ctx.fill()
  ctx.beginPath(); ctx.arc(ex-1.6,ey-1.8,1.4,0,Math.PI*2)
  ctx.fillStyle='rgba(255,255,255,0.92)'; ctx.fill()
  ctx.beginPath(); ctx.arc(ex,ey,7.5,0,Math.PI*2)
  ctx.strokeStyle='rgba(100,58,18,0.28)'; ctx.lineWidth=0.8; ctx.stroke()
  ctx.beginPath(); ctx.arc(138,5,3.0,0,Math.PI*2)
  ctx.fillStyle='rgba(180,108,78,0.62)'; ctx.fill()
}

export default function KoiHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cacheRef  = useRef<HTMLCanvasElement[][] | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Pre-render every fish × every animation frame once
    cacheRef.current = FISH.map(cfg => {
      const period = (2 * Math.PI) / cfg.waveFreq
      return Array.from({ length: NFRAMES }, (_, i) => {
        const t  = (i / NFRAMES) * period
        const oc = document.createElement('canvas')
        oc.width = FW; oc.height = FH
        const oc2 = oc.getContext('2d')!
        // Bake the glow into the frame so main loop needs zero shadow ops
        oc2.shadowColor = cfg.glow
        oc2.shadowBlur  = 18
        oc2.translate(FOX, FOY)
        drawKoi(oc2, t, cfg)
        return oc
      })
    })

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    let raf: number
    const start = performance.now()

    const tick = () => {
      const cache = cacheRef.current
      if (!cache) { raf = requestAnimationFrame(tick); return }

      const t  = performance.now() - start
      const cw = canvas.width, ch = canvas.height
      ctx.clearRect(0, 0, cw, ch)

      const cx     = cw / 2, cy = ch / 2
      const baseRx = Math.min(cw * 0.36, cw / 2 - 65)
      const baseRy = Math.min(ch * 0.30, ch / 2 - 65)
      const baseSc = Math.min(cw, ch) * 0.46 / 280

      FISH.forEach((f, fi) => {
        const α   = t * f.speed * 0.00019 + f.phase
        const rx  = baseRx * (0.82 + f.sizeM * 0.20)
        const ry  = baseRy * (0.82 + f.sizeM * 0.20)
        const hx  = cx + rx * Math.cos(α * f.freqX)
        const hy  = cy + ry * Math.sin(α * f.freqY)
        const dhx = -rx * f.freqX * Math.sin(α * f.freqX)
        const dhy =  ry * f.freqY * Math.cos(α * f.freqY)
        const sc  = baseSc * f.sizeM

        // Pick the pre-rendered frame for current wobble phase
        const frame = Math.floor((t * f.waveFreq / (2 * Math.PI)) * NFRAMES) % NFRAMES

        ctx.save()
        ctx.translate(hx, hy)
        ctx.rotate(Math.atan2(dhy, dhx))
        ctx.scale(sc, sc * f.yM)
        ctx.translate(-FOX, -FOY)
        ctx.drawImage(cache[fi][frame], 0, 0)
        ctx.restore()
      })

      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  )
}
