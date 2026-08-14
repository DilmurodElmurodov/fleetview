import type { FleetAlert, SimStatus, TelemetryFrame, Vehicle, Zone } from '../types'

const API: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8085'

export const wsUrl = (): string =>
  API === ''
    ? `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`
    : `${API.replace(/^http/, 'ws')}/ws`

interface Envelope<T> {
  success: boolean
  data: T
  error: { code: string; message: string } | null
}

function isEnvelope<T>(body: unknown): body is Envelope<T> {
  return typeof body === 'object' && body !== null && 'success' in body && 'data' in body
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const body: unknown = res.status === 204 ? undefined : await res.json().catch(() => undefined)
  if (isEnvelope<T>(body)) {
    if (!res.ok || !body.success) {
      throw new Error(body.error?.message ?? `${res.status} ${res.statusText}`)
    }
    return body.data
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return body as T
}

export const api = {
  vehicles: () => req<Vehicle[]>('/api/vehicles'),
  liveTelemetry: () => req<TelemetryFrame[]>('/api/telemetry/live'),
  history: (vehicleId: number, limit = 2000) =>
    req<TelemetryFrame[]>(`/api/telemetry/history/${vehicleId}?limit=${limit}`),
  zones: () => req<Zone[]>('/api/zones'),
  createZone: (body: { name: string; zoneType: string; coordinates: [number, number][] }) =>
    req<Zone>('/api/zones', { method: 'POST', body: JSON.stringify(body) }),
  deleteZone: (id: number) => req<void>(`/api/zones/${id}`, { method: 'DELETE' }),
  alerts: (limit = 50) => req<FleetAlert[]>(`/api/alerts?limit=${limit}`),
  ackAlert: (id: number) => req<void>(`/api/alerts/${id}/ack`, { method: 'POST' }),
  simStatus: () => req<SimStatus>('/api/simulator/status'),
  simStart: () => req<SimStatus>('/api/simulator/start', { method: 'POST' }),
  simStop: () => req<SimStatus>('/api/simulator/stop', { method: 'POST' }),
  simSpeed: (x: number) => req<SimStatus>(`/api/simulator/speed/${x}`, { method: 'POST' }),
  health: () => req<{ status: string }>('/actuator/health'),
}
