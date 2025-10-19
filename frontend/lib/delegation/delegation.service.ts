/**
 * Smart Account & Delegation Service (Frontend)
 * 
 * This is where users:
 * 1. Create their MetaMask Smart Account
 * 2. Build delegations with caveats
 * 3. Sign delegations with their smart account
 * 4. Send signed delegations to backend
 * 
 * The backend NEVER has access to user's private keys or wallet.
 */

import {
  toMetaMaskSmartAccount,
  createDelegation,
  getDeleGatorEnvironment,
  Implementation,
  type MetaMaskSmartAccount,
  type Delegation,
  type DeleGatorEnvironment,
  type Caveat,
} from '@metamask/delegation-toolkit';
import { createCaveatBuilder } from '@metamask/delegation-toolkit/utils';
import type { Address, Hex, PublicClient } from 'viem';
import { walletService } from './wallet';
import { monadTestnet } from './chains';
import { generateAuthMessage } from '@/lib/auth/signature-auth';

export interface SmartAccountInfo {
  address: Address;
  implementation: 'Hybrid';
  isDeployed: boolean;
}

export interface DelegationRequest {
  delegation: Delegation;
  signature: Hex;
  issuerAddress: Address;
  smartAccountAddress: Address;
  maxCalls?: number;
  expiresAt?: Date;
}

class DelegationService {
  private smartAccount: MetaMaskSmartAccount | null = null;
  private environment: DeleGatorEnvironment;

  constructor() {
    this.environment = getDeleGatorEnvironment(monadTestnet.id);
  }

  /**
   * Create or retrieve user's smart account
   * This runs in the BROWSER, not on backend
   */
  async createSmartAccount(): Promise<SmartAccountInfo> {
    const connection = walletService.getConnection();
    if (!connection) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    console.log('Creating smart account for user:', connection.address);

    // Create Hybrid smart account (EOA + passkeys support)
    this.smartAccount = await toMetaMaskSmartAccount({
      client: connection.publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [
        connection.address, // User's EOA as owner
        [], // No P256 key IDs (can add passkeys later)
        [], // No P256 X values
        [], // No P256 Y values
      ],
      deploySalt: '0x0000000000000000000000000000000000000000000000000000000000000001',
      signer: {
        walletClient: connection.walletClient,
      },
    });

    console.log('Smart account created:', this.smartAccount.address);

    // Check if smart account is deployed
    const bytecode = await connection.publicClient.getBytecode({
      address: this.smartAccount.address,
    });

    const isDeployed = bytecode !== undefined && bytecode !== '0x';

    return {
      address: this.smartAccount.address,
      implementation: 'Hybrid',
      isDeployed,
    };
  }

  /**
   * Get existing smart account
   */
  getSmartAccount(): MetaMaskSmartAccount | null {
    return this.smartAccount;
  }

  /**
   * Create a delegation to VeriCred+ backend
   * User specifies how many credentials and for how long
   */
  async createDelegationToBackend(params: {
    backendAddress: Address;
    veriCredSBTAddress: Address;
    maxCredentials: number;
    expiryDays: number;
  }): Promise<Omit<Delegation, 'signature'>> {
    if (!this.smartAccount) {
      throw new Error('Smart account not created. Call createSmartAccount first.');
    }

    const connection = walletService.getConnection();
    if (!connection) {
      throw new Error('Wallet not connected');
    }

    console.log('Creating delegation with params:', params);

    // Calculate timestamps
    const now = Math.floor(Date.now() / 1000);
    const expiryTimestamp = now + params.expiryDays * 24 * 60 * 60;

    // Build caveats using caveat builder
    const caveatBuilder = createCaveatBuilder(this.smartAccount.environment);

    // 1. Only allow VeriCredSBT contract
    caveatBuilder.addCaveat('allowedTargets', {
      targets: [params.veriCredSBTAddress],
    });

    // 2. Only allow mintCredential function
    caveatBuilder.addCaveat('allowedMethods', {
      selectors: ['0x83115c5b'], // keccak256 hash of "mintCredential(address,string,string,uint256,uint256)"
    });

    // 3. Limit number of credentials
    caveatBuilder.addCaveat('limitedCalls', {
      limit: params.maxCredentials,
    });

    // 4. Time window
    caveatBuilder.addCaveat('timestamp', {
      afterThreshold: now,
      beforeThreshold: expiryTimestamp,
    });

    const caveats = caveatBuilder.build();

    console.log('Caveats built:', caveats);

    // Create delegation from user's smart account to backend
    const delegation = createDelegation({
      from: this.smartAccount.address, // User's smart account
      to: params.backendAddress, // VeriCred+ backend
      environment: this.smartAccount.environment,
      scope: {
        type: 'functionCall',
        targets: [params.veriCredSBTAddress],
        selectors: ['0x83115c5b'], // Function selector for mintCredential
      },
      caveats,
    });

    console.log('Delegation created (unsigned):', delegation);

    return delegation;
  }

