/**
 * Credential Revocation API
 *
 * POST /api/credentials/revoke
 * Revokes a credential on-chain
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndRateLimit } from '@/lib/auth/middleware';
import { RATE_LIMITS } from '@/lib/auth/rate-limiter';
import { BackendWalletService } from '@/lib/backend/wallet-service';
import { DelegationModel } from '@/lib/database/models/Delegation';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Address, X-Signature, X-Timestamp',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

async function revokeCredentialHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const { tokenId, reason, delegationId } = body;

    // Validate required fields
    if (!tokenId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: tokenId, reason' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get issuer address from authenticated request
    const issuerAddress = (req as any).address;

    // If using delegation, validate it
    if (delegationId) {
      const delegation = await DelegationModel.findById(delegationId);
      if (!delegation) {
        return NextResponse.json(
          { error: 'Delegation not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      if (delegation.issuerAddress.toLowerCase() !== issuerAddress.toLowerCase()) {
        return NextResponse.json(
          { error: 'Delegation does not belong to this issuer' },
          { status: 403, headers: corsHeaders }
        );
      }

      if (delegation.isRevoked) {
        return NextResponse.json(
          { error: 'Delegation has been revoked' },
          { status: 403, headers: corsHeaders }
        );
      }

      if (new Date() > delegation.expiresAt) {
        return NextResponse.json(
          { error: 'Delegation has expired' },
          { status: 403, headers: corsHeaders }
        );
      }

      // Check if delegation has reached max calls
      const canIncrement = await DelegationModel.incrementCallCount(delegationId);
      if (!canIncrement) {
        return NextResponse.json(
          { error: 'Delegation has reached maximum usage limit' },
          { status: 403, headers: corsHeaders }
        );
      }
    }

    // Revoke credential on-chain
    const walletService = BackendWalletService.getInstance();
    await walletService.initialize();

    const txHash = await walletService.revokeCredential(tokenId, reason);

    console.log('[Credential Revocation] Credential revoked:', {
      tokenId,
      reason,
      txHash,
      revokedBy: issuerAddress,
    });

    return NextResponse.json({
      success: true,
      tokenId,
      transactionHash: txHash,
      reason,
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[Credential Revocation] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to revoke credential',
        details: error.message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Export with auth and rate limiting
export const POST = withAuthAndRateLimit(
  revokeCredentialHandler,
  RATE_LIMITS.CREDENTIAL_ISSUE // Reuse same rate limit
);
