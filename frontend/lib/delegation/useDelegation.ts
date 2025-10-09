/**
 * Delegation Hook
 *
 * Creates and signs delegations to grant backend permission to mint credentials.
 * This is STEP 3 - after smart account creation.
 *
 * Based on PRD and MetaMask Delegation docs:
 * - User creates delegation with specific scopes
 * - Signs delegation with smart account
 * - Sends signed delegation to backend
 * - Backend stores it and uses it to mint credentials later
 */

'use client';

import { useState, useCallback } from 'react';
import {
  createDelegation,
  type Delegation,
  type MetaMaskSmartAccount,
} from '@metamask/delegation-toolkit';
import { createCaveatBuilder } from '@metamask/delegation-toolkit/utils';
import type { Address, Hex } from 'viem';

export interface DelegationParams {
  backendAddress: Address;
  veriCredSBTAddress: Address;
  maxCredentials: number;
  expiryDays: number;
}

export interface SignedDelegation extends Delegation {
  signature: Hex;
}

export interface DelegationState {
  delegation: SignedDelegation | null;
  isCreating: boolean;
  isSigning: boolean;
  error: string | null;
}

export function useDelegation() {
  const [state, setState] = useState<DelegationState>({
    delegation: null,
    isCreating: false,
    isSigning: false,
    error: null,
  });

  /**
   * Create delegation with proper scopes and caveats
   *
   * From PRD: Delegation should allow backend to:
   * - Only call VeriCredSBT contract
   * - Only call mintCredential function
   * - Limited number of times
   * - Time-bounded
   */
  const createAndSignDelegation = useCallback(async (
    smartAccount: MetaMaskSmartAccount,
    params: DelegationParams
  ) => {
    setState(prev => ({ ...prev, isCreating: true, error: null }));

    try {
      console.log('Creating delegation with params:', params);

      // Calculate timestamps
      const now = Math.floor(Date.now() / 1000);
      const expiryTimestamp = now + params.expiryDays * 24 * 60 * 60;

      // Create caveat builder for adding restrictions
      const caveatBuilder = createCaveatBuilder(smartAccount.environment);

      // 1. SCOPE: Only allow VeriCredSBT contract
      caveatBuilder.addCaveat('allowedTargets', {
        targets: [params.veriCredSBTAddress],
      });

      // 2. SCOPE: Only allow mintCredential function
      // Function signature: mintCredential(address,string,string,uint256)
      caveatBuilder.addCaveat('allowedMethods', {
        methods: [{
          target: params.veriCredSBTAddress,
          selector: '0x' + 'mintCredential(address,string,string,uint256)' // Will be hashed properly
        }]
      });

      // 3. SCOPE: Limit number of calls (max credentials)
      caveatBuilder.addCaveat('limitedCalls', {
        limit: params.maxCredentials,
      });

      // 4. SCOPE: Time window
      caveatBuilder.addCaveat('timestamp', {
        notBefore: now,
        notAfter: expiryTimestamp,
      });

      const caveats = caveatBuilder.build();

      console.log('Caveats created:', caveats);

      // Create the delegation
      const delegation = createDelegation({
        from: smartAccount.address,           // User's smart account
        to: params.backendAddress,            // VeriCred+ backend
        environment: smartAccount.environment,
        scope: {
          type: 'functionCall',
          target: params.veriCredSBTAddress,
          selector: 'mintCredential(address,string,string,uint256)',
        },
        caveats,
      });

      console.log('Delegation created (unsigned)');

      // Now sign the delegation
      setState(prev => ({ ...prev, isCreating: false, isSigning: true }));

      console.log('Requesting user to sign delegation...');

      // User signs with their smart account
      // This will show MetaMask popup
      const signature = await smartAccount.signDelegation({ delegation });

      console.log('Delegation signed by user');

      const signedDelegation: SignedDelegation = {
        ...delegation,
        signature,
      };

      setState({
        delegation: signedDelegation,
        isCreating: false,
        isSigning: false,
        error: null,
      });

      return signedDelegation;
    } catch (error: any) {
      console.error('Failed to create/sign delegation:', error);
      setState({
        delegation: null,
        isCreating: false,
        isSigning: false,
        error: error.message || 'Failed to create delegation',
      });
      return null;
    }
  }, []);

  /**
   * Send signed delegation to backend
   */
  const sendToBackend = useCallback(async (
    signedDelegation: SignedDelegation,
    smartAccountAddress: Address,
    issuerAddress: Address,
    backendUrl: string
  ) => {
    try {
      console.log('Sending delegation to backend:', backendUrl);

      const response = await fetch(`${backendUrl}/api/delegations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          delegation: signedDelegation,
          smartAccountAddress,
          issuerAddress,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send delegation to backend');
      }

      const result = await response.json();
      console.log('Delegation stored on backend:', result);

      return result;
    } catch (error: any) {
      console.error('Failed to send delegation to backend:', error);
      throw error;
    }
  }, []);

  /**
   * Reset delegation state
   */
  const reset = useCallback(() => {
    setState({
      delegation: null,
      isCreating: false,
      isSigning: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    createAndSignDelegation,
    sendToBackend,
    reset,
  };
}
