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
      const count = Math.min(70, Math.floor(window.innerWidth / 22))
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28 * DPR,
        vy: (Math.random() - 0.5) * 0.28 * DPR,
        r: (Math.random() * 1.6 + 1) * DPR,
      }))
    }

    resize()
    window.addEventListener('resize', resize)

    function draw() {
      ctx.clearRect(0, 0, w, h)
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > w) n.vx *= -1
        if (n.y < 0 || n.y > h) n.vy *= -1

        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j]
          const dx = n.x - m.x
          const dy = n.y - m.y
          const d = Math.hypot(dx, dy)
          const max = 140 * DPR
          if (d < max) {
            const a = (1 - d / max) * 0.5
            ctx.strokeStyle = 'rgba(34,229,154,' + a * 0.6 + ')'
            ctx.lineWidth = DPR * 0.6
            ctx.beginPath()
            ctx.moveTo(n.x, n.y)
            ctx.lineTo(m.x, m.y)
            ctx.stroke()
          }
        }
      }

      for (const n of nodes) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4)
        g.addColorStop(0, 'rgba(34,229,154,.9)')
        g.addColorStop(1, 'rgba(34,229,154,0)')
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

