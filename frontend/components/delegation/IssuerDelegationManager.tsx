/**
 * Issuer Delegation Manager Component (Frontend)
 * 
 * UI for issuers to:
 * 1. Connect MetaMask wallet
 * 2. Create smart account
 * 3. Grant delegation to VeriCred+ backend
 * 4. Manage active delegations
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Wallet, Shield } from 'lucide-react';
import { walletService } from '@/lib/delegation/wallet';
import { delegationService } from '@/lib/delegation/delegation.service';
import type { Address } from 'viem';

// Backend configuration
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
const BACKEND_ADDRESS = process.env.NEXT_PUBLIC_BACKEND_ADDRESS as Address;
const VERICRED_SBT_ADDRESS = process.env.NEXT_PUBLIC_VERICRED_SBT_ADDRESS as Address;

export function IssuerDelegationManager() {
  // Wallet state
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<Address | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Smart account state
  const [smartAccountAddress, setSmartAccountAddress] = useState<Address | null>(null);
  const [isCreatingSmartAccount, setIsCreatingSmartAccount] = useState(false);
  const [smartAccountCreated, setSmartAccountCreated] = useState(false);

  // Delegation state
  const [maxCredentials, setMaxCredentials] = useState(100);
  const [expiryDays, setExpiryDays] = useState(30);
  const [isCreatingDelegation, setIsCreatingDelegation] = useState(false);
  const [delegationId, setDelegationId] = useState<string | null>(null);
  const [delegationCreated, setDelegationCreated] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Check if wallet is already connected
  useEffect(() => {
    const connection = walletService.getConnection();
    if (connection) {
      setIsConnected(true);
      setWalletAddress(connection.address);
    }
  }, []);

  /**
   * Step 1: Connect MetaMask wallet
   */
  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const connection = await walletService.connect();
      setIsConnected(true);
      setWalletAddress(connection.address);
      console.log('Wallet connected:', connection.address);
    } catch (err: any) {
      console.error('Failed to connect wallet:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Step 2: Create smart account
   */
  const handleCreateSmartAccount = async () => {
    setIsCreatingSmartAccount(true);
    setError(null);

    try {
      const smartAccountInfo = await delegationService.createSmartAccount();
      setSmartAccountAddress(smartAccountInfo.address);
      setSmartAccountCreated(true);
      console.log('Smart account created:', smartAccountInfo.address);
    } catch (err: any) {
      console.error('Failed to create smart account:', err);
      setError(err.message || 'Failed to create smart account');
    } finally {
      setIsCreatingSmartAccount(false);
    }
  };

  /**
   * Step 3: Create and sign delegation, send to backend
   */
  const handleGrantDelegation = async () => {
    setIsCreatingDelegation(true);
    setError(null);

    try {
      const result = await delegationService.completeOnboarding({
        backendAddress: BACKEND_ADDRESS,
        veriCredSBTAddress: VERICRED_SBT_ADDRESS,
        backendUrl: BACKEND_URL,
        maxCredentials,
        expiryDays,
      });

      setDelegationId(result.delegationId);
      setDelegationCreated(true);
      console.log('Delegation granted:', result.delegationId);
    } catch (err: any) {
      console.error('Failed to grant delegation:', err);
      setError(err.message || 'Failed to grant delegation');
    } finally {
      setIsCreatingDelegation(false);
    }
  };

  /**
   * Disconnect wallet
   */
  const handleDisconnect = () => {
    walletService.disconnect();
    setIsConnected(false);
    setWalletAddress(null);
    setSmartAccountAddress(null);
    setSmartAccountCreated(false);
    setDelegationCreated(false);
    setDelegationId(null);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Issuer Onboarding</h1>
        <p className="text-muted-foreground">
          Grant VeriCred+ the authority to issue credentials on your behalf with strict security controls
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Connect Wallet */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Step 1: Connect MetaMask Wallet
          </CardTitle>
          <CardDescription>
            Connect your MetaMask wallet to authenticate and create your issuer profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Connected Wallet</p>
                <p className="text-sm text-muted-foreground font-mono">{walletAddress}</p>
              </div>
              <Badge variant="outline" className="bg-green-50">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">
              VeriCred+ will never have access to your private keys or wallet
            </p>
          )}
        </CardContent>
        <CardFooter>
          {!isConnected ? (
            <Button onClick={handleConnectWallet} disabled={isConnecting} className="w-full">
              {isConnecting ? (
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
            <Button onClick={handleDisconnect} variant="outline" className="w-full">
              Disconnect Wallet
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Step 2: Create Smart Account */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Step 2: Create Smart Account
          </CardTitle>
          <CardDescription>
            Your smart account enables secure delegation with advanced features like gasless transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {smartAccountCreated ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Smart Account Address</p>
                <p className="text-sm text-muted-foreground font-mono">{smartAccountAddress}</p>
              </div>
              <Badge variant="outline" className="bg-green-50">
                <CheckCircle className="h-3 w-3 mr-1" />
                Created
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">
              Smart account deployment happens automatically on first use
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleCreateSmartAccount}
            disabled={!isConnected || smartAccountCreated || isCreatingSmartAccount}
            className="w-full"
          >
            {isCreatingSmartAccount ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Smart Account...
              </>
            ) : smartAccountCreated ? (
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

      {/* Step 3: Grant Delegation */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Step 3: Grant Delegation</CardTitle>
          <CardDescription>
            Configure delegation parameters and authorize VeriCred+ to mint credentials on your behalf
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
                disabled={delegationCreated}
                min={1}
                max={1000}
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of credentials that can be issued
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDays">Expiry Period (Days)</Label>
              <Input
                id="expiryDays"
                type="number"
                value={expiryDays}
                onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                disabled={delegationCreated}
                min={1}
                max={90}
              />
              <p className="text-xs text-muted-foreground">
                Delegation expires after this period
              </p>
            </div>
          </div>

          {delegationCreated && delegationId && (
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
              <li>AI fraud analysis before every credential issuance</li>
              <li>You can revoke delegation anytime</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleGrantDelegation}
            disabled={!smartAccountCreated || delegationCreated || isCreatingDelegation}
            className="w-full"
          >
            {isCreatingDelegation ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Granting Delegation...
              </>
            ) : delegationCreated ? (
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
      {delegationCreated && (
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
