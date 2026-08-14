import { motion } from 'framer-motion'
import { AlertTriangle, Gauge, Radio, Siren, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface SimAlert {
  id: number
  kind: 'breach' | 'speeding'
  text: string
}

interface Counters {
  packets: number
  alerts: number
  avgSpeed: number
}

/** Closed-loop routes in a 320×200 design space, [x, y] pairs. */
const LOOPS: number[][][] = [
  [[20, 160], [80, 120], [150, 130], [230, 90], [300, 110], [260, 170], [140, 185], [50, 180]],
  [[30, 60], [110, 40], [200, 55], [280, 35], [295, 90], [210, 120], [90, 95]],
  [[60, 100], [140, 70], [240, 140], [180, 170], [90, 150]],
  [[240, 40], [300, 60], [285, 150], [220, 160], [200, 100]],
]

const ZONE: number[][] = [[196, 28], [292, 44], [282, 112], [192, 96]]
const ZONE_CENTER: [number, number] = [240, 70]

function loopLength(pts: number[][]): number[] {
  // cumulative distances including the closing segment
  const cum = [0]
  for (let i = 1; i <= pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i % pts.length]
    cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]))
  }
  return cum
}

function pointAt(pts: number[][], cum: number[], d: number): [number, number] {
  const total = cum[cum.length - 1]
  let dd = ((d % total) + total) % total
  for (let i = 1; i < cum.length; i++) {
    if (dd <= cum[i]) {
      const a = pts[i - 1]
      const b = pts[i % pts.length]
      const t = (dd - cum[i - 1]) / (cum[i] - cum[i - 1] || 1)
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
    }
  }
  return [pts[0][0], pts[0][1]]
}

/**
 * Interactive miniature of the dispatcher console: canvas fleet animation with
 * speed control, on-demand geofence breach, and live incrementing counters.
 */
