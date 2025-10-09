"use client"

import { useState, useEffect } from 'react'
import { Menu, LogOut, LayoutDashboard, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SignInModal } from '@/components/auth/signin-modal'
import { useAuth } from '@/lib/auth/auth-context'

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [copied, setCopied] = useState(false)
  const { isAuthenticated, walletAddress, userType, disconnect } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getDashboardRoute = () => {
    switch (userType) {
      case 'issuer': return '/issuer/dashboard'
      case 'holder': return '/holder/dashboard'
      case 'verifier': return '/verifier/dashboard'
      default: return '/dashboard'
    }
  }

  const copyAddress = async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
  ]

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-slate-950/70 backdrop-blur-xl border-b border-white/10'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer">
              <span className="text-2xl">🛡️</span>
              <span className="text-xl font-black text-white tracking-tight">
                VeriCred+
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-slate-300 hover:text-white transition-colors font-medium text-sm tracking-wide relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 group-hover:w-full transition-all duration-300" />
                </a>
              ))}
            </div>

            {/* Right Side */}
            <div className="hidden md:flex items-center gap-3">
              {!isAuthenticated ? (
                /* Connect Wallet with hexagon style */
                <button
                  onClick={() => setShowAuth(true)}
                  className="group relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-black overflow-hidden transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-emerald-400 transition-all duration-300 group-hover:bg-emerald-500"
                    style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)' }}
                  />
                  <span className="relative font-bold tracking-wide">
                    Connect Wallet
                  </span>
                </button>
              ) : (
                /* Connected Wallet Display */
                <>
                  {/* Wallet Address Badge */}
                  <button
                    onClick={copyAddress}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm hover:border-emerald-500/40 hover:bg-white/10 transition-all group"
                  >
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-white font-mono text-xs">
                      {walletAddress ? shortenAddress(walletAddress) : '0x0000...0000'}
                    </span>
                    {copied ? (
                      <Check className="h-3 w-3 text-emerald-400 animate-in fade-in zoom-in" />
                    ) : (
                      <Copy className="h-3 w-3 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                    )}
                  </button>

                  {/* User Avatar Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="relative group outline-none">
                        <Avatar className="cursor-pointer ring-2 ring-white/20 hover:ring-emerald-500/40 transition-all duration-300 w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold">
                            {walletAddress ? walletAddress.slice(2, 4).toUpperCase() : '0x'}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 bg-slate-950/95 backdrop-blur-xl border border-white/10 text-white"
                    >
                      <div className="px-3 py-2">
                        <p className="text-xs text-slate-400">Connected as</p>
                        <button
                          onClick={copyAddress}
                          className="flex items-center gap-2 mt-1 hover:bg-white/5 px-2 py-1 rounded transition-all group w-full"
                        >
                          <p className="text-sm font-mono font-semibold text-emerald-400">
                            {walletAddress ? shortenAddress(walletAddress) : '0x0000...0000'}
                          </p>
                          {copied ? (
                            <Check className="h-3 w-3 text-emerald-400 animate-in fade-in zoom-in" />
                          ) : (
                            <Copy className="h-3 w-3 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                          )}
                        </button>
                        {userType && (
                          <p className="text-xs text-slate-500 capitalize mt-1 px-2">{userType}</p>
                        )}
                      </div>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        className="cursor-pointer focus:bg-white/5 focus:text-white"
                        onClick={() => window.location.href = getDashboardRoute()}
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        className="cursor-pointer focus:bg-red-500/10 focus:text-red-400"
                        onClick={disconnect}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-white hover:text-emerald-400">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950 backdrop-blur-xl border-l border-emerald-500/20 w-[300px] p-6">
                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950/80 pointer-events-none z-0" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent pointer-events-none z-0" />

                {/* Subtle animated glow */}
                <div className="absolute top-1/4 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl animate-pulse pointer-events-none z-0" />
                <div className="absolute bottom-1/3 -left-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl animate-pulse pointer-events-none z-0" style={{ animationDelay: '1s' }} />
                <div className="relative flex flex-col gap-8 mt-8 h-full z-10">
                  {/* Mobile Wallet Status */}
                  {isAuthenticated && walletAddress && (
                    <button
                      onClick={copyAddress}
                      className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/20 hover:border-emerald-500/40 hover:bg-white/10 rounded-xl transition-all group"
                    >
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-white font-mono text-xs flex-1">{shortenAddress(walletAddress)}</span>
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-400 animate-in fade-in zoom-in" />
                      ) : (
                        <Copy className="h-4 w-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                      )}
                    </button>
                  )}

                  {/* Mobile Links */}
                  <div className="flex flex-col gap-1">
                    {navLinks.map((link) => (
                      <a
                        key={link.name}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="text-slate-300 hover:text-white hover:bg-white/5 transition-all font-semibold text-base px-4 py-3 rounded-lg"
                      >
                        {link.name}
                      </a>
                    ))}
                  </div>

                  {/* Mobile Connect Wallet */}
                  <Button
                    onClick={() => {
                      setShowAuth(true)
                      setIsOpen(false)
                    }}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl py-6 text-sm"
                  >
                    {isAuthenticated ? 'Connected' : 'Connect Wallet'}
                  </Button>

                  {/* Mobile User - Only show if connected */}
                  {isAuthenticated && walletAddress && (
                    <div className="pt-6 border-t border-white/10 mt-auto space-y-3">
                      <a href={getDashboardRoute()} className="flex items-center gap-4 hover:bg-white/5 rounded-lg p-3 transition-all">
                        <Avatar className="ring-2 ring-emerald-500/30 w-12 h-12">
                          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-base">
                            {walletAddress.slice(2, 4).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold text-white">Dashboard</p>
                          <p className="text-xs text-slate-400 mt-0.5">View your credentials</p>
                        </div>
                      </a>
                      <button
                        onClick={() => {
                          disconnect()
                          setIsOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-all font-semibold text-sm"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Sign In Modal */}
      <SignInModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
      />
    </>
  )
}
