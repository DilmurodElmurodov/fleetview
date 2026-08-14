import { Client } from '@stomp/stompjs'
import { useEffect, useRef, useState } from 'react'
import { wsUrl } from '../api/client'
import type { FleetAlert, TelemetryFrame } from '../types'

/**
 * STOMP connection to the backend broker.
 * Subscribes to the batched telemetry topic and the alerts topic.
 * Callbacks are kept in refs so the client is created exactly once.
 */
export function useTelemetrySocket(
  onTelemetry: (frames: TelemetryFrame[]) => void,
  onAlert: (alert: FleetAlert) => void,
): { connected: boolean } {
  const [connected, setConnected] = useState(false)
  const telemetryRef = useRef(onTelemetry)
  const alertRef = useRef(onAlert)
  telemetryRef.current = onTelemetry
  alertRef.current = onAlert

  useEffect(() => {
    const client = new Client({
      brokerURL: wsUrl(),
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true)
        client.subscribe('/topic/telemetry', (msg) => {
          telemetryRef.current(JSON.parse(msg.body) as TelemetryFrame[])
        })
        client.subscribe('/topic/alerts', (msg) => {
          alertRef.current(JSON.parse(msg.body) as FleetAlert)
        })
      },
      onDisconnect: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
    })
    client.activate()
    return () => {
      void client.deactivate()
    }
  }, [])

  return { connected }
}
