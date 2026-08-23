import { useEffect, useRef, useState } from 'react'
import useAppStore from '../store/useAppStore'

export default function useWebSocket(cameraId) {
  const [detections, setDetections] = useState([])
  const [connected, setConnected]   = useState(false)
  const wsRef = useRef(null)
  const addAlert = useAppStore((s) => s.addAlert)

  useEffect(() => {
    if (!cameraId) return

    let isCancelled = false
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/camera/${cameraId}`)
    wsRef.current = ws

    ws.onopen = () => {
      if (!isCancelled) setConnected(true)
    }

    ws.onclose = () => {
      if (!isCancelled) setConnected(false)
    }

    ws.onerror = (e) => {
      console.error('WebSocket error:', e)
    }

    ws.onmessage = (event) => {
      if (isCancelled) return

      const data = JSON.parse(event.data)
      setDetections(data.detections || [])

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

    return () => {
      isCancelled = true
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
      wsRef.current = null
    }
  }, [cameraId])

  return { detections, connected }
}