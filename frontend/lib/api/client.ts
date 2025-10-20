/**
 * Authenticated API Client
 * Automatically adds authentication headers to API requests
 */

import { generateAuthMessage } from '@/lib/auth/signature-auth';

// Cache signature for 30 minutes to avoid repeated MetaMask popups during demo
let cachedSignature: { address: string; signature: string; timestamp: number } | null = null;
const SIGNATURE_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export class ApiClient {
  /**
   * Make an authenticated fetch request
   */
  static async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Get accounts from MetaMask
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const accounts = await window.ethereum.request({
      method: 'eth_accounts'
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('Wallet not connected. Please connect your wallet.');
    }

    const address = accounts[0];
    const now = Date.now();

    // Check if we have a valid cached signature
    let authSignature: string;
    let timestamp: number;

    if (cachedSignature &&
        cachedSignature.address === address &&
        (now - cachedSignature.timestamp) < SIGNATURE_CACHE_DURATION) {
      // Use cached signature
      authSignature = cachedSignature.signature;
      timestamp = cachedSignature.timestamp;
      console.log('[ApiClient] Using cached signature');
    } else {
      // Create new authentication signature
      timestamp = now;
      const authMessage = generateAuthMessage(timestamp);

      // Sign with MetaMask
      authSignature = await window.ethereum.request({
        method: 'personal_sign',
        params: [authMessage, address],
      });

      // Cache the signature
      cachedSignature = { address, signature: authSignature, timestamp };
      console.log('[ApiClient] Created new signature (cached for 5 min)');
    }

    // Add auth headers to request
    const headers = {
      'Content-Type': 'application/json',
      'x-address': address,
      'x-signature': authSignature,
      'x-timestamp': timestamp.toString(),
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
    });
  }

  /**
   * GET request with authentication
   */
  static async get(url: string): Promise<Response> {
    return this.fetch(url, { method: 'GET' });
  }

  /**
   * POST request with authentication
   */
  static async post(url: string, body: any): Promise<Response> {
    return this.fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * PUT request with authentication
   */
  static async put(url: string, body: any): Promise<Response> {
    return this.fetch(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request with authentication
   */
  static async delete(url: string): Promise<Response> {
    return this.fetch(url, { method: 'DELETE' });
  }
}
