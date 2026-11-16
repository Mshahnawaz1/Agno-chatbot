import { useEffect, useRef } from 'react'
import clsx from 'clsx'

const RINGS = 52
const STEPS = 140

/**
 * A slowly morphing blob drawn as many thin contour lines, so it reads like a
 * glowing, finely ridged surface. Pauses when off screen or in a hidden tab and
 * draws a single still frame when the user prefers reduced motion.
 */
export function Orb({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let raf = 0
    let onScreen = true

    const shape = (a: number, k: number, t: number) =>
      0.12 * Math.sin(3 * a + t * 0.00035 + k * 1.3) +
      0.07 * Math.sin(5 * a - t * 0.00028 + k * 2.4) +
      0.05 * Math.sin(2 * a + t * 0.00045 - k * 0.8)

    const trace = (cx: number, cy: number, radius: number, k: number, t: number) => {
      ctx.beginPath()
      for (let j = 0; j <= STEPS; j++) {
        const a = (j / STEPS) * Math.PI * 2
        const r = radius * (1 + shape(a, k, t))
        const x = cx + Math.cos(a) * r
        const y = cy + Math.sin(a) * r * 0.86
        if (j === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      const cx = w / 2
      const cy = h / 2
      const R = Math.min(w, h) * 0.4

      // Body: a soft violet fill under the outermost contour.
      trace(cx, cy, R, 1, t)
      const body = ctx.createRadialGradient(cx, cy - R * 0.2, R * 0.1, cx, cy, R * 1.15)
      body.addColorStop(0, 'rgba(167, 139, 250, 0.38)')
      body.addColorStop(0.55, 'rgba(109, 40, 217, 0.26)')
      body.addColorStop(1, 'rgba(49, 46, 129, 0.08)')
      ctx.fillStyle = body
      ctx.fill()

      // Ridges: thin contours from the core outward, brightest mid-way.
      ctx.globalCompositeOperation = 'lighter'
      ctx.lineWidth = 1
      for (let i = 0; i < RINGS; i++) {
        const k = i / (RINGS - 1)
        trace(cx, cy, R * (0.18 + 0.82 * k), k, t)
        const hue = 268 - 38 * k
        const alpha = 0.04 + 0.2 * Math.sin(k * Math.PI)
        ctx.strokeStyle = `hsla(${hue}, 92%, ${72 - 12 * k}%, ${alpha})`
        ctx.stroke()
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    const loop = (t: number) => {
      draw(t)
      raf = requestAnimationFrame(loop)
    }
    const start = () => {
      cancelAnimationFrame(raf)
      if (reduce) draw(0)
      else if (onScreen && !document.hidden) raf = requestAnimationFrame(loop)
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw(performance.now())
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      start()
    })
    io.observe(canvas)
    const onVisibility = () => start()
    document.addEventListener('visibilitychange', onVisibility)

    resize()
    start()
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={ref} aria-hidden className={clsx('block', className)} />
}
