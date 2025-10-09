/**
 * Wallet Connection Hook
 *
 * Handles MetaMask wallet connection for users.
 * This is the FIRST step - user connects wallet before anything else.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createWalletClient, createPublicClient, custom, http, type Address } from 'viem';
import { monadTestnet } from './chains';

export interface WalletState {
  address: Address | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  chainId: number | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    chainId: null,
  });

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;

      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        }) as Address[];

        if (accounts.length > 0) {
          setState(prev => ({
            ...prev,
            address: accounts[0],
            isConnected: true,
          }));
        }
      } catch (error) {
        console.error('Failed to check wallet connection:', error);
      }
    };

    checkConnection();
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState(prev => ({
        ...prev,
        error: 'MetaMask not installed. Please install MetaMask to continue.',
      }));
      return null;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as Address[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      const address = accounts[0];

      // Switch to Monad testnet
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${monadTestnet.id.toString(16)}` }],
        });
      } catch (switchError: any) {
        // Chain not added, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${monadTestnet.id.toString(16)}`,
              chainName: monadTestnet.name,
              nativeCurrency: monadTestnet.nativeCurrency,
              rpcUrls: [monadTestnet.rpcUrls.default.http[0]],
              blockExplorerUrls: [monadTestnet.blockExplorers.default.url],
            }],
          });
        } else {
          throw switchError;
        }
      }

      setState({
        address,
        isConnected: true,
        isConnecting: false,
        error: null,
        chainId: monadTestnet.id,
      });

      return address;
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      setState({
        address: null,
        isConnected: false,
        isConnecting: false,
        error: error.message || 'Failed to connect wallet',
        chainId: null,
      });
      return null;
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setState({
      address: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      chainId: null,
    });
  }, []);

  // Get wallet client for signing
  const getWalletClient = useCallback(() => {
    if (!state.address || !window.ethereum) return null;

    return createWalletClient({
      account: state.address,
      chain: monadTestnet,
      transport: custom(window.ethereum),
    });
  }, [state.address]);

  // Get public client for reading
  const getPublicClient = useCallback(() => {
    return createPublicClient({
      chain: monadTestnet,
      transport: http(),
    });
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    getWalletClient,
    getPublicClient,
  };
}

// Type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
