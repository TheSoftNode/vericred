/**
 * Credential Verification API
 *
 * Feature 3 from PRD: Instant, Trustless Verification
 *
 * GET /api/credentials/verify?tokenId=123
 * Returns credential status queried from Envio indexer
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCredentialById } from '@/lib/server/envio';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Missing tokenId parameter' },
        { status: 400 }
      );
    }

    console.log('[Verify] Checking credential:', tokenId);

    // Query Envio indexer
    const credential = await getCredentialById(tokenId);

    if (!credential) {
      return NextResponse.json({
        verified: false,
        status: 'NOT_FOUND',
        message: 'Credential not found',
      });
    }

    // Check credential status
    const isVerified = credential.status === 'ACTIVE';
    const isRevoked = credential.status === 'REVOKED';

    return NextResponse.json({
      verified: isVerified,
      status: credential.status,
      credential: {
        tokenId: credential.tokenId,
        recipient: credential.recipient,
        issuer: credential.issuer,
        credentialType: credential.credentialType,
        issuedAt: credential.issuedAt,
        revokedAt: credential.revokedAt,
        revocationReason: credential.revocationReason,
        metadataURI: credential.metadataURI,
        transactionHash: credential.transactionHash,
        blockNumber: credential.blockNumber,
      },
      message: isVerified
        ? '✅ Verified: This credential is valid and active'
        : isRevoked
        ? '❌ Revoked: This credential has been revoked'
        : '⚠️ Invalid: This credential status is unknown',
    });

  } catch (error) {
    console.error('[Verify] Error verifying credential:', error);
    return NextResponse.json(
      { error: 'Failed to verify credential' },
      { status: 500 }
    );
  }
}
