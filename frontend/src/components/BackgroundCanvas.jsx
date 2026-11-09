import { useEffect, useRef } from 'react'

export default function BackgroundCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      canvas.style.display = 'none'
      return
    }

    const ctx = canvas.getContext('2d')
    let animationFrameId
    let w, h, nodes
    let DPR = Math.min(window.devicePixelRatio || 1, 2)

    function resize() {
      w = canvas.width = window.innerWidth * DPR
      h = canvas.height = window.innerHeight * DPR
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      const count = Math.min(80, Math.floor(window.innerWidth / 18))
      nodes = Array.from({ length: count }, () => {
        // Multi-color celestial palette: Gold, Purple, Cyan, Emerald
        const colors = [
          { r: 245, g: 158, b: 11 },   // Gold (#f59e0b)
          { r: 251, g: 191, b: 36 },   // Warm Gold (#fbbf24)
          { r: 168, g: 85, b: 247 },   // Violet/Purple (#a855f7)
          { r: 129, g: 140, b: 248 },  // Electric Indigo (#818cf8)
          { r: 56, g: 189, b: 248 },   // Cyber Cyan (#38bdf8)
        ]
        const col = colors[Math.floor(Math.random() * colors.length)]
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35 * DPR,
          vy: (Math.random() - 0.5) * 0.35 * DPR,
          r: (Math.random() * 2 + 1) * DPR,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.02 + Math.random() * 0.025,
          color: col,
        }
      })
    }

    resize()
    window.addEventListener('resize', resize)

    function draw() {
      ctx.clearRect(0, 0, w, h)
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        n.x += n.vx
        n.y += n.vy
        n.pulse += n.pulseSpeed
        if (n.x < 0 || n.x > w) n.vx *= -1
        if (n.y < 0 || n.y > h) n.vy *= -1

        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j]
          const dx = n.x - m.x
          const dy = n.y - m.y
          const d = Math.hypot(dx, dy)
          const max = 150 * DPR
          if (d < max) {
            const a = (1 - d / max) * 0.45
            // Subtle gradient line between connected nodes
            const grad = ctx.createLinearGradient(n.x, n.y, m.x, m.y)
            grad.addColorStop(0, `rgba(${n.color.r}, ${n.color.g}, ${n.color.b}, ${a * 0.7})`)
            grad.addColorStop(1, `rgba(${m.color.r}, ${m.color.g}, ${m.color.b}, ${a * 0.7})`)
            ctx.strokeStyle = grad
            ctx.lineWidth = DPR * 0.75
            ctx.beginPath()
            ctx.moveTo(n.x, n.y)
            ctx.lineTo(m.x, m.y)
            ctx.stroke()
          }
        }
      }

      for (const n of nodes) {
        const currentR = n.r * (1 + 0.25 * Math.sin(n.pulse))
        ctx.beginPath()
        ctx.arc(n.x, n.y, currentR, 0, Math.PI * 2)
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, currentR * 3.5)
        g.addColorStop(0, `rgba(${n.color.r}, ${n.color.g}, ${n.color.b}, 0.95)`)
        g.addColorStop(0.5, `rgba(${n.color.r}, ${n.color.g}, ${n.color.b}, 0.35)`)
        g.addColorStop(1, `rgba(${n.color.r}, ${n.color.g}, ${n.color.b}, 0)`)
        ctx.fillStyle = g
        ctx.fill()
      }

      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <canvas id="net" ref={canvasRef} />
}

