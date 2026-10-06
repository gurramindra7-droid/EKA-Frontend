import { Component, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  buildField,
  createDocumentTexture,
  createDotTexture,
  FIELD_DESKTOP,
  FIELD_MOBILE,
  RING_TILT,
  type Field,
} from './knowledgeField'
import { easeInOutCubic, signalsAt, smoothstep } from './IntroTimeline'

/**
 * KnowledgeScene — the intro's 3D background layer.
 *
 * Story, driven entirely by the shared intro clock:
 *   scattered documents & nodes drifting in a deep dark volume
 *     → faint connections appear between nearby documents
 *       → nodes settle into a lattice core, documents into an orbital ring
 *         → the structure converges and calms behind "EKA".
 *
 * Only grayscale values are used. Typography is NOT rendered here; this
 * canvas is strictly the background layer.
 */

interface SceneProps {
  /** Seconds since intro start (shared with the typography layer). */
  clock: RefObject<number>
  reducedMotion: boolean
  compact: boolean
  paused: boolean
}

export default function KnowledgeScene(props: SceneProps) {
  const [supported] = useState(detectWebGL)
  if (!supported) return <SceneFallback />
  return (
    <SceneErrorBoundary fallback={<SceneFallback />}>
      <Canvas
        dpr={[1, props.compact ? 1.5 : 1.75]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ fov: 45, near: 0.1, far: 120, position: [0, 0.6, 30] }}
        frameloop={props.paused ? 'never' : 'always'}
        onCreated={({ gl, scene }) => {
          gl.setClearColor('#000000', 1)
          scene.fog = new THREE.Fog('#000000', 11, 46)
        }}
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden
      >
        <KnowledgeField {...props} />
      </Canvas>
    </SceneErrorBoundary>
  )
}

/* ------------------------------------------------------------------ */

const tmpObj = new THREE.Object3D()
const tmpA = new THREE.Vector3()
const tmpB = new THREE.Vector3()
const tmpQ1 = new THREE.Quaternion()
const tmpQ2 = new THREE.Quaternion()
const yAxis = new THREE.Vector3(0, 1, 0)
const CARD_W = 1.3
const CARD_H = 1.69

