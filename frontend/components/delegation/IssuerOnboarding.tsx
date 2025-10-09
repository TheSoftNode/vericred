/**
 * Issuer Onboarding Component
 *
 * Complete 3-step flow for issuers based on PRD:
 * 1. Connect MetaMask wallet
 * 2. Create smart account
 * 3. Grant delegation to backend
 *
 * This is the MAIN component users interact with.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Wallet, Shield, Key } from 'lucide-react';

import { useWallet } from '@/lib/delegation/useWallet';
import { useSmartAccount } from '@/lib/delegation/useSmartAccount';
import { useDelegation } from '@/lib/delegation/useDelegation';
import type { Address } from 'viem';

// Configuration from environment
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
const BACKEND_ADDRESS = (process.env.NEXT_PUBLIC_BACKEND_ADDRESS || '0x0000000000000000000000000000000000000000') as Address;
const VERICRED_SBT_ADDRESS = (process.env.NEXT_PUBLIC_VERICRED_SBT_ADDRESS || '0x0000000000000000000000000000000000000000') as Address;

export function IssuerOnboarding() {
  // Hook states
  const wallet = useWallet();
  const smartAccount = useSmartAccount();
  const delegation = useDelegation();

  // UI state
  const [maxCredentials, setMaxCredentials] = useState(100);
  const [expiryDays, setExpiryDays] = useState(30);
  const [delegationId, setDelegationId] = useState<string | null>(null);
  const [sendingToBackend, setSendingToBackend] = useState(false);

  /**
   * STEP 1: Connect wallet
   */
  const handleConnectWallet = async () => {
    await wallet.connect();
  };

  /**
   * STEP 2: Create smart account
   */
  const handleCreateSmartAccount = async () => {
    const walletClient = wallet.getWalletClient();
    const publicClient = wallet.getPublicClient();

    if (!walletClient || !publicClient || !wallet.address) {
      return;
    }

    await smartAccount.createSmartAccount(
      walletClient,
      publicClient,
      wallet.address
    );
  };

  /**
   * STEP 3: Create and sign delegation, then send to backend
   */
  const handleGrantDelegation = async () => {
    if (!smartAccount.smartAccount || !wallet.address) {
      return;
    }

    // Create and sign delegation
    const signedDelegation = await delegation.createAndSignDelegation(
      smartAccount.smartAccount,
      {
        backendAddress: BACKEND_ADDRESS,
        veriCredSBTAddress: VERICRED_SBT_ADDRESS,
        maxCredentials,
        expiryDays,
      }
    );

    if (!signedDelegation) {
      return;
    }

    // Send to backend
    setSendingToBackend(true);
    try {
      const result = await delegation.sendToBackend(
        signedDelegation,
        smartAccount.address!,
        wallet.address,
        BACKEND_URL
      );

      setDelegationId(result.delegationId || result.id);
    } catch (error: any) {
      console.error('Failed to send to backend:', error);
    } finally {
      setSendingToBackend(false);
    }
  };

  /**
   * Reset all states
   */
  const handleReset = () => {
    wallet.disconnect();
    smartAccount.reset();
    delegation.reset();
    setDelegationId(null);
  };

  // Combined error from any step
  const error = wallet.error || smartAccount.error || delegation.error;

  // Check if all steps completed
  const isComplete = !!delegationId;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Issuer Onboarding</h1>
        <p className="text-muted-foreground">
          Grant VeriCred+ permission to issue credentials on your behalf with strict security controls
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* STEP 1: Connect Wallet */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Step 1: Connect MetaMask Wallet
          </CardTitle>
          <CardDescription>
            Connect your MetaMask wallet to authenticate
          </CardDescription>
        </CardHeader>
        <CardContent>
          {wallet.isConnected ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Connected Wallet</p>
                <p className="text-sm text-muted-foreground font-mono">{wallet.address}</p>
              </div>
              <Badge variant="outline" className="bg-green-50">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              VeriCred+ will never have access to your private keys or wallet
            </p>
          )}
        </CardContent>
        <CardFooter>
          {!wallet.isConnected ? (
            <Button
              onClick={handleConnectWallet}
              disabled={wallet.isConnecting}
              className="w-full"
            >
              {wallet.isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect MetaMask
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleReset} variant="outline" className="w-full">
              Disconnect
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* STEP 2: Create Smart Account */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Step 2: Create Smart Account
          </CardTitle>
          <CardDescription>
            Your smart account enables secure delegation features
          </CardDescription>
        </CardHeader>
        <CardContent>
          {smartAccount.address ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Smart Account Address</p>
                  <p className="text-sm text-muted-foreground font-mono">{smartAccount.address}</p>
                </div>
                <Badge variant="outline" className="bg-green-50">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Created
                </Badge>
              </div>
              {!smartAccount.isDeployed && (
                <p className="text-xs text-muted-foreground">
                  Note: Smart account will be deployed on first use (delegation signing)
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              A smart account enables gasless transactions and delegation
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleCreateSmartAccount}
            disabled={!wallet.isConnected || !!smartAccount.address || smartAccount.isCreating}
            className="w-full"
          >
            {smartAccount.isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Smart Account...
              </>
            ) : smartAccount.address ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Smart Account Created
              </>
            ) : (
              'Create Smart Account'
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* STEP 3: Grant Delegation */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Step 3: Grant Delegation
          </CardTitle>
          <CardDescription>
            Configure and authorize VeriCred+ to mint credentials on your behalf
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxCredentials">Maximum Credentials</Label>
              <Input
                id="maxCredentials"
                type="number"
                value={maxCredentials}
                onChange={(e) => setMaxCredentials(parseInt(e.target.value))}
                disabled={isComplete}
                min={1}
                max={1000}
              />
              <p className="text-xs text-muted-foreground">
                Max credentials backend can issue
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDays">Expiry Period (Days)</Label>
              <Input
                id="expiryDays"
                type="number"
                value={expiryDays}
                onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                disabled={isComplete}
                min={1}
                max={90}
              />
              <p className="text-xs text-muted-foreground">
                Delegation expires after this period
              </p>
            </div>
          </div>

          {isComplete && delegationId && (
            <Alert className="bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">Delegation Created Successfully!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Delegation ID: <span className="font-mono">{delegationId}</span>
                </p>
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">Security Controls:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Only VeriCredSBT contract can be called</li>
              <li>Only mintCredential function is allowed</li>
              <li>Limited to {maxCredentials} credentials maximum</li>
              <li>Automatically expires after {expiryDays} days</li>
              <li>AI fraud analysis before every issuance</li>
              <li>You can revoke anytime</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleGrantDelegation}
            disabled={
              !smartAccount.smartAccount ||
              isComplete ||
              delegation.isCreating ||
              delegation.isSigning ||
              sendingToBackend
            }
            className="w-full"
          >
            {delegation.isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Delegation...
              </>
            ) : delegation.isSigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please sign in MetaMask...
              </>
            ) : sendingToBackend ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending to backend...
              </>
            ) : isComplete ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Delegation Granted
              </>
            ) : (
              'Grant Delegation to VeriCred+'
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Success Message */}
      {isComplete && (
        <Alert className="bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">✅ Onboarding Complete!</p>
            <p className="text-sm text-muted-foreground mt-2">
              You can now issue credentials through VeriCred+. The platform will use AI fraud analysis
              and redeem your delegation to mint credentials on your behalf.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
