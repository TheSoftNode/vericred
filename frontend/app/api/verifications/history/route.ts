import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/database/mongodb';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const verifierAddress = searchParams.get('verifier');

    console.log('[API] Fetching verification history for:', verifierAddress);

    const client = await clientPromise;
    const db = client.db('vericred');

    // Build query
    const query: any = {};
    if (verifierAddress && verifierAddress !== 'undefined') {
      query.verifierAddress = verifierAddress.toLowerCase();
    }

    console.log('[API] MongoDB query:', query);

    // Fetch verifications
    const verifications = await db
      .collection('verifications')
      .find(query)
      .sort({ verifiedAt: -1 })
      .limit(100)
      .toArray();

    console.log('[API] Found', verifications.length, 'verifications');

    // Get credential details for each verification
    const verificationsWithDetails = await Promise.all(
      verifications.map(async (v: any) => {
        const credential = await db.collection('credentials').findOne({
          tokenId: v.tokenId
        });

        return {
          id: v._id.toString(),
          credentialId: v.credentialId,
          tokenId: v.tokenId,
          status: v.status,
          verifiedAt: v.verifiedAt.toISOString(),
          credential: credential ? {
            credentialType: credential.credentialType,
            issuerAddress: credential.issuerAddress,
            recipientAddress: credential.recipientAddress,
            isRevoked: credential.isRevoked,
          } : null,
        };
      })
    );

    console.log('[API] Returning', verificationsWithDetails.length, 'verifications with details');

    return NextResponse.json({
      verifications: verificationsWithDetails,
    });
  } catch (error: any) {
    console.error('[API] Failed to fetch verification history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification history', message: error.message },
      { status: 500 }
    );
  }
}
