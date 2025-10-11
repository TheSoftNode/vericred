"use client";

import { Suspense, useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import * as THREE from "three";
import { SignInModal } from "@/components/auth/signin-modal";

// Floating credential badges (cubes)
function FloatingBadges() {
  const group = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = time * 0.05;
      group.current.position.y = Math.sin(time * 0.3) * 0.2;
    }

    group.current.children.forEach((child, i) => {
      child.rotation.x = time * 0.2 + i;
      child.rotation.y = time * 0.3 + i;
    });
  });

  return (
    <group ref={group} position={[-4, 0, -5]}>
      {/* Main emerald cube */}
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

      {/* Cyan cube */}
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

      {/* Smaller cubes */}
      <mesh position={[2, -1, 1]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#10b981"
          emissive="#10b981"
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      <mesh position={[1, 2, -1]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#06b6d4"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

// Network connections with lines
function NetworkConnections() {
  const linesRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (linesRef.current) {
      linesRef.current.rotation.y = time * 0.02;
    }
  });

  const nodes = useMemo(() => {
    return [
      new THREE.Vector3(-4, 2, -3),
      new THREE.Vector3(-2, -1, -4),
      new THREE.Vector3(1, 3, -5),
      new THREE.Vector3(3, 0, -3),
      new THREE.Vector3(0, -2, -6),
      new THREE.Vector3(-3, -3, -2),
    ];
  }, []);

  const lines = useMemo(() => {
    const lineGeometries = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const points = [nodes[i], nodes[i + 1]];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      lineGeometries.push(geometry);
    }
    return lineGeometries;
  }, [nodes]);

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
            <primitive
              key={`line-${i}`}
              object={
                new THREE.Line(
                  lines[i],
                  new THREE.LineBasicMaterial({
                    color: "#10b981",
                    opacity: 0.3,
                    transparent: true,
                  })
                )
              }
            />
          )}
        </group>
      ))}
    </group>
  );
}

// Particle field
function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null!);
  const particleCount = 1500;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
    }
    return pos;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = time * 0.02;
    }
  });

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
  );
}

// Glowing sphere
function GlowingSphere() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.x = time * 0.2;
      meshRef.current.rotation.y = time * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} position={[2, 3, -7]}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial
        color="#10b981"
        emissive="#10b981"
        emissiveIntensity={0.8}
        transparent
        opacity={0.6}
      />
    </mesh>
  );
}

