/**
 * Delegation Storage API
 *
 * POST /api/delegations - Store signed delegation from frontend
 * GET /api/delegations - List delegations for an issuer
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { DelegationModel } from '@/lib/database/models/Delegation';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Address, X-Signature, X-Timestamp',
};

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

async function postDelegationHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const { delegation, smartAccountAddress, maxCalls, expiresAt } = body;

    // Get issuer address from authenticated request
    const issuerAddress = (req as any).address;

    // Validate inputs
    if (!delegation || !smartAccountAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: delegation, smartAccountAddress' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!delegation.signature) {
      return NextResponse.json(
        { error: 'Delegation must be signed' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get backend wallet address from environment
    const backendAddress = process.env.NEXT_PUBLIC_BACKEND_DELEGATION_ADDRESS;
    if (!backendAddress) {
      throw new Error('Backend delegation address not configured');
    }

    // Create delegation in database
    const delegationId = await DelegationModel.createDelegation({
      issuerAddress,
      smartAccountAddress: smartAccountAddress.toLowerCase(),
      backendAddress: backendAddress.toLowerCase(),
      delegation,
      maxCalls: maxCalls || 100,
      expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
    });

    console.log('[Delegation] Stored delegation:', {
      id: delegationId,
      smartAccount: smartAccountAddress,
      issuer: issuerAddress,
      maxCalls,
    });

    return NextResponse.json({
      success: true,
      delegationId,
      message: 'Delegation stored successfully',
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[Delegation] Error storing delegation:', error);
    return NextResponse.json(
      { error: 'Failed to store delegation', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

async function getDelegationsHandler(req: NextRequest) {
  try {
    // Get issuer address from authenticated request
    const issuerAddress = (req as any).address;

    const { searchParams } = new URL(req.url);
    const smartAccountAddress = searchParams.get('smartAccountAddress');
    const includeRevoked = searchParams.get('includeRevoked') === 'true';

    // Fetch delegations
    const delegations = await DelegationModel.findByIssuer(issuerAddress, includeRevoked);

    // Filter by smart account if provided
    let filteredDelegations = delegations;
    if (smartAccountAddress) {
      filteredDelegations = delegations.filter(
        d => d.smartAccountAddress.toLowerCase() === smartAccountAddress.toLowerCase()
      );
    }

    return NextResponse.json({
      delegations: filteredDelegations.map(d => ({
        id: d._id?.toString(),
        smartAccountAddress: d.smartAccountAddress,
        issuerAddress: d.issuerAddress,
        backendAddress: d.backendAddress,
        maxCalls: d.maxCalls,
        callsUsed: d.callsUsed,
        createdAt: d.createdAt,
        expiresAt: d.expiresAt,
        isRevoked: d.isRevoked,
        revokedAt: d.revokedAt,
        // Don't send the actual delegation object for security
      })),
      count: filteredDelegations.length,
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[Delegation] Error fetching delegations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delegations', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Export with authentication
export const POST = withAuth(postDelegationHandler);
export const GET = withAuth(getDelegationsHandler);
