'use client'

import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'

interface HeroContentProps {
  onGetStarted: () => void
}

export default function HeroContent({ onGetStarted }: HeroContentProps) {
  return (
    <div className="flex flex-col justify-center h-full space-y-6 sm:space-y-8">
      {/* Main Heading */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-2"
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-[-0.02em]">
          <span className="block text-white/90 font-light mb-1">Tamper-Proof Credentials</span>
          <span className="block text-white font-black">AI-Powered Verification</span>
        </h1>
      </motion.div>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="text-sm sm:text-base md:text-lg text-slate-400 max-w-xl leading-relaxed font-normal"
      >
        Issue verifiable credentials with AI fraud detection.
        Verify instantly on Monad blockchain. Build trust in the Web3 credential economy—securely.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row gap-3 pt-2"
      >
        {/* Primary Button - Hexagon style */}
        <button
          onClick={onGetStarted}
          className="group relative inline-flex items-center justify-center px-7 py-4 text-[15px] font-medium text-black overflow-hidden transition-all duration-300"
        >
          {/* Hexagon shape using clip-path */}
          <div className="absolute inset-0 bg-emerald-400 transition-all duration-300 group-hover:bg-emerald-500"
            style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}
          />

          {/* Shine effect */}
          <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}
          />

          {/* Shadow glow */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 blur-xl bg-emerald-400/60 transition-opacity duration-300 -z-10" />

          {/* Content */}
          <span className="relative flex items-center gap-2 font-semibold tracking-wide">
            <Sparkles className="w-4 h-4" />
            Issue Credentials
          </span>
        </button>

        {/* Secondary Button - Angular style */}
        <button className="group relative inline-flex items-center justify-center px-7 py-4 text-[15px] font-medium text-white transition-all duration-300">
          {/* Angular cut corners */}
          <div className="absolute inset-0 bg-white/10 group-hover:bg-white/15 transition-colors duration-300"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
          />

          {/* Inner layer */}
          <div className="absolute inset-[1.5px] bg-slate-950/40 backdrop-blur-md group-hover:bg-slate-900/40 transition-colors duration-300"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
          />

          {/* Shine */}
          <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Content */}
          <span className="relative flex items-center gap-2 tracking-wide">
            Verify Credentials
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </button>
      </motion.div>
    </div>
  )
}
