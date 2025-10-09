"use client";

import { Suspense, useRef } from "react";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Torus, MeshDistortMaterial } from "@react-three/drei";
import { Brain, Shield, Zap, Lock, Globe, ArrowRight } from "lucide-react";
import * as THREE from "three";

// Animated 3D torus
function AnimatedTorus() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Torus args={[1, 0.4, 64, 100]} ref={meshRef}>
      <MeshDistortMaterial
        color="#10b981"
        attach="material"
        distort={0.3}
        speed={1.5}
        roughness={0.2}
        metalness={0.8}
      />
    </Torus>
  );
}

export function Features() {
  const features = [
    {
      icon: Brain,
      title: "AI Fraud Detection",
      description: "Advanced AI analyzes on-chain patterns in real-time to prevent credential fraud before issuance",
      stat: "99.9%",
      label: "Accuracy",
      color: "emerald",
    },
    {
      icon: Shield,
      title: "Soulbound NFTs",
      description: "Tamper-proof credentials as non-transferable NFTs with immutable blockchain verification",
      stat: "100%",
      label: "Secure",
      color: "cyan",
    },
    {
      icon: Zap,
      title: "Instant Verification",
      description: "Monad's 400ms blocks + Envio indexing for sub-2-second credential verification",
      stat: "<2s",
      label: "Speed",
      color: "emerald",
    },
    {
      icon: Lock,
      title: "Smart Account Delegation",
      description: "MetaMask smart accounts with time-bounded delegation for secure issuance permissions",
      stat: "Time-boxed",
      label: "Control",
      color: "cyan",
    },
    {
      icon: Globe,
      title: "Interoperable",
      description: "Standards-compliant credentials that work across platforms and ecosystems seamlessly",
      stat: "Universal",
      label: "Access",
      color: "emerald",
    },
  ];

  return (
    <section className="relative bg-black py-32 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header with 3D element */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
              <span className="text-emerald-400 font-semibold text-sm tracking-wide">Powerful Features</span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1]">
              Built for the<br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Future of Trust
              </span>
            </h2>

            <p className="text-lg text-slate-400 leading-relaxed mb-8">
              Combining AI, blockchain, and smart accounts to create the most advanced credential verification platform.
            </p>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-sm text-slate-400">Powered by Monad</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                <span className="text-sm text-slate-400">Indexed by Envio</span>
              </div>
            </div>
          </motion.div>

          {/* 3D Torus */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative h-[400px]"
          >
            <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
              <Suspense fallback={null}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <pointLight position={[-5, -5, 5]} intensity={0.5} color="#10b981" />
                <AnimatedTorus />
              </Suspense>
            </Canvas>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative"
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 ${
                feature.color === 'cyan'
                  ? 'bg-cyan-500/10'
                  : 'bg-emerald-500/10'
              } rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              {/* Card */}
              <div className={`relative h-full bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 ${
                feature.color === 'cyan'
                  ? 'hover:border-cyan-500/30'
                  : 'hover:border-emerald-500/30'
              } transition-all duration-300`}>
                {/* Icon */}
                <div className="mb-6">
                  <div className={`w-14 h-14 ${
                    feature.color === 'cyan'
                      ? 'bg-cyan-500/10 border-cyan-500/20 group-hover:bg-cyan-500/20'
                      : 'bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/20'
                  } rounded-xl flex items-center justify-center border transition-colors`}>
                    <feature.icon className={`w-7 h-7 ${
                      feature.color === 'cyan' ? 'text-cyan-400' : 'text-emerald-400'
                    }`} />
                  </div>
                </div>

                {/* Title */}
                <h3 className={`text-xl font-bold text-white mb-3 ${
                  feature.color === 'cyan'
                    ? 'group-hover:text-cyan-400'
                    : 'group-hover:text-emerald-400'
                } transition-colors`}>
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  {feature.description}
                </p>

                {/* Arrow indicator */}
                <div className={`flex items-center gap-2 ${
                  feature.color === 'cyan' ? 'text-cyan-400' : 'text-emerald-400'
                } opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <span className="text-xs font-semibold">Learn more</span>
                  <ArrowRight className="w-4 h-4" />
                </div>

                {/* Corner accent */}
                <div className="absolute bottom-0 right-0 w-24 h-24 overflow-hidden rounded-br-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className={`absolute bottom-0 right-0 w-full h-full ${
                    feature.color === 'cyan'
                      ? 'bg-cyan-500/10'
                      : 'bg-emerald-500/10'
                  }`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
