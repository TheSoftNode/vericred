'use client'

import { motion } from 'framer-motion'
import { GraduationCap, Building2, FileCheck, Award, Shield } from 'lucide-react'

const credentialTypes = [
  {
    name: 'Universities',
    icon: GraduationCap,
    description: 'Academic Credentials',
    color: 'from-blue-500 to-cyan-500',
    glow: 'shadow-cyan-500/20'
  },
  {
    name: 'Professional',
    icon: Award,
    description: 'Career Certificates',
    color: 'from-emerald-500 to-teal-500',
    glow: 'shadow-emerald-500/20'
  },
  {
    name: 'Government',
    icon: Building2,
    description: 'Official Documents',
    color: 'from-slate-400 to-slate-600',
    glow: 'shadow-slate-500/20'
  },
  {
    name: 'Healthcare',
    icon: Shield,
    description: 'Medical Certifications',
    color: 'from-purple-500 to-pink-500',
    glow: 'shadow-purple-500/20'
  },
  {
    name: 'Verification',
    icon: FileCheck,
    description: 'Identity Proofs',
    color: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/20'
  },
]

export default function HeroVisual() {
  return (
    <div className="relative flex items-center justify-center h-full w-full">
      {/* Diagonal stacked cards layout - compact */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative flex flex-col gap-2"
      >
        {credentialTypes.map((credential, index) => {
          const Icon = credential.icon
          const isEven = index % 2 === 0

          return (
            <motion.div
              key={credential.name}
              initial={{ opacity: 0, x: isEven ? -50 : 50, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.3 + index * 0.1,
                ease: [0.16, 1, 0.3, 1]
              }}
              whileHover={{ scale: 1.03, x: isEven ? -5 : 5 }}
              className="group relative"
              style={{ marginLeft: isEven ? '0' : '50px' }}
            >
              {/* Angular card with cut corners - smaller */}
              <div
                className={`relative bg-slate-900/50 backdrop-blur-2xl border border-white/20 px-3 py-2.5 shadow-2xl ${credential.glow} group-hover:border-white/40 transition-all duration-300 w-[240px]`}
                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
              >
                {/* Gradient overlay on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${credential.color} opacity-0 group-hover:opacity-15 transition-opacity duration-300`}
                  style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                />

                {/* Content */}
                <div className="relative flex items-center gap-3">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${credential.color} shadow-lg flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      {credential.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      {credential.description}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${credential.color} flex items-center justify-center`}>
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-0.5 bg-slate-800/50 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${credential.color}`}
                      initial={{ width: '0%' }}
                      whileInView={{ width: `${30 + index * 10}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 font-medium">Active</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
