/**
 * Smart Account Hook
 *
 * Creates MetaMask Smart Account for users.
 * This is STEP 2 - after wallet connection.
 *
 * Based on MetaMask Delegation Toolkit docs:
 * - Creates Hybrid smart account (supports EOA owner)
 * - Smart account enables delegation features
 */

'use client';

import { useState, useCallback } from 'react';
import {
  toMetaMaskSmartAccount,
  getDeleGatorEnvironment,
  Implementation,
  type MetaMaskSmartAccount,
} from '@metamask/delegation-toolkit';
import type { Address, PublicClient, WalletClient } from 'viem';
import { monadTestnet } from './chains';

export interface SmartAccountState {
  smartAccount: MetaMaskSmartAccount | null;
  address: Address | null;
  isCreating: boolean;
  isDeployed: boolean;
  error: string | null;
}

export function useSmartAccount() {
  const [state, setState] = useState<SmartAccountState>({
    smartAccount: null,
    address: null,
    isCreating: false,
    isDeployed: false,
    error: null,
  });

  /**
   * Create smart account for the user
   *
   * Flow from MetaMask docs:
   * 1. Get delegation environment for chain
   * 2. Create Hybrid smart account
   * 3. Check if it's deployed
   */
  const createSmartAccount = useCallback(async (
    walletClient: WalletClient,
    publicClient: PublicClient,
    ownerAddress: Address
  ) => {
    setState(prev => ({ ...prev, isCreating: true, error: null }));

    try {
      console.log('Creating smart account for:', ownerAddress);

      // Get delegation environment for Monad testnet
      const environment = getDeleGatorEnvironment(monadTestnet.id);

      console.log('Delegation environment:', environment);

      // Create Hybrid smart account
      // Hybrid = supports EOA owner + passkeys
      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [
          ownerAddress,  // User's EOA as owner
          [],            // No P256 key IDs initially
          [],            // No P256 X coordinates
          [],            // No P256 Y coordinates
        ],
        deploySalt: '0x0000000000000000000000000000000000000000000000000000000000000001',
        signer: { walletClient },
      });

      console.log('Smart account created:', smartAccount.address);

      // Check if smart account is already deployed on chain
      const bytecode = await publicClient.getBytecode({
        address: smartAccount.address,
      });

      const isDeployed = bytecode !== undefined && bytecode !== '0x';

      console.log('Smart account deployed:', isDeployed);

      setState({
        smartAccount,
        address: smartAccount.address,
        isCreating: false,
        isDeployed,
        error: null,
      });

      return smartAccount;
    } catch (error: any) {
      console.error('Failed to create smart account:', error);
      setState({
        smartAccount: null,
        address: null,
        isCreating: false,
        isDeployed: false,
        error: error.message || 'Failed to create smart account',
      });
      return null;
    }
  }, []);

  /**
   * Reset smart account state
   */
  const reset = useCallback(() => {
    setState({
      smartAccount: null,
      address: null,
      isCreating: false,
      isDeployed: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    createSmartAccount,
    reset,
  };
}
