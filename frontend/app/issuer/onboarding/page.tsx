/**
 * Issuer Onboarding Page
 * 
 * Route: /issuer/onboarding
 * 
 * This page allows issuers to:
 * 1. Connect their MetaMask wallet
 * 2. Create a smart account using MetaMask Delegation Toolkit
 * 3. Grant delegation to the VeriCred+ backend for credential issuance
 */

import { IssuerDelegationManager } from '@/components/delegation/IssuerDelegationManager';
import { Header, Footer } from '@/components/layout';

export const metadata = {
  title: 'Issuer Onboarding | VeriCred+',
  description: 'Set up your issuer account and grant delegation to VeriCred+ for secure credential issuance',
};

export default function IssuerOnboardingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-4">Issuer Onboarding</h1>
            <p className="text-xl text-muted-foreground">
              Set up your issuer account in 3 simple steps
            </p>
          </div>

          {/* Info Banner */}
          <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">ℹ️</span>
              What is Delegation?
            </h2>
            <p className="text-sm text-muted-foreground mb-2">
              By granting delegation to VeriCred+, you allow our backend to issue credentials on your behalf without exposing your private keys. 
              This is powered by <strong>MetaMask Smart Accounts</strong> and ensures:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
              <li><strong>Security:</strong> Your private keys never leave your browser</li>
              <li><strong>Control:</strong> Set limits on how many credentials can be issued</li>
              <li><strong>Expiry:</strong> Delegations automatically expire after your chosen time period</li>
              <li><strong>AI Oversight:</strong> Every credential is analyzed for fraud before minting</li>
            </ul>
          </div>

          {/* Delegation Manager Component */}
          <IssuerDelegationManager />

          {/* Technical Details */}
          <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border">
            <h3 className="text-lg font-semibold mb-3">Technical Details</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Smart Account:</strong> ERC-4337 compatible account on Monad testnet</p>
              <p><strong>Delegation Standard:</strong> MetaMask Delegation Toolkit v0.13.0</p>
              <p><strong>Blockchain:</strong> Monad testnet (Chain ID: 10143)</p>
              <p><strong>Indexing:</strong> Real-time credential tracking via Envio</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
