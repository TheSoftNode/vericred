/**
 * IPFS Service using Pinata
 * Uploads credential metadata to IPFS
 */

import PinataSDK from '@pinata/sdk';

export interface CredentialMetadata {
  name: string;
  description: string;
  image?: string;
  attributes: {
    credentialType: string;
    issuer: string;
    issuerName: string;
    issuerAddress: string;
    recipient: string;
    recipientName?: string;
    issuedDate: string;
    expirationDate?: string;
    credentialHash: string;
    additionalData?: Record<string, any>;
  };
}

class IPFSService {
  private pinata: PinataSDK | null = null;
  private initialized: boolean = false;

  /**
   * Initialize Pinata client
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const apiKey = process.env.PINATA_API_KEY;
    const secretKey = process.env.PINATA_SECRET_KEY;

    if (!apiKey || !secretKey) {
      throw new Error(
        'PINATA_API_KEY and PINATA_SECRET_KEY must be set in environment variables'
      );
    }

    this.pinata = new PinataSDK(apiKey, secretKey);

    // Test authentication
    try {
      await this.pinata.testAuthentication();
      console.log('✅ Pinata authenticated successfully');
      this.initialized = true;
    } catch (error) {
      console.error('❌ Pinata authentication failed:', error);
      throw new Error('Failed to authenticate with Pinata');
    }
  }

  /**
   * Upload credential metadata to IPFS
   */
  async uploadMetadata(metadata: CredentialMetadata): Promise<string> {
    if (!this.pinata) {
      throw new Error('IPFS service not initialized. Call initialize() first.');
    }

    try {
      const result = await this.pinata.pinJSONToIPFS(metadata, {
        pinataMetadata: {
          name: `credential-${metadata.attributes.credentialType}-${Date.now()}`,
        },
        pinataOptions: {
          cidVersion: 0,
        },
      });

      const ipfsHash = result.IpfsHash;
      const ipfsUri = `ipfs://${ipfsHash}`;

      console.log('✅ Metadata uploaded to IPFS:', ipfsUri);

      return ipfsUri;
    } catch (error: any) {
      console.error('❌ Failed to upload to IPFS:', error);
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  /**
   * Upload image to IPFS
   */
  async uploadImage(imageBuffer: Buffer, filename: string): Promise<string> {
    if (!this.pinata) {
      throw new Error('IPFS service not initialized');
    }

    try {
      const result = await this.pinata.pinFileToIPFS(
        // Create ReadableStream from buffer
        // @ts-ignore - Pinata types are loose
        imageBuffer,
        {
          pinataMetadata: {
            name: filename,
          },
          pinataOptions: {
            cidVersion: 0,
          },
        }
      );

      const ipfsHash = result.IpfsHash;
      const ipfsUri = `ipfs://${ipfsHash}`;

      console.log('✅ Image uploaded to IPFS:', ipfsUri);

      return ipfsUri;
    } catch (error: any) {
      console.error('❌ Failed to upload image to IPFS:', error);
      throw new Error(`IPFS image upload failed: ${error.message}`);
    }
  }

  /**
   * Get IPFS gateway URL
   */
  getGatewayUrl(ipfsUri: string): string {
    const hash = ipfsUri.replace('ipfs://', '');
    const gateway = process.env.IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';

    return `${gateway}${hash}`;
  }

  /**
   * Unpin content from IPFS
   */
  async unpin(ipfsHash: string): Promise<void> {
    if (!this.pinata) {
      throw new Error('IPFS service not initialized');
    }

    try {
      await this.pinata.unpin(ipfsHash);
      console.log('✅ Content unpinned from IPFS:', ipfsHash);
    } catch (error: any) {
      console.error('❌ Failed to unpin from IPFS:', error);
      throw new Error(`IPFS unpin failed: ${error.message}`);
    }
  }

  /**
   * Build credential metadata object
   */
  buildCredentialMetadata(params: {
    credentialType: string;
    issuerName: string;
    issuerAddress: string;
    recipientAddress: string;
    recipientName?: string;
    issuedDate: Date | string;
    expirationDate?: Date | string;
    credentialHash: string;
    additionalData?: Record<string, any>;
  }): CredentialMetadata {
    return {
      name: `${params.credentialType} - ${params.recipientName || 'Credential'}`,
      description: `Verifiable ${params.credentialType} credential issued by ${params.issuerName}`,
      attributes: {
        credentialType: params.credentialType,
        issuer: params.issuerName,
        issuerName: params.issuerName,
        issuerAddress: params.issuerAddress,
        recipient: params.recipientAddress,
        recipientName: params.recipientName,
        issuedDate: typeof params.issuedDate === 'string' ? params.issuedDate : params.issuedDate.toISOString(),
        expirationDate: params.expirationDate ? (typeof params.expirationDate === 'string' ? params.expirationDate : params.expirationDate.toISOString()) : undefined,
        credentialHash: params.credentialHash,
        additionalData: params.additionalData,
      },
    };
  }
}

// Singleton instance
let ipfsServiceInstance: IPFSService | null = null;

/**
 * Get IPFS service (singleton)
 */
export function getIPFSService(): IPFSService {
  if (!ipfsServiceInstance) {
    ipfsServiceInstance = new IPFSService();
  }

  return ipfsServiceInstance;
}

/**
 * Initialize IPFS service (call once at startup)
 */
export async function initializeIPFSService(): Promise<void> {
  const service = getIPFSService();
  await service.initialize();
}

export { IPFSService };
