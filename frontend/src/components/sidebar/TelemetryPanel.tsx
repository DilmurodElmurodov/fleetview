import { Fuel, Gauge, Navigation, Video } from 'lucide-react'
import type { TelemetryFrame, Vehicle } from '../../types'

interface Props {
  vehicles: Vehicle[]
  liveFrames: Map<number, TelemetryFrame>
  selectedVehicleId: number | null
  onSelect: (id: number) => void
  followedVehicleId: number | null
  onFollow: (id: number) => void
}

/** Small SVG speedometer arc, 0–120 km/h. */
function SpeedArc({ speed }: { speed: number }) {
  const pct = Math.min(1, speed / 120)
  const angle = -120 + pct * 240
  const large = pct > 0.5 ? 1 : 0
  const end = polar(angle)
  const start = polar(-120)
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12">
      <path
        d={`M ${polar(-120).x} ${polar(-120).y} A 19 19 0 1 1 ${polar(120).x} ${polar(120).y}`}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {pct > 0.01 && (
        <path
          d={`M ${start.x} ${start.y} A 19 19 0 ${large} 1 ${end.x} ${end.y}`}
          fill="none"
          stroke={speed > 90 ? '#fbbf24' : '#38bdf8'}
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}
      <text x="24" y="26" textAnchor="middle" className="fill-white" fontSize="11" fontWeight="700">
        {Math.round(speed)}
      </text>
      <text x="24" y="36" textAnchor="middle" className="fill-slate-400" fontSize="6">
        km/h
      </text>
    </svg>
  )
}

const polar = (deg: number) => {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: (24 + 19 * Math.cos(rad)).toFixed(2), y: (24 + 19 * Math.sin(rad)).toFixed(2) }
}

export default function TelemetryPanel({
  vehicles,
  liveFrames,
  selectedVehicleId,
  onSelect,
  followedVehicleId,
  onFollow,
}: Props) {
  return (
    <div className="flex-1 space-y-2 overflow-y-auto pr-1">
      {vehicles.map((v) => {
        const live = liveFrames.get(v.id) ?? v.live
        const fuel = live?.fuelLevelPct ?? 0
        const selected = v.id === selectedVehicleId
        const followed = v.id === followedVehicleId
        return (
          <div
            key={v.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(v.id)}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(v.id)}
            className={`glass w-full cursor-pointer p-3 text-left transition-colors hover:bg-white/[0.07] ${
              selected ? 'ring-1 ring-sky-400/60' : ''
            } ${followed ? 'ring-1 ring-violet-400/60' : ''}`}
          >
            <div className="flex items-center gap-3">
              <SpeedArc speed={live?.speedKph ?? 0} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-mono text-sm font-semibold text-white">
                    {v.plateNumber}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onFollow(v.id)
                      }}
                      title={followed ? 'Exit cinema follow' : 'Focus vehicle (cinema follow)'}
                      className={`rounded p-0.5 transition ${
                        followed
                          ? 'text-violet-300'
                          : 'text-slate-500 hover:text-sky-300'
                      }`}
                    >
                      <Video className="h-3.5 w-3.5" />
                    </button>
                    <Navigation
                      className="h-3 w-3"
                      style={{ transform: `rotate(${live?.bearingDeg ?? 0}deg)` }}
                    />
                    {Math.round(live?.bearingDeg ?? 0)}°
                  </span>
                </div>
                <div className="truncate text-[11px] text-slate-400">
                  {v.model} · {v.driverName}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <Fuel
                    className={`h-3 w-3 ${fuel < 12 ? 'text-red-400' : 'text-slate-400'}`}
                  />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${fuel < 12 ? 'bg-red-400' : 'bg-emerald-500'}`}
                      style={{ width: `${fuel}%` }}
                    />
                  </div>
                  <span className="w-9 text-right font-mono text-[10px] text-slate-300">
                    {fuel.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
      {vehicles.length === 0 && (
        <div className="flex items-center gap-2 p-4 text-sm text-slate-400">
          <Gauge className="h-4 w-4" /> Waiting for fleet data…
        </div>
      )}
    </div>
  )
}