  /**
   * Sign the delegation with user's smart account
   * This happens in the browser, user approves via MetaMask
   */
  async signDelegation(delegation: Omit<Delegation, 'signature'>): Promise<Hex> {
    if (!this.smartAccount) {
      throw new Error('Smart account not created');
    }

    console.log('Requesting user to sign delegation...');
    console.log('Delegation to sign:', JSON.stringify(delegation, null, 2));
    console.log('Smart account address:', this.smartAccount.address);

    try {
      // User signs delegation with their smart account
      // This should trigger MetaMask popup for EIP-712 signing
      console.log('Calling smartAccount.signDelegation...');

      const signature = await this.smartAccount.signDelegation({
        delegation,
      });

      console.log('✅ Delegation signed successfully!');
      console.log('Signature:', signature);

      return signature;
    } catch (error: any) {
      console.error('❌ Delegation signing failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error:', error);

      // Check if user rejected
      if (error.code === 4001 || error.message?.includes('User rejected')) {
        throw new Error('User rejected the delegation signature request');
      }

      // Other errors
      throw new Error(`Failed to sign delegation: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Complete flow: Create delegation and sign it
   * Returns signed delegation ready to send to backend
   */
  async createAndSignDelegation(params: {
    backendAddress: Address;
    veriCredSBTAddress: Address;
    maxCredentials: number;
    expiryDays: number;
  }): Promise<DelegationRequest> {
    const connection = walletService.getConnection();
    if (!connection) {
      throw new Error('Wallet not connected');
    }

    if (!this.smartAccount) {
      throw new Error('Smart account not created');
    }

    // 1. Create unsigned delegation
    const unsignedDelegation = await this.createDelegationToBackend(params);

    // 2. User signs delegation
    const signature = await this.signDelegation(unsignedDelegation);

    // 3. Combine into signed delegation
    const signedDelegation: Delegation = {
      ...unsignedDelegation,
      signature,
    };

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + params.expiryDays);

    return {
      delegation: signedDelegation,
      signature,
      issuerAddress: connection.address,
      smartAccountAddress: this.smartAccount.address,
      maxCalls: params.maxCredentials,
      expiresAt,
    };
  }

  /**
   * Send signed delegation to backend
   * Backend will store it and use it to mint credentials
   */
  async sendDelegationToBackend(
    delegationRequest: DelegationRequest,
    backendUrl: string
  ): Promise<{ delegationId: string; success: boolean }> {
    console.log('Sending delegation to backend:', backendUrl);

    // Get wallet connection for signing auth message
    const connection = walletService.getConnection();
    if (!connection) {
      throw new Error('Wallet not connected');
    }

    // Create authentication signature
    const timestamp = Date.now();
    const authMessage = generateAuthMessage(timestamp);

    // Sign with user's wallet (EOA, not smart account)
    const authSignature = await connection.walletClient.signMessage({
      account: connection.address,
      message: authMessage,
    });

    const response = await fetch(`${backendUrl}/api/delegations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-address': delegationRequest.issuerAddress,
        'x-signature': authSignature,
        'x-timestamp': timestamp.toString(),
      },
      body: JSON.stringify({
        delegation: delegationRequest.delegation,
        smartAccountAddress: delegationRequest.smartAccountAddress,
        maxCalls: delegationRequest.maxCalls,
        expiresAt: delegationRequest.expiresAt?.toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send delegation to backend');
    }

    const result = await response.json();
    console.log('Delegation stored on backend:', result.delegationId);

    return {
      delegationId: result.delegationId,
      success: true,
    };
  }

  /**
   * Complete onboarding flow
   * 1. Connect wallet
   * 2. Create smart account
   * 3. Create and sign delegation
   * 4. Send to backend
   */
  async completeOnboarding(params: {
    backendAddress: Address;
    veriCredSBTAddress: Address;
    backendUrl: string;
    maxCredentials?: number;
    expiryDays?: number;
  }): Promise<{
    smartAccountAddress: Address;
    delegationId: string;
    success: boolean;
  }> {
    // 1. Ensure wallet is connected
    const connection = walletService.getConnection();
    if (!connection) {
      await walletService.connect();
    }

    // 2. Create smart account
    const smartAccountInfo = await this.createSmartAccount();

    // 3. Create and sign delegation
    const delegationRequest = await this.createAndSignDelegation({
      backendAddress: params.backendAddress,
      veriCredSBTAddress: params.veriCredSBTAddress,
      maxCredentials: params.maxCredentials || 100,
      expiryDays: params.expiryDays || 30,
    });

    // 4. Send to backend
    const result = await this.sendDelegationToBackend(
      delegationRequest,
      params.backendUrl
    );

    return {
      smartAccountAddress: smartAccountInfo.address,
      delegationId: result.delegationId,
      success: true,
    };
  }

  /**
   * Get delegation details from backend
   */
  async getDelegationStatus(
    delegationId: string,
    backendUrl: string
  ): Promise<{
    isActive: boolean;
    usageCount: number;
    maxUsage: number;
    expiresAt: Date;
  }> {
    const response = await fetch(`${backendUrl}/api/delegations/${delegationId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch delegation status');
    }

    return await response.json();
  }

  /**
   * Revoke delegation
   * User signs revocation transaction
   */
  async revokeDelegation(
    delegationId: string,
    backendUrl: string
  ): Promise<{ success: boolean }> {
    const connection = walletService.getConnection();
    if (!connection) {
      throw new Error('Wallet not connected');
    }

    const response = await fetch(`${backendUrl}/api/delegations/${delegationId}/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        issuerAddress: connection.address,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to revoke delegation');
    }

    return await response.json();
  }
}

// Export singleton instance
export const delegationService = new DelegationService();
