import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/database/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  try {
    const tokenId = params.tokenId;

    // Query MongoDB for credential
    const client = await clientPromise;
    const db = client.db('vericred');

    const credential = await db.collection('credentials').findOne({
      tokenId: tokenId
    });

    if (!credential) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      credential: {
        ...credential,
        _id: credential._id.toString(),
      },
      verified: true,
      status: credential.isRevoked ? 'revoked' : 'valid',
    });
  } catch (error: any) {
    console.error('Failed to verify credential:', error);
    return NextResponse.json(
      { error: 'Failed to verify credential', message: error.message },
      { status: 500 }
    );
  }
}
