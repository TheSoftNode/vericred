/**
 * Wallet Connection & Authentication Service (Frontend)
 * 
 * Handles MetaMask wallet connection, user authentication, and session management.
 * This is where users authenticate - NOT on the backend.
 */

import { createPublicClient, createWalletClient, custom, http, type Address, type WalletClient, type PublicClient, type Account } from 'viem';
import { monadTestnet } from './chains';

export interface WalletConnection {
  address: Address;
  chainId: number;
  isConnected: boolean;
  walletClient: WalletClient<any, any, Account>;
  publicClient: PublicClient;
}

class WalletService {
  private walletClient: WalletClient<any, any, Account> | null = null;
  private publicClient: PublicClient | null = null;
  private currentAddress: Address | null = null;

  /**
   * Connect to MetaMask wallet
   * This is the user authentication entry point
   */
  async connect(): Promise<WalletConnection> {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed. Please install MetaMask to continue.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as Address[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      this.currentAddress = accounts[0];

      // Create wallet client using MetaMask provider
      this.walletClient = createWalletClient({
        account: this.currentAddress!,
        chain: monadTestnet,
        transport: custom(window.ethereum),
      }) as WalletClient<any, any, Account>;

      // Create public client for reading blockchain state
      this.publicClient = createPublicClient({
        chain: monadTestnet,
        transport: http(),
      }) as PublicClient;

      // Switch to Monad testnet if not already
      await this.switchToMonadTestnet();

      // Setup event listeners for account/network changes
      this.setupEventListeners();

      console.log('Wallet connected:', this.currentAddress);

      return {
        address: this.currentAddress,
        chainId: monadTestnet.id,
        isConnected: true,
        walletClient: this.walletClient!,
        publicClient: this.publicClient,
      };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.walletClient = null;
    this.publicClient = null;
    this.currentAddress = null;
    
    // Remove event listeners
    if (window.ethereum && (window.ethereum as any).removeAllListeners) {
      (window.ethereum as any).removeAllListeners();
    }

    console.log('Wallet disconnected');
  }

  /**
   * Get current wallet connection
   */
  getConnection(): WalletConnection | null {
    if (!this.walletClient || !this.publicClient || !this.currentAddress) {
      return null;
    }

    return {
      address: this.currentAddress,
      chainId: monadTestnet.id,
      isConnected: true,
      walletClient: this.walletClient,
      publicClient: this.publicClient!,
    };
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.currentAddress !== null && this.walletClient !== null;
  }

  /**
   * Get current address
   */
  getAddress(): Address | null {
    return this.currentAddress;
  }

  /**
   * Get wallet client (for signing)
   */
  getWalletClient(): WalletClient<any, any, Account> | null {
    return this.walletClient;
  }

  /**
   * Get public client (for reading)
   */
  getPublicClient(): PublicClient | null {
    return this.publicClient;
  }

  /**
   * Switch to Monad testnet
   */
  private async switchToMonadTestnet(): Promise<void> {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${monadTestnet.id.toString(16)}` }],
      });
    } catch (switchError: any) {
      // Chain not added, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${monadTestnet.id.toString(16)}`,
                chainName: monadTestnet.name,
                nativeCurrency: monadTestnet.nativeCurrency,
                rpcUrls: [monadTestnet.rpcUrls.default.http[0]],
                blockExplorerUrls: [monadTestnet.blockExplorers.default.url],
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add Monad testnet:', addError);
          throw addError;
        }
      } else {
        throw switchError;
      }
    }
  }

  /**
   * Setup event listeners for wallet changes
   */
  private setupEventListeners(): void {
    if (!window.ethereum) return;

    // Account changed
    (window.ethereum as any).on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected wallet
        this.disconnect();
        window.location.reload();
      } else {
        // User switched accounts
        console.log('Account changed:', accounts[0]);
        window.location.reload();
      }
    });

    // Chain changed
    (window.ethereum as any).on('chainChanged', (chainId: string) => {
      console.log('Chain changed:', chainId);
      window.location.reload();
    });
  }

  /**
   * Sign message with connected wallet
   */
  async signMessage(message: string): Promise<`0x${string}`> {
    if (!this.walletClient || !this.currentAddress) {
      throw new Error('Wallet not connected');
    }

    return await this.walletClient.signMessage({
      account: this.currentAddress,
      message,
    });
  }

  /**
   * Sign typed data (EIP-712)
   */
  async signTypedData(typedData: any): Promise<`0x${string}`> {
    if (!this.walletClient || !this.currentAddress) {
      throw new Error('Wallet not connected');
    }

    return await this.walletClient.signTypedData({
      account: this.currentAddress,
      ...typedData,
    });
  }
}

// Export singleton instance
export const walletService = new WalletService();

// Type declarations for window.ethereum removed - defined in auth-context.tsx
