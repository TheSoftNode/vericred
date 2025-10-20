/**
 * Signature-Based Authentication
 * Verifies wallet ownership via signed messages
 */

import { type Address, type Hex, verifyMessage } from 'viem';

export interface AuthHeaders {
  'x-address': string;
  'x-signature': string;
  'x-timestamp': string;
  'x-message'?: string;
}

export interface AuthResult {
  address: Address;
  timestamp: number;
  isValid: boolean;
}

/**
 * Generate message for user to sign
 */
export function generateAuthMessage(timestamp: number): string {
  return `VeriCred+ Authentication\n\nTimestamp: ${timestamp}\n\nThis signature proves you own this wallet address.`;
}

/**
 * Verify signed authentication message
 */
export async function verifyAuthSignature(
  address: string,
  signature: string,
  timestamp: string,
  customMessage?: string
): Promise<AuthResult> {
  try {
    const timestampNum = parseInt(timestamp);
    const now = Date.now();

    // Check timestamp (30 minute window - extended for demo)
    const MAX_AGE = 30 * 60 * 1000; // 30 minutes
    if (now - timestampNum > MAX_AGE) {
      return {
        address: address as Address,
        timestamp: timestampNum,
        isValid: false,
      };
    }

    // Verify signature
    const message = customMessage || generateAuthMessage(timestampNum);

    const isValid = await verifyMessage({
      address: address as Address,
      message,
      signature: signature as Hex,
    });

    return {
      address: address as Address,
      timestamp: timestampNum,
      isValid,
    };
  } catch (error) {
    console.error('Signature verification error:', error);
    return {
      address: address as Address,
      timestamp: parseInt(timestamp),
      isValid: false,
    };
  }
}

/**
 * Extract and verify auth from request headers
 */
export async function authenticateRequest(
  headers: Headers
): Promise<{ address: Address } | null> {
  const address = headers.get('x-address');
  const signature = headers.get('x-signature');
  const timestamp = headers.get('x-timestamp');
  const customMessage = headers.get('x-message') || undefined;

  if (!address || !signature || !timestamp) {
    return null;
  }

  const result = await verifyAuthSignature(
    address,
    signature,
    timestamp,
    customMessage
  );

  if (!result.isValid) {
    return null;
  }

  return { address: result.address };
}

/**
 * Create authentication headers (client-side utility)
 */
export function createAuthHeaders(
  address: string,
  signature: string,
  timestamp: number
): Record<string, string> {
  return {
    'x-address': address,
    'x-signature': signature,
    'x-timestamp': timestamp.toString(),
    'x-message': generateAuthMessage(timestamp),
  };
}
