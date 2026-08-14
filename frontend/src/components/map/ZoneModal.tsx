import { motion } from 'framer-motion'
import { useState } from 'react'

interface Props {
  onConfirm: (name: string, zoneType: string) => void
  onCancel: () => void
}

export default function ZoneModal({ onConfirm, onCancel }: Props) {
  const [name, setName] = useState('')
  const [zoneType, setZoneType] = useState('RESTRICTED')

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong w-80 p-5"
      >
        <h3 className="mb-4 text-sm font-semibold text-white">New Geofence Zone</h3>
        <label className="mb-1 block text-[11px] uppercase tracking-wider text-slate-400">
          Zone name
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Andijan Border Zone"
          className="mb-3 w-full rounded-lg border border-white/10 bg-[#0a0f1c] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/50"
        />
        <label className="mb-1 block text-[11px] uppercase tracking-wider text-slate-400">
          Type
        </label>
        <select
          value={zoneType}
          onChange={(e) => setZoneType(e.target.value)}
          className="mb-4 w-full rounded-lg border border-white/10 bg-[#0a0f1c] px-3 py-2 text-sm text-white outline-none"
        >
          <option value="RESTRICTED">Restricted</option>
          <option value="DELIVERY">Delivery</option>
          <option value="WAREHOUSE">Warehouse</option>
        </select>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            disabled={!name.trim()}
            onClick={() => onConfirm(name.trim(), zoneType)}
            className="rounded-lg bg-sky-500/25 px-3 py-1.5 text-xs font-semibold text-sky-200 hover:bg-sky-500/35 disabled:opacity-40"
          >
            Create zone
          </button>
        </div>
      </motion.div>
    </div>
  )
}
