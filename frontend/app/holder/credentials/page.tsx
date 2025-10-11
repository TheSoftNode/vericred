"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { motion } from "framer-motion";
import { Award, Search, Share2, Eye, Download, Filter } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

const ENVIO_GRAPHQL_URL = process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL || "http://localhost:8080/v1/graphql";

interface Credential {
  id: string;
  tokenId: string;
  credentialType: string;
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  isRevoked: boolean;
  metadataURI?: string;
}

export default function HolderCredentialsPage() {
  const { walletAddress } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "valid" | "revoked">("all");

  useEffect(() => {
    if (walletAddress) {
      fetchCredentials();
    }
  }, [walletAddress]);

  const fetchCredentials = async () => {
    setIsLoading(true);
    try {
      const query = `
        query GetHolderCredentials($recipient: String!) {
          Credential(
            where: { recipient: { _eq: $recipient } }
            order_by: { issuanceDate: desc }
          ) {
            id tokenId credentialType issuer
            issuanceDate expirationDate isRevoked metadataURI
          }
        }
      `;

      const response = await fetch(ENVIO_GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          variables: { recipient: walletAddress?.toLowerCase() },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCredentials(data.data?.Credential || []);
      }
    } catch (error) {
      console.error("Failed to fetch credentials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCredentials = credentials.filter((cred) => {
    const matchesSearch = cred.credentialType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "valid" && !cred.isRevoked) ||
      (filterStatus === "revoked" && cred.isRevoked);
    return matchesSearch && matchesFilter;
  });

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <DashboardLayout userType="holder">
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2">My Credentials</h1>
          <p className="text-sm text-slate-400">View and manage all your verifiable credentials</p>
        </div>

        {/* Filters */}
        <div className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search credentials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/40 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              {["all", "valid", "revoked"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    filterStatus === status
                      ? "bg-emerald-500 text-black"
                      : "bg-white/5 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Credentials Grid */}
        {isLoading ? (
          <div className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full mx-auto"
            />
            <p className="text-sm text-slate-400 mt-4">Loading credentials...</p>
          </div>
        ) : filteredCredentials.length === 0 ? (
          <div className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
            <Award className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-sm text-slate-400">No credentials found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCredentials.map((credential) => (
              <motion.div
                key={credential.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all group"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                    credential.isRevoked
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-emerald-500/10 border-emerald-500/30"
                  }`}>
                    <Award className={`w-6 h-6 ${credential.isRevoked ? "text-red-400" : "text-emerald-400"}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white mb-1">
                      {credential.credentialType}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Issued by {shortenAddress(credential.issuer)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Issued:</span>
                    <span className="text-white">{formatDate(credential.issuanceDate)}</span>
                  </div>
                  {credential.expirationDate && (
                    <div className="flex justify-between">
                      <span>Expires:</span>
                      <span className="text-white">{formatDate(credential.expirationDate)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={credential.isRevoked ? "text-red-400" : "text-emerald-400"}>
                      {credential.isRevoked ? "Revoked" : "Valid"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-white transition-all">
                    <Share2 className="w-3 h-3" /> Share
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-white transition-all">
                    <Eye className="w-3 h-3" /> View
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
