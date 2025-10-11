"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { motion } from "framer-motion";
import {
  User,
  Shield,
  Bell,
  Key,
  Save,
  Trash2,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

export default function IssuerSettingsPage() {
  const { walletAddress, smartAccountAddress } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Profile settings
  const [organizationName, setOrganizationName] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [credentialIssued, setCredentialIssued] = useState(true);
  const [credentialRevoked, setCredentialRevoked] = useState(true);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const shortenAddress = (address: string | null) => {
    if (!address) return "Not connected";
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  return (
    <DashboardLayout userType="issuer">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2">
            Settings
          </h1>
          <p className="text-sm text-slate-400">
            Manage your issuer profile and preferences
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Settings */}
            <div className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Profile Information</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Enter organization name"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/40 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Website
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/40 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@example.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/40 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Notifications</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Email Notifications
                    </p>
                    <p className="text-xs text-slate-400">
                      Receive email updates about your activity
                    </p>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      emailNotifications ? "bg-emerald-500" : "bg-white/10"
                    }`}
                  >
                    <motion.div
                      animate={{ x: emailNotifications ? 24 : 2 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full"
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Credential Issued
                    </p>
                    <p className="text-xs text-slate-400">
                      Get notified when credentials are issued
                    </p>
                  </div>
                  <button
                    onClick={() => setCredentialIssued(!credentialIssued)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      credentialIssued ? "bg-emerald-500" : "bg-white/10"
                    }`}
                  >
                    <motion.div
                      animate={{ x: credentialIssued ? 24 : 2 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full"
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Credential Revoked
                    </p>
                    <p className="text-xs text-slate-400">
                      Get notified when credentials are revoked
                    </p>
                  </div>
                  <button
                    onClick={() => setCredentialRevoked(!credentialRevoked)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      credentialRevoked ? "bg-emerald-500" : "bg-white/10"
                    }`}
                  >
                    <motion.div
                      animate={{ x: credentialRevoked ? 24 : 2 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full"
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            {saveSuccess ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <p className="text-sm text-emerald-400 font-medium">
                  Settings saved successfully!
                </p>
              </motion.div>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full group relative inline-flex items-center justify-center px-6 py-4 text-base font-semibold text-black overflow-hidden transition-all duration-300 disabled:opacity-50"
              >
                <div
                  className="absolute inset-0 bg-emerald-400 transition-all duration-300 group-hover:bg-emerald-500"
                  style={{
                    clipPath:
                      "polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)",
                  }}
                />
                <span className="relative font-bold tracking-wide flex items-center gap-2">
                  <Save className="w-5 h-5" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </span>
              </button>
            )}
          </div>

          {/* Account Info Sidebar */}
          <div className="space-y-6">
            {/* Wallet Info */}
            <div className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-center">
                  <Key className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Wallet</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1">EOA Address</p>
                  <p className="text-xs font-mono text-white">
                    {shortenAddress(walletAddress)}
                  </p>
                </div>
                {smartAccountAddress && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Smart Account</p>
                    <p className="text-xs font-mono text-white">
                      {shortenAddress(smartAccountAddress)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Delegation Status */}
            <div className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Delegation</h3>
              </div>

              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-all">
                <RefreshCw className="w-4 h-4" />
                Refresh Delegation
              </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-red-400 mb-4">Danger Zone</h3>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-sm font-medium text-red-400 transition-all">
                <Trash2 className="w-4 h-4" />
                Revoke All Delegations
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
