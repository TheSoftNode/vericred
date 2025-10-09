'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

function FloatingShields() {
  const group = useRef<THREE.Group>(null!)

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (group.current) {
      group.current.rotation.y = time * 0.05
      group.current.position.y = Math.sin(time * 0.3) * 0.2
    }

    // Rotate individual objects
    group.current.children.forEach((child, i) => {
      child.rotation.x = time * 0.2 + i
      child.rotation.y = time * 0.3 + i
    })
  })

  return (
    <group ref={group} position={[4, 0, -5]}>
      {/* Main credential shield */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial
          color="#10b981"
          emissive="#10b981"
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Smaller floating verification badges */}
      <mesh position={[-2, 1.5, 0.5]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#06b6d4"
          emissiveIntensity={0.4}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      <mesh position={[2, -1, 1]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#8b5cf6"
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      <mesh position={[1, 2, -1]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#3b82f6"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </group>
  )
}

function NetworkConnections() {
  const linesRef = useRef<THREE.Group>(null!)

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (linesRef.current) {
      linesRef.current.rotation.y = time * 0.02
    }
  })

  const nodes = useMemo(() => {
    return [
      new THREE.Vector3(-4, 2, -3),
      new THREE.Vector3(-2, -1, -4),
      new THREE.Vector3(1, 3, -5),
      new THREE.Vector3(3, 0, -3),
      new THREE.Vector3(0, -2, -6),
      new THREE.Vector3(-3, -3, -2),
    ]
  }, [])

  const lines = useMemo(() => {
    const lineGeometries = []
    for (let i = 0; i < nodes.length - 1; i++) {
      const points = [nodes[i], nodes[i + 1]]
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      lineGeometries.push(geometry)
    }
    return lineGeometries
  }, [nodes])

  return (
    <group ref={linesRef}>
      {nodes.map((pos, i) => (
        <group key={i}>
          {/* Node spheres */}
          <mesh position={[pos.x, pos.y, pos.z]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial
              color="#10b981"
              emissive="#10b981"
              emissiveIntensity={1}
            />
          </mesh>

          {/* Connection lines */}
          {i < lines.length && (
            <primitive key={`line-${i}`} object={new THREE.Line(lines[i], new THREE.LineBasicMaterial({ color: "#10b981", opacity: 0.3, transparent: true }))} />
          )}
        </group>
      ))}
    </group>
  )
}

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null!)
  const particleCount = 1500

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5
    }
    return pos
  }, [])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (pointsRef.current) {
      pointsRef.current.rotation.y = time * 0.02
    }
  })

  return (
    <Points ref={pointsRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#06b6d4"
        size={0.02}
        sizeAttenuation
        depthWrite={false}
        opacity={0.4}
      />
    </Points>
  )
}

function GlowingSphere() {
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (meshRef.current) {
      meshRef.current.rotation.x = time * 0.2
      meshRef.current.rotation.y = time * 0.3
    }
  })

  return (
    <mesh ref={meshRef} position={[-2, 3, -7]}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial
        color="#10b981"
        emissive="#10b981"
        emissiveIntensity={0.8}
        transparent
        opacity={0.6}
      />
    </mesh>
  )
}

export default function HeroBackground3D() {
  return (
    <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950">
      <Canvas camera={{ position: [0, 0, 8], fov: 65 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#10b981" />
        <pointLight position={[-10, 5, 5]} intensity={1.5} color="#06b6d4" />
        <pointLight position={[5, -5, 3]} intensity={1.2} color="#3b82f6" />
        <spotLight position={[0, 15, 5]} intensity={2} angle={0.4} penumbra={1} color="#10b981" />

        <ParticleField />
        <NetworkConnections />
        <FloatingShields />
        <GlowingSphere />
      </Canvas>

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950" />
    </div>
  )
}
