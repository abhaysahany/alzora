import { useEffect, useRef } from 'react'

const STAR_COLORS = ['#c084fc', '#8b5cf6', '#ffd700', '#38bdf8', '#f8fafc']

/**
 * Global Cosmic Background Image + Live Starfield Canvas + Mouse Spotlight + Star-Burst Click Effects.
 * Mounted once at App root so every route shares the interactive cosmic experience.
 */
export function CosmicEffectsLayer() {
  const canvasRef = useRef(null)
  const auraRef = useRef(null)
  const burstLayerRef = useRef(null)

  // 1. Live 60fps Starfield & Shooting Stars Canvas (video-like ambient motion)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const starCount = Math.min(110, Math.max(45, Math.floor((width * height) / 18000)))
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.6 + 0.4,
      vx: (Math.random() - 0.5) * 0.14,
      vy: -(Math.random() * 0.18 + 0.04),
      alpha: Math.random() * 0.65 + 0.25,
      twinkleSpeed: Math.random() * 0.02 + 0.008,
      phase: Math.random() * Math.PI * 2,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    }))

    let shootingStar = null
    let nextShootAt = performance.now() + 3500
    let rafId = null

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    const draw = (now) => {
      ctx.clearRect(0, 0, width, height)

      for (const s of stars) {
        if (!reducedMotion) {
          s.x += s.vx
          s.y += s.vy
          s.phase += s.twinkleSpeed
          if (s.y < -4) {
            s.y = height + 4
            s.x = Math.random() * width
          }
          if (s.x < -4) s.x = width + 4
          if (s.x > width + 4) s.x = -4
        }

        const twinkle = 0.55 + 0.45 * Math.sin(s.phase)
        ctx.globalAlpha = s.alpha * twinkle
        ctx.fillStyle = s.color
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Occasional shooting star
      if (!reducedMotion) {
        if (!shootingStar && now > nextShootAt) {
          shootingStar = {
            x: Math.random() * width * 0.8 + width * 0.1,
            y: Math.random() * height * 0.35,
            vx: (Math.random() > 0.5 ? 1 : -1) * (5.5 + Math.random() * 3),
            vy: 2.5 + Math.random() * 2,
            life: 1,
          }
          nextShootAt = now + 5500 + Math.random() * 5000
        }

        if (shootingStar) {
          ctx.globalAlpha = shootingStar.life * 0.85
          const grad = ctx.createLinearGradient(
            shootingStar.x,
            shootingStar.y,
            shootingStar.x - shootingStar.vx * 10,
            shootingStar.y - shootingStar.vy * 10
          )
          grad.addColorStop(0, '#ffd700')
          grad.addColorStop(0.5, '#c084fc')
          grad.addColorStop(1, 'transparent')
          ctx.strokeStyle = grad
          ctx.lineWidth = 1.8
          ctx.beginPath()
          ctx.moveTo(shootingStar.x, shootingStar.y)
          ctx.lineTo(shootingStar.x - shootingStar.vx * 10, shootingStar.y - shootingStar.vy * 10)
          ctx.stroke()

          shootingStar.x += shootingStar.vx
          shootingStar.y += shootingStar.vy
          shootingStar.life -= 0.025
          if (shootingStar.life <= 0) {
            shootingStar = null
          }
        }
      }

      ctx.globalAlpha = 1
      if (!reducedMotion) {
        rafId = requestAnimationFrame(draw)
      }
    }

    rafId = requestAnimationFrame(draw)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // 2. Global Mouse Spotlight on Cards + Cursor Aura + Star-Burst Click Effect
  useEffect(() => {
    const aura = auraRef.current
    const burstLayer = burstLayerRef.current
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

    let lastHoveredCard = null
    let lastTrailAt = 0

    const spawnTrailStar = (x, y) => {
      if (reducedMotion || !burstLayer) return
      const star = document.createElement('span')
      star.className = 'elzora-click-star'
      star.textContent = Math.random() > 0.4 ? '✦' : '★'
      star.style.left = `${x}px`
      star.style.top = `${y}px`
      star.style.color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]
      star.style.setProperty('--tx', `${((Math.random() - 0.5) * 26).toFixed(1)}px`)
      star.style.setProperty('--ty', `${(-10 - Math.random() * 18).toFixed(1)}px`)
      star.style.fontSize = `${9 + Math.floor(Math.random() * 5)}px`
      burstLayer.appendChild(star)
      setTimeout(() => star.remove(), 620)
    }

    const spawnStarBurst = (x, y, card, starCount = 8) => {
      if (reducedMotion || !burstLayer) return

      // Expanding cosmic ripple ring
      const ring = document.createElement('span')
      ring.className = 'elzora-click-ring'
      ring.style.left = `${x}px`
      ring.style.top = `${y}px`
      burstLayer.appendChild(ring)

      // Glowing star particles bursting outward
      for (let i = 0; i < starCount; i += 1) {
        const angle = (Math.PI * 2 * i) / starCount + (Math.random() - 0.5) * 0.35
        const dist = 24 + Math.random() * 30
        const tx = Math.cos(angle) * dist
        const ty = Math.sin(angle) * dist

        const star = document.createElement('span')
        star.className = 'elzora-click-star'
        star.textContent = i % 3 === 0 ? '✦' : '★'
        star.style.left = `${x}px`
        star.style.top = `${y}px`
        star.style.color = STAR_COLORS[i % STAR_COLORS.length]
        star.style.setProperty('--tx', `${tx.toFixed(1)}px`)
        star.style.setProperty('--ty', `${ty.toFixed(1)}px`)
        star.style.fontSize = `${10 + (i % 3) * 3}px`
        burstLayer.appendChild(star)
      }

      if (card) {
        card.classList.remove('elzora-card-clicked')
        void card.offsetWidth
        card.classList.add('elzora-card-clicked')
        setTimeout(() => card.classList.remove('elzora-card-clicked'), 520)
      }

      setTimeout(() => {
        ring.remove()
        const stars = burstLayer.querySelectorAll('.elzora-click-star')
        for (let i = 0; i < Math.min(starCount, stars.length); i += 1) {
          stars[i].remove()
        }
      }, 650)
    }

    const CARD_SELECTOR =
      '.elzora-glass-hover, .card, .stat-card, .chart-card, .referral-card, .activity-card, .card-3d, .pe-full-plan-card, .voice-panel'

    const resetCardTilt = (card) => {
      if (card) {
        card.style.transform = ''
      }
    }

    const onPointerMove = (e) => {
      if (aura && e.pointerType !== 'touch') {
        aura.style.opacity = '1'
        aura.style.transform = `translate3d(${e.clientX - 180}px, ${e.clientY - 180}px, 0)`
      }

      const card = e.target?.closest?.(CARD_SELECTOR)
      if (card) {
        if (lastHoveredCard && lastHoveredCard !== card) {
          resetCardTilt(lastHoveredCard)
        }
        if (card !== lastHoveredCard) {
          lastHoveredCard = card
          spawnStarBurst(e.clientX, e.clientY, card, 6)
        }

        // Continuous mouse-following 3D tilt + starlight trail while moving inside the card
        if (!reducedMotion && e.pointerType !== 'touch') {
          const rect = card.getBoundingClientRect()
          const maxTilt = card.classList.contains('voice-panel') ? 2.8 : 7
          const rx = (((e.clientY - rect.top) / Math.max(1, rect.height)) - 0.5) * -maxTilt
          const ry = (((e.clientX - rect.left) / Math.max(1, rect.width)) - 0.5) * maxTilt
          card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-4px)`

          const now = performance.now()
          if (now - lastTrailAt > 48) {
            lastTrailAt = now
            spawnTrailStar(e.clientX, e.clientY)
          }
        }
      } else if (lastHoveredCard) {
        resetCardTilt(lastHoveredCard)
        lastHoveredCard = null
      }
    }

    const onPointerLeave = () => {
      resetCardTilt(lastHoveredCard)
      lastHoveredCard = null
      if (aura) aura.style.opacity = '0'
    }

    const onPointerDown = (e) => {
      const card = e.target?.closest?.(CARD_SELECTOR)
      spawnStarBurst(e.clientX, e.clientY, card, 8)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('mouseleave', onPointerLeave)
    window.addEventListener('pointerdown', onPointerDown, { passive: true })

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('mouseleave', onPointerLeave)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [])

  return (
    <>
      {/* Color-Matched Cosmic Background Video + Fallback Poster Image */}
      <div className="elzora-cosmic-bg-wrap" aria-hidden="true">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/assets/cosmic-bg.jpg"
          className="elzora-cosmic-bg-img"
        >
          <source src="/assets/cosmic-bg.webm" type="video/webm" />
        </video>
      </div>

      {/* Live 60fps Starfield & Shooting Stars Canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.85,
        }}
      />

      {/* Mouse Cursor Violet-Gold Aura */}
      <div ref={auraRef} className="elzora-mouse-aura" aria-hidden="true" />

      {/* Click Star-Burst Layer */}
      <div ref={burstLayerRef} className="elzora-burst-layer" aria-hidden="true" />
    </>
  )
}
