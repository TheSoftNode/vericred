"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Activity,
  Clock,
  ScanLine,
  ExternalLink,
  ChevronRight,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

// Environment variables
const ENVIO_GRAPHQL_URL = process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL || "http://localhost:8080/v1/graphql";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

interface Credential {
  id: string;
  tokenId: string;
  credentialType: string;
  issuer: string;
  recipient: string;
  issuanceDate: string;
  expirationDate?: string;
  isRevoked: boolean;
  metadataURI?: string;
}

interface VerificationRecord {
  id: string;
  credentialId: string;
  credential?: Credential;
  verifiedAt: string;
  status: "valid" | "invalid" | "expired" | "revoked";
}

export default function VerifierDashboard() {
  const { walletAddress } = useAuth();

  // State
  const [credentialId, setCredentialId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    credential: Credential;
    status: "valid" | "invalid" | "expired" | "revoked";
    message: string;
  } | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState<VerificationRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    valid: 0,
    invalid: 0,
    pending: 0,
    successRate: 0,
  });

  // Fetch verification history on mount
  useEffect(() => {
    if (!walletAddress) return;
    fetchVerificationHistory();
  }, [walletAddress]);

  // Calculate stats when history changes
  useEffect(() => {
    const total = verificationHistory.length;
    const valid = verificationHistory.filter((v) => v.status === "valid").length;
    const invalid = verificationHistory.filter((v) => v.status === "invalid" || v.status === "revoked").length;
    const pending = 0; // Can be expanded later for async verifications
    const successRate = total > 0 ? Math.round((valid / total) * 100) : 0;

    setStats({ total, valid, invalid, pending, successRate });
  }, [verificationHistory]);

  const fetchVerificationHistory = async () => {
    setIsLoadingHistory(true);
    try {
      // In a real implementation, you'd fetch verification history from your backend
      // For now, we'll keep it empty
      const response = await fetch(`${BACKEND_URL}/api/verifications/history?verifier=${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        setVerificationHistory(data.verifications || []);
      }
    } catch (error) {
      console.error("Failed to fetch verification history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const verifyCredential = async () => {
    if (!credentialId.trim()) return;

    setIsVerifying(true);
    try {
      // Query MongoDB for credential data
      const response = await fetch(`${BACKEND_URL}/api/credentials/verify/${credentialId}`);

      if (!response.ok) {
        setVerificationResult({
          credential: null as any,
          status: "invalid",
          message: "Credential not found on blockchain",
        });
        setShowResultModal(true);
        setIsVerifying(false);
        return;
      }

      const data = await response.json();

      if (!data.credential) {
        setVerificationResult({
          credential: null as any,
          status: "invalid",
          message: "Credential not found",
        });
        setShowResultModal(true);
        setIsVerifying(false);
        return;
      }

      const credential = {
        id: data.credential.tokenId,
        tokenId: data.credential.tokenId,
        credentialType: data.credential.credentialType,
        issuer: data.credential.issuerAddress,
        recipient: data.credential.recipientAddress,
        issuanceDate: new Date(data.credential.createdAt).getTime().toString(),
        isRevoked: data.credential.isRevoked,
        metadataURI: data.credential.metadataURI,
      };

      // Step 2: Verify credential validity
      let status: "valid" | "invalid" | "expired" | "revoked" = "valid";
      let message = "Credential is valid and verified on blockchain";

      if (credential.isRevoked) {
        status = "revoked";
        message = "This credential has been revoked by the issuer";
      } else if (credential.expirationDate) {
        const expiryDate = new Date(parseInt(credential.expirationDate) * 1000);
        if (expiryDate < new Date()) {
          status = "expired";
          message = `Credential expired on ${expiryDate.toLocaleDateString()}`;
        }
      }

      setVerificationResult({ credential, status, message });
      setShowResultModal(true);

      // Step 3: Log verification to backend
      await fetch(`${BACKEND_URL}/api/verifications/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verifierAddress: walletAddress,
          credentialId: credential.id,
          tokenId: credentialId,
          status,
        }),
      });

      // Refresh history
      fetchVerificationHistory();
    } catch (error) {
      console.error("Verification failed:", error);
      setVerificationResult({
        credential: null as any,
        status: "invalid",
        message: "Verification failed. Please check the credential ID and try again.",
      });
      setShowResultModal(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const shortenAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "invalid":
      case "revoked":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      case "expired":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      default:
        return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle2 className="w-5 h-5" />;
      case "invalid":
      case "revoked":
        return <XCircle className="w-5 h-5" />;
      case "expired":
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const statCards = [
    {
      label: "Total Verified",
      value: stats.total.toString(),
      icon: Shield,
      color: "emerald",
      change: "+0%",
    },
    {
      label: "Valid",
      value: stats.valid.toString(),
      icon: CheckCircle2,
      color: "cyan",
      change: `${stats.successRate}%`,
    },
    {
      label: "Invalid",
      value: stats.invalid.toString(),
      icon: XCircle,
      color: "white",
      change: stats.invalid.toString(),
    },
    {
      label: "Pending",
      value: stats.pending.toString(),
      icon: Clock,
      color: "white",
      change: stats.pending.toString(),
    },
  ];

  return (
    <DashboardLayout userType="verifier">
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              Verifier Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Verify credentials and view verification history
            </p>
          </div>

          <button
            onClick={() => setCredentialId("")}
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
              <ScanLine className="w-4 h-4" />
              New Verification
            </span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              {/* Glow effect */}
              <div
                className={`absolute inset-0 ${
                  stat.color === "emerald"
                    ? "bg-emerald-500/10"
                    : stat.color === "cyan"
                    ? "bg-cyan-500/10"
                    : "bg-white/5"
                } rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />

              {/* Card */}
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

        {/* Verification Scanner & History */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Verification Scanner */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">
                  Quick Verification
                </h2>
              </div>

              <div className="space-y-6">
                {/* Input Area */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-2xl blur-xl" />
                  <div className="relative bg-slate-950/50 border border-white/10 rounded-2xl p-8">
                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl flex items-center justify-center">
                        <ScanLine className="w-10 h-10 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">
                          Scan or Enter Credential ID
                        </h3>
                        <p className="text-sm text-slate-400 mb-4">
                          Paste credential token ID to verify on-chain
                        </p>
                      </div>
                      <div className="w-full max-w-md">
                        <input
                          type="text"
                          placeholder="Enter credential token ID..."
                          value={credentialId}
                          onChange={(e) => setCredentialId(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && verifyCredential()}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/40 transition-colors"
                        />
                      </div>
                      <button
                        onClick={verifyCredential}
                        disabled={isVerifying || !credentialId.trim()}
                        className="group relative inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-black overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div
                          className="absolute inset-0 bg-emerald-400 transition-all duration-300 group-hover:bg-emerald-500"
                          style={{
                            clipPath:
                              "polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)",
                          }}
                        />
                        <span className="relative font-bold tracking-wide flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          {isVerifying ? "Verifying..." : "Verify Now"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent Verifications */}
                <div>
                  <h3 className="text-sm font-bold text-white mb-4">
                    Recent Verifications
                  </h3>

                  {isLoadingHistory ? (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                      <Activity className="w-8 h-8 text-slate-500 mx-auto mb-2 animate-pulse" />
                      <p className="text-sm text-slate-400">Loading history...</p>
                    </div>
                  ) : verificationHistory.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                      <Activity className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">
                        No verifications yet
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Start by verifying your first credential
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {verificationHistory.slice(0, 5).map((record) => (
                        <motion.div
                          key={record.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${getStatusColor(record.status)}`}>
                                {getStatusIcon(record.status)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  {record.credential?.credentialType || "Unknown Credential"}
                                </p>
                                <p className="text-xs text-slate-400">
                                  Token ID: {record.credentialId.slice(0, 10)}...
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs px-2 py-1 rounded-lg border ${getStatusColor(record.status)}`}>
                                {record.status.toUpperCase()}
                              </span>
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Stats & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
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
                <button
                  onClick={() => setCredentialId("")}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 rounded-xl transition-all group text-left"
                >
                  <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <ScanLine className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Verify</p>
                    <p className="text-xs text-slate-500">New verification</p>
                  </div>
                </button>

                <button
                  onClick={fetchVerificationHistory}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 rounded-xl transition-all group text-left"
                >
                  <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                    <Activity className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">History</p>
                    <p className="text-xs text-slate-500">Refresh</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all group text-left">
                  <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <Search className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Search</p>
                    <p className="text-xs text-slate-500">Find credential</p>
                  </div>
                </button>
              </div>
            </motion.div>

            {/* Verification Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h2 className="text-lg font-bold text-white mb-6">
                Success Rate
              </h2>

              <div className="text-center mb-6">
                <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-white/10"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - stats.successRate / 100)}`}
                      className="text-emerald-400 transition-all duration-1000"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute">
                    <p className="text-3xl font-black text-white">{stats.successRate}%</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400">
                  of verifications successful
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Valid</span>
                  <span className="font-semibold text-emerald-400">{stats.valid}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Invalid</span>
                  <span className="font-semibold text-red-400">{stats.invalid}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Total</span>
                  <span className="font-semibold text-slate-300">{stats.total}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Verification Result Modal */}
      <AnimatePresence>
        {showResultModal && verificationResult && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setShowResultModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-slate-950 border border-white/10 rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-white">
                    Verification Result
                  </h2>
                  <button
                    onClick={() => setShowResultModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-center mb-8">
                  <div className={`w-24 h-24 rounded-2xl flex items-center justify-center border-2 ${getStatusColor(verificationResult.status)}`}>
                    {getStatusIcon(verificationResult.status)}
                  </div>
                </div>

                {/* Status Message */}
                <div className="text-center mb-8">
                  <h3 className={`text-2xl font-bold mb-2 ${
                    verificationResult.status === "valid" ? "text-emerald-400" :
                    verificationResult.status === "expired" ? "text-amber-400" :
                    "text-red-400"
                  }`}>
                    {verificationResult.status === "valid" ? "Credential Valid" :
                     verificationResult.status === "expired" ? "Credential Expired" :
                     verificationResult.status === "revoked" ? "Credential Revoked" :
                     "Invalid Credential"}
                  </h3>
                  <p className="text-slate-400">{verificationResult.message}</p>
                </div>

                {/* Credential Details */}
                {verificationResult.credential && (
                  <div className="space-y-4 bg-white/5 border border-white/10 rounded-xl p-6">
                    <h4 className="text-sm font-bold text-white mb-4">Credential Details</h4>

                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-slate-400">Type</span>
                        <span className="text-sm font-semibold text-white text-right">
                          {verificationResult.credential.credentialType}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-sm text-slate-400">Token ID</span>
                        <span className="text-sm font-mono text-white">
                          {verificationResult.credential.tokenId}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-sm text-slate-400">Issuer</span>
                        <span className="text-sm font-mono text-white">
                          {shortenAddress(verificationResult.credential.issuer)}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-sm text-slate-400">Recipient</span>
                        <span className="text-sm font-mono text-white">
                          {shortenAddress(verificationResult.credential.recipient)}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-sm text-slate-400">Issued</span>
                        <span className="text-sm text-white">
                          {formatDate(verificationResult.credential.issuanceDate)}
                        </span>
                      </div>

                      {verificationResult.credential.expirationDate && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-slate-400">Expires</span>
                          <span className="text-sm text-white">
                            {formatDate(verificationResult.credential.expirationDate)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-start">
                        <span className="text-sm text-slate-400">Status</span>
                        <span className={`text-sm font-semibold ${
                          verificationResult.credential.isRevoked ? "text-red-400" : "text-emerald-400"
                        }`}>
                          {verificationResult.credential.isRevoked ? "Revoked" : "Active"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowResultModal(false);
                      setCredentialId("");
                    }}
                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-semibold transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowResultModal(false);
                      setCredentialId("");
                    }}
                    className="group relative inline-flex items-center justify-center flex-1 px-6 py-3 text-sm font-semibold text-black overflow-hidden transition-all duration-300"
                  >
                    <div
                      className="absolute inset-0 bg-emerald-400 transition-all duration-300 group-hover:bg-emerald-500"
                      style={{
                        clipPath:
                          "polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)",
                      }}
                    />
                    <span className="relative font-bold tracking-wide flex items-center gap-2">
                      Verify Another
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
