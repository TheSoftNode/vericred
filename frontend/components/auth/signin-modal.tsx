"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, X, Fingerprint, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, UserType } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const [userType, setUserType] = useState<UserType>(null);
  const [error, setError] = useState<string | null>(null);
  const { connectMetaMask, connectPasskey, isLoading } = useAuth();
  const router = useRouter();

  const handlePasskeySignIn = async () => {
    if (!userType) return;
    setError(null);

    try {
      await connectPasskey(userType);
      onClose();
      // Route to appropriate dashboard
      router.push(getDashboardRoute(userType));
    } catch (err: any) {
      setError(err.message || "Passkey authentication failed");
    }
  };

  const handleMetaMaskConnect = async () => {
    if (!userType) return;
    setError(null);

    try {
      await connectMetaMask(userType);
      onClose();
      // Route to appropriate dashboard
      router.push(getDashboardRoute(userType));
    } catch (err: any) {
      setError(err.message || "MetaMask connection failed");
    }
  };

  const getDashboardRoute = (type: UserType): string => {
    switch (type) {
      case 'issuer':
        return '/issuer/dashboard';
      case 'holder':
        return '/holder/dashboard';
      case 'verifier':
        return '/verifier/dashboard';
      default:
        return '/dashboard';
    }
  };

  const resetModal = () => {
    setUserType(null);
    setError(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800 text-white p-0 overflow-hidden">
        <div className="relative">
          {/* Close Button */}
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-50"
          >
            <X className="h-4 w-4 text-slate-400" />
            <span className="sr-only">Close</span>
          </button>

          <div className="p-8">
            {/* Header */}
            <DialogHeader className="mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                  <Shield className="w-7 h-7 text-white" />
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold text-center text-white">
                {userType ? `Sign in as ${userType.charAt(0).toUpperCase() + userType.slice(1)}` : "Connect to VeriCred+"}
              </DialogTitle>
              <p className="text-center text-slate-400 text-sm mt-2">
                {userType
                  ? "Choose your preferred authentication method"
                  : "Sign in to start your credential journey"
                }
              </p>
            </DialogHeader>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400 text-center">{error}</p>
              </div>
            )}

            <AnimatePresence mode="wait">
              {!userType ? (
                // User Type Selection
                <motion.div
                  key="user-type-selection"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  <Button
                    onClick={() => setUserType("issuer")}
                    disabled={isLoading}
                    className="w-full h-14 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-white justify-start px-6 text-base font-medium rounded-xl transition-all duration-200"
                  >
                    <Shield className="w-5 h-5 mr-3 text-emerald-400" />
                    I'm an Issuer
                    <span className="ml-auto text-xs text-slate-400">Universities, Institutions</span>
                  </Button>

                  <Button
                    onClick={() => setUserType("holder")}
                    disabled={isLoading}
                    className="w-full h-14 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-white justify-start px-6 text-base font-medium rounded-xl transition-all duration-200"
                  >
                    <Fingerprint className="w-5 h-5 mr-3 text-blue-400" />
                    I'm a Credential Holder
                    <span className="ml-auto text-xs text-slate-400">Students, Graduates</span>
                  </Button>

                  <Button
                    onClick={() => setUserType("verifier")}
                    disabled={isLoading}
                    className="w-full h-14 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-white justify-start px-6 text-base font-medium rounded-xl transition-all duration-200"
                  >
                    <Shield className="w-5 h-5 mr-3 text-purple-400" />
                    I'm a Verifier
                    <span className="ml-auto text-xs text-slate-400">HR, Employers</span>
                  </Button>
                </motion.div>
              ) : (
                // Authentication Methods
                <motion.div
                  key="auth-methods"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Back Button */}
                  <button
                    onClick={resetModal}
                    disabled={isLoading}
                    className="text-sm text-slate-400 hover:text-white transition-colors mb-2 disabled:opacity-50"
                  >
                    ← Change user type
                  </button>

                  {/* Passkey Sign-In (for holders and issuers) */}
                  {(userType === "holder" || userType === "issuer") && (
                    <Button
                      onClick={handlePasskeySignIn}
                      disabled={isLoading}
                      className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <Fingerprint className="w-5 h-5 mr-2" />
                      )}
                      Sign in with Passkey
                    </Button>
                  )}

                  {/* MetaMask Connect Divider (only show if passkey is available) */}
                  {(userType === "holder" || userType === "issuer") && (
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-700"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-slate-900 px-2 text-slate-400">OR</span>
                      </div>
                    </div>
                  )}

                  {/* MetaMask Connect (all users) */}
                  <Button
                    onClick={handleMetaMaskConnect}
                    disabled={isLoading}
                    className="w-full h-12 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 40 40" fill="none">
                        <path d="M37.2 3.8L22.5 14.5l2.7-6.4 12-4.3z" fill="#E17726" stroke="#E17726" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2.8 3.8l14.5 10.9-2.5-6.6-12-4.3zM31.8 28.3l-3.9 6 8.4 2.3 2.4-8.1-6.9-.2zM1.3 28.5l2.4 8.1 8.4-2.3-3.9-6-6.9.2z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M11.6 17.2l-2.2 3.4 8.3.4-.3-8.9-5.8 5.1zM28.4 17.2l-5.9-5.3-.2 9.1 8.3-.4-2.2-3.4zM12.1 34.3l5-2.4-4.3-3.4-.7 5.8zM22.9 31.9l5 2.4-.7-5.8-4.3 3.4z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    Connect MetaMask
                  </Button>

                  {/* Additional Info */}
                  <div className="mt-6 pt-4 border-t border-slate-800">
                    <p className="text-xs text-slate-500 text-center leading-relaxed">
                      By connecting, you agree to our{" "}
                      <a href="#" className="text-emerald-400 hover:underline">Terms of Service</a>
                      {" "}and{" "}
                      <a href="#" className="text-emerald-400 hover:underline">Privacy Policy</a>.
                      {" "}Your wallet is non-custodial and secured by{" "}
                      <span className="text-white font-medium">MetaMask</span>.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
