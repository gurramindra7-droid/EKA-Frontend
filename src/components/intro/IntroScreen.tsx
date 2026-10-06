import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import KnowledgeScene from './KnowledgeScene'
import {
  ctaOpacityAt,
  CTA_START_S,
  INTRO_TOTAL_S,
  sceneIndexAt,
  SCENES,
  signalsAt,
  smoothstep,
  textAt,
  type TextBlockId,
} from './IntroTimeline'
import { FONT_STACK, MONO_STACK } from '../../theme/theme'

/**
 * EKA cinematic intro (≈13 s).
 *
 * Layers (back → front):
 *   z0  KnowledgeScene  — WebGL knowledge space (background only)
 *   z1  veil            — calms the area behind the typography
 *   z2  typography      — ONE active text block, HTML, always crisp
 *   z3  controls        — ENTER EKA (inside the identity block) and SKIP INTRO
 *
 * A single requestAnimationFrame clock drives everything. Per-frame values
 * (opacity, motion) are written straight to the DOM through refs, so React
 * only re-renders when the active text block changes — and because only one
 * block is ever mounted, major texts can never overlap.
 */

const EXIT_MS = 850
const EXIT_MS_REDUCED = 300
const FONT_WAIT_MS = 700

/** Dev-only: `?introAt=7.5` freezes the timeline at a given second (visual QA). */
const FROZEN_AT: number | null = (() => {
  if (!import.meta.env.DEV) return null
  const v = new URLSearchParams(window.location.search).get('introAt')
  return v !== null && Number.isFinite(Number(v)) ? Number(v) : null
})()

