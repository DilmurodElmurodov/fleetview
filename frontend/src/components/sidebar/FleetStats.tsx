import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TelemetryFrame } from '../../types'

interface Props {
  /** Rolling fleet-average speed, one sample per telemetry tick. */
  speedHistory: { t: string; avg: number }[]
  liveFrames: Map<number, TelemetryFrame>
}

const tooltipStyle = {
  backgroundColor: '#0d1524',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  fontSize: 11,
  color: '#e2e8f0',
}

/** Buckets current fuel levels into 20 %-wide bins. */
function fuelBins(frames: Map<number, TelemetryFrame>) {
  const bins = [
    { label: '0–20', n: 0 },
    { label: '20–40', n: 0 },
    { label: '40–60', n: 0 },
    { label: '60–80', n: 0 },
    { label: '80–100', n: 0 },
  ]
  for (const f of frames.values()) {
    bins[Math.min(4, Math.floor(f.fuelLevelPct / 20))].n++
  }
  return bins
}

export default function FleetStats({ speedHistory, liveFrames }: Props) {
  const bins = fuelBins(liveFrames)
  const latestAvg = speedHistory.length ? speedHistory[speedHistory.length - 1].avg : 0

  return (
    <div className="space-y-3">
      <div className="glass p-3">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-[11px] uppercase tracking-wider text-slate-400">
            Fleet avg speed
          </span>
          <span className="font-mono text-sm font-semibold text-white">
            {latestAvg.toFixed(0)} <span className="text-[10px] text-slate-400">km/h</span>
          </span>
        </div>
        <ResponsiveContainer width="100%" height={70}>
          <LineChart data={speedHistory} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="t" hide />
            <YAxis hide domain={[0, 110]} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(v) => [`${Number(v).toFixed(1)} km/h`, 'avg speed']}
            />
            <Line
              type="monotone"
              dataKey="avg"
              stroke="#0284c7"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="glass p-3">
        <div className="mb-1 text-[11px] uppercase tracking-wider text-slate-400">
          Fuel distribution <span className="normal-case">(% tank, trucks per bin)</span>
        </div>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={bins} margin={{ top: 4, right: 4, bottom: 0, left: 4 }} barCategoryGap="25%">
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide allowDecimals={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              formatter={(v) => [`${v} trucks`, 'count']}
            />
            <Bar dataKey="n" fill="#059669" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
