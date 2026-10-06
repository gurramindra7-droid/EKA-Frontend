import * as THREE from 'three'

/**
 * Procedural layout for the intro's "enterprise knowledge space".
 *
 * Every element has two states:
 *   scattered  — information distributed through a deep volume
 *   structured — the same information organized around a central core
 *
 * The 3D scene interpolates between them over time. Generation is seeded,
 * so the composition is identical on every run (no random chaos).
 */

export interface FieldConfig {
  cards: number
  nodes: number
  dust: number
  /** Half-extent of the scattered volume (x, y). */
  spreadX: number
  spreadY: number
  ringRadius: number
  coreRadius: number
}

export const FIELD_DESKTOP: FieldConfig = { cards: 24, nodes: 120, dust: 520, spreadX: 18, spreadY: 10, ringRadius: 7.8, coreRadius: 3.0 }
/** Phones / portrait: fewer objects, a narrower and taller volume. */
export const FIELD_MOBILE: FieldConfig = { cards: 14, nodes: 80, dust: 240, spreadX: 9, spreadY: 15, ringRadius: 6.4, coreRadius: 2.6 }

/** Mulberry32 — tiny deterministic PRNG. */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const range = (r: () => number, min: number, max: number) => min + r() * (max - min)

/**
 * A scattered position that keeps a clear corridor around the camera's
 * line of sight, so nothing ever drifts through the typography zone.
 */
function scatterPoint(r: () => number, spreadX: number, spreadY: number, zMin: number, zMax: number) {
  for (;;) {
    const x = range(r, -spreadX, spreadX)
    const y = range(r, -spreadY, spreadY)
    const z = range(r, zMin, zMax)
    // Elliptical corridor: wider when closer to the camera.
    const near = THREE.MathUtils.clamp((z + 10) / 30, 0, 1)
    const k = Math.min(1, spreadX / 18)
    const cx = (3.4 + near * 2.6) * k
    const cy = 1.9 + near * 1.4
    if ((x / cx) ** 2 + (y / cy) ** 2 > 1) return new THREE.Vector3(x, y, z)
  }
}

export interface CardData {
  scatter: THREE.Vector3
  scatterRot: THREE.Euler
  target: THREE.Vector3
  /** Ring angle (radians) of the structured slot. */
  angle: number
  scale: number
  /** 0..1 stagger used to cascade the organization. */
  delay: number
  spin: number
}

export interface NodeData {
  scatter: THREE.Vector3
  target: THREE.Vector3
  delay: number
}

export interface Field {
  cards: CardData[]
  nodes: NodeData[]
  /** Pairs of node indices forming the structured lattice. */
  edges: [number, number][]
  /** card index → nearest node index (document ↔ knowledge links). */
  links: [number, number][]
  dust: Float32Array
  ringRadius: number
  coreRadius: number
}

/** Ring inclination: the front arc passes below the typography, the back arc above. */
export const RING_TILT = THREE.MathUtils.degToRad(62)

