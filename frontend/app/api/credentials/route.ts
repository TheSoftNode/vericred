import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/database/mongodb';

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('vericred');

    // Get query params for filtering
    const { searchParams } = new URL(req.url);
    const issuerAddress = searchParams.get('issuer');
    const recipientAddress = searchParams.get('recipient');

    // Build query
    const query: any = {};
    if (issuerAddress) {
      query.issuerAddress = issuerAddress.toLowerCase();
    }
    if (recipientAddress) {
      query.recipientAddress = recipientAddress.toLowerCase();
    }

    // Fetch credentials sorted by most recent
    const credentials = await db
      .collection('credentials')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    // Calculate stats
    const stats = {
      totalIssued: credentials.length,
      activeCredentials: credentials.filter((c: any) => !c.isRevoked).length,
      revokedCredentials: credentials.filter((c: any) => c.isRevoked).length,
      uniqueRecipients: new Set(credentials.map((c: any) => c.recipientAddress)).size,
    };

    return NextResponse.json({
      credentials: credentials.map((c: any) => ({
        ...c,
        _id: c._id.toString(),
      })),
      stats,
    });
  } catch (error: any) {
    console.error('Failed to fetch credentials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credentials', message: error.message },
      { status: 500 }
    );
  }
}
