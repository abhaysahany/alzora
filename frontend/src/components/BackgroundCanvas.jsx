import { useEffect, useRef } from 'react'

/**
 * Modern High-End 3D Flip & Celestial Matrix Canvas
 * Pure Black & Gold luxury aesthetic matching the 3D metallic logo.
 * Features 3D flipping golden prism tiles, interconnected neural matrix nodes, and floating stardust.
 */
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
    let w, h, nodes, flipTiles
    const DPR = Math.min(window.devicePixelRatio || 1, 2)

    function resize() {
      w = canvas.width = window.innerWidth * DPR
      h = canvas.height = window.innerHeight * DPR
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'

      // 1. Constellation Matrix Nodes
      const count = Math.min(75, Math.floor(window.innerWidth / 18))
      const goldPalette = [
        { r: 255, g: 215, b: 0 },    // Pure Radiant Gold (#ffd700)
        { r: 251, g: 191, b: 36 },   // Warm Sun Gold (#fbbf24)
        { r: 245, g: 158, b: 11 },   // Amber Gold (#f59e0b)
        { r: 217, g: 119, b: 6 },    // Deep Bronze Gold (#d97706)
        { r: 254, g: 240, b: 138 },  // Champagne Light Gold (#fef08a)
      ]

      nodes = Array.from({ length: count }, () => {
        const col = goldPalette[Math.floor(Math.random() * goldPalette.length)]
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.28 * DPR,
          vy: (Math.random() - 0.5) * 0.28 * DPR,
          r: (Math.random() * 2 + 1) * DPR,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.018 + Math.random() * 0.02,
          color: col,
        }
      })

      // 2. Modern 3D Flipping Geometric Crystals (Black & Gold)
      const tileCount = Math.min(22, Math.floor(window.innerWidth / 65))
      flipTiles = Array.from({ length: tileCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22 * DPR,
        vy: (Math.random() - 0.5) * 0.22 * DPR,
        size: (Math.random() * 22 + 16) * DPR,
        angleX: Math.random() * Math.PI * 2,
        angleY: Math.random() * Math.PI * 2,
        speedX: (0.008 + Math.random() * 0.012) * (Math.random() > 0.5 ? 1 : -1),
        speedY: (0.01 + Math.random() * 0.014) * (Math.random() > 0.5 ? 1 : -1),
        rot: Math.random() * Math.PI,
        rotSpeed: (0.004 + Math.random() * 0.006) * (Math.random() > 0.5 ? 1 : -1),
      }))
    }

    resize()
    window.addEventListener('resize', resize)

    function draw() {
      ctx.clearRect(0, 0, w, h)

      // --- LAYER A: 3D FLIPPING GEOMETRIC TILES ---
      for (const t of flipTiles) {
        t.x += t.vx
        t.y += t.vy
        t.angleX += t.speedX
        t.angleY += t.speedY
        t.rot += t.rotSpeed

        if (t.x < -50 * DPR) t.x = w + 50 * DPR
        if (t.x > w + 50 * DPR) t.x = -50 * DPR
        if (t.y < -50 * DPR) t.y = h + 50 * DPR
        if (t.y > h + 50 * DPR) t.y = -50 * DPR

        const cosX = Math.cos(t.angleX)
        const sinY = Math.sin(t.angleY)
        const isFrontFace = cosX * sinY >= 0

        ctx.save()
        ctx.translate(t.x, t.y)
        ctx.rotate(t.rot)
        ctx.scale(cosX, sinY)

        const hs = t.size / 2

        // Outer glow on front face
        if (isFrontFace) {
          ctx.shadowColor = 'rgba(251, 191, 36, 0.45)'
          ctx.shadowBlur = 12 * DPR
        } else {
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
        }

        // Diamond / Rhombus path
        ctx.beginPath()
        ctx.moveTo(0, -hs)
        ctx.lineTo(hs, 0)
        ctx.lineTo(0, hs)
        ctx.lineTo(-hs, 0)
        ctx.closePath()

        if (isFrontFace) {
          // Front Face: Brilliant Metallic Gold Gradient
          const grad = ctx.createLinearGradient(-hs, -hs, hs, hs)
          grad.addColorStop(0, 'rgba(254, 240, 138, 0.45)')
          grad.addColorStop(0.5, 'rgba(251, 191, 36, 0.35)')
          grad.addColorStop(1, 'rgba(217, 119, 6, 0.25)')
          ctx.fillStyle = grad
          ctx.fill()

          ctx.strokeStyle = 'rgba(255, 215, 0, 0.55)'
          ctx.lineWidth = 1 * DPR
          ctx.stroke()
        } else {
          // Back Face: Deep Obsidian Black with Subtle Amber Edge
          ctx.fillStyle = 'rgba(10, 14, 24, 0.65)'
          ctx.fill()

          ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)'
          ctx.lineWidth = 0.8 * DPR
          ctx.stroke()
        }

        ctx.restore()
      }

      // --- LAYER B: CONSTELLATION MATRIX CONNECTIONS ---
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
          const max = 145 * DPR

          if (d < max) {
            const a = (1 - d / max) * 0.42
            const grad = ctx.createLinearGradient(n.x, n.y, m.x, m.y)
            grad.addColorStop(0, `rgba(${n.color.r}, ${n.color.g}, ${n.color.b}, ${a * 0.75})`)
            grad.addColorStop(1, `rgba(${m.color.r}, ${m.color.g}, ${m.color.b}, ${a * 0.75})`)
            ctx.strokeStyle = grad
            ctx.lineWidth = DPR * 0.75
            ctx.beginPath()
            ctx.moveTo(n.x, n.y)
            ctx.lineTo(m.x, m.y)
            ctx.stroke()
          }
        }
      }

      // --- LAYER C: GLOWING STARDUST NODES ---
      for (const n of nodes) {
        const currentR = n.r * (1 + 0.25 * Math.sin(n.pulse))
        ctx.beginPath()
        ctx.arc(n.x, n.y, currentR, 0, Math.PI * 2)

        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, currentR * 3.5)
        g.addColorStop(0, `rgba(${n.color.r}, ${n.color.g}, ${n.color.b}, 0.95)`)
        g.addColorStop(0.45, `rgba(${n.color.r}, ${n.color.g}, ${n.color.b}, 0.35)`)
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
