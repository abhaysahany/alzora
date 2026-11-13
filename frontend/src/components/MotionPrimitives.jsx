import { useEffect, useRef, useState } from 'react'

/**
 * Scroll-triggered reveal wrapper using IntersectionObserver.
 * Lightweight & GPU-accelerated; never blocks layout or interaction.
 */
export function RevealOnScroll({
  children,
  delay = 0,
  className = '',
  style = {},
}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`elzora-reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Smooth numeric count-up for genuine on-chain/backend values.
 * Never fabricates numbers — renders 0 or the exact real value passed in.
 */
export function AnimatedCounter({
  value = 0,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 700,
}) {
  const target = Number.isFinite(Number(value)) ? Number(value) : 0
  const [display, setDisplay] = useState(target)
  const prevRef = useRef(target)

  useEffect(() => {
    const startVal = prevRef.current
    if (startVal === target) {
      setDisplay(target)
      return undefined
    }

    let frameId = null
    const startTime = performance.now()

    const tick = (now) => {
      const progress = Math.min(1, (now - startTime) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startVal + (target - startVal) * eased
      setDisplay(current)
      if (progress < 1) {
        frameId = requestAnimationFrame(tick)
      } else {
        prevRef.current = target
        setDisplay(target)
      }
    }

    frameId = requestAnimationFrame(tick)
    return () => {
      if (frameId) cancelAnimationFrame(frameId)
      prevRef.current = target
    }
  }, [target, duration])

  const formatted =
    decimals > 0
      ? display.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Math.round(display).toLocaleString()

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}

const DEFAULT_PARTICLES = [
  { left: '8%', top: '18%', size: 5, color: 'rgba(255, 215, 0, 0.55)', dur: '7.5s', delay: '0s' },
  { left: '19%', top: '64%', size: 4, color: 'rgba(251, 191, 36, 0.45)', dur: '9s', delay: '1.2s' },
  { left: '34%', top: '26%', size: 6, color: 'rgba(245, 158, 11, 0.48)', dur: '8.2s', delay: '0.6s' },
  { left: '52%', top: '14%', size: 4, color: 'rgba(254, 240, 138, 0.45)', dur: '6.8s', delay: '2s' },
  { left: '68%', top: '72%', size: 5, color: 'rgba(217, 119, 6, 0.5)', dur: '8.8s', delay: '0.9s' },
  { left: '82%', top: '24%', size: 6, color: 'rgba(255, 215, 0, 0.4)', dur: '7.8s', delay: '1.7s' },
  { left: '91%', top: '56%', size: 4, color: 'rgba(251, 191, 36, 0.5)', dur: '9.4s', delay: '0.4s' },
]

/**
 * Ambient floating particle dots for hero & futuristic showcase sections.
 */
export function FloatingParticles({ particles = DEFAULT_PARTICLES }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {particles.map((p, idx) => (
        <span
          key={idx}
          className="elzora-particle-dot"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            '--p-dur': p.dur,
            '--p-delay': p.delay,
          }}
        />
      ))}
    </div>
  )
}

/**
 * Smooth page transition wrapper.
 */
export function PageTransitionShell({ children, className = '', style = {} }) {
  return (
    <div className={`elzora-page-enter ${className}`} style={style}>
      {children}
    </div>
  )
}

