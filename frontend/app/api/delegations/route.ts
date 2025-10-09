/**
 * Delegation Storage API
 *
 * POST /api/delegations - Store signed delegation from frontend
 * GET /api/delegations - List delegations for a smart account
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// In-memory storage for MVP (replace with database in production)
const delegationsStore = new Map<string, any>();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { delegation, smartAccountAddress, issuerAddress } = body;

    // Validate inputs
    if (!delegation || !smartAccountAddress || !issuerAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: delegation, smartAccountAddress, issuerAddress' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!delegation.signature) {
      return NextResponse.json(
        { error: 'Delegation must be signed' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Generate delegation ID
    const delegationId = `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store delegation
    const storedDelegation = {
      id: delegationId,
      delegation,
      smartAccountAddress: smartAccountAddress.toLowerCase(),
      issuerAddress: issuerAddress.toLowerCase(),
      createdAt: new Date().toISOString(),
      status: 'active', // active, used, revoked
      usageCount: 0,
      maxUsageCount: 100, // Extract from delegation caveats in production
    };

    delegationsStore.set(delegationId, storedDelegation);

    console.log('[Delegation] Stored delegation:', {
      id: delegationId,
      smartAccount: smartAccountAddress,
      issuer: issuerAddress,
    });

    return NextResponse.json({
      success: true,
      delegationId,
      message: 'Delegation stored successfully',
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('[Delegation] Error storing delegation:', error);
    return NextResponse.json(
      { error: 'Failed to store delegation' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const smartAccountAddress = searchParams.get('smartAccountAddress');
    const issuerAddress = searchParams.get('issuerAddress');

    if (!smartAccountAddress && !issuerAddress) {
      return NextResponse.json(
        { error: 'Provide either smartAccountAddress or issuerAddress' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Filter delegations
    const delegations = Array.from(delegationsStore.values()).filter(d => {
      if (smartAccountAddress && d.smartAccountAddress !== smartAccountAddress.toLowerCase()) {
        return false;
      }
      if (issuerAddress && d.issuerAddress !== issuerAddress.toLowerCase()) {
        return false;
      }
      return true;
    });

    return NextResponse.json({
      delegations,
      count: delegations.length,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('[Delegation] Error fetching delegations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delegations' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Export the delegations store for use by other API routes
export { delegationsStore };
