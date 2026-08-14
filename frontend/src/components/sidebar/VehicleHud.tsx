import { motion } from 'framer-motion'
import { Video, VideoOff, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { TelemetryFrame, Vehicle } from '../../types'

interface GaugeProps {
  label: string
  value: number
  max: number
  unit: string
  display: string
  warn?: boolean
}

/** 240° HUD arc; stroke-dasharray transitions give the sweep animation. */
function HudGauge({ label, value, max, unit, display, warn }: GaugeProps) {
  const pct = Math.max(0, Math.min(1, value / max))
  const ARC = 66.6 // 240° of a pathLength-100 circle
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 64 64" className="h-16 w-16">
        <g transform="rotate(150 32 32)">
          <circle
            cx="32" cy="32" r="26" fill="none"
            stroke="rgba(255,255,255,0.08)" strokeWidth="5" strokeLinecap="round"
            pathLength={100} strokeDasharray={`${ARC} 100`}
          />
          <circle
            cx="32" cy="32" r="26" fill="none"
            stroke={warn ? '#fbbf24' : '#38bdf8'} strokeWidth="5" strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${(pct * ARC).toFixed(2)} 100`}
            style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.22,1,0.36,1)' }}
          />
        </g>
        <text x="32" y="33" textAnchor="middle" className="fill-white" fontSize="12" fontWeight="700">
          {display}
        </text>
        <text x="32" y="44" textAnchor="middle" className="fill-slate-400" fontSize="6.5">
          {unit}
        </text>
      </svg>
      <span className="mt-1 text-[9px] uppercase tracking-wider text-slate-400">{label}</span>
    </div>
  )
}

interface Props {
  vehicle: Vehicle
  live: TelemetryFrame | null
  following: boolean
  onToggleFollow: () => void
  onClose: () => void
}

/**
 * Futuristic HUD drawer for the selected vehicle. Tire pressure and satellite
 * signal have no physical sensor in the demo fleet — they are deterministic
 * per-vehicle simulations with a slow wobble, refreshed with each frame.
 */
export default function VehicleHud({ vehicle, live, following, onToggleFollow, onClose }: Props) {
  const [, forceTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 2000)
    return () => clearInterval(t)
  }, [])

  const now = Date.now() / 30000
  const tirePressure = 8.2 + 0.5 * Math.sin(vehicle.id * 2.7 + now)
  const satSignal = Math.round(11 + 2.6 * Math.sin(vehicle.id * 1.3 + now * 1.7))
  const speed = live?.speedKph ?? 0
  const fuel = live?.fuelLevelPct ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 28 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="glass-neon-sky absolute bottom-20 left-1/2 z-20 hidden -translate-x-1/2 px-5 py-4 md:block"
    >
      <div className="mb-3 flex items-center gap-3">
        <div>
          <div className="font-mono text-sm font-bold text-white">{vehicle.plateNumber}</div>
          <div className="text-[10px] text-slate-400">
            {vehicle.model} · {vehicle.driverName}
          </div>
        </div>
        <button
          onClick={onToggleFollow}
          title={following ? 'Exit cinema follow' : 'Cinema follow'}
          className={`ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
            following
              ? 'bg-violet-500/25 text-violet-300 ring-1 ring-violet-400/50'
              : 'bg-white/[0.06] text-slate-300 hover:bg-white/10'
          }`}
        >
          {following ? <VideoOff className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
          {following ? 'Following' : 'Focus'}
        </button>
        <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-start gap-4">
        <HudGauge
          label="Speed" value={speed} max={120} unit="km/h"
          display={String(Math.round(speed))} warn={speed > 90}
        />
        <HudGauge
          label="Fuel" value={fuel} max={100} unit="%"
          display={fuel.toFixed(0)} warn={fuel < 12}
        />
        <HudGauge
          label="Tires" value={tirePressure} max={10} unit="bar"
          display={tirePressure.toFixed(1)} warn={tirePressure < 7.9}
        />
        <HudGauge
          label="Signal" value={satSignal} max={14} unit="sats"
          display={String(satSignal)} warn={satSignal < 9}
        />
      </div>
    </motion.div>
  )
}