function KnowledgeField({ clock, reducedMotion, compact }: SceneProps) {
  const field: Field = useMemo(() => buildField(compact ? FIELD_MOBILE : FIELD_DESKTOP), [compact])
  const docTexture = useMemo(() => createDocumentTexture(), [])
  const dotTexture = useMemo(() => createDotTexture(), [])

  // Pairs of nearby scattered cards → early "connections" between documents.
  const cardPairs = useMemo(() => {
    const pairs: [number, number][] = []
    field.cards.forEach((a, i) => {
      field.cards.forEach((b, j) => {
        if (j > i && a.scatter.distanceTo(b.scatter) < (compact ? 6.5 : 5.5)) pairs.push([i, j])
      })
    })
    return pairs.slice(0, 40)
  }, [field, compact])

  // Precomputed quaternions per card.
  const cardQuats = useMemo(
    () =>
      field.cards.map((c) => ({
        scatter: new THREE.Quaternion().setFromEuler(c.scatterRot),
      })),
    [field],
  )

  // ---- refs to live objects ----
  const cardsRef = useRef<THREE.InstancedMesh>(null)
  const nodesRef = useRef<THREE.Points>(null)
  const edgesRef = useRef<THREE.LineSegments>(null)
  const linksRef = useRef<THREE.LineSegments>(null)
  const pairsRef = useRef<THREE.LineSegments>(null)
  const dustRef = useRef<THREE.Points>(null)
  const ringOuterRef = useRef<THREE.LineLoop>(null)

  // ---- geometry buffers (allocated once) ----
  const buffers = useMemo(() => {
    const nodePos = new Float32Array(field.nodes.length * 3)
    const edgePos = new Float32Array(field.edges.length * 6)
    const edgeCol = new Float32Array(field.edges.length * 6)
    const linkPos = new Float32Array(field.links.length * 6)
    const linkCol = new Float32Array(field.links.length * 6)
    const pairPos = new Float32Array(cardPairs.length * 6)
    const pairCol = new Float32Array(cardPairs.length * 6)
    const cardPos = field.cards.map(() => new THREE.Vector3())
    return { nodePos, edgePos, edgeCol, linkPos, linkCol, pairPos, pairCol, cardPos }
  }, [field, cardPairs])

  const ringGeometry = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i < 160; i++) {
      const a = (i / 160) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0))
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [])

  useEffect(
    () => () => {
      docTexture.dispose()
      dotTexture.dispose()
      ringGeometry.dispose()
    },
    [docTexture, dotTexture, ringGeometry],
  )

  useFrame((state) => {
    const { camera, size, scene } = state
    const t = clock.current ?? 0
    const s = signalsAt(t)
    const m = reducedMotion ? 0.15 : 1 // motion amplitude
    const aspect = size.width / Math.max(1, size.height)
    const fit = aspect < 1 ? 1 + (1 - aspect) * 1.25 : 1

    /* ---------------- camera: slow dolly through the space ---------------- */
    const travel = easeInOutCubic(t / 9.5)
    const zStart = reducedMotion ? 19 : 30
    const z = THREE.MathUtils.lerp(zStart, 17.5, travel) * fit
    const orbit = t * 0.11 * m
    camera.position.set(Math.sin(orbit) * 2.2 * m, 0.7 + Math.sin(t * 0.17) * 0.35 * m, z)
    camera.lookAt(0, 0, 0)
    // Depth fog tracks the camera distance so the composition reads the same on any aspect.
    const fog = scene.fog as THREE.Fog | null
    if (fog) {
      fog.near = z * 0.45
      fog.far = z + 22
    }

    /* ---------------- structural rotation ---------------- */
    const coreSpin = t * 0.07 * m + 0.4
    const ringSpin = t * 0.045 * m
    const ringR = field.ringRadius * (1 - 0.08 * s.converge)
    const coreScale = 1 - 0.1 * s.converge
    const tiltCos = Math.cos(RING_TILT)
    const tiltSin = Math.sin(RING_TILT)

    /* ---------------- document cards ---------------- */
    const cards = cardsRef.current
    if (cards) {
      field.cards.forEach((c, i) => {
        const local = easeInOutCubic(smoothstep(c.delay * 0.4, c.delay * 0.4 + 0.6, s.organize))
        // scattered: gentle drift
        tmpA.set(
          c.scatter.x + Math.sin(t * 0.32 + i) * 0.35 * m,
          c.scatter.y + Math.cos(t * 0.27 + i * 1.7) * 0.28 * m,
          c.scatter.z,
        )
        // structured: orbital ring slot
        const a = c.angle + ringSpin
        tmpB.set(Math.cos(a) * ringR, -Math.sin(a) * ringR * tiltCos, Math.sin(a) * ringR * tiltSin)
        const p = buffers.cardPos[i].copy(tmpA).lerp(tmpB, local)

        tmpQ1.copy(cardQuats[i].scatter)
        tmpQ1.multiply(tmpQ2.setFromAxisAngle(yAxis, t * 0.05 * c.spin * m))
        // structured: face the viewer, slightly curved like a gallery
        tmpQ2.setFromAxisAngle(yAxis, -Math.cos(a) * 0.45)
        tmpObj.quaternion.copy(tmpQ1).slerp(tmpQ2, local)
        tmpObj.position.copy(p)
        const sc = c.scale * (1 - 0.32 * local)
        tmpObj.scale.set(sc, sc, sc)
        tmpObj.updateMatrix()
        cards.setMatrixAt(i, tmpObj.matrix)
      })
      cards.instanceMatrix.needsUpdate = true
      const mat = cards.material as THREE.MeshBasicMaterial
      mat.opacity = s.reveal * (1 - 0.35 * s.calm)
    }

    /* ---------------- knowledge nodes ---------------- */
    const cs = Math.cos(coreSpin)
    const sn = Math.sin(coreSpin)
    const np = buffers.nodePos
    field.nodes.forEach((n, i) => {
      const local = easeInOutCubic(smoothstep(n.delay * 0.35, n.delay * 0.35 + 0.65, s.organize))
      const sx = n.scatter.x + Math.sin(t * 0.21 + i * 0.7) * 0.4 * m
      const sy = n.scatter.y + Math.cos(t * 0.19 + i * 1.3) * 0.3 * m
      const sz = n.scatter.z
      const tx = (n.target.x * cs - n.target.z * sn) * coreScale
      const ty = n.target.y * coreScale
      const tz = (n.target.x * sn + n.target.z * cs) * coreScale
      np[i * 3] = sx + (tx - sx) * local
      np[i * 3 + 1] = sy + (ty - sy) * local
      np[i * 3 + 2] = sz + (tz - sz) * local
    })
    if (nodesRef.current) {
      nodesRef.current.geometry.attributes.position.needsUpdate = true
      const mat = nodesRef.current.material as THREE.PointsMaterial
      mat.opacity = s.reveal * (0.55 + 0.35 * s.organize) * (1 - 0.4 * s.calm)
    }

    /* ---------------- lattice edges (structure) ---------------- */
    const edgeAlpha = s.organize * s.organize * (1 - 0.45 * s.calm)
    field.edges.forEach(([a, b], k) => {
      const o = k * 6
      for (let d = 0; d < 3; d++) {
        buffers.edgePos[o + d] = np[a * 3 + d]
        buffers.edgePos[o + 3 + d] = np[b * 3 + d]
      }
      // Fade long (still-travelling) segments so no giant lines streak across.
      const dx = np[a * 3] - np[b * 3]
      const dy = np[a * 3 + 1] - np[b * 3 + 1]
      const dz = np[a * 3 + 2] - np[b * 3 + 2]
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz)
      const fade = 1 - smoothstep(1.5, 2.2, len)
      const v = 0.46 * edgeAlpha * fade
      for (let d = 0; d < 6; d++) buffers.edgeCol[o + d] = v
    })
    if (edgesRef.current) {
      const g = edgesRef.current.geometry
      g.attributes.position.needsUpdate = true
      g.attributes.color.needsUpdate = true
    }

    /* ---------------- document ↔ core links ---------------- */
    field.links.forEach(([ci, ni], k) => {
      const o = k * 6
      const c = buffers.cardPos[ci]
      buffers.linkPos[o] = c.x
      buffers.linkPos[o + 1] = c.y
      buffers.linkPos[o + 2] = c.z
      buffers.linkPos[o + 3] = np[ni * 3]
      buffers.linkPos[o + 4] = np[ni * 3 + 1]
      buffers.linkPos[o + 5] = np[ni * 3 + 2]
      const local = smoothstep(0.55, 1, s.organize)
      const v = 0.2 * local * (1 - 0.65 * s.converge) * (1 - 0.5 * s.calm)
      buffers.linkCol[o] = buffers.linkCol[o + 1] = buffers.linkCol[o + 2] = v * 1.4
      buffers.linkCol[o + 3] = buffers.linkCol[o + 4] = buffers.linkCol[o + 5] = v * 0.3
    })
    if (linksRef.current) {
      const g = linksRef.current.geometry
      g.attributes.position.needsUpdate = true
      g.attributes.color.needsUpdate = true
    }

    /* ---------------- early connections between scattered documents ---------------- */
    const early = s.connect * (1 - smoothstep(0.15, 0.6, s.organize))
    cardPairs.forEach(([a, b], k) => {
      const o = k * 6
      const pa = buffers.cardPos[a]
      const pb = buffers.cardPos[b]
      buffers.pairPos[o] = pa.x
      buffers.pairPos[o + 1] = pa.y
      buffers.pairPos[o + 2] = pa.z
      buffers.pairPos[o + 3] = pb.x
      buffers.pairPos[o + 4] = pb.y
      buffers.pairPos[o + 5] = pb.z
      // staggered appearance; long segments never render
      const plen = pa.distanceTo(pb)
      const lenFade = 1 - smoothstep(4.0, 5.5, plen)
      const stagger = smoothstep(k / cardPairs.length * 0.6, k / cardPairs.length * 0.6 + 0.4, early)
      const v = 0.34 * stagger * lenFade * (1 - 0.5 * s.calm)
      for (let d = 0; d < 6; d++) buffers.pairCol[o + d] = v
    })
    if (pairsRef.current) {
      const g = pairsRef.current.geometry
      g.attributes.position.needsUpdate = true
      g.attributes.color.needsUpdate = true
    }

    /* ---------------- ambient particles ---------------- */
    if (dustRef.current) {
      dustRef.current.rotation.y = t * 0.012 * m
      const mat = dustRef.current.material as THREE.PointsMaterial
      mat.opacity = 0.42 * s.reveal
    }

    /* ---------------- orbital guides ---------------- */
    if (ringOuterRef.current) {
      ringOuterRef.current.scale.setScalar(ringR)
      ;(ringOuterRef.current.material as THREE.LineBasicMaterial).opacity = 0.5 * smoothstep(0.5, 1, s.organize)
    }
  })

  return (
    <>
      {/* Ambient data particles */}
      <points ref={dustRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[field.dust, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={compact ? 0.06 : 0.05}
          map={dotTexture}
          color="#888888"
          transparent
          opacity={0}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Document cards — one instanced draw call */}
      <instancedMesh ref={cardsRef} args={[undefined, undefined, field.cards.length]} frustumCulled={false}>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshBasicMaterial
          map={docTexture}
          transparent
          opacity={0}
          alphaTest={0.02}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Early connections between documents */}
      <lineSegments ref={pairsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[buffers.pairPos, 3]} />
          <bufferAttribute attach="attributes-color" args={[buffers.pairCol, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </lineSegments>

      {/* Knowledge nodes */}
      <points ref={nodesRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[buffers.nodePos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={compact ? 0.13 : 0.11}
          map={dotTexture}
          color="#CCCCCC"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
          toneMapped={false}
        />
      </points>

      {/* Structured lattice */}
      <lineSegments ref={edgesRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[buffers.edgePos, 3]} />
          <bufferAttribute attach="attributes-color" args={[buffers.edgeCol, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </lineSegments>

      {/* Document ↔ core links */}
      <lineSegments ref={linksRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[buffers.linkPos, 3]} />
          <bufferAttribute attach="attributes-color" args={[buffers.linkCol, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </lineSegments>

      {/* Orbital guides */}
      <lineLoop ref={ringOuterRef} geometry={ringGeometry} rotation={[Math.PI - RING_TILT, 0, 0]}>
        <lineBasicMaterial color="#444444" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </lineLoop>

    </>
  )
}

/* ------------------------------------------------------------------ */
/* WebGL support + graceful fallback                                   */
/* ------------------------------------------------------------------ */

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    return Boolean(ctx)
  } catch {
    return false
  }
}

class SceneErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.warn('[EKA] 3D intro unavailable, using fallback.', error)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/** Elegant static monochrome backdrop used when WebGL is unavailable. */
function SceneFallback() {
  return (
    <div
      aria-hidden
      data-webgl-fallback
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(ellipse 55% 42% at 50% 50%, rgba(255,255,255,0.06), transparent 70%), #000',
        overflow: 'hidden',
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.55 }}>
        <g fill="none" stroke="#333333" strokeWidth="1">
          <ellipse cx="800" cy="450" rx="560" ry="150" />
          <ellipse cx="800" cy="450" rx="250" ry="250" stroke="#222222" />
        </g>
        <g fill="#111111" stroke="#444444" strokeWidth="1">
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2
            const x = 800 + Math.cos(a) * 560
            const y = 450 + Math.sin(a) * 150
            return <rect key={i} x={x - 18} y={y - 24} width="36" height="48" rx="3" />
          })}
        </g>
      </svg>
    </div>
  )
}
