/**
 * EKA intro — deterministic scene timeline (≈13 s).
 *
 * One clock (seconds since the intro mounted) drives both the HTML
 * typography layer and the 3D knowledge scene. Everything here is a pure
 * function of `t`, so the sequence is reproducible and trivially testable.
 *
 *   scene 0  opening      0.0 – 2.0   black → 3D knowledge space emerges
 *   scene 1  product      2.0 – 4.0   ENTERPRISE / KNOWLEDGE ASSISTANT
 *   scene 2  engineered   4.0 – 6.0   ENGINEERED BY / CODE WITH AI LABS
 *   scene 3  message      6.0 – 8.0   ONE PLACE FOR / ENTERPRISE KNOWLEDGE
 *   scene 4  identity     8.0 – 9.0   EKA
 *   scene 5  cta          9.0 – 13.0  EKA + ENTER EKA
 *   → app                 13.0
 *
 * Text windows are strictly sequential with a short gap between them, so
 * two major texts can never be visible at the same instant.
 */

export type SceneId = 'opening' | 'product' | 'engineered' | 'message' | 'identity' | 'cta'

export interface Scene {
  id: SceneId
  start: number
  end: number
}

export const INTRO_TOTAL_S = 13

export const SCENES: readonly Scene[] = [
  { id: 'opening', start: 0, end: 2 },
  { id: 'product', start: 2, end: 4 },
  { id: 'engineered', start: 4, end: 6 },
  { id: 'message', start: 6, end: 8 },
  { id: 'identity', start: 8, end: 9 },
  { id: 'cta', start: 9, end: INTRO_TOTAL_S },
]

/** Which typography block is mounted for a scene (one at a time). */
export type TextBlockId = 'product' | 'engineered' | 'message' | 'identity'

export interface TextWindow {
  id: TextBlockId
  /** Fade-in begins. */
  start: number
  /** Fully faded out (Infinity = holds until exit). */
  end: number
  fadeIn: number
  fadeOut: number
}

/**
 * Text windows. Each statement fades in, holds, and is completely gone
 * ~150 ms before the next one starts.
 */
export const TEXT_WINDOWS: readonly TextWindow[] = [
  { id: 'product', start: 2.0, end: 3.85, fadeIn: 0.55, fadeOut: 0.4 },
  { id: 'engineered', start: 4.0, end: 5.85, fadeIn: 0.55, fadeOut: 0.4 },
  { id: 'message', start: 6.0, end: 7.85, fadeIn: 0.55, fadeOut: 0.4 },
  { id: 'identity', start: 8.0, end: Number.POSITIVE_INFINITY, fadeIn: 0.9, fadeOut: 0 },
]

/** ENTER EKA becomes visible at 9 s and stays until the user leaves. */
export const CTA_START_S = 9.0
export const CTA_FADE_S = 0.6

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
export const smoothstep = (a: number, b: number, v: number) => {
  const x = clamp01((v - a) / (b - a))
  return x * x * (3 - 2 * x)
}
export const easeOutCubic = (v: number) => 1 - (1 - clamp01(v)) ** 3
export const easeInOutCubic = (v: number) => {
  const x = clamp01(v)
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2
}

export function sceneIndexAt(t: number): number {
  for (let i = SCENES.length - 1; i >= 0; i--) {
    if (t >= SCENES[i].start) return i
  }
  return 0
}

export interface TextState {
  id: TextBlockId
  /** 0..1 opacity envelope. */
  opacity: number
  /** 0 → entering, 1 → settled, used for subtle motion. */
  enter: number
  /** 0 → visible, 1 → fully exited, used for subtle exit motion. */
  exit: number
}

/** The single active text block at time t, or null between windows. */
export function textAt(t: number): TextState | null {
  for (const w of TEXT_WINDOWS) {
    if (t >= w.start && t < w.end) {
      const enter = w.fadeIn > 0 ? clamp01((t - w.start) / w.fadeIn) : 1
      const exit = Number.isFinite(w.end) && w.fadeOut > 0 ? clamp01(1 - (w.end - t) / w.fadeOut) : 0
      const opacity = easeOutCubic(enter) * (1 - easeInOutCubic(exit))
      return { id: w.id, opacity, enter: easeOutCubic(enter), exit: easeInOutCubic(exit) }
    }
  }
  return null
}

export function ctaOpacityAt(t: number): number {
  return easeOutCubic((t - CTA_START_S) / CTA_FADE_S)
}

/**
 * Signals for the 3D knowledge space.
 *
 *   reveal      0→1  the space emerges from black (0 – 1.8 s)
 *   connect     0→1  first faint connections between documents (4 – 7 s)
 *   organize    0→1  scattered information settles into structure (6.2 – 9.0 s)
 *   converge    0→1  the structure tightens toward the centre (8.2 – 9.8 s)
 *   calm        0→1  area behind typography quietens (follows the text)
 */
export interface SceneSignals {
  reveal: number
  connect: number
  organize: number
  converge: number
  calm: number
}

export function signalsAt(t: number): SceneSignals {
  const text = textAt(t)
  const isStatement = text && text.id !== 'identity'
  return {
    reveal: smoothstep(0.05, 1.8, t),
    connect: smoothstep(4.0, 7.0, t),
    organize: smoothstep(6.2, 9.0, t),
    converge: smoothstep(8.2, 9.8, t),
    calm: isStatement ? text.opacity : text ? 0.85 * text.opacity : 0,
  }
}