export default function IntroScreen({ onEnter }: { onEnter: () => void }) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { noSsr: true })
  const compact = useMediaQuery('(max-width: 720px)', { noSsr: true })

  const clock = useRef(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const veilRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const skipRef = useRef<HTMLButtonElement>(null)
  const blockRef = useRef<TextBlockId | null>(null)
  const exitingRef = useRef(false)

  const [block, setBlock] = useState<TextBlockId | null>(null)
  const [ctaReady, setCtaReady] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [sceneOff, setSceneOff] = useState(false)

  /* ---------------- exit (CTA, skip, Esc, or timeline end) ---------------- */
  const exit = useCallback(() => {
    if (exitingRef.current) return
    exitingRef.current = true
    setExiting(true)
    window.setTimeout(() => {
      setSceneOff(true)
      onEnter()
    }, reducedMotion ? EXIT_MS_REDUCED : EXIT_MS)
  }, [onEnter, reducedMotion])

  /* ---------------- the clock ---------------- */
  useEffect(() => {
    let raf = 0
    let start: number | null = null
    let cancelled = false

    const frame = (now: number) => {
      if (start === null) start = now
      const t = FROZEN_AT ?? (now - start) / 1000
      clock.current = t

      // Active text block (mount/unmount only at zero opacity).
      const text = textAt(t)
      const id = text?.id ?? null
      if (id !== blockRef.current) {
        blockRef.current = id
        setBlock(id)
      }

      // Typography envelope.
      const el = textRef.current
      if (el) {
        const o = text?.opacity ?? 0
        el.style.opacity = o.toFixed(3)
        if (text && !reducedMotion) {
          const y = (1 - text.enter) * 16 - text.exit * 10
          const scale = 0.985 + 0.015 * text.enter + 0.01 * text.exit
          const blur = (1 - text.enter) * 8 + text.exit * 6
          el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`
          el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none'
        } else {
          el.style.transform = 'none'
          el.style.filter = 'none'
        }
      }

      // Veil follows the typography so the space behind text is calmer.
      if (veilRef.current) veilRef.current.style.opacity = signalsAt(t).calm.toFixed(3)

      // ENTER EKA.
      if (ctaRef.current) {
        const c = ctaOpacityAt(t)
        ctaRef.current.style.opacity = c.toFixed(3)
        ctaRef.current.style.transform = reducedMotion ? 'none' : `translate3d(0, ${((1 - c) * 10).toFixed(2)}px, 0)`
      }
      if (t >= CTA_START_S) setCtaReady(true)

      // SKIP INTRO retires once the CTA takes over.
      if (skipRef.current) {
        const s = 1 - smoothstep(8.6, 9.0, t)
        skipRef.current.style.opacity = (s * Math.min(1, t / 0.6)).toFixed(3)
        skipRef.current.style.visibility = s <= 0.001 ? 'hidden' : 'visible'
      }

      if (rootRef.current) rootRef.current.dataset.scene = SCENES[sceneIndexAt(t)].id

      // Timeline end → main application.
      if (t >= INTRO_TOTAL_S && FROZEN_AT === null) exit()

      raf = requestAnimationFrame(frame)
    }

    // Start once fonts are ready (the opening is black, so a short wait is invisible).
    const fontsReady = (document as Document & { fonts?: FontFaceSet }).fonts?.ready ?? Promise.resolve()
    const timeout = new Promise((r) => window.setTimeout(r, FONT_WAIT_MS))
    void Promise.race([fontsReady, timeout]).then(() => {
      if (!cancelled) raf = requestAnimationFrame(frame)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [exit, reducedMotion])

  /* ---------------- keyboard ---------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [exit])

  return (
    <Box
      ref={rootRef}
      role="region"
      aria-label="EKA introduction"
      data-intro-root
      data-scene="opening"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        backgroundColor: '#000000',
        color: '#FFFFFF',
        overflow: 'hidden',
        fontFamily: FONT_STACK,
        opacity: exiting ? 0 : 1,
        transition: `opacity ${reducedMotion ? EXIT_MS_REDUCED : EXIT_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        userSelect: 'none',
      }}
    >
      <Box component="h1" sx={visuallyHidden}>
        EKA — Enterprise Knowledge Assistant, engineered by Code With AI Labs
      </Box>

      {/* z0 — 3D knowledge space */}
      <Box sx={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <KnowledgeScene clock={clock} reducedMotion={reducedMotion} compact={compact} paused={sceneOff} />
      </Box>

      {/* z1 — static cinematic vignette + dynamic calm veil behind text */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse 120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.7) 100%)',
        }}
      />
      <Box
        ref={veilRef}
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          opacity: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 46% 30% at 50% 50%, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0) 100%)',
        }}
      />

      {/* z2 — the single active typography block */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, sm: 4 },
          pointerEvents: 'none',
        }}
      >
        <Box
          ref={textRef}
          data-intro-text={block ?? ''}
          aria-live="polite"
          sx={{ opacity: 0, textAlign: 'center', willChange: 'opacity, transform, filter', maxWidth: '100%' }}
        >
          {block === 'product' && <ProductBlock />}
          {block === 'engineered' && <EngineeredBlock />}
          {block === 'message' && <MessageBlock />}
          {block === 'identity' && (
            <IdentityBlock ctaRef={ctaRef} ctaReady={ctaReady && !exiting} onEnter={exit} />
          )}
        </Box>
      </Box>

      {/* z3 — skip control */}
      <Box
        component="button"
        ref={skipRef}
        type="button"
        onClick={exit}
        aria-label="Skip introduction"
        sx={{
          position: 'absolute',
          zIndex: 3,
          right: { xs: 16, sm: 32 },
          bottom: { xs: 18, sm: 28 },
          opacity: 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          px: 1,
          py: 0.75,
          fontFamily: MONO_STACK,
          fontSize: '0.625rem',
          letterSpacing: '0.32em',
          color: '#666666',
          transition: 'color 0.2s ease',
          '&:hover': { color: '#AAAAAA' },
          '&:focus-visible': { outline: '1px solid #888888', outlineOffset: 2, color: '#CCCCCC' },
        }}
      >
        SKIP INTRO
      </Box>
    </Box>
  )
}

/* ------------------------------------------------------------------ */
/* Typography blocks — exactly the approved copy, nothing else         */
/* ------------------------------------------------------------------ */

const lineBase = {
  m: 0,
  fontFamily: FONT_STACK,
  whiteSpace: 'nowrap',
  lineHeight: 1.08,
} as const

/** Optical centring for tracked uppercase (trailing letter-spacing). */
const track = (em: number) => ({ letterSpacing: `${em}em`, pl: `${em}em` })