export function CTA() {
  const [showSignInModal, setShowSignInModal] = useState(false);

  const features = [
    "AI Fraud Detection",
    "Instant Verification",
    "Passkey Authentication",
    "Blockchain Secured",
  ];

  return (
    <>
      <section className="relative overflow-hidden flex items-center">
        {/* 3D Background - Matching Hero */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950">
          <Canvas camera={{ position: [0, 0, 8], fov: 65 }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.3} />
              <pointLight position={[10, 10, 10]} intensity={2} color="#10b981" />
              <pointLight position={[-10, 5, 5]} intensity={1.5} color="#06b6d4" />
              <pointLight position={[5, -5, 3]} intensity={1.2} color="#3b82f6" />
              <spotLight
                position={[0, 15, 5]}
                intensity={2}
                angle={0.4}
                penumbra={1}
                color="#10b981"
              />

              <ParticleField />
              <NetworkConnections />
              <FloatingBadges />
              <GlowingSphere />
            </Suspense>
          </Canvas>

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - 3D Visual Space */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative h-[400px] flex items-center justify-center"
            >
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Glow effect behind card */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
                </div>

                {/* Large Badge Visual */}
                <motion.div
                  className="relative"
                  animate={{
                    rotateY: [0, 5, 0, -5, 0],
                    rotateX: [0, 2, 0, -2, 0]
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Main card with shimmer effect */}
                  <div className="w-72 h-72 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-3xl border border-white/10 backdrop-blur-xl p-8 flex flex-col items-center justify-center space-y-6 relative overflow-hidden shadow-2xl shadow-emerald-500/20">
                    {/* Shimmer overlay */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{ x: [-250, 250] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
                    />

                    <motion.div
                      className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center relative z-10 shadow-lg shadow-emerald-500/50"
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, 0, -5, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      <Sparkles className="w-10 h-10 text-white" />
                    </motion.div>

                    <div className="text-center relative z-10">
                      <div className="text-3xl font-black text-white mb-2">VeriCred+</div>
                      <div className="text-sm text-emerald-400 font-bold tracking-wider">CREDENTIAL SYSTEM</div>
                    </div>

                    <div className="flex gap-2 relative z-10">
                      <motion.div
                        className="w-2 h-2 bg-emerald-400 rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-cyan-400 rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-emerald-400 rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                      />
                    </div>
                  </div>

                  {/* Floating badges around - with more dynamic animations */}
                  <motion.div
                    animate={{
                      y: [-8, 8, -8],
                      rotate: [-2, 2, -2]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute -top-4 -right-4 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full backdrop-blur-xl shadow-lg shadow-emerald-500/20"
                  >
                    <span className="text-xs text-emerald-400 font-bold">AI Powered</span>
                  </motion.div>

                  <motion.div
                    animate={{
                      y: [8, -8, 8],
                      rotate: [2, -2, 2]
                    }}
                    transition={{ duration: 3.5, repeat: Infinity }}
                    className="absolute -bottom-4 -left-4 px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/30 rounded-full backdrop-blur-xl shadow-lg shadow-cyan-500/20"
                  >
                    <span className="text-xs text-cyan-400 font-bold">Blockchain</span>
                  </motion.div>

                  <motion.div
                    animate={{
                      x: [-8, 8, -8],
                      rotate: [2, -2, 2]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute top-1/2 -right-10 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full backdrop-blur-xl shadow-lg"
                  >
                    <span className="text-xs text-white font-bold">Secure</span>
                  </motion.div>

                  {/* Additional floating verification badges */}
                  <motion.div
                    animate={{
                      y: [-6, 6, -6],
                      x: [-3, 3, -3]
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute -left-8 top-1/4 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full backdrop-blur-xl"
                  >
                    <span className="text-xs text-emerald-400 font-bold">✓ Verified</span>
                  </motion.div>

                  <motion.div
                    animate={{
                      y: [6, -6, 6],
                      x: [3, -3, 3]
                    }}
                    transition={{ duration: 4.5, repeat: Infinity }}
                    className="absolute -right-6 bottom-1/4 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full backdrop-blur-xl"
                  >
                    <span className="text-xs text-cyan-400 font-bold">Instant</span>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right Side - Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="inline-block mb-6"
              >
                <div className="px-5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full backdrop-blur-sm">
                  <span className="text-emerald-400 font-bold text-xs tracking-wider uppercase">
                    Ready to Start?
                  </span>
                </div>
              </motion.div>

              {/* Main Heading */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-[1.1]"
              >
                Issue Your First
                <br />
                <span className="text-emerald-400">Verifiable Credential</span>
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-base md:text-lg text-slate-400 mb-6 leading-relaxed"
              >
                Join the future of tamper-proof credentials with AI-powered fraud
                detection, instant verification, and passkey authentication.
              </motion.p>

              {/* Features List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex flex-wrap gap-3 mb-6"
              >
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm hover:border-emerald-500/30 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-slate-300 font-medium">
                      {feature}
                    </span>
                  </div>
                ))}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-3 mb-6"
              >
                <button
                  onClick={() => setShowSignInModal(true)}
                  className="group relative inline-flex items-center justify-center px-8 py-3 text-sm font-semibold text-black overflow-hidden transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-emerald-400 transition-all duration-300 group-hover:bg-emerald-500 group-hover:shadow-2xl group-hover:shadow-emerald-500/30"
                    style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)' }}
                  />
                  <span className="relative font-bold tracking-wide flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Get Started Free
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                <button className="group relative inline-flex items-center justify-center px-8 py-3 text-sm font-semibold text-white overflow-hidden transition-all duration-300">
                  <div className="absolute inset-0 bg-white/5 hover:bg-white/10 border border-white/20 group-hover:border-cyan-500/40 transition-all duration-300 backdrop-blur-sm"
                    style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)' }}
                  />
                  <span className="relative font-bold tracking-wide">
                    View Documentation
                  </span>
                </button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-wrap gap-4 text-slate-500 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"
                    style={{ animationDelay: "0.5s" }}
                  />
                  <span>Free tier forever</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"
                    style={{ animationDelay: "1s" }}
                  />
                  <span>Setup in 15 seconds</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-10" />
      </section>

      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />
    </>
  );
}