export function buildField(config: FieldConfig): Field {
  const r = rng(0xe4a2026)
  const { ringRadius, coreRadius, spreadX, spreadY } = config

  // --- Knowledge nodes: scattered → Fibonacci sphere lattice (the core) ---
  const nodes: NodeData[] = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < config.nodes; i++) {
    const y = 1 - (i / (config.nodes - 1)) * 2
    const rad = Math.sqrt(1 - y * y)
    const th = golden * i
    const target = new THREE.Vector3(Math.cos(th) * rad, y, Math.sin(th) * rad).multiplyScalar(coreRadius)
    nodes.push({ scatter: scatterPoint(r, spreadX * 0.95, spreadY * 0.95, -26, 16), target, delay: r() })
  }

  // Lattice edges: each node to its 3 nearest structured neighbours.
  const edgeSet = new Set<string>()
  const edges: [number, number][] = []
  nodes.forEach((n, i) => {
    const nearest = nodes
      .map((m, j) => ({ j, d: j === i ? Infinity : n.target.distanceToSquared(m.target) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)
    for (const { j } of nearest) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`
      if (!edgeSet.has(key)) {
        edgeSet.add(key)
        edges.push([Math.min(i, j), Math.max(i, j)])
      }
    }
  })

  // --- Document cards: scattered → evenly spaced orbital ring ---
  const cards: CardData[] = []
  const tiltCos = Math.cos(RING_TILT)
  const tiltSin = Math.sin(RING_TILT)
  for (let i = 0; i < config.cards; i++) {
    const angle = (i / config.cards) * Math.PI * 2
    const target = new THREE.Vector3(
      Math.cos(angle) * ringRadius,
      -Math.sin(angle) * ringRadius * tiltCos,
      Math.sin(angle) * ringRadius * tiltSin,
    )
    cards.push({
      scatter: scatterPoint(r, spreadX, spreadY, -28, 18),
      scatterRot: new THREE.Euler(range(r, -0.5, 0.5), range(r, -0.9, 0.9), range(r, -0.25, 0.25)),
      target,
      angle,
      scale: range(r, 0.85, 1.15),
      delay: r(),
      spin: range(r, -1, 1),
    })
  }

  // Links: each card to its closest core node in the structured state.
  const links: [number, number][] = cards.map((c, ci) => {
    let best = 0
    let bestD = Infinity
    nodes.forEach((n, ni) => {
      const d = n.target.distanceToSquared(c.target)
      if (d < bestD) {
        bestD = d
        best = ni
      }
    })
    return [ci, best]
  })

  // --- Ambient data particles ---
  const dust = new Float32Array(config.dust * 3)
  for (let i = 0; i < config.dust; i++) {
    dust[i * 3] = range(r, -30, 30)
    dust[i * 3 + 1] = range(r, -16, 16)
    dust[i * 3 + 2] = range(r, -40, 20)
  }

  return { cards, nodes, edges, links, dust, ringRadius, coreRadius }
}

/* ------------------------------------------------------------------ */
/* Monochrome canvas textures                                          */
/* ------------------------------------------------------------------ */

/** Abstract document card: hairline frame, title bar and text rules. */
export function createDocumentTexture(): THREE.CanvasTexture {
  const w = 256
  const h = 332
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  const radius = 10

  const roundRect = (x: number, y: number, rw: number, rh: number, rr: number) => {
    g.beginPath()
    g.moveTo(x + rr, y)
    g.arcTo(x + rw, y, x + rw, y + rh, rr)
    g.arcTo(x + rw, y + rh, x, y + rh, rr)
    g.arcTo(x, y + rh, x, y, rr)
    g.arcTo(x, y, x + rw, y, rr)
    g.closePath()
  }

  // Face
  roundRect(2, 2, w - 4, h - 4, radius)
  g.fillStyle = '#111111'
  g.fill()
  g.lineWidth = 2
  g.strokeStyle = '#666666'
  g.stroke()

  // Title
  g.fillStyle = '#AAAAAA'
  g.fillRect(24, 30, 120, 9)
  g.fillStyle = '#444444'
  g.fillRect(24, 48, 72, 5)

  // Divider
  g.fillStyle = '#333333'
  g.fillRect(24, 68, w - 48, 1)

  // Text rules
  const rules = [0.92, 0.84, 0.88, 0.62, 0, 0.9, 0.8, 0.86, 0.7, 0, 0.88, 0.76, 0.5]
  let y = 88
  for (const len of rules) {
    if (len > 0) {
      g.fillStyle = '#333333'
      g.fillRect(24, y, (w - 48) * len, 4)
    }
    y += 16
  }

  // Footer marker
  g.fillStyle = '#444444'
  g.fillRect(24, h - 34, 34, 4)
  g.fillRect(w - 58, h - 34, 34, 4)

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  tex.needsUpdate = true
  return tex
}

/** Soft round sprite for nodes and particles. */
export function createDotTexture(): THREE.CanvasTexture {
  const s = 64
  const c = document.createElement('canvas')
  c.width = s
  c.height = s
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.35, 'rgba(255,255,255,0.85)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, s, s)
  const tex = new THREE.CanvasTexture(c)
  tex.needsUpdate = true
  return tex
}
