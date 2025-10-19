"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Shield,
  Users,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Brain,
  Zap,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { walletService } from "@/lib/delegation/wallet";
import { delegationService } from "@/lib/delegation/delegation.service";
import { ApiClient } from "@/lib/api/client";
import type { Address } from "viem";

// Configuration
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const BACKEND_ADDRESS = (process.env.NEXT_PUBLIC_BACKEND_ADDRESS || "0x0000000000000000000000000000000000000000") as Address;
const VERICRED_SBT_ADDRESS = (process.env.NEXT_PUBLIC_VERICRED_SBT_ADDRESS || "0x0000000000000000000000000000000000000000") as Address;

export default function IssuerDashboard() {
  const { walletAddress } = useAuth();
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showDelegationModal, setShowDelegationModal] = useState(false);

  // Issue Credential State
  const [recipientAddress, setRecipientAddress] = useState("");
  const [credentialType, setCredentialType] = useState("");
  const [metadata, setMetadata] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [riskAnalysis, setRiskAnalysis] = useState<any>(null);
  const [isIssuing, setIsIssuing] = useState(false);

  // Delegation State
  const [maxCredentials, setMaxCredentials] = useState(100);
  const [expiryDays, setExpiryDays] = useState(30);
  const [isCreatingDelegation, setIsCreatingDelegation] = useState(false);
  const [delegationId, setDelegationId] = useState<string | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<Address | null>(null);
  const [hasDelegation, setHasDelegation] = useState(false);

  // Check for existing delegations on mount
  useEffect(() => {
    if (walletAddress) {
      checkExistingDelegation();
    }
  }, [walletAddress]);

  const checkExistingDelegation = async () => {
    try {
      // walletAddress being set means wallet is connected
      if (!walletAddress) {
        console.log('⏳ Wallet not connected yet, skipping delegation check');
        return;
      }

      const response = await ApiClient.get(`${BACKEND_URL}/api/delegations`);
      if (response.ok) {
        const data = await response.json();
        if (data.delegations && data.delegations.length > 0) {
          // Find active delegation (not revoked, not expired)
          const activeDelegation = data.delegations.find((d: any) =>
            !d.isRevoked && new Date(d.expiresAt) > new Date()
          );
          if (activeDelegation) {
            setDelegationId(activeDelegation.id);
            setSmartAccountAddress(activeDelegation.smartAccountAddress);
            setHasDelegation(true);
            console.log('✅ Found active delegation:', activeDelegation.id);
          } else {
            console.log('⚠️ No active delegation found');
            setHasDelegation(false);
          }
        } else {
          setHasDelegation(false);
        }
      }
    } catch (error) {
      console.error("Failed to check existing delegation:", error);
      setHasDelegation(false);
    }
  };

  const stats = [
    {
      label: "Total Issued",
      value: "0",
      icon: Award,
      color: "emerald",
      change: "+0%",
    },
    {
      label: "Active Credentials",
      value: "0",
      icon: Shield,
      color: "cyan",
      change: "+0%",
    },
    {
      label: "Pending",
      value: "0",
      icon: Clock,
      color: "white",
      change: "0",
    },
    {
      label: "Recipients",
      value: "0",
      icon: Users,
      color: "white",
      change: "+0",
    },
  ];

  // AI Risk Analysis
  const analyzeRecipient = async () => {
    if (!recipientAddress) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientAddress,
          issuerAddress: walletAddress,
        }),
      });

      if (response.ok) {
        const analysis = await response.json();
        setRiskAnalysis(analysis);
      }
    } catch (error) {
      console.error("AI Analysis failed:", error);
      setRiskAnalysis({
        riskScore: 50,
        recommendation: "Unable to analyze. Verify manually.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Issue Credential
  const handleIssueCredential = async () => {
    if (!recipientAddress || !credentialType || !delegationId) return;

    setIsIssuing(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/credentials/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delegationId,
          recipientAddress,
          credentialType,
          metadata,
        }),
      });

      if (response.ok) {
        setShowIssueModal(false);
        // Refresh dashboard
      }
    } catch (error) {
      console.error("Failed to issue credential:", error);
    } finally {
      setIsIssuing(false);
    }
  };

  // Create Delegation
  const handleCreateDelegation = async () => {
    setIsCreatingDelegation(true);
    try {
      // Step 1: Ensure wallet is connected via delegation wallet service
      let connection = walletService.getConnection();
      if (!connection) {
        await walletService.connect();
        connection = walletService.getConnection();
      }

      if (!connection) {
        throw new Error("Failed to connect wallet");
      }

      // Step 2: Create smart account
      const smartAccountInfo = await delegationService.createSmartAccount();
      setSmartAccountAddress(smartAccountInfo.address);

      // Step 3: Create and sign delegation
      const delegationRequest = await delegationService.createAndSignDelegation({
        backendAddress: BACKEND_ADDRESS,
        veriCredSBTAddress: VERICRED_SBT_ADDRESS,
        maxCredentials,
        expiryDays,
      });

      // Step 4: Send to backend
      const result = await delegationService.sendDelegationToBackend(
        delegationRequest,
        BACKEND_URL
      );

      setDelegationId(result.delegationId);
      setHasDelegation(true);
      setShowDelegationModal(false);
    } catch (error) {
      console.error("Failed to create delegation:", error);
    } finally {
      setIsCreatingDelegation(false);
    }
  };

  return (
    <DashboardLayout userType="issuer">
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              Issuer Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage delegations and issue verifiable credentials with AI fraud detection
            </p>
          </div>

          <div className="flex gap-3">
            {!delegationId && (
              <button
                onClick={() => setShowDelegationModal(true)}
                className="group relative inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-black overflow-hidden transition-all duration-300"
              >
                <div
                  className="absolute inset-0 bg-cyan-400 transition-all duration-300 group-hover:bg-cyan-500"
                  style={{
                    clipPath:
                      "polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)",
                  }}
                />
                <span className="relative font-bold tracking-wide flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Setup Delegation
                </span>
              </button>
            )}

            <button
              onClick={() => setShowIssueModal(true)}
              disabled={!delegationId}
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
                <Plus className="w-4 h-4" />
                Issue Credential
              </span>
            </button>
          </div>
        </div>

        {/* Delegation Status Alert */}
        {!delegationId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-400">
                Delegation Required
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Set up delegation using MetaMask Smart Account to start issuing credentials
              </p>
            </div>
          </motion.div>
        )}

        {delegationId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-400">
                Delegation Active
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {maxCredentials} credentials • Expires in {expiryDays} days
              </p>
            </div>
          </motion.div>
        )}

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

        {/* Recent Activity & Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Credentials */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">
                  Recent Credentials
                </h2>
                <button className="text-sm text-emerald-400 hover:text-emerald-300 font-medium">
                  View All
                </button>
              </div>

              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400 mb-2">No credentials issued yet</p>
                <p className="text-sm text-slate-500">
                  {delegationId
                    ? "Start by issuing your first credential"
                    : "Set up delegation first"}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1">
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
                  onClick={() => setShowIssueModal(true)}
                  disabled={!delegationId}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 rounded-xl transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <Plus className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Issue New
                    </p>
                    <p className="text-xs text-slate-500">With AI analysis</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 rounded-xl transition-all group text-left">
                  <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                    <FileText className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Templates
                    </p>
                    <p className="text-xs text-slate-500">Manage templates</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all group text-left">
                  <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Recipients
                    </p>
                    <p className="text-xs text-slate-500">Manage recipients</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Issue Credential Modal */}
      <AnimatePresence>
        {showIssueModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowIssueModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-slate-950 border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white">
                  Issue Credential
                </h3>
                <button
                  onClick={() => setShowIssueModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Recipient Address */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/40 transition-colors"
                  />
                </div>

                {/* AI Risk Analysis Button */}
                <button
                  onClick={analyzeRecipient}
                  disabled={!recipientAddress || isAnalyzing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-400 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Brain className="w-4 h-4" />
                      </motion.div>
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4" />
                      Run AI Fraud Analysis
                    </>
                  )}
                </button>

                {/* Risk Analysis Result */}
                {riskAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border ${
                      riskAnalysis.riskScore < 30
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : riskAnalysis.riskScore < 70
                        ? "bg-yellow-500/10 border-yellow-500/30"
                        : "bg-red-500/10 border-red-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles
                        className={`w-4 h-4 ${
                          riskAnalysis.riskScore < 30
                            ? "text-emerald-400"
                            : riskAnalysis.riskScore < 70
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      />
                      <span
                        className={`text-sm font-semibold ${
                          riskAnalysis.riskScore < 30
                            ? "text-emerald-400"
                            : riskAnalysis.riskScore < 70
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {riskAnalysis.riskScore < 30
                          ? "🟢 Low Risk"
                          : riskAnalysis.riskScore < 70
                          ? "🟡 Medium Risk"
                          : "🔴 High Risk"}{" "}
                        ({riskAnalysis.riskScore}/100)
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {riskAnalysis.recommendation}
                    </p>
                  </motion.div>
                )}

                {/* Credential Type */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Credential Type
                  </label>
                  <input
                    type="text"
                    value={credentialType}
                    onChange={(e) => setCredentialType(e.target.value)}
                    placeholder="e.g., Bachelor of Science"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/40 transition-colors"
                  />
                </div>

                {/* Metadata */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Metadata (Optional)
                  </label>
                  <textarea
                    value={metadata}
                    onChange={(e) => setMetadata(e.target.value)}
                    placeholder="Additional information..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/40 transition-colors resize-none"
                  />
                </div>

                {/* Issue Button */}
                <button
                  onClick={handleIssueCredential}
                  disabled={
                    !recipientAddress || !credentialType || isIssuing || !delegationId
                  }
                  className="w-full group relative inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-black overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div
                    className="absolute inset-0 bg-emerald-400 transition-all duration-300 group-hover:bg-emerald-500"
                    style={{
                      clipPath:
                        "polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)",
                    }}
                  />
                  <span className="relative font-bold tracking-wide flex items-center justify-center gap-2">
                    {isIssuing ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          <Zap className="w-4 h-4" />
                        </motion.div>
                        Issuing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Issue Credential
                      </>
                    )}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delegation Setup Modal */}
      <AnimatePresence>
        {showDelegationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDelegationModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-slate-950 border border-white/10 rounded-2xl p-6 max-w-lg w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white">
                  Setup Delegation
                </h3>
                <button
                  onClick={() => setShowDelegationModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                  <p className="text-sm text-cyan-400 mb-2">
                    🛡️ Grant VeriCred+ permission to issue credentials on your behalf
                  </p>
                  <p className="text-xs text-slate-400">
                    Using MetaMask Smart Account & Delegation Toolkit. You control the limits.
                  </p>
                </div>

                {/* Smart Account Info */}
                {smartAccountAddress && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                    <p className="text-xs font-medium text-emerald-400 mb-1">
                      Smart Account Created
                    </p>
                    <p className="text-xs font-mono text-slate-400">
                      {smartAccountAddress.slice(0, 10)}...{smartAccountAddress.slice(-8)}
                    </p>
                  </div>
                )}

                {/* Max Credentials */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Maximum Credentials
                  </label>
                  <input
                    type="number"
                    value={maxCredentials}
                    onChange={(e) => setMaxCredentials(Number(e.target.value))}
                    disabled={isCreatingDelegation}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/40 transition-colors disabled:opacity-50"
                  />
                </div>

                {/* Expiry Days */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Expiry (Days)
                  </label>
                  <input
                    type="number"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Number(e.target.value))}
                    disabled={isCreatingDelegation}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/40 transition-colors disabled:opacity-50"
                  />
                </div>

                {/* Security Controls Info */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-xs font-medium text-white mb-2">Security Controls:</p>
                  <ul className="text-xs text-slate-400 space-y-1">
                    <li>• Only VeriCredSBT contract can be called</li>
                    <li>• Only mintCredential function allowed</li>
                    <li>• Limited to {maxCredentials} credentials max</li>
                    <li>• Auto-expires in {expiryDays} days</li>
                    <li>• AI fraud analysis before every issuance</li>
                  </ul>
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreateDelegation}
                  disabled={isCreatingDelegation}
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
                    {isCreatingDelegation ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          <Shield className="w-4 h-4" />
                        </motion.div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Create Delegation
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
