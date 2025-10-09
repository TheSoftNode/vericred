"use client";

import { Suspense, useRef } from "react";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, MeshDistortMaterial } from "@react-three/drei";
import { Shield, Zap, Fingerprint } from "lucide-react";
import * as THREE from "three";

// Animated 3D sphere
function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.15;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <Sphere args={[1, 100, 200]} scale={1.5} ref={meshRef}>
      <MeshDistortMaterial
        color="#10b981"
        attach="material"
        distort={0.3}
        speed={1.5}
        roughness={0.1}
        metalness={0.9}
      />
    </Sphere>
  );
}

export function ProblemSolution() {
  const features = [
    {
      icon: Shield,
      title: "AI Fraud Detection",
      metric: "99.9%",
      description: "AI analyzes on-chain patterns to prevent credential fraud before issuance",
    },
    {
      icon: Zap,
      title: "Instant Verification",
      metric: "<2s",
      description: "Monad's 400ms blocks + Envio indexing for real-time credential verification",
    },
    {
      icon: Fingerprint,
      title: "Passkey Authentication",
      metric: "Face ID",
      description: "Biometric sign-in with smart accounts—no wallet complexity needed",
    },
  ];

  return (
    <section className="relative bg-black py-24 overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: 3D Visual */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative h-[500px]">
              <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
                <Suspense fallback={null}>
                  <ambientLight intensity={0.4} />
                  <directionalLight position={[5, 5, 5]} intensity={1.2} />
                  <pointLight position={[-5, -5, -5]} intensity={0.5} color="#10b981" />
                  <AnimatedSphere />
                  <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate
                    autoRotateSpeed={0.5}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 1.5}
                  />
                </Suspense>
              </Canvas>

              {/* Floating stats around sphere */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="absolute top-20 right-0 px-4 py-2 bg-slate-950/80 backdrop-blur-xl border border-emerald-500/30 rounded-xl"
              >
                <div className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  $16B
                </div>
                <div className="text-xs text-slate-400">Fraud prevented</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="absolute bottom-32 left-0 px-4 py-2 bg-slate-950/80 backdrop-blur-xl border border-emerald-500/30 rounded-xl"
              >
                <div className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  &lt;2s
                </div>
                <div className="text-xs text-slate-400">Verification</div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
              <span className="text-emerald-400 font-semibold text-sm tracking-wide">Why VeriCred+</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-[1.1]">
              Tamper-Proof Credentials.<br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                AI-Powered Trust.
              </span>
            </h2>

            <p className="text-lg text-slate-400 mb-12 leading-relaxed">
              Traditional verification takes weeks and costs billions in fraud. VeriCred+ uses AI, MetaMask smart accounts,
              and Monad blockchain to verify credentials instantly—with zero complexity.
            </p>

            {/* Features list */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex gap-4 group"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-emerald-400" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                      <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs font-bold text-emerald-400">
                        {feature.metric}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
