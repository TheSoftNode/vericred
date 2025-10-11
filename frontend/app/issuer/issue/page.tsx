"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { motion } from "framer-motion";
import {
  FileText,
  Send,
  Brain,
  Sparkles,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export default function IssueCredentialPage() {
  const { walletAddress } = useAuth();

  // Form state
  const [recipientAddress, setRecipientAddress] = useState("");
  const [credentialType, setCredentialType] = useState("");
  const [metadata, setMetadata] = useState("");
  const [expiryDays, setExpiryDays] = useState(365);

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [riskAnalysis, setRiskAnalysis] = useState<any>(null);

  // Issuance state
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState(false);

  const credentialTypes = [
    "University Degree",
    "Professional Certificate",
    "Employment Verification",
    "KYC Verification",
    "Age Verification",
    "Custom Credential",
  ];

  const analyzeRecipient = async () => {
    if (!recipientAddress) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/analyze-fraud`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientAddress,
          issuerAddress: walletAddress,
          credentialType,
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
        riskLevel: "MEDIUM",
        recommendation: "Unable to analyze. Verify manually.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleIssueCredential = async () => {
    if (!recipientAddress || !credentialType) return;

    setIsIssuing(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/credentials/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientAddress,
          credentialType,
          metadata,
          expiryDays,
        }),
      });

      if (response.ok) {
        setIssueSuccess(true);
        // Reset form after 2 seconds
        setTimeout(() => {
          setRecipientAddress("");
          setCredentialType("");
          setMetadata("");
          setRiskAnalysis(null);
          setIssueSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to issue credential:", error);
    } finally {
      setIsIssuing(false);
    }
  };

  return (
    <DashboardLayout userType="issuer">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2">
            Issue New Credential
          </h1>
          <p className="text-sm text-slate-400">
            Issue verifiable credentials with AI-powered fraud detection
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">
              {/* Recipient Address */}
              <div>
                <label className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
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

              {/* AI Analysis Button */}
              {recipientAddress && (
                <button
                  onClick={analyzeRecipient}
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl text-purple-400 hover:border-purple-500/50 transition-all disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-4 h-4" />
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
              )}

              {/* Risk Analysis Result */}
              {riskAnalysis && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border ${
                    riskAnalysis.riskLevel === "LOW"
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : riskAnalysis.riskLevel === "MEDIUM"
                      ? "bg-yellow-500/10 border-yellow-500/30"
                      : "bg-red-500/10 border-red-500/30"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles
                      className={`w-4 h-4 ${
                        riskAnalysis.riskLevel === "LOW"
                          ? "text-emerald-400"
                          : riskAnalysis.riskLevel === "MEDIUM"
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        riskAnalysis.riskLevel === "LOW"
                          ? "text-emerald-400"
                          : riskAnalysis.riskLevel === "MEDIUM"
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {riskAnalysis.riskLevel} Risk ({riskAnalysis.riskScore}/100)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {riskAnalysis.recommendation}
                  </p>
                </motion.div>
              )}

              {/* Credential Type */}
              <div>
                <label className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Credential Type
                </label>
                <select
                  value={credentialType}
                  onChange={(e) => setCredentialType(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/40 transition-colors"
                >
                  <option value="">Select credential type...</option>
                  {credentialTypes.map((type) => (
                    <option key={type} value={type} className="bg-slate-900">
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expiry */}
              <div>
                <label className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Expiry (Days)
                </label>
                <input
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/40 transition-colors"
                />
              </div>

              {/* Metadata */}
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Additional Metadata (Optional)
                </label>
                <textarea
                  value={metadata}
                  onChange={(e) => setMetadata(e.target.value)}
                  placeholder="Additional information about this credential..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/40 transition-colors resize-none"
                />
              </div>

              {/* Success Message */}
              {issueSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <p className="text-sm text-emerald-400 font-medium">
                    Credential issued successfully!
                  </p>
                </motion.div>
              )}

              {/* Issue Button */}
              <button
                onClick={handleIssueCredential}
                disabled={!recipientAddress || !credentialType || isIssuing}
                className="w-full group relative inline-flex items-center justify-center px-6 py-4 text-base font-semibold text-black overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div
                  className="absolute inset-0 bg-emerald-400 transition-all duration-300 group-hover:bg-emerald-500"
                  style={{
                    clipPath:
                      "polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)",
                  }}
                />
                <span className="relative font-bold tracking-wide flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  {isIssuing ? "Issuing..." : "Issue Credential"}
                </span>
              </button>
            </div>
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            {/* Requirements */}
            <div className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Requirements</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Valid Address</p>
                    <p className="text-xs text-slate-400">
                      Recipient must have valid Ethereum address
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">AI Analysis</p>
                    <p className="text-xs text-slate-400">
                      Run fraud check before issuing
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Active Delegation</p>
                    <p className="text-xs text-slate-400">
                      Delegation must be set up in dashboard
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-cyan-400 mb-2">
                    About Credentials
                  </p>
                  <p className="text-xs text-slate-400">
                    Credentials are issued as soulbound NFTs on Monad. They cannot be
                    transferred and can only be revoked by the issuer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
