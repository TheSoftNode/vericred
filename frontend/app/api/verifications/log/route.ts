import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/database/mongodb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { verifierAddress, credentialId, tokenId, status } = body;

    console.log('[API] Logging verification:', { verifierAddress, credentialId, tokenId, status });

    // Save verification to MongoDB
    const client = await clientPromise;
    const db = client.db('vericred');

    const verification = {
      verifierAddress: verifierAddress?.toLowerCase() || 'anonymous',
      credentialId,
      tokenId,
      status,
      verifiedAt: new Date(),
    };

    const result = await db.collection('verifications').insertOne(verification);
    console.log('[API] Verification logged with ID:', result.insertedId);

    return NextResponse.json({
      success: true,
      message: 'Verification logged successfully',
      id: result.insertedId,
    });
  } catch (error: any) {
    console.error('[API] Failed to log verification:', error);
    return NextResponse.json(
      { error: 'Failed to log verification', message: error.message },
      { status: 500 }
    );
  }
}
