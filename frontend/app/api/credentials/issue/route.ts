/**
 * Credential Issuance API
 *
 * POST /api/credentials/issue
 * Issues a credential using delegation from the issuer's smart account
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndRateLimit } from '@/lib/auth/middleware';
import { RATE_LIMITS } from '@/lib/auth/rate-limiter';
import { DelegationModel } from '@/lib/database/models/Delegation';
import { UserModel } from '@/lib/database/models/User';
import { IPFSService } from '@/lib/backend/ipfs-service';
import { BackendWalletService } from '@/lib/backend/wallet-service';
import { analyzeFraudRisk } from '@/lib/server/openai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Address, X-Signature, X-Timestamp',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

async function issueCredentialHandler(req: NextRequest, auth: { address: string }) {
  try {
    const body = await req.json();
    const {
      recipientAddress,
      credentialType,
      credentialData,
      recipientName,
      issuerName,
      delegationId,
    } = body;

    // Validate required fields
    if (!recipientAddress || !credentialType || !credentialData) {
      return NextResponse.json(
        { error: 'Missing required fields: recipientAddress, credentialType, credentialData' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get issuer address from authenticated request
    const issuerAddress = auth.address;

    // 1. Fetch and validate delegation
    let delegation;
    if (delegationId === "auto" || !delegationId) {
      // Auto-find active delegation for this issuer
      delegation = await DelegationModel.findActiveByIssuer(issuerAddress);
      if (!delegation) {
        return NextResponse.json(
          { error: 'No active delegation found. Please create a delegation first.' },
          { status: 404, headers: corsHeaders }
        );
      }
    } else {
      delegation = await DelegationModel.findById(delegationId);
    }
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
    const actualDelegationId = delegation._id?.toString();
    if (!actualDelegationId) {
      return NextResponse.json(
        { error: 'Invalid delegation ID' },
        { status: 500, headers: corsHeaders }
      );
    }

    const canIncrement = await DelegationModel.incrementCallCount(actualDelegationId);
    if (!canIncrement) {
      return NextResponse.json(
        { error: 'Delegation has reached maximum usage limit' },
        { status: 403, headers: corsHeaders }
      );
    }

    // 2. AI Fraud Analysis - CORE HACKATHON FEATURE
    let fraudAnalysis = null;
    try {
      // Use analyze-fraud endpoint that supports gpt-5-nano
      const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/analyze-fraud`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientAddress,
          issuerAddress,
          credentialType,
        }),
      });

      if (analysisResponse.ok) {
        fraudAnalysis = await analysisResponse.json();
        console.log('[Credential Issuance] ✅ AI fraud analysis:', fraudAnalysis);
      }
    } catch (error) {
      console.error('[Credential Issuance] AI analysis error:', error);
    }

    // 3. Upload metadata to IPFS
    const { getIPFSService } = await import('@/lib/backend/ipfs-service');
    const ipfsService = getIPFSService();
    await ipfsService.initialize();

    const metadata = ipfsService.buildCredentialMetadata({
      recipientAddress,
      recipientName: recipientName || 'Unknown',
      issuerAddress,
      issuerName: issuerName || 'Unknown Issuer',
      credentialType,
      credentialData,
      issuedDate: new Date().toISOString(),
      credentialHash: '', // Will be computed on-chain
    });

    const metadataURI = await ipfsService.uploadMetadata(metadata);
    console.log('[Credential Issuance] Metadata uploaded to IPFS:', metadataURI);

    // 4. Mint credential on-chain using backend wallet
    const { getBackendWallet } = await import('@/lib/backend/wallet-service');
    const walletService = getBackendWallet();
    await walletService.initialize();

    const result = await walletService.mintCredentialWithDelegation({
      delegation: delegation.delegation,
      recipientAddress,
      credentialType,
      metadataURI,
      credentialHash: '', // Computed on-chain
    });

    console.log('[Credential Issuance] Credential minted:', {
      tokenId: result.tokenId,
      txHash: result.txHash,
      recipient: recipientAddress,
      issuer: issuerAddress,
    });

    // 5. Save credential to MongoDB for dashboard display
    const clientPromise = (await import('@/lib/database/mongodb')).default;
    const client = await clientPromise;
    const db = client.db('vericred');

    await db.collection('credentials').insertOne({
      tokenId: result.tokenId,
      transactionHash: result.txHash,
      recipientAddress: recipientAddress.toLowerCase(),
      recipientName: recipientName || 'Unknown',
      issuerAddress: issuerAddress.toLowerCase(),
      issuerName: issuerName || 'Unknown Issuer',
      credentialType,
      credentialData,
      metadataURI,
      isRevoked: false,
      createdAt: new Date(),
      fraudAnalysis: fraudAnalysis ? {
        riskLevel: fraudAnalysis.riskLevel,
        riskScore: fraudAnalysis.riskScore,
        recommendation: fraudAnalysis.recommendation,
      } : null,
    });

    console.log('[Credential Issuance] Credential saved to database');

    // 6. Return success response
    return NextResponse.json({
      success: true,
      tokenId: result.tokenId,
      transactionHash: result.txHash,
      metadataURI,
      fraudAnalysis: fraudAnalysis ? {
        riskLevel: fraudAnalysis.riskLevel,
        riskScore: fraudAnalysis.riskScore,
        recommendation: fraudAnalysis.recommendation,
      } : null,
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[Credential Issuance] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to issue credential',
        details: error.message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Export with auth and rate limiting
export const POST = withAuthAndRateLimit(
  issueCredentialHandler,
  RATE_LIMITS.CREDENTIAL_ISSUE
);
