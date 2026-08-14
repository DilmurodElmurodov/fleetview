import { History, Pause, Play, X } from 'lucide-react'
import type { ReplayState, Vehicle } from '../../types'

interface Props {
  replay: ReplayState
  vehicles: Vehicle[]
  onLoad: (vehicleId: number) => void
  onTogglePlay: () => void
  onSpeed: (x: number) => void
  onSeek: (index: number) => void
  onClose: () => void
}

export default function ReplayPlayer({
  replay,
  vehicles,
  onLoad,
  onTogglePlay,
  onSpeed,
  onSeek,
  onClose,
}: Props) {
  const active = replay.vehicleId != null && replay.frames.length > 0
  const current = active ? replay.frames[replay.index] : null

  return (
    <div className="glass-strong flex items-center gap-3 px-4 py-2.5">
      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400">
        <History className="h-3.5 w-3.5" /> Replay
      </span>

      <select
        value={replay.vehicleId ?? ''}
        onChange={(e) => e.target.value && onLoad(Number(e.target.value))}
        className="rounded-lg border border-white/10 bg-[#0d1524] px-2 py-1.5 font-mono text-xs text-slate-200 outline-none"
      >
        <option value="">Select truck…</option>
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>
            {v.plateNumber}
          </option>
        ))}
      </select>

      {active && (
        <>
          <button
            onClick={onTogglePlay}
            className="rounded-lg bg-violet-500/20 p-1.5 text-violet-300 hover:bg-violet-500/30"
          >
            {replay.playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <input
            type="range"
            min={0}
            max={replay.frames.length - 1}
            value={replay.index}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="w-40 accent-violet-400"
          />
          <span className="w-16 font-mono text-[10px] text-slate-400">
            {current ? new Date(current.recordedAt).toLocaleTimeString() : ''}
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 5].map((x) => (
              <button
                key={x}
                onClick={() => onSpeed(x)}
                className={`rounded-md px-1.5 py-0.5 font-mono text-xs ${
                  replay.speed === x
                    ? 'bg-violet-500/25 text-violet-300'
                    : 'text-slate-400 hover:bg-white/10'
                }`}
              >
                {x}x
              </button>
            ))}
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-white/10">
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  )
}
