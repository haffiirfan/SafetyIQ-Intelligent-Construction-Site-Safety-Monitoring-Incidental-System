import { useRef, useEffect, useState } from 'react'
import useWebSocket from '../hooks/useWebSocket'

const RISK_COLORS = {
  Critical: '#ef4444',
  High:     '#f97316',
  Medium:   '#eab308',
  Low:      '#3b82f6',
  None:     '#22c55e',
}

export default function CameraFeed({ cameraId = 1 }) {
  const { detections, connected } = useWebSocket(cameraId)
  const videoRef = useRef(null)
  const [videoDims, setVideoDims] = useState({ w: 640, h: 360 })

  const violations = detections.filter((d) => d.risk !== 'None')

  const videoSrc = cameraId === 1
    ? '/footage_1.mp4'
    : '/footage_2.mp4'

  const handleVideoLoad = () => {
    if (videoRef.current) {
      setVideoDims({
        w: videoRef.current.videoWidth  || 640,
        h: videoRef.current.videoHeight || 360,
      })
    }
  }

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
        <span className="text-white text-sm font-semibold">
          Camera {cameraId}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
          connected ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {connected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {/* Video + SVG overlay container */}
      <div className="relative bg-black" style={{ height: '260px' }}>

        {/* Native video — plays at full speed */}
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          onLoadedMetadata={handleVideoLoad}
          className="w-full h-full object-cover"
        />

        {/* SVG overlay for bounding boxes */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${videoDims.w} ${videoDims.h}`}
          preserveAspectRatio="none"
        >
          {detections.map((d, i) => {
            if (!d.bbox || d.bbox.length < 4) return null
            const [x1, y1, x2, y2] = d.bbox
            const color = RISK_COLORS[d.risk] || '#ffffff'
            return (
              <g key={i}>
                <rect
                  x={x1} y={y1}
                  width={x2 - x1}
                  height={y2 - y1}
                  fill="none"
                  stroke={color}
                  strokeWidth="3"
                />
                <rect
                  x={x1} y={y1 - 22}
                  width={(d.class.length + 5) * 7}
                  height="20"
                  fill={color}
                  opacity="0.85"
                />
                <text
                  x={x1 + 4}
                  y={y1 - 6}
                  fill="white"
                  fontSize="13"
                  fontWeight="bold"
                  fontFamily="Arial"
                >
                  {d.class} {Math.round(d.confidence * 100)}%
                </text>
              </g>
            )
          })}
        </svg>

        {/* Detection count badge */}
        {detections.length > 0 && (
          <div className="absolute top-2 right-2 bg-black
                          bg-opacity-70 text-white text-xs
                          px-2 py-1 rounded">
            {detections.length} detected
          </div>
        )}
      </div>

      {/* Detection list */}
      <div className="p-3 space-y-1 max-h-28 overflow-y-auto">
        {detections.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-2">
            No detections
          </p>
        ) : (
          detections.map((d, i) => (
            <div key={i}
              className="flex items-center justify-between text-xs">
              <span className="font-semibold"
                style={{ color: RISK_COLORS[d.risk] }}>
                {d.class}
              </span>
              <span className="text-gray-400">
                {(d.confidence * 100).toFixed(0)}%
              </span>
              <span style={{ color: RISK_COLORS[d.risk] }}>
                {d.risk}
              </span>
            </div>
          ))
        )}
      </div>

      {violations.length > 0 && (
        <div className="bg-red-900 px-3 py-2">
          <p className="text-red-300 text-xs font-bold">
            {violations.length} violation(s) detected
          </p>
        </div>
      )}
    </div>
  )
}