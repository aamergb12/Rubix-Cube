import { useRef, useMemo, useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

/* -------------------------------------------------------------------------- */
/*                                CONFIGURATION                               */
/* -------------------------------------------------------------------------- */

const COLORS = {
  U: '#ffffff',
  D: '#ffff00',
  L: '#ff8000',
  R: '#ff0000',
  F: '#00ff00',
  B: '#0000ff',
} as const

const FACE_AXIS: Record<string, THREE.Vector3> = {
  U: new THREE.Vector3(0, 1, 0),
  D: new THREE.Vector3(0, -1, 0),
  L: new THREE.Vector3(-1, 0, 0),
  R: new THREE.Vector3(1, 0, 0),
  F: new THREE.Vector3(0, 0, 1),
  B: new THREE.Vector3(0, 0, -1),
}

const SLICE_FILTER: Record<string, (pos: number[]) => boolean> = {
  U: ([, y]) => y === 1,
  D: ([, y]) => y === -1,
  L: ([x]) => x === -1,
  R: ([x]) => x === 1,
  F: ([, , z]) => z === 1,
  B: ([, , z]) => z === -1,
}

const FACES = ['U', 'D', 'L', 'R', 'F', 'B']

/* -------------------------------------------------------------------------- */
/*                               CUBE STATE                                   */
/* -------------------------------------------------------------------------- */

interface Cubie {
  id: string
  position: THREE.Vector3
  quaternion: THREE.Quaternion
  stickers: { normal: [number, number, number]; color: string; face: string }[]
}

function makeSolvedCubies(): Cubie[] {
  const cubies: Cubie[] = []

  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue
        const stickers = []
        if (y === 1) stickers.push({ normal: [0, 1, 0], color: COLORS.U, face: 'U' })
        if (y === -1) stickers.push({ normal: [0, -1, 0], color: COLORS.D, face: 'D' })
        if (x === -1) stickers.push({ normal: [-1, 0, 0], color: COLORS.L, face: 'L' })
        if (x === 1) stickers.push({ normal: [1, 0, 0], color: COLORS.R, face: 'R' })
        if (z === 1) stickers.push({ normal: [0, 0, 1], color: COLORS.F, face: 'F' })
        if (z === -1) stickers.push({ normal: [0, 0, -1], color: COLORS.B, face: 'B' })
        
        cubies.push({
          id: `${x}${y}${z}`,
          position: new THREE.Vector3(x, y, z),
          quaternion: new THREE.Quaternion(),
          stickers,
        })
      }

  return cubies
}

/* -------------------------------------------------------------------------- */
/*                             STICKER SUBCOMPONENT                           */
/* -------------------------------------------------------------------------- */

