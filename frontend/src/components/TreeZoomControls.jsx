import React from 'react'
import { Plus, Minus, RotateCcw } from 'lucide-react'

export function TreeZoomControls({
  zoom = 1,
  setZoom,
  min = 0.3,
  max = 1.6,
  step = 0.1,
  style = {},
}) {
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(max, +(prev + step).toFixed(1)))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(min, +(prev - step).toFixed(1)))
  }

  const handleReset = () => {
    setZoom(1)
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(139, 92, 246, 0.4)',
        borderRadius: 24,
        padding: '4px 8px',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.45)',
        zIndex: 10,
        ...style,
      }}
    >
      <button
        type="button"
        onClick={handleZoomOut}
        disabled={zoom <= min}
        title="Zoom Out (-)"
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          background: zoom <= min ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.08)',
          color: zoom <= min ? 'rgba(255, 255, 255, 0.3)' : '#fff',
          cursor: zoom <= min ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
        }}
      >
        <Minus size={13} />
      </button>

      <button
        type="button"
        onClick={handleReset}
        title="Reset Zoom to 100%"
        style={{
          padding: '2px 8px',
          height: 28,
          borderRadius: 14,
          border: '1px solid rgba(139, 92, 246, 0.3)',
          background: 'rgba(139, 92, 246, 0.15)',
          color: '#c084fc',
          fontFamily: 'monospace',
          fontSize: '0.78rem',
          fontWeight: 800,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          minWidth: 54,
          justifyContent: 'center',
          transition: 'all 0.15s ease',
        }}
      >
        <span>{Math.round(zoom * 100)}%</span>
        <RotateCcw size={10} style={{ opacity: 0.7 }} />
      </button>

      <button
        type="button"
        onClick={handleZoomIn}
        disabled={zoom >= max}
        title="Zoom In (+)"
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          background: zoom >= max ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.08)',
          color: zoom >= max ? 'rgba(255, 255, 255, 0.3)' : '#fff',
          cursor: zoom >= max ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
        }}
      >
        <Plus size={13} />
      </button>
    </div>
  )
}
