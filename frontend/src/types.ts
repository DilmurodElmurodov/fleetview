export interface TelemetryFrame {
  vehicleId: number
  plateNumber: string | null
  lat: number
  lon: number
  speedKph: number
  bearingDeg: number
  fuelLevelPct: number
  recordedAt: string
}

export interface Vehicle {
  id: number
  plateNumber: string
  model: string
  driverName: string
  status: string
  fuelCapacityL: number
  live: TelemetryFrame | null
}

export interface Zone {
  id: number
  name: string
  zoneType: 'RESTRICTED' | 'DELIVERY' | 'WAREHOUSE'
  color: string
  active: boolean
  coordinates: [number, number][]
  createdAt: string
}

export interface FleetAlert {
  id: number
  vehicleId: number
  plateNumber: string | null
  zoneId: number | null
  zoneName: string | null
  alertType: 'ZONE_ENTER' | 'ZONE_EXIT' | 'SPEEDING' | 'LOW_FUEL'
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  message: string
  lat: number | null
  lon: number | null
  acknowledged: boolean
  createdAt: string
}

export interface SimStatus {
  running: boolean
  speedMultiplier: number
  truckCount: number
  tickMillis: number
}

export interface ReplayState {
  vehicleId: number | null
  frames: TelemetryFrame[]
  index: number
  playing: boolean
  speed: number
}
