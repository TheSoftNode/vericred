/**
 * Envio Service
 *
 * Queries Envio HyperIndex GraphQL API for on-chain credential data.
 * Based on schema.graphql from /envio-indexer
 *
 * Key entities:
 * - Credential: Aggregated credential data
 * - Issuer: Issuer statistics
 * - CredentialType: Type statistics
 */

const ENVIO_API_URL = process.env.ENVIO_API_URL || '';

export interface Credential {
  id: string;
  tokenId: string;
  recipient: string;
  issuer: string;
  credentialType: string;
  metadataURI: string;
  credentialHash?: string;
  status: 'ACTIVE' | 'REVOKED' | 'TRANSFERRED';
  issuedAt: string;
  revokedAt?: string;
  revokedBy?: string;
  revocationReason?: string;
  blockNumber: string;
  transactionHash: string;
}

export interface Issuer {
  id: string;
  name: string;
  isVerified: boolean;
  registeredAt: string;
  logoURI?: string;
  websiteURI?: string;
  totalCredentialsIssued: string;
  totalActiveCredentials: string;
  authorizedTypes: string[];
}

export interface CredentialMintEvent {
  id: string;
  tokenId: string;
  recipient: string;
  issuer: string;
  credentialType: string;
  metadataURI: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

/**
 * Get credential by token ID
 */
export async function getCredentialById(tokenId: string): Promise<Credential | null> {
  if (!ENVIO_API_URL) {
    console.warn('[Envio] API URL not configured');
    return null;
  }

  const query = `
    query GetCredential($id: ID!) {
      Credential(id: $id) {
        id
        tokenId
        recipient
        issuer
        credentialType
        metadataURI
        credentialHash
        status
        issuedAt
        revokedAt
        revokedBy
        revocationReason
        blockNumber
        transactionHash
      }
    }
  `;

  try {
    const response = await fetch(ENVIO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { id: `credential_${tokenId}` },
      }),
    });

    const data = await response.json();
    return data.data?.Credential || null;
  } catch (error) {
    console.error('[Envio] Failed to fetch credential:', error);
    return null;
  }
}

/**
 * Get all credentials for a recipient address
 */
export async function getCredentialsByRecipient(address: string): Promise<Credential[]> {
  if (!ENVIO_API_URL) return [];

  const query = `
    query GetCredentialsByRecipient($recipient: String!) {
      Credential(
        where: { recipient: { _eq: $recipient } }
        order_by: { issuedAt: desc }
      ) {
        id
        tokenId
        recipient
        issuer
        credentialType
        metadataURI
        status
        issuedAt
        revokedAt
        blockNumber
        transactionHash
      }
    }
  `;

  try {
    const response = await fetch(ENVIO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { recipient: address.toLowerCase() },
      }),
    });

    const data = await response.json();
    return data.data?.Credential || [];
  } catch (error) {
    console.error('[Envio] Failed to fetch credentials:', error);
    return [];
  }
}

/**
 * Get recent credential minting events for an address
 * Used by AI agent for fraud analysis
 */
export async function getRecentMintEvents(address: string, limit: number = 50): Promise<CredentialMintEvent[]> {
  if (!ENVIO_API_URL) return [];

  const query = `
    query GetRecentMintEvents($recipient: String!, $limit: Int!) {
      VeriCredSBT_CredentialMinted(
        where: { recipient: { _eq: $recipient } }
        order_by: { blockTimestamp: desc }
        limit: $limit
      ) {
        id
        tokenId
        recipient
        issuer
        credentialType
        metadataURI
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `;

  try {
    const response = await fetch(ENVIO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: {
          recipient: address.toLowerCase(),
          limit
        },
      }),
    });

    const data = await response.json();
    return data.data?.VeriCredSBT_CredentialMinted || [];
  } catch (error) {
    console.error('[Envio] Failed to fetch mint events:', error);
    return [];
  }
}

/**
 * Check if two addresses have prior interactions
 * Returns count of credentials issued from issuer to recipient
 */
export async function checkPriorInteractions(
  issuerAddress: string,
  recipientAddress: string
): Promise<number> {
  if (!ENVIO_API_URL) return 0;

  const query = `
    query CheckInteractions($issuer: String!, $recipient: String!) {
      Credential_aggregate(
        where: {
          issuer: { _eq: $issuer }
          recipient: { _eq: $recipient }
        }
      ) {
        aggregate {
          count
        }
      }
    }
  `;

  try {
    const response = await fetch(ENVIO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: {
          issuer: issuerAddress.toLowerCase(),
          recipient: recipientAddress.toLowerCase()
        },
      }),
    });

    const data = await response.json();
    return data.data?.Credential_aggregate?.aggregate?.count || 0;
  } catch (error) {
    console.error('[Envio] Failed to check interactions:', error);
    return 0;
  }
}

/**
 * Get issuer information
 */
export async function getIssuerInfo(address: string): Promise<Issuer | null> {
  if (!ENVIO_API_URL) return null;

  const query = `
    query GetIssuer($id: ID!) {
      Issuer(id: $id) {
        id
        name
        isVerified
        registeredAt
        logoURI
        websiteURI
        totalCredentialsIssued
        totalActiveCredentials
        authorizedTypes
      }
    }
  `;

  try {
    const response = await fetch(ENVIO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { id: `issuer_${address.toLowerCase()}` },
      }),
    });

    const data = await response.json();
    return data.data?.Issuer || null;
  } catch (error) {
    console.error('[Envio] Failed to fetch issuer:', error);
    return null;
  }
}

/**
 * Get recipient's on-chain activity summary for AI analysis
 */
export async function getRecipientActivitySummary(address: string) {
  const [credentials, recentMints] = await Promise.all([
    getCredentialsByRecipient(address),
    getRecentMintEvents(address, 20),
  ]);

  return {
    address,
    totalCredentials: credentials.length,
    activeCredentials: credentials.filter(c => c.status === 'ACTIVE').length,
    revokedCredentials: credentials.filter(c => c.status === 'REVOKED').length,
    recentActivity: recentMints.slice(0, 10),
    credentialTypes: [...new Set(credentials.map(c => c.credentialType))],
    issuers: [...new Set(credentials.map(c => c.issuer))],
  };
}
