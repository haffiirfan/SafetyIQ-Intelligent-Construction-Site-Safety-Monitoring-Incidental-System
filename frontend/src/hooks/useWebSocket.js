// ══════════════════════════════════════════
// hooks/useWebSocket.js — Live camera feed
// ══════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import useAppStore from '../store/useAppStore'

export default function useWebSocket(cameraId) {
  const [detections, setDetections] = useState([])
  const [connected, setConnected]   = useState(false)
  const wsRef = useRef(null)
  const addAlert = useAppStore((s) => s.addAlert)

  useEffect(() => {
    if (!cameraId) return

    const ws = new WebSocket(
      `ws://127.0.0.1:8000/ws/camera/${cameraId}`
    )
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      console.log(`WebSocket connected — Camera ${cameraId}`)
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setDetections(data.detections || [])

      // Add critical violations to alerts
      data.violations?.forEach((v) => {
        if (v.risk === 'Critical') {
          addAlert({
            id:        Date.now(),
            type:      v.class,
            risk:      v.risk,
            camera_id: cameraId,
            time:      new Date().toLocaleTimeString()
          })
        }
      })
    }

    ws.onclose = () => {
      setConnected(false)
      console.log(`WebSocket disconnected — Camera ${cameraId}`)
    }

    ws.onerror = (e) => console.error('WebSocket error:', e)

    return () => ws.close()
  }, [cameraId])

  return { detections, connected }
}