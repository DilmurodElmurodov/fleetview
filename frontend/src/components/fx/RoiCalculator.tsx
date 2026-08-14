import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'
import { Calculator, Fuel, TrendingUp, Wallet } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/** Animates a number toward `target` with an ease-out ramp. */
function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  useEffect(() => {
    const from = fromRef.current
    if (from === target) return
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(from + (target - from) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      fromRef.current = target
    }
  }, [target, durationMs])
  return value
}

// Model assumptions (heavy trucks): ~35 l/100 km, ~$1.05/l diesel, 30 days/mo.
const FUEL_L_PER_KM = 0.35
const FUEL_USD_PER_L = 1.05

function model(fleet: number, kmPerDay: number) {
  const fuelSavedPct = Math.min(18, 7 + fleet * 0.012 + kmPerDay * 0.006)
  const efficiencyPct = Math.min(26, 9 + fleet * 0.015 + kmPerDay * 0.008)
  const monthlyFuelSpend = fleet * kmPerDay * 30 * FUEL_L_PER_KM * FUEL_USD_PER_L
  const monthlyRoi = monthlyFuelSpend * (fuelSavedPct / 100)
  return { fuelSavedPct, efficiencyPct, monthlyRoi }
}

export default function RoiCalculator() {
  const [fleet, setFleet] = useState(60)
  const [kmPerDay, setKmPerDay] = useState(420)
  const [revealed, setRevealed] = useState(false)

  const { fuelSavedPct, efficiencyPct, monthlyRoi } = model(fleet, kmPerDay)
  const fuelAnim = useCountUp(revealed ? fuelSavedPct : 0)
  const effAnim = useCountUp(revealed ? efficiencyPct : 0)
  const roiAnim = useCountUp(revealed ? monthlyRoi : 0)

  const reveal = (e: React.MouseEvent<HTMLButtonElement>) => {
    setRevealed(true)
    const rect = e.currentTarget.getBoundingClientRect()
    confetti({
      particleCount: 70,
      spread: 75,
      startVelocity: 28,
      scalar: 0.8,
      origin: {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: rect.top / window.innerHeight,
      },
      colors: ['#059669', '#0ea5e9', '#a78bfa', '#e2e8f0'],
      disableForReducedMotion: true,
    })
  }

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="glass-neon grid grid-cols-1 gap-8 p-8 lg:grid-cols-2"
    >
      {/* inputs */}
      <div>
        <div className="mb-6 flex items-center gap-2">
          <div className="rounded-xl bg-emerald-500/15 p-2.5">
            <Calculator className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Calculate your fleet savings</h3>
            <p className="text-xs text-slate-400">Live model — drag the sliders</p>
          </div>
        </div>

        <label className="flex items-baseline justify-between text-[11px] uppercase tracking-wider text-slate-400">
          Fleet size
          <span className="font-mono text-sm normal-case text-white">{fleet} trucks</span>
        </label>
        <input
          type="range"
          min={5}
          max={500}
          step={5}
          value={fleet}
          onChange={(e) => setFleet(Number(e.target.value))}
          className="mt-2 w-full accent-emerald-500"
        />

        <label className="mt-6 flex items-baseline justify-between text-[11px] uppercase tracking-wider text-slate-400">
          Average distance
          <span className="font-mono text-sm normal-case text-white">{kmPerDay} km/day</span>
        </label>
        <input
          type="range"
          min={50}
          max={1000}
          step={10}
          value={kmPerDay}
          onChange={(e) => setKmPerDay(Number(e.target.value))}
          className="mt-2 w-full accent-emerald-500"
        />

        {!revealed && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={reveal}
            className="btn-glow mt-8 w-full rounded-xl px-6 py-3.5 text-sm font-semibold text-white"
          >
            Calculate my savings
          </motion.button>
        )}
        {revealed && (
          <p className="mt-8 text-[11px] leading-relaxed text-slate-500">
            Estimates based on ~35 l/100 km heavy-truck consumption at $1.05/l and observed
            telemetry-driven savings across reference fleets. Actuals depend on routes and cargo.
          </p>
        )}
      </div>

      {/* outputs */}
      <div className="grid grid-cols-1 content-center gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        {[
          {
            icon: Fuel,
            label: 'Fuel saved',
            value: `${fuelAnim.toFixed(1)}%`,
            sub: 'idle & route waste cut',
          },
          {
            icon: TrendingUp,
            label: 'Efficiency boost',
            value: `${effAnim.toFixed(1)}%`,
            sub: 'more deliveries / truck',
          },
          {
            icon: Wallet,
            label: 'Monthly ROI',
            value: `$${Math.round(roiAnim).toLocaleString()}`,
            sub: 'estimated net savings',
          },
        ].map((o) => (
          <div key={o.label} className="glass p-5 text-center">
            <o.icon className="mx-auto mb-2 h-4 w-4 text-emerald-400" />
            <div className="font-mono text-2xl font-bold tabular-nums text-white">
              {revealed ? o.value : '—'}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">
              {o.label}
            </div>
            <div className="mt-1 text-[10px] text-slate-500">{o.sub}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
