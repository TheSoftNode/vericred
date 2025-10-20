"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Award,
  Download,
  Share2,
  Eye,
  Clock,
  CheckCircle2,
  X,
  ExternalLink,
  Calendar,
  Building,
  User,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const ENVIO_GRAPHQL_URL = process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL || "http://localhost:8080/graphql";

interface Credential {
  id: string;
  tokenId: string;
  credentialType: string;
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  isRevoked: boolean;
  metadataURI: string;
}

export default function HolderDashboard() {
  const { walletAddress } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [verifierEmail, setVerifierEmail] = useState("");
  const [accessDuration, setAccessDuration] = useState(24);
  const [isGrantingAccess, setIsGrantingAccess] = useState(false);

  const stats = [
    {
      label: "My Credentials",
      value: credentials.length.toString(),
      icon: Shield,
      color: "emerald",
      change: `+${credentials.length}`,
    },
    {
      label: "Verified",
      value: credentials.filter((c) => !c.isRevoked).length.toString(),
      icon: CheckCircle2,
      color: "cyan",
      change: "100%",
    },
    {
      label: "Shared",
      value: "0",
      icon: Share2,
      color: "white",
      change: "+0",
    },
    {
      label: "Expiring Soon",
      value: "0",
      icon: Clock,
      color: "white",
      change: "0",
    },
  ];

  // Fetch credentials from MongoDB
  useEffect(() => {
    if (!walletAddress) return;

    const fetchCredentials = async () => {
      setIsLoading(true);
      try {
        // Fetch from MongoDB via our API
        const response = await fetch(`${BACKEND_URL}/api/credentials?recipient=${walletAddress}`);

        if (response.ok) {
          const data = await response.json();
          const formattedCreds = (data.credentials || []).map((c: any) => ({
            id: c.tokenId,
            tokenId: c.tokenId,
            credentialType: c.credentialType,
            issuer: c.issuerAddress,
            issuanceDate: Math.floor(new Date(c.createdAt).getTime() / 1000).toString(),
            expirationDate: undefined,
            isRevoked: c.isRevoked,
            metadataURI: c.metadataURI,
            transactionHash: c.transactionHash,
            credentialData: c.credentialData,
            recipientName: c.recipientName,
          }));
          setCredentials(formattedCreds);
        }
      } catch (error) {
        console.error("Failed to fetch credentials:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCredentials();
  }, [walletAddress]);

  // Grant time-bounded access to verifier
  const handleGrantAccess = async () => {
    if (!selectedCredential || !verifierEmail) return;

    setIsGrantingAccess(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/credentials/grant-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialId: selectedCredential.id,
          holderAddress: walletAddress,
          verifierEmail,
          durationHours: accessDuration,
        }),
      });

      if (response.ok) {
        setShowShareModal(false);
        setVerifierEmail("");
        // Show success message
      }
    } catch (error) {
      console.error("Failed to grant access:", error);
    } finally {
      setIsGrantingAccess(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <DashboardLayout userType="holder">
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              My Credentials
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              View and manage your verifiable credentials from the blockchain
            </p>
          </div>

          <button
            onClick={() => {
              /* Export all */
            }}
            className="group relative inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-black overflow-hidden transition-all duration-300"
          >
            <div
              className="absolute inset-0 bg-emerald-400 transition-all duration-300 group-hover:bg-emerald-500"
              style={{
                clipPath:
                  "polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)",
              }}
            />
            <span className="relative font-bold tracking-wide flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export All
            </span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              <div
                className={`absolute inset-0 ${
                  stat.color === "emerald"
                    ? "bg-emerald-500/10"
                    : stat.color === "cyan"
                    ? "bg-cyan-500/10"
                    : "bg-white/5"
                } rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />

              <div
                className={`relative bg-slate-950/50 backdrop-blur-xl border ${
                  stat.color === "emerald"
                    ? "border-emerald-500/20 hover:border-emerald-500/40"
                    : stat.color === "cyan"
                    ? "border-cyan-500/20 hover:border-cyan-500/40"
                    : "border-white/10 hover:border-white/20"
                } rounded-2xl p-6 transition-all duration-300`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 ${
                      stat.color === "emerald"
                        ? "bg-emerald-500/10 border-emerald-500/20"
                        : stat.color === "cyan"
                        ? "bg-cyan-500/10 border-cyan-500/20"
                        : "bg-white/5 border-white/10"
                    } rounded-xl flex items-center justify-center border`}
                  >
                    <stat.icon
                      className={`w-6 h-6 ${
                        stat.color === "emerald"
                          ? "text-emerald-400"
                          : stat.color === "cyan"
                          ? "text-cyan-400"
                          : "text-white"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-3xl font-black text-white mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-slate-400 mb-2">{stat.label}</p>
                  <p
                    className={`text-xs ${
                      stat.change.startsWith("+")
                        ? "text-emerald-400"
                        : "text-slate-500"
                    } font-medium`}
                  >
                    {stat.change}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Credentials List & Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Credentials */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">
                  Your Credentials
                </h2>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 text-xs font-medium text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/10 transition-colors">
                    All
                  </button>
                  <button className="px-3 py-1.5 text-xs font-medium text-slate-400 border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
                    Active
                  </button>
                  <button className="px-3 py-1.5 text-xs font-medium text-slate-400 border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
                    Expired
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Shield className="w-8 h-8 text-emerald-400" />
                  </motion.div>
                </div>
              ) : credentials.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Award className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-slate-400 mb-2">No credentials yet</p>
                  <p className="text-sm text-slate-500">
                    Your credentials will appear here once issued
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {credentials.map((credential) => (
                    <motion.div
                      key={credential.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 border border-white/10 hover:border-emerald-500/30 rounded-xl p-4 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Award className="w-6 h-6 text-emerald-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-white mb-1">
                              {credential.credentialType}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                              <div className="flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                <span>{shortenAddress(credential.issuer)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(credential.issuanceDate)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!credential.isRevoked ? (
                            <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                              <span className="text-xs font-semibold text-emerald-400">
                                Valid
                              </span>
                            </div>
                          ) : (
                            <div className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
                              <span className="text-xs font-semibold text-red-400">
                                Revoked
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const frameUrl = `${window.location.origin}/api/frames/verify/${credential.tokenId}`;
                              const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(`Just received my ${credential.credentialType} credential! 🎓\n\nVerify it here:`)}&embeds[]=${encodeURIComponent(frameUrl)}`;
                              window.open(farcasterUrl, '_blank');
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-all text-xs font-medium"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            Share on Farcaster
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedCredential(credential);
                              setShowShareModal(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-all text-xs font-medium"
                          >
                            <Share2 className="w-3 h-3" />
                            Grant Access
                          </button>
                          <button
                            onClick={() => window.open(`https://ipfs.io/ipfs/${credential.metadataURI.replace('ipfs://', '')}`, '_blank')}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg transition-all text-xs font-medium"
                          >
                            <Eye className="w-3 h-3" />
                            View IPFS
                          </button>
                          <a
                            href={`https://testnet.monadexplorer.com/tx/${(credential as any).transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg transition-all"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h2 className="text-lg font-bold text-white mb-6">
                Quick Actions
              </h2>

              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 rounded-xl transition-all group text-left">
                  <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <Eye className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">View All</p>
                    <p className="text-xs text-slate-500">See credentials</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 rounded-xl transition-all group text-left">
                  <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                    <Share2 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Share</p>
                    <p className="text-xs text-slate-500">Grant access</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all group text-left">
                  <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <Download className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Download</p>
                    <p className="text-xs text-slate-500">Export as PDF</p>
                  </div>
                </button>
              </div>
            </motion.div>

            {/* Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h2 className="text-lg font-bold text-white mb-6">
                Recent Activity
              </h2>

              <div className="space-y-4">
                {credentials.length > 0 ? (
                  credentials.slice(0, 3).map((cred, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-white font-medium">
                          Received {cred.credentialType}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDate(cred.issuanceDate)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-slate-500">No activity yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Share Access Modal */}
      <AnimatePresence>
        {showShareModal && selectedCredential && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowShareModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-slate-950 border border-white/10 rounded-2xl p-6 max-w-lg w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white">
                  Grant Time-Bounded Access
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                  <p className="text-sm text-cyan-400 mb-2">
                    🔐 Grant temporary access to: {selectedCredential.credentialType}
                  </p>
                  <p className="text-xs text-slate-400">
                    Using MetaMask Delegation - revocable anytime
                  </p>
                </div>

                {/* Verifier Email */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Verifier Email
                  </label>
                  <input
                    type="email"
                    value={verifierEmail}
                    onChange={(e) => setVerifierEmail(e.target.value)}
                    placeholder="verifier@company.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/40 transition-colors"
                  />
                </div>

                {/* Access Duration */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Access Duration (Hours)
                  </label>
                  <input
                    type="number"
                    value={accessDuration}
                    onChange={(e) => setAccessDuration(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/40 transition-colors"
                  />
                </div>

                {/* Grant Button */}
                <button
                  onClick={handleGrantAccess}
                  disabled={!verifierEmail || isGrantingAccess}
                  className="w-full group relative inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-black overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div
                    className="absolute inset-0 bg-cyan-400 transition-all duration-300 group-hover:bg-cyan-500"
                    style={{
                      clipPath:
                        "polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)",
                    }}
                  />
                  <span className="relative font-bold tracking-wide flex items-center justify-center gap-2">
                    {isGrantingAccess ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          <Share2 className="w-4 h-4" />
                        </motion.div>
                        Granting...
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        Grant Access
                      </>
                    )}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