export default function MiniFleetSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mult, setMult] = useState(1)
  const [counters, setCounters] = useState<Counters>({ packets: 0, alerts: 0, avgSpeed: 62 })
  const [feed, setFeed] = useState<SimAlert[]>([])
  const multRef = useRef(1)
  const packetsRef = useRef(0)
  const alertsRef = useRef(0)
  const breachRef = useRef<{ start: number } | null>(null)
  const alertSeq = useRef(0)
  multRef.current = mult

  const pushAlert = (kind: SimAlert['kind'], text: string) => {
    alertsRef.current += 1
    setFeed((f) => [{ id: ++alertSeq.current, kind, text }, ...f].slice(0, 4))
  }

  const triggerBreach = () => {
    if (breachRef.current) return
    breachRef.current = { start: performance.now() }
    pushAlert('breach', 'Truck 01 A 102 BB breached Restricted Zone R-7!')
  }

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const cums = LOOPS.map(loopLength)
    const offsets = [0, 120, 60, 200]
    const speeds = [14, 17, 12, 15] // px per second at 1x
    let dist = [...offsets]
    let last = performance.now()
    let raf = 0

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const rect = canvas.parentElement!.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      ctx.setTransform((rect.width / 320) * dpr, 0, 0, (rect.height / 200) * dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement!)

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const m = multRef.current

      for (let i = 0; i < LOOPS.length; i++) {
        dist[i] += speeds[i] * m * dt
      }
      // telemetry cadence: each truck emits a packet every simulated 2 s
      packetsRef.current += (LOOPS.length * m * dt) / 2

      ctx.clearRect(0, 0, 320, 200)

      // grid
      ctx.strokeStyle = 'rgba(148,163,184,0.08)'
      ctx.lineWidth = 0.6
      for (let x = 0; x <= 320; x += 32) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x + 18, 200)
        ctx.stroke()
      }
      for (let y = 0; y <= 200; y += 40) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(320, y - 12)
        ctx.stroke()
      }

      // geofence zone (flashes during a breach)
      const breach = breachRef.current
      const flash = breach ? 0.5 + 0.5 * Math.sin((now - breach.start) / 90) : 0
      ctx.fillStyle = `rgba(239,68,68,${(0.1 + flash * 0.15).toFixed(3)})`
      ctx.strokeStyle = `rgba(239,68,68,${(0.6 + flash * 0.4).toFixed(3)})`
      ctx.lineWidth = 1.4
      ctx.setLineDash([5, 3])
      ctx.beginPath()
      ZONE.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.setLineDash([])

      // routes
      ctx.strokeStyle = 'rgba(56,189,248,0.16)'
      ctx.lineWidth = 1.6
      for (const pts of LOOPS) {
        ctx.beginPath()
        pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
        ctx.closePath()
        ctx.stroke()
      }

      // trucks
      for (let i = 0; i < LOOPS.length; i++) {
        let [x, y] = pointAt(LOOPS[i], cums[i], dist[i])
        let color = '56,189,248'

        // truck 1 detours into the zone during a breach (4 s arc in and out)
        if (i === 1 && breach) {
          const p = (now - breach.start) / 4000
          if (p >= 1) {
            breachRef.current = null
          } else {
            const blend = Math.sin(p * Math.PI) // 0 → 1 → 0
            x = x + (ZONE_CENTER[0] - x) * blend
            y = y + (ZONE_CENTER[1] - y) * blend
            if (blend > 0.4) color = '239,68,68'
          }
        }

        const g = ctx.createRadialGradient(x, y, 0, x, y, 10)
        g.addColorStop(0, `rgba(${color},0.4)`)
        g.addColorStop(1, `rgba(${color},0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, 10, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = `rgb(${color})`
        ctx.strokeStyle = '#0a0f1c'
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.arc(x, y, 3.4, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    // publish counters to React at a readable rate
    const pub = setInterval(() => {
      setCounters({
        packets: Math.floor(packetsRef.current),
        alerts: alertsRef.current,
        avgSpeed: Math.round(62 * multRef.current + 3 * Math.sin(Date.now() / 1700)),
      })
    }, 400)

    return () => {
      cancelAnimationFrame(raf)
      clearInterval(pub)
      ro.disconnect()
    }
  }, [])

  // a 5× fleet occasionally trips the speed limit
  useEffect(() => {
    if (mult < 5) return
    const t = setTimeout(
      () => pushAlert('speeding', 'Truck 30 B 204 DD is speeding: 97 km/h (limit 90)'),
      1500,
    )
    return () => clearTimeout(t)
  }, [mult])

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* live canvas */}
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="glass-neon-sky relative overflow-hidden p-2 lg:col-span-2"
      >
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-gradient-to-br from-[#0b1322] to-[#101a2e]">
          <canvas ref={canvasRef} className="absolute inset-0" />
          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-medium text-slate-300 backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            LIVE SIMULATION
          </span>
        </div>

        {/* controls */}
        <div className="flex flex-wrap items-center gap-3 px-3 py-3">
          <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400">
            <Gauge className="h-3.5 w-3.5" /> Fleet speed
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 5].map((x) => (
              <button
                key={x}
                onClick={() => setMult(x)}
                className={`rounded-md px-2.5 py-1 font-mono text-xs transition ${
                  mult === x
                    ? 'bg-sky-500/25 text-sky-300 ring-1 ring-sky-400/50'
                    : 'text-slate-400 hover:bg-white/10'
                }`}
              >
                {x}x
              </button>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={triggerBreach}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-red-500/15 px-3.5 py-1.5 text-xs font-semibold text-red-300 ring-1 ring-red-500/30 transition hover:bg-red-500/25"
          >
            <Siren className="h-3.5 w-3.5" /> Trigger geofence breach
          </motion.button>
        </div>
      </motion.div>

      {/* live counters + feed */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3 lg:grid-cols-1 xl:grid-cols-3">
          {[
            { icon: Radio, label: 'packets', value: counters.packets.toLocaleString() },
            { icon: AlertTriangle, label: 'alerts', value: String(counters.alerts) },
            { icon: Zap, label: 'avg km/h', value: String(counters.avgSpeed) },
          ].map((c) => (
            <motion.div
              key={c.label}
              whileHover={{ y: -3 }}
              className="glass-neon p-3 text-center"
            >
              <c.icon className="mx-auto mb-1 h-3.5 w-3.5 text-emerald-400" />
              <div className="font-mono text-lg font-bold tabular-nums text-white">{c.value}</div>
              <div className="text-[9px] uppercase tracking-wider text-slate-400">{c.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="glass flex-1 space-y-1.5 p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">
            Alert feed
          </div>
          {feed.length === 0 && (
            <p className="text-[11px] text-slate-500">
              All quiet. Push the fleet to 5× — or breach a zone yourself.
            </p>
          )}
          {feed.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-start gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] ${
                a.kind === 'breach'
                  ? 'border-red-500/40 bg-red-500/10 text-red-300'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
              }`}
            >
              {a.kind === 'breach' ? (
                <Siren className="mt-0.5 h-3 w-3 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              )}
              <span className="text-slate-200">{a.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
