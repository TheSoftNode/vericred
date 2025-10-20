/**
 * Farcaster Frame Verification Route
 *
 * From PRD: Farcaster Mini App for instant credential verification
 * Returns Farcaster Frame HTML that displays verification status
 *
 * Usage: /api/frames/verify/[credentialId]
 */

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/database/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { credentialId: string } }
) {
  try {
    const credentialId = params.credentialId;

    console.log('[Frame] Verifying credential for Frame:', credentialId);

    // Query MongoDB for credential
    const client = await clientPromise;
    const db = client.db('vericred');
    const credentialDoc = await db.collection('credentials').findOne({
      tokenId: credentialId
    });

    const credential = credentialDoc ? {
      credentialType: credentialDoc.credentialType,
      status: credentialDoc.isRevoked ? 'REVOKED' : 'ACTIVE',
    } : null;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (credential && credential.status === 'ACTIVE') {
      // VERIFIED CREDENTIAL
      const frameHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${baseUrl}/api/frames/image/verified?type=${encodeURIComponent(credential.credentialType)}" />
    <meta property="fc:frame:button:1" content="✅ Verified on VeriCred+" />
    <meta property="fc:frame:button:1:action" content="link" />
    <meta property="fc:frame:button:1:target" content="${baseUrl}/verify?tokenId=${credentialId}" />
    <meta property="fc:frame:button:2" content="Get Your Own Credential" />
    <meta property="fc:frame:button:2:action" content="link" />
    <meta property="fc:frame:button:2:target" content="${baseUrl}" />
    <meta property="og:title" content="VeriCred+ Verified Credential" />
    <meta property="og:description" content="${credential.credentialType} - Verified on Monad Blockchain" />
  </head>
  <body>
    <h1>✅ Verified Credential</h1>
    <p>This ${credential.credentialType} credential is verified and active on VeriCred+</p>
  </body>
</html>`;

      return new NextResponse(frameHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      });
    } else if (credential && credential.status === 'REVOKED') {
      // REVOKED CREDENTIAL
      const frameHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${baseUrl}/api/frames/image/revoked" />
    <meta property="fc:frame:button:1" content="❌ Credential Revoked" />
    <meta property="fc:frame:button:1:action" content="link" />
    <meta property="fc:frame:button:1:target" content="${baseUrl}/verify?tokenId=${credentialId}" />
    <meta property="og:title" content="Revoked Credential" />
    <meta property="og:description" content="This credential has been revoked" />
  </head>
  <body>
    <h1>❌ Revoked Credential</h1>
    <p>This credential has been revoked and is no longer valid</p>
  </body>
</html>`;

      return new NextResponse(frameHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      });
    } else {
      // NOT FOUND
      const frameHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${baseUrl}/api/frames/image/not-found" />
    <meta property="fc:frame:button:1" content="❓ Credential Not Found" />
    <meta property="fc:frame:button:1:action" content="link" />
    <meta property="fc:frame:button:1:target" content="${baseUrl}" />
    <meta property="og:title" content="Credential Not Found" />
    <meta property="og:description" content="This credential could not be verified" />
  </head>
  <body>
    <h1>❓ Credential Not Found</h1>
    <p>This credential could not be found on VeriCred+</p>
  </body>
</html>`;

      return new NextResponse(frameHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

  } catch (error) {
    console.error('[Frame] Error generating frame:', error);
    return NextResponse.json(
      { error: 'Failed to generate frame' },
      { status: 500 }
    );
  }
}
