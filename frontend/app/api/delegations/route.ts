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

async function postDelegationHandler(req: NextRequest, auth: { address: string }) {
  try {
    console.log('[API Delegation] POST request received');
    const body = await req.json();
    console.log('[API Delegation] Request body:', JSON.stringify(body, null, 2));

    const { delegation, smartAccountAddress, maxCalls, expiresAt } = body;

    // Get issuer address from authenticated request
    const issuerAddress = auth.address;
    console.log('[API Delegation] Issuer address:', issuerAddress);

    // Validate inputs
    if (!delegation || !smartAccountAddress) {
      console.error('[API Delegation] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: delegation, smartAccountAddress' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('[API Delegation] Delegation object:', delegation);
    console.log('[API Delegation] Smart account:', smartAccountAddress);

    if (!delegation.signature) {
      console.error('[API Delegation] Delegation not signed');
      return NextResponse.json(
        { error: 'Delegation must be signed' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('[API Delegation] Delegation signature present:', delegation.signature.substring(0, 20) + '...');

    // Get backend wallet address from environment
    const backendAddress = process.env.NEXT_PUBLIC_BACKEND_DELEGATION_ADDRESS;
    console.log('[API Delegation] Backend address:', backendAddress);
    if (!backendAddress) {
      throw new Error('Backend delegation address not configured');
    }

    // Extract VeriCredSBT address from delegation caveats
    const veriCredSBTAddress = delegation.caveats?.find((c: any) =>
      c.enforcer && c.terms
    )?.terms || process.env.NEXT_PUBLIC_VERICRED_SBT_ADDRESS || '';
    console.log('[API Delegation] VeriCredSBT address from caveats:', veriCredSBTAddress);

    // Create delegation in database
    console.log('[API Delegation] Creating delegation in database...');
    const createdDelegation = await DelegationModel.create({
      issuerAddress,
      smartAccountAddress: smartAccountAddress.toLowerCase(),
      backendAddress: backendAddress.toLowerCase(),
      delegation,
      maxCalls: maxCalls || 100,
      expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      metadata: {
        veriCredSBTAddress,
        caveats: delegation.caveats?.map((c: any) => c.enforcer) || [],
      },
    });

    const delegationId = createdDelegation._id?.toString();

    console.log('[API Delegation] ✅ Stored delegation successfully:', {
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

async function getDelegationsHandler(req: NextRequest, auth?: { address: string }) {
  try {
    const { searchParams } = new URL(req.url);

    // Get issuer address from auth or query parameter (for unauthenticated reads)
    const issuerAddress = auth?.address || searchParams.get('address');

    if (!issuerAddress) {
      return NextResponse.json(
        { error: 'Issuer address required (via auth or query param)' },
        { status: 400, headers: corsHeaders }
      );
    }

    const smartAccountAddress = searchParams.get('smartAccountAddress');
    const includeRevoked = searchParams.get('includeRevoked') === 'true';

    // Fetch delegations
    const allDelegations = await DelegationModel.getAllForIssuer(issuerAddress);
    const delegations = includeRevoked
      ? allDelegations
      : allDelegations.filter(d => !d.isRevoked);

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

// Wrapper for GET that allows both authenticated and unauthenticated access
async function getHandler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const addressParam = searchParams.get('address');

  // If address is provided in query, allow unauthenticated access
  if (addressParam) {
    return getDelegationsHandler(req, undefined);
  }

  // Otherwise require authentication
  return withAuth<any>(getDelegationsHandler)(req);
}

// Export with authentication
export const POST = withAuth<any>(postDelegationHandler);
export const GET = getHandler;
