import { useEffect, useRef } from 'react'

/**
 * Full-viewport cyber-grid + particle canvas. Grid nodes glow and lean toward
 * the cursor with distance falloff; drifting particles add depth. Renders a
 * single static frame when the user prefers reduced motion.
 */
export default function CyberGridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const GAP = 56
    let w = 0
    let h = 0
    let cols = 0
    let rows = 0
    const mouse = { x: -9999, y: -9999 }

    interface Particle {
      x: number
      y: number
      vx: number
      vy: number
      r: number
      hue: number
    }
    let particles: Particle[] = []

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.ceil(w / GAP) + 1
      rows = Math.ceil(h / GAP) + 1
      const count = Math.min(90, Math.floor((w * h) / 22000))
      particles = Array.from({ length: count }, (_, i) => ({
        x: ((i * 733) % 1000) / 1000 * w,
        y: ((i * 271) % 1000) / 1000 * h,
        vx: (((i * 97) % 100) / 100 - 0.5) * 0.35,
        vy: (((i * 53) % 100) / 100 - 0.5) * 0.35,
        r: 0.8 + ((i * 37) % 100) / 100 * 1.4,
        hue: i % 3,
      }))
    }

    const HUES = ['14,165,233', '16,185,129', '124,58,237'] // sky, emerald, violet

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)

      // grid nodes with cursor attraction + slow breathing glow
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const bx = gx * GAP
          const by = gy * GAP
          const dx = mouse.x - bx
          const dy = mouse.y - by
          const dist = Math.hypot(dx, dy)
          const pull = Math.max(0, 1 - dist / 220)
          const px = bx + dx * pull * 0.12
          const py = by + dy * pull * 0.12
          const breathe = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(t / 2400 + gx * 0.7 + gy * 0.9)
          const alpha = 0.05 + breathe * 0.05 + pull * 0.45
          ctx.fillStyle = `rgba(56,189,248,${alpha.toFixed(3)})`
          ctx.beginPath()
          ctx.arc(px, py, 1 + pull * 1.6, 0, Math.PI * 2)
          ctx.fill()

          // connect brightened nodes near the cursor
          if (pull > 0.25 && gx + 1 < cols) {
            ctx.strokeStyle = `rgba(56,189,248,${(pull * 0.16).toFixed(3)})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(px, py)
            ctx.lineTo(bx + GAP, by)
            ctx.stroke()
          }
        }
      }

      // drifting particles
      for (const p of particles) {
        if (!reduced) {
          p.x += p.vx
          p.y += p.vy
          if (p.x < -10) p.x = w + 10
          if (p.x > w + 10) p.x = -10
          if (p.y < -10) p.y = h + 10
          if (p.y > h + 10) p.y = -10
        }
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6)
        g.addColorStop(0, `rgba(${HUES[p.hue]},0.35)`)
        g.addColorStop(1, `rgba(${HUES[p.hue]},0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    let raf = 0
    const loop = (t: number) => {
      draw(t)
      raf = requestAnimationFrame(loop)
    }

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    const onLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)
    if (reduced) {
      draw(0)
    } else {
      raf = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 opacity-70"
    />
  )
}
