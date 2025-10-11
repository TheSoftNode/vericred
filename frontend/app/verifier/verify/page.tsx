"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, Shield, CheckCircle2, XCircle, AlertTriangle, Search } from "lucide-react";

const ENVIO_GRAPHQL_URL = process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL || "http://localhost:8080/v1/graphql";

interface VerificationResult {
  credential: any;
  status: "valid" | "invalid" | "expired" | "revoked";
  message: string;
}

export default function VerifierVerifyPage() {
  const [credentialId, setCredentialId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const verifyCredential = async () => {
    if (!credentialId.trim()) return;

    setIsVerifying(true);
    try {
      const query = `
        query GetCredential($tokenId: String!) {
          Credential(where: { tokenId: { _eq: $tokenId } }) {
            id tokenId credentialType issuer recipient
            issuanceDate expirationDate isRevoked metadataURI
          }
        }
      `;

      const response = await fetch(ENVIO_GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { tokenId: credentialId } }),
      });

      if (response.ok) {
        const data = await response.json();
        const credentials = data.data?.Credential || [];

        if (credentials.length === 0) {
          setResult({
            credential: null,
            status: "invalid",
            message: "Credential not found on blockchain",
          });
        } else {
          const credential = credentials[0];
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

          setResult({ credential, status, message });
        }
      }
    } catch (error) {
      console.error("Verification failed:", error);
      setResult({
        credential: null,
        status: "invalid",
        message: "Verification failed. Please try again.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout userType="verifier">
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Verify Credential</h1>
          <p className="text-sm text-slate-400">
            Instantly verify credentials on-chain using Envio indexer
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Scanner */}
          <div className="lg:col-span-2">
            <div className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <div className="flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-24 h-24 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl flex items-center justify-center">
                  <ScanLine className="w-12 h-12 text-emerald-400" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Scan or Enter Credential ID</h3>
                  <p className="text-sm text-slate-400">Enter the credential token ID to verify</p>
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
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-black overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div
                    className="absolute inset-0 bg-emerald-400 transition-all duration-300 group-hover:bg-emerald-500"
                    style={{
                      clipPath: "polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)",
                    }}
                  />
                  <span className="relative font-bold tracking-wide flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    {isVerifying ? "Verifying..." : "Verify Now"}
                  </span>
                </button>
              </div>

              {/* Result */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-8 pt-8 border-t border-white/10"
                  >
                    <div className="flex items-center justify-center mb-6">
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 ${
                          result.status === "valid"
                            ? "bg-emerald-500/10 border-emerald-500/30"
                            : result.status === "expired"
                            ? "bg-yellow-500/10 border-yellow-500/30"
                            : "bg-red-500/10 border-red-500/30"
                        }`}
                      >
                        {result.status === "valid" ? (
                          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                        ) : result.status === "expired" ? (
                          <AlertTriangle className="w-8 h-8 text-yellow-400" />
                        ) : (
                          <XCircle className="w-8 h-8 text-red-400" />
                        )}
                      </div>
                    </div>

                    <div className="text-center mb-6">
                      <h3
                        className={`text-xl font-bold mb-2 ${
                          result.status === "valid"
                            ? "text-emerald-400"
                            : result.status === "expired"
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {result.status === "valid"
                          ? "✓ Credential Valid"
                          : result.status === "expired"
                          ? "⚠ Credential Expired"
                          : result.status === "revoked"
                          ? "✗ Credential Revoked"
                          : "✗ Invalid Credential"}
                      </h3>
                      <p className="text-sm text-slate-400">{result.message}</p>
                    </div>

                    {result.credential && (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3">
                        <h4 className="text-sm font-bold text-white mb-4">Credential Details</h4>

                        <div className="flex justify-between items-start">
                          <span className="text-xs text-slate-400">Type</span>
                          <span className="text-sm font-semibold text-white text-right">
                            {result.credential.credentialType}
                          </span>
                        </div>

                        <div className="flex justify-between items-start">
                          <span className="text-xs text-slate-400">Token ID</span>
                          <span className="text-xs font-mono text-white">
                            #{result.credential.tokenId}
                          </span>
                        </div>

                        <div className="flex justify-between items-start">
                          <span className="text-xs text-slate-400">Issuer</span>
                          <span className="text-xs font-mono text-white">
                            {shortenAddress(result.credential.issuer)}
                          </span>
                        </div>

                        <div className="flex justify-between items-start">
                          <span className="text-xs text-slate-400">Recipient</span>
                          <span className="text-xs font-mono text-white">
                            {shortenAddress(result.credential.recipient)}
                          </span>
                        </div>

                        <div className="flex justify-between items-start">
                          <span className="text-xs text-slate-400">Issued</span>
                          <span className="text-xs text-white">
                            {formatDate(result.credential.issuanceDate)}
                          </span>
                        </div>

                        {result.credential.expirationDate && (
                          <div className="flex justify-between items-start">
                            <span className="text-xs text-slate-400">Expires</span>
                            <span className="text-xs text-white">
                              {formatDate(result.credential.expirationDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">How It Works</h3>
              <div className="space-y-3 text-xs text-slate-400">
                <p>1. Enter credential token ID</p>
                <p>2. System queries Envio indexer</p>
                <p>3. Validates on-chain status</p>
                <p>4. Instant verification result</p>
              </div>
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-6">
              <p className="text-sm font-semibold text-cyan-400 mb-2">Instant Verification</p>
              <p className="text-xs text-slate-400">
                Powered by Envio HyperIndex for sub-second blockchain queries
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