function ProductBlock() {
  return (
    <Stack gap={{ xs: 1.5, sm: 2.25 }}>
      <Box
        component="div"
        sx={{
          ...lineBase,
          ...track(0.16),
          fontWeight: 300,
          color: '#FFFFFF',
          fontSize: 'clamp(2rem, 9.2vw, 6.25rem)',
        }}
      >
        ENTERPRISE
      </Box>
      <Box
        component="div"
        sx={{
          ...lineBase,
          ...track(0.34),
          fontWeight: 400,
          color: '#CCCCCC',
          fontSize: 'clamp(0.95rem, 2.9vw, 2rem)',
        }}
      >
        KNOWLEDGE ASSISTANT
      </Box>
    </Stack>
  )
}

function EngineeredBlock() {
  return (
    <Stack gap={{ xs: 1.75, sm: 2.5 }}>
      <Box
        sx={{
          ...lineBase,
          ...track(0.5),
          fontFamily: MONO_STACK,
          fontWeight: 400,
          color: '#888888',
          fontSize: 'clamp(0.625rem, 1.3vw, 0.8125rem)',
        }}
      >
        ENGINEERED BY
      </Box>
      <Box
        sx={{
          ...lineBase,
          ...track(0.22),
          fontWeight: 400,
          color: '#F5F5F5',
          fontSize: 'clamp(1.15rem, 4.7vw, 2.75rem)',
        }}
      >
        CODE WITH AI LABS
      </Box>
    </Stack>
  )
}

function MessageBlock() {
  return (
    <Stack gap={{ xs: 1.25, sm: 1.75 }}>
      <Box
        sx={{
          ...lineBase,
          ...track(0.38),
          fontWeight: 300,
          color: '#AAAAAA',
          fontSize: 'clamp(0.8rem, 2.1vw, 1.5rem)',
        }}
      >
        ONE PLACE FOR
      </Box>
      <Box
        sx={{
          ...lineBase,
          ...track(0.12),
          fontWeight: 300,
          color: '#FFFFFF',
          fontSize: 'clamp(1.35rem, 5.6vw, 4rem)',
        }}
      >
        ENTERPRISE KNOWLEDGE
      </Box>
    </Stack>
  )
}

function IdentityBlock({
  ctaRef,
  ctaReady,
  onEnter,
}: {
  ctaRef: React.RefObject<HTMLDivElement | null>
  ctaReady: boolean
  onEnter: () => void
}) {
  return (
    <Stack gap={{ xs: 4, sm: 5.5 }}>
      <Box
        sx={{
          ...lineBase,
          ...track(0.3),
          fontWeight: 300,
          color: '#FFFFFF',
          lineHeight: 0.9,
          fontSize: 'clamp(5rem, 22vw, 13rem)',
        }}
      >
        EKA
      </Box>
      {/* Space is reserved from 8 s so EKA never shifts when the CTA arrives. */}
      <Box ref={ctaRef} sx={{ opacity: 0, pointerEvents: ctaReady ? 'auto' : 'none' }}>
        <Box
          component="button"
          type="button"
          data-eka-enter
          onClick={onEnter}
          tabIndex={ctaReady ? 0 : -1}
          aria-hidden={!ctaReady}
          sx={{
            ...track(0.36),
            fontFamily: FONT_STACK,
            fontSize: { xs: '0.75rem', sm: '0.8125rem' },
            fontWeight: 600,
            color: '#000000',
            backgroundColor: '#FFFFFF',
            border: '1px solid #FFFFFF',
            borderRadius: '2px',
            minWidth: { xs: 220, sm: 260 },
            px: 5,
            py: { xs: 1.75, sm: 2 },
            cursor: 'pointer',
            transition: 'background-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.12), 0 12px 40px rgba(0,0,0,0.6)',
            '&:hover': { backgroundColor: '#000000', color: '#FFFFFF' },
            '&:focus-visible': { outline: '1px solid #FFFFFF', outlineOffset: 4 },
          }}
        >
          ENTER EKA
        </Box>
      </Box>
    </Stack>
  )
}

function Stack({ gap, children }: { gap: Record<string, number>; children: ReactNode }) {
  return <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap }}>{children}</Box>
}

const visuallyHidden = {
  position: 'absolute',
  width: 1,
  height: 1,
  p: 0,
  m: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const
