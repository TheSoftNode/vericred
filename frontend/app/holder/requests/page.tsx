"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { motion } from "framer-motion";
import { FileText, Check, X, Clock, User } from "lucide-react";

interface AccessRequest {
  id: string;
  verifierName: string;
  verifierAddress: string;
  credentialType: string;
  requestedAt: string;
  expiresAt: string;
  status: "pending" | "approved" | "rejected";
}

export default function HolderRequestsPage() {
  const [requests] = useState<AccessRequest[]>([
    {
      id: "1",
      verifierName: "Acme Corp",
      verifierAddress: "0x1234567890123456789012345678901234567890",
      credentialType: "Employment Verification",
      requestedAt: "2025-01-10T10:00:00Z",
      expiresAt: "2025-01-17T10:00:00Z",
      status: "pending",
    },
  ]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <DashboardLayout userType="holder">
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2">
            Access Requests
          </h1>
          <p className="text-sm text-slate-400">
            Manage credential access requests from verifiers
          </p>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
              <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-sm text-slate-400">No access requests</p>
            </div>
          ) : (
            requests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-cyan-400" />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-base font-bold text-white mb-1">
                        {request.verifierName}
                      </h3>
                      <p className="text-xs text-slate-400 mb-3">
                        {shortenAddress(request.verifierAddress)}
                      </p>

                      <div className="space-y-2 text-xs text-slate-400">
                        <div className="flex gap-2">
                          <span className="font-medium">Credential:</span>
                          <span className="text-white">{request.credentialType}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-medium">Requested:</span>
                          <span className="text-white">{formatDate(request.requestedAt)}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-medium">Access expires:</span>
                          <span className="text-white">{formatDate(request.expiresAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {request.status === "pending" && (
                    <div className="flex gap-2">
                      <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-sm font-medium text-emerald-400 transition-all">
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-sm font-medium text-red-400 transition-all">
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}

                  {request.status === "approved" && (
                    <span className="text-xs px-3 py-2 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                      Approved
                    </span>
                  )}

                  {request.status === "rejected" && (
                    <span className="text-xs px-3 py-2 rounded-lg border bg-red-500/10 border-red-500/30 text-red-400">
                      Rejected
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
