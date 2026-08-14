import { Gauge, Pause, Play } from 'lucide-react'
import type { SimStatus } from '../../types'

interface Props {
  status: SimStatus | null
  onStart: () => void
  onStop: () => void
  onSpeed: (x: number) => void
}

export default function SimulatorControls({ status, onStart, onStop, onSpeed }: Props) {
  const running = status?.running ?? false
  return (
    <div className="glass-strong flex items-center gap-3 px-4 py-2.5">
      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400">
        <Gauge className="h-3.5 w-3.5" /> Simulator
      </span>
      <button
        onClick={running ? onStop : onStart}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
          running
            ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25'
            : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
        }`}
      >
        {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        {running ? 'Stop' : 'Start'}
      </button>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 5].map((x) => (
          <button
            key={x}
            onClick={() => onSpeed(x)}
            className={`rounded-md px-2 py-1 font-mono text-xs transition-colors ${
              status?.speedMultiplier === x
                ? 'bg-sky-500/25 text-sky-300'
                : 'text-slate-400 hover:bg-white/10'
            }`}
          >
            {x}x
          </button>
        ))}
      </div>
    </div>
  )
}