function StickerPlane({ color, normal, face }: { color: string; normal: [number, number, number]; face: string }) {
  const n = new THREE.Vector3(...normal)
  const pos = n.clone().multiplyScalar(0.505)
  const rot = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n)
  return (
    <mesh 
      position={pos.toArray()} 
      quaternion={rot} 
      castShadow
      userData={{ isSticker: true, face }}
    >
      <planeGeometry args={[0.88, 0.88]} />
      <meshStandardMaterial color={color} metalness={0.15} roughness={0.5} />
    </mesh>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  MAIN VIEW                                 */
/* -------------------------------------------------------------------------- */

export const CubeView = forwardRef(({ cube, controlsRef }: { cube: any; controlsRef: any }, ref) => {
  const [cubies, setCubies] = useState<Cubie[]>(() => makeSolvedCubies())
  const cubeRef = useRef<THREE.Group>(null!)
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const { camera, gl } = useThree()
  const [isAnimating, setIsAnimating] = useState(false)
  const [moveHistory, setMoveHistory] = useState<Array<{ face: string; direction: number }>>([])

  const [drag, setDrag] = useState<{
    face: string
    plane: THREE.Plane
    p0: THREE.Vector3
    u: THREE.Vector3
    v: THREE.Vector3
    angle: number
    affectedIndices: number[]
  } | null>(null)

  /* ------------------------------ SCRAMBLE & RESET ------------------------------ */
  
  const scramble = () => {
    if (isAnimating) return
    setIsAnimating(true)
    
    const moves = 20
    const moveSequence: Array<{ face: string; direction: number }> = []
    
    // Generate all moves upfront
    for (let i = 0; i < moves; i++) {
      const face = FACES[Math.floor(Math.random() * FACES.length)]
      const direction = Math.random() > 0.5 ? 1 : -1
      moveSequence.push({ face, direction })
    }
    
    let currentMove = 0
    
    const executeNextMove = () => {
      if (currentMove >= moveSequence.length) {
        setIsAnimating(false)
        return
      }
      
      const { face, direction } = moveSequence[currentMove]
      
      // Use functional update to get latest cubies state
      setCubies(prevCubies => {
        const axis = FACE_AXIS[face]
        const target = direction * Math.PI / 2

        const affectedIndices = prevCubies
          .map((c, i) => {
            const pos = [Math.round(c.position.x), Math.round(c.position.y), Math.round(c.position.z)]
            return SLICE_FILTER[face](pos) ? i : -1
          })
          .filter(i => i >= 0)

        const next = prevCubies.map((c, i) => {
          if (!affectedIndices.includes(i)) return c
          const newCubie = { ...c }
          newCubie.quaternion = new THREE.Quaternion()
            .setFromAxisAngle(axis, target)
            .multiply(c.quaternion)
          newCubie.position = new THREE.Vector3().copy(c.position)
          newCubie.position.applyAxisAngle(axis, target)
          newCubie.position.round()
          return newCubie
        })
        
        return next
      })
      
      currentMove++
      setTimeout(executeNextMove, 150)
    }
    
    executeNextMove()
  }

  const undo = () => {
    if (isAnimating || moveHistory.length === 0) return
    
    const lastMove = moveHistory[moveHistory.length - 1]
    const axis = FACE_AXIS[lastMove.face]
    const target = -lastMove.direction * Math.PI / 2 // Reverse direction

    setCubies(prevCubies => {
      const affectedIndices = prevCubies
        .map((c, i) => {
          const pos = [Math.round(c.position.x), Math.round(c.position.y), Math.round(c.position.z)]
          return SLICE_FILTER[lastMove.face](pos) ? i : -1
        })
        .filter(i => i >= 0)

      const next = prevCubies.map((c, i) => {
        if (!affectedIndices.includes(i)) return c
        const newCubie = { ...c }
        newCubie.quaternion = new THREE.Quaternion()
          .setFromAxisAngle(axis, target)
          .multiply(c.quaternion)
        newCubie.position = new THREE.Vector3().copy(c.position)
        newCubie.position.applyAxisAngle(axis, target)
        newCubie.position.round()
        return newCubie
      })
      
      return next
    })
    
    setMoveHistory(prev => prev.slice(0, -1))
  }

  const reset = () => {
    if (isAnimating) return
    setCubies(makeSolvedCubies())
    setMoveHistory([]) // Clear history on reset
  }

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    scramble,
    reset,
    undo,
    canUndo: moveHistory.length > 0,
  }))

  /* ------------------------------ INTERACTION ------------------------------- */

  const onPointerDown = (e: PointerEvent) => {
    if (drag || isAnimating) return

    const mouse = new THREE.Vector2(
      (e.clientX / gl.domElement.clientWidth) * 2 - 1,
      -(e.clientY / gl.domElement.clientHeight) * 2 + 1
    )
    raycaster.setFromCamera(mouse, camera)

    let hitFace: string | null = null
    let hitDistance = Infinity

    cubeRef.current.traverse((obj: any) => {
      if (obj.isMesh && obj.userData?.isSticker) {
        const hits = raycaster.intersectObject(obj, false)
        if (hits.length && hits[0].distance < hitDistance) {
          hitDistance = hits[0].distance
          hitFace = obj.userData.face
        }
      }
    })

    if (!hitFace) return

    if (controlsRef.current) {
      controlsRef.current.enabled = false
    }

    (gl.domElement as any).style.cursor = 'grabbing'

    const n = FACE_AXIS[hitFace].clone()
    const p0 = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(hitDistance))
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, p0)
    const tmp = Math.abs(n.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
    const u = new THREE.Vector3().crossVectors(tmp, n).normalize()
    const v = new THREE.Vector3().crossVectors(n, u).normalize()

    const affectedIndices = cubies
      .map((c, i) => {
        const pos = [Math.round(c.position.x), Math.round(c.position.y), Math.round(c.position.z)]
        return SLICE_FILTER[hitFace](pos) ? i : -1
      })
      .filter(i => i >= 0)

    setDrag({ face: hitFace, plane, p0, u, v, angle: 0, affectedIndices })
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!drag) return

    const mouse = new THREE.Vector2(
      (e.clientX / gl.domElement.clientWidth) * 2 - 1,
      -(e.clientY / gl.domElement.clientHeight) * 2 + 1
    )
    raycaster.setFromCamera(mouse, camera)

    const p = new THREE.Vector3()
    raycaster.ray.intersectPlane(drag.plane, p)

    const d = p.clone().sub(drag.p0)
    const du = d.dot(drag.u)
    const dv = d.dot(drag.v)

    const mag = Math.max(Math.abs(du), Math.abs(dv))
    const direction = Math.abs(du) > Math.abs(dv) ? Math.sign(du) : Math.sign(dv)
    const angle = THREE.MathUtils.clamp(mag * 2, -Math.PI / 2, Math.PI / 2) * direction

    setDrag(prev => (prev ? { ...prev, angle } : null))
  }

  const onPointerUp = () => {
    if (!drag) {
      if (controlsRef.current) {
        controlsRef.current.enabled = true
      }
      return
    }
    
    (gl.domElement as any).style.cursor = 'default'

    const threshold = THREE.MathUtils.degToRad(15)
    const target =
      Math.abs(drag.angle) < threshold
        ? 0
        : drag.angle > 0
        ? Math.PI / 2
        : -Math.PI / 2

    if (target === 0) {
      setDrag(null)
      if (controlsRef.current) {
        controlsRef.current.enabled = true
      }
      return
    }

    const axis = FACE_AXIS[drag.face]
    const duration = 120
    const t0 = performance.now()
    const affectedIndices = drag.affectedIndices
    const moveFace = drag.face

    const animate = (t: number) => {
      const k = Math.min(1, (t - t0) / duration)

      if (k < 1) {
        requestAnimationFrame(animate)
      } else {
        setCubies(prev => {
          const next = prev.map((c, i) => {
            if (!affectedIndices.includes(i)) return c
            const newCubie = { ...c }
            newCubie.quaternion = new THREE.Quaternion()
              .setFromAxisAngle(axis, target)
              .multiply(c.quaternion)
            newCubie.position = new THREE.Vector3().copy(c.position)
            newCubie.position.applyAxisAngle(axis, target)
            newCubie.position.round()
            return newCubie
          })
          return next
        })

        setDrag(null)
        
        // Record the move for undo
        setMoveHistory(prev => [...prev, { face: moveFace, direction: target > 0 ? 1 : -1 }])
        
        if (controlsRef.current) {
          controlsRef.current.enabled = true
        }
      }
    }

    requestAnimationFrame(animate)
  }

  useEffect(() => {
    const canvas = gl.domElement
    const handleDown = (e: Event) => onPointerDown(e as PointerEvent)
    const handleMove = (e: Event) => onPointerMove(e as PointerEvent)
    const handleUp = () => onPointerUp()
    
    canvas.addEventListener('pointerdown', handleDown)
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      canvas.removeEventListener('pointerdown', handleDown)
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [drag, cubies, isAnimating])

  /* ------------------------------ RENDER ----------------------------- */

  return (
    <group ref={cubeRef}>
      {cubies.map((cubie, idx) => {
        let rotation = new THREE.Quaternion().copy(cubie.quaternion)
        let position = new THREE.Vector3().copy(cubie.position)

        if (drag && drag.affectedIndices.includes(idx)) {
          const axis = FACE_AXIS[drag.face]
          const tempQuat = new THREE.Quaternion().setFromAxisAngle(axis, drag.angle)
          rotation = tempQuat.clone().multiply(rotation)
          position = new THREE.Vector3().copy(cubie.position).applyAxisAngle(axis, drag.angle)
        }

        return (
          <group key={cubie.id} position={position.toArray()} quaternion={rotation.toArray()}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial
                color="#0a0d14"
                metalness={0.3}
                roughness={0.8}
              />
            </mesh>
            {cubie.stickers.map((s, i) => (
              <StickerPlane key={i} color={s.color} normal={s.normal} face={s.face} />
            ))}
          </group>
        )
      })}
    </group>
  )
})