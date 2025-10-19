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

  /**
   * Mint credential using delegation
   * Note: The delegation parameter is used for tracking/logging only.
   * The actual transaction is executed by the backend wallet which has ISSUER_ROLE.
   */
  async mintCredentialWithDelegation(params: {
    delegation: any; // Delegation object (for tracking only)
    recipientAddress: Address;
    credentialType: string;
    metadataURI: string;
    credentialHash: string;
  }): Promise<{ tokenId: string; txHash: Hex }> {
    if (!this.walletClient || !this.publicClient) {
      throw new Error('Backend wallet not initialized');
    }

    const VERICRED_SBT_ADDRESS = process.env.NEXT_PUBLIC_VERICRED_SBT_ADDRESS as Address;
    if (!VERICRED_SBT_ADDRESS) {
      throw new Error('VERICRED_SBT_ADDRESS not configured in environment');
    }

    console.log('[Backend Wallet] Minting credential:', {
      recipient: params.recipientAddress,
      type: params.credentialType,
      metadataURI: params.metadataURI,
      contract: VERICRED_SBT_ADDRESS,
    });

    // Calculate expiration time (1 year from now)
    const expirationTime = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);

    try {
      // Call mintCredential on VeriCredSBT contract
      const { request } = await this.publicClient.simulateContract({
        address: VERICRED_SBT_ADDRESS,
        abi: [
          {
            type: 'function',
            name: 'mintCredential',
            inputs: [
              { name: 'recipient', type: 'address' },
              { name: 'credentialType', type: 'string' },
              { name: 'metadataURI', type: 'string' },
              { name: 'expirationTime', type: 'uint256' },
            ],
            outputs: [{ name: 'tokenId', type: 'uint256' }],
            stateMutability: 'nonpayable',
          },
        ],
        functionName: 'mintCredential',
        args: [
          params.recipientAddress,
          params.credentialType,
          params.metadataURI,
          BigInt(expirationTime),
        ],
        account: this.backendAddress!,
      });

      // Execute the transaction
      const hash = await this.walletClient.writeContract(request);

      console.log('[Backend Wallet] Transaction sent:', hash);

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      console.log('[Backend Wallet] Transaction confirmed:', {
        hash,
        blockNumber: receipt.blockNumber,
        status: receipt.status,
      });

      if (receipt.status !== 'success') {
        throw new Error('Transaction failed');
      }

      // Extract tokenId from logs
      // The CredentialMinted event signature
      const credentialMintedTopic = '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925'; // Adjust if needed

      // Find the relevant log and decode tokenId
      // For now, we'll parse it from the first log's topics
      const tokenId = receipt.logs[0]?.topics[1]
        ? BigInt(receipt.logs[0].topics[1]).toString()
        : '0';

      console.log('[Backend Wallet] Credential minted successfully:', {
        tokenId,
        txHash: hash,
      });

      return {
        tokenId,
        txHash: hash,
      };
    } catch (error: any) {
      console.error('[Backend Wallet] Failed to mint credential:', error);
      throw new Error(`Failed to mint credential: ${error.message || 'Unknown error'}`);
    }
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
