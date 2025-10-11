"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { motion } from "framer-motion";
import { FileText, CheckCircle2, XCircle, Search, Filter } from "lucide-react";

interface VerificationRecord {
  id: string;
  credentialType: string;
  credentialId: string;
  status: "valid" | "invalid" | "expired" | "revoked";
  verifiedAt: string;
  issuer: string;
  recipient: string;
}

export default function VerifierHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "valid" | "invalid">("all");

  const [verifications] = useState<VerificationRecord[]>([
    {
      id: "1",
      credentialType: "University Degree",
      credentialId: "123456",
      status: "valid",
      verifiedAt: "2025-01-10T10:30:00Z",
      issuer: "0x1234567890123456789012345678901234567890",
      recipient: "0x0987654321098765432109876543210987654321",
    },
  ]);

  const filteredVerifications = verifications.filter((v) => {
    const matchesSearch = v.credentialType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "valid" && v.status === "valid") ||
      (filterStatus === "invalid" && v.status !== "valid");
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: verifications.length,
    valid: verifications.filter((v) => v.status === "valid").length,
    invalid: verifications.filter((v) => v.status !== "valid").length,
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
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
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2">
            Verification History
          </h1>
          <p className="text-sm text-slate-400">View all past credential verifications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Verified", value: stats.total, color: "emerald" },
            { label: "Valid", value: stats.valid, color: "cyan" },
            { label: "Invalid", value: stats.invalid, color: "red" },
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
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search verifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/40 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              {["all", "valid", "invalid"].map((status) => (
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

        {/* History List */}
        <div className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          {filteredVerifications.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-sm text-slate-400">No verification history</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredVerifications.map((record) => (
                <div key={record.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                          record.status === "valid"
                            ? "bg-emerald-500/10 border-emerald-500/30"
                            : "bg-red-500/10 border-red-500/30"
                        }`}
                      >
                        {record.status === "valid" ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-400" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-bold text-white">
                            {record.credentialType}
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-lg border ${
                              record.status === "valid"
                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                                : "text-red-400 bg-red-500/10 border-red-500/30"
                            }`}
                          >
                            {record.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-400">
                          <div>
                            <span className="font-medium">ID:</span> #{record.credentialId}
                          </div>
                          <div>
                            <span className="font-medium">Verified:</span>{" "}
                            {formatDate(record.verifiedAt)}
                          </div>
                          <div>
                            <span className="font-medium">Issuer:</span>{" "}
                            {shortenAddress(record.issuer)}
                          </div>
                        </div>
                      </div>
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
