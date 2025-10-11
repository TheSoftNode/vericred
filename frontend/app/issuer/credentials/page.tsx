"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { motion } from "framer-motion";
import {
  Shield,
  Search,
  Filter,
  MoreVertical,
  Eye,
  XCircle,
  Download,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

const ENVIO_GRAPHQL_URL = process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL || "http://localhost:8080/v1/graphql";

interface Credential {
  id: string;
  tokenId: string;
  credentialType: string;
  recipient: string;
  issuanceDate: string;
  expirationDate?: string;
  isRevoked: boolean;
  metadataURI?: string;
}

export default function IssuerCredentialsPage() {
  const { walletAddress } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "revoked">("all");

  useEffect(() => {
    if (walletAddress) {
      fetchCredentials();
    }
  }, [walletAddress]);

  const fetchCredentials = async () => {
    setIsLoading(true);
    try {
      const query = `
        query GetIssuerCredentials($issuer: String!) {
          Credential(
            where: { issuer: { _eq: $issuer } }
            order_by: { issuanceDate: desc }
          ) {
            id
            tokenId
            credentialType
            recipient
            issuanceDate
            expirationDate
            isRevoked
            metadataURI
          }
        }
      `;

      const response = await fetch(ENVIO_GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          variables: { issuer: walletAddress?.toLowerCase() },
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
    const matchesSearch =
      cred.credentialType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.tokenId.includes(searchQuery);

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && !cred.isRevoked) ||
      (filterStatus === "revoked" && cred.isRevoked);

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: credentials.length,
    active: credentials.filter((c) => !c.isRevoked).length,
    revoked: credentials.filter((c) => c.isRevoked).length,
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
    });
  };

  return (
    <DashboardLayout userType="issuer">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-2">
              Issued Credentials
            </h1>
            <p className="text-sm text-slate-400">
              View and manage all credentials you've issued
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Issued", value: stats.total, color: "emerald" },
            { label: "Active", value: stats.active, color: "cyan" },
            { label: "Revoked", value: stats.revoked, color: "red" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-xl p-4"
            >
              <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
              <p
                className={`text-2xl font-black ${
                  stat.color === "emerald"
                    ? "text-emerald-400"
                    : stat.color === "cyan"
                    ? "text-cyan-400"
                    : "text-red-400"
                }`}
              >
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by type, recipient, or token ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/40 transition-colors"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              {["all", "active", "revoked"].map((status) => (
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

        {/* Credentials List */}
        <div className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full mx-auto"
              />
              <p className="text-sm text-slate-400 mt-4">Loading credentials...</p>
            </div>
          ) : filteredCredentials.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-sm text-slate-400">
                {searchQuery || filterStatus !== "all"
                  ? "No credentials match your filters"
                  : "No credentials issued yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredCredentials.map((credential) => (
                <div
                  key={credential.id}
                  className="p-6 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                          credential.isRevoked
                            ? "bg-red-500/10 border-red-500/30"
                            : "bg-emerald-500/10 border-emerald-500/30"
                        }`}
                      >
                        <Shield
                          className={`w-6 h-6 ${
                            credential.isRevoked ? "text-red-400" : "text-emerald-400"
                          }`}
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-bold text-white">
                            {credential.credentialType}
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-lg border ${
                              credential.isRevoked
                                ? "text-red-400 bg-red-500/10 border-red-500/30"
                                : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                            }`}
                          >
                            {credential.isRevoked ? "Revoked" : "Active"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-400">
                          <div>
                            <span className="font-medium">Recipient:</span>{" "}
                            {shortenAddress(credential.recipient)}
                          </div>
                          <div>
                            <span className="font-medium">Issued:</span>{" "}
                            {formatDate(credential.issuanceDate)}
                          </div>
                          <div>
                            <span className="font-medium">Token ID:</span> #
                            {credential.tokenId}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                        <Eye className="w-4 h-4" />
                      </button>
                      {!credential.isRevoked && (
                        <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
