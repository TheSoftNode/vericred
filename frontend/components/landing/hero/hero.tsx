'use client'

import { Suspense, useState } from 'react'
import HeroBackground3D from './hero-background-3d'
import HeroContent from './hero-content'
import HeroVisual from './hero-visual'
import { SignInModal } from '@/components/auth/signin-modal'

export function Hero() {
  const [showSignInModal, setShowSignInModal] = useState(false)

  return (
    <>
      <section className="relative min-h-screen overflow-hidden bg-black">
        {/* 3D Animated Background */}
        <Suspense fallback={<div className="absolute inset-0 bg-black" />}>
          <HeroBackground3D />
        </Suspense>

        {/* Main Content Grid */}
        <div className="relative z-10 min-h-screen">
          <div className="mx-auto max-w-7xl flex px-4 sm:px-6 lg:px-8 h-screen">
            <div className="flex justify-between gap-12 lg:gap-64 h-full py-16 sm:py-20">
              {/* Left Side - Content */}
              <div className="flex items-center w-full lg:w-auto">
                <HeroContent onGetStarted={() => setShowSignInModal(true)} />
              </div>

              {/* Right Side - Visual */}
              <div className="hidden lg:flex items-center justify-center">
                <HeroVisual />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-20 pointer-events-none" />
      </section>

      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />
    </>
  )
}
