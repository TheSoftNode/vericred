"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Home,
  FileText,
  Shield,
  Settings,
  LogOut,
  ChevronLeft,
  User,
  Bell,
  Search,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: "issuer" | "holder" | "verifier";
}

export function DashboardLayout({ children, userType }: DashboardLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { walletAddress, disconnect } = useAuth();

  const handleLogout = () => {
    disconnect();
    router.push("/");
  };

  const navigation = {
    issuer: [
      { name: "Dashboard", href: "/issuer/dashboard", icon: Home },
      { name: "Issue Credentials", href: "/issuer/issue", icon: FileText },
      { name: "Issued Credentials", href: "/issuer/credentials", icon: Shield },
      { name: "Settings", href: "/issuer/settings", icon: Settings },
    ],
    holder: [
      { name: "Dashboard", href: "/holder/dashboard", icon: Home },
      { name: "My Credentials", href: "/holder/credentials", icon: Shield },
      { name: "Requests", href: "/holder/requests", icon: FileText },
      { name: "Settings", href: "/holder/settings", icon: Settings },
    ],
    verifier: [
      { name: "Dashboard", href: "/verifier/dashboard", icon: Home },
      { name: "Verify Credentials", href: "/verifier/verify", icon: Shield },
      { name: "History", href: "/verifier/history", icon: FileText },
      { name: "Settings", href: "/verifier/settings", icon: Settings },
    ],
  };

  const navItems = navigation[userType];

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden lg:flex flex-col border-r border-white/10 bg-slate-950/50 backdrop-blur-xl relative"
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
            <motion.div
              animate={{ opacity: sidebarOpen ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              {sidebarOpen && (
                <>
                  <span className="text-2xl">🛡️</span>
                  <span className="text-lg font-black text-white">VeriCred+</span>
                </>
              )}
            </motion.div>

            {!sidebarOpen && (
              <span className="text-2xl">🛡️</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group"
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <motion.span
                animate={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? "auto" : 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium overflow-hidden whitespace-nowrap"
              >
                {item.name}
              </motion.span>
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <motion.span
              animate={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? "auto" : 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-medium overflow-hidden whitespace-nowrap"
            >
              Logout
            </motion.span>
          </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-24 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white hover:bg-emerald-600 transition-colors shadow-lg"
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform ${!sidebarOpen ? "rotate-180" : ""}`}
          />
        </button>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed inset-y-0 left-0 w-72 bg-slate-950 border-r border-white/10 z-50 lg:hidden flex flex-col"
            >
              {/* Logo */}
              <div className="h-20 flex items-center justify-between px-6 border-b border-white/10">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <span className="text-2xl">🛡️</span>
                  <span className="text-lg font-black text-white">VeriCred+</span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                ))}
              </nav>

              {/* User Section */}
              <div className="p-4 border-t border-white/10">
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-20 border-b border-white/10 bg-slate-950/50 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Search Bar */}
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl w-64 lg:w-80">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full" />
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-3 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold">
                  {walletAddress ? walletAddress.slice(2, 4).toUpperCase() : "0x"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-xs text-slate-400 capitalize">{userType}</p>
                <p className="text-xs font-mono text-white">
                  {walletAddress ? shortenAddress(walletAddress) : "0x0000...0000"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
