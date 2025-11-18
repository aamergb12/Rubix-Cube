import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { CubeView } from './CubeView'
import * as THREE from 'three'
import { useRef } from 'react'

/**
 * CubeCanvas
 * -----------
 * Main 3D scene for the Rubik’s Cube simulation.
 * Includes lighting, environment, controls, and action buttons (Scramble / Undo / Reset).
 */
export function CubeCanvas({ cube }: { cube: any }) {
  const controlsRef = useRef<any>(null)
  const cubeViewRef = useRef<any>(null)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        shadows
        camera={{ position: [5, 5, 6], fov: 45 }}
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        dpr={[1, 2]}
      >
        {/* ---------- LIGHTING ---------- */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Environment preset="city" />

        {/* ---------- MAIN CUBE ---------- */}
        <CubeView ref={cubeViewRef} cube={cube} controlsRef={controlsRef} />

        {/* ---------- CAMERA CONTROLS ---------- */}
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          maxDistance={15}
          minDistance={4}
        />

        {/* ---------- CONTACT SHADOWS ---------- */}
        <ContactShadows
          position={[0, -2, 0]}
          opacity={0.3}
          scale={15}
          blur={2}
          far={4}
        />
      </Canvas>

      {/* ---------- UI BUTTONS ---------- */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '12px',
          zIndex: 10,
        }}
      >
        {[
          {
            label: '🎲 Scramble',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            action: () => cubeViewRef.current?.scramble?.(),
          },
          {
            label: '↩️ Undo',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            action: () => cubeViewRef.current?.undo?.(),
          },
          {
            label: '🔄 Reset',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            action: () => cubeViewRef.current?.reset?.(),
          },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 600,
              color: '#fff',
              background: btn.gradient,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}
