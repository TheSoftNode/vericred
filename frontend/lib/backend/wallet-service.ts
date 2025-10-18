/**
 * Backend Wallet Service
 * Manages the backend wallet that executes delegated operations
 *
 * SECURITY: Private key should be in environment variable, NOT in code
 */

import {
  createWalletClient,
  createPublicClient,
  http,
  type Address,
  type Hex,
  type WalletClient,
  type PublicClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from '../delegation/chains';

class BackendWalletService {
  private walletClient: WalletClient | null = null;
  private publicClient: PublicClient | null = null;
  private backendAddress: Address | null = null;

  /**
   * Initialize backend wallet
   * CRITICAL: Only call this on server-side (API routes)
   */
  async initialize(): Promise<void> {
    if (this.walletClient) {
      return; // Already initialized
    }

    // Get private key from environment
    const privateKey = process.env.BACKEND_PRIVATE_KEY as Hex;

    if (!privateKey) {
      throw new Error(
        'BACKEND_PRIVATE_KEY not set in environment variables. This is required for delegated operations.'
      );
    }

    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      throw new Error(
        'Invalid BACKEND_PRIVATE_KEY format. Must be 0x-prefixed hex string of 64 characters.'
      );
    }

    // Create account from private key
    const account = privateKeyToAccount(privateKey);
    this.backendAddress = account.address;

    console.log('🔑 Backend wallet initialized:', this.backendAddress);

    // Create wallet client
    this.walletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http(process.env.MONAD_TESTNET_RPC || monadTestnet.rpcUrls.default.http[0]),
    });

    // Create public client
    this.publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(process.env.MONAD_TESTNET_RPC || monadTestnet.rpcUrls.default.http[0]),
    });

    // Check balance
    const balance = await this.publicClient.getBalance({
      address: this.backendAddress,
    });

    console.log(`💰 Backend wallet balance: ${balance} wei`);

    if (balance === 0n) {
      console.warn('⚠️  WARNING: Backend wallet has zero balance. Cannot execute transactions!');
    }
  }

  /**
   * Get backend wallet address
   */
  getAddress(): Address {
    if (!this.backendAddress) {
      throw new Error('Backend wallet not initialized. Call initialize() first.');
    }

    return this.backendAddress;
  }

  /**
   * Get wallet client
   */
  getWalletClient(): WalletClient {
    if (!this.walletClient) {
      throw new Error('Backend wallet not initialized. Call initialize() first.');
    }

    return this.walletClient;
  }

  /**
   * Get public client
   */
  getPublicClient(): PublicClient {
    if (!this.publicClient) {
      throw new Error('Backend wallet not initialized. Call initialize() first.');
    }

    return this.publicClient;
  }

  /**
   * Check if wallet is initialized
   */
  isInitialized(): boolean {
    return this.walletClient !== null;
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<bigint> {
    if (!this.publicClient || !this.backendAddress) {
      throw new Error('Backend wallet not initialized');
    }

    return await this.publicClient.getBalance({
      address: this.backendAddress,
    });
  }

  /**
   * Check if wallet has sufficient balance for gas
   */
  async hasSufficientBalance(estimatedGas: bigint = 500000n): Promise<boolean> {
    const balance = await this.getBalance();
    const gasPrice = await this.publicClient!.getGasPrice();
    const estimatedCost = estimatedGas * gasPrice;

    return balance >= estimatedCost;
  }
}

// Singleton instance
let backendWalletInstance: BackendWalletService | null = null;

/**
 * Get backend wallet service (singleton)
 */
export function getBackendWallet(): BackendWalletService {
  if (!backendWalletInstance) {
    backendWalletInstance = new BackendWalletService();
  }

  return backendWalletInstance;
}

/**
 * Initialize backend wallet (call once at startup)
 */
export async function initializeBackendWallet(): Promise<void> {
  const wallet = getBackendWallet();
  await wallet.initialize();
}

export { BackendWalletService };
