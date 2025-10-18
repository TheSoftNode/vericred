# API Routes Implementation Guide

This file contains the exact code needed to implement the 4 critical missing API routes.

---

## 1. Delegation Registration API

**File**: `/frontend/app/api/delegation/register/route.ts`

```typescript
/**
 * Delegation Registration API
 * POST /api/delegation/register
 *
 * Stores signed delegation from issuer in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { DelegationModel } from '@/lib/database';
import { withAuth, errorResponse, successResponse } from '@/lib/auth/middleware';

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { delegation, smartAccountAddress } = body;

    if (!delegation || !smartAccountAddress) {
      return errorResponse(
        'Invalid request',
        'delegation and smartAccountAddress are required',
        'MISSING_PARAMS',
        400
      );
    }

    // Verify issuer address matches authenticated user
    if (auth.address.toLowerCase() !== delegation.delegate.toLowerCase()) {
      return errorResponse(
        'Unauthorized',
        'Delegation issuer does not match authenticated user',
        'UNAUTHORIZED',
        403
      );
    }

    // Extract caveat information
    const caveats = delegation.caveats || [];
    const limitedCallsCaveat = caveats.find((c: any) => c.enforcer.includes('LimitedCalls'));
    const timestampCaveat = caveats.find((c: any) => c.enforcer.includes('Timestamp'));

    const maxCalls = limitedCallsCaveat?.terms?.limit || 100;
    const expiresAt = timestampCaveat?.terms?.beforeThreshold
      ? new Date(timestampCaveat.terms.beforeThreshold * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Store delegation in database
    const storedDelegation = await DelegationModel.create({
      issuerAddress: auth.address,
      smartAccountAddress,
      backendAddress: process.env.NEXT_PUBLIC_BACKEND_DELEGATION_ADDRESS!,
      delegation,
      maxCalls,
      expiresAt,
      metadata: {
        veriCredSBTAddress: process.env.NEXT_PUBLIC_VERICRED_SBT_ADDRESS!,
        caveats: caveats.map((c: any) => c.enforcer.split('/').pop()),
      },
    });

    console.log('[Delegation] Registered:', storedDelegation._id);

    return successResponse({
      delegationId: storedDelegation._id!.toString(),
      expiresAt: expiresAt.toISOString(),
      maxCalls,
    });
  } catch (error: any) {
    console.error('[Delegation] Registration error:', error);

    return errorResponse(
      'Registration failed',
      error.message || 'Failed to register delegation',
      'DELEGATION_ERROR',
      500
    );
  }
});
```

---

## 2. Credential Issuance API

**File**: `/frontend/app/api/credentials/issue/route.ts`

```typescript
/**
 * Credential Issuance API
 * POST /api/credentials/issue
 *
 * Issues credential via delegated minting
 */

import { NextRequest, NextResponse } from 'next/server';
import { keccak256, toHex } from 'viem';
import { DelegationModel } from '@/lib/database';
import { getBackendWallet } from '@/lib/backend/wallet-service';
import { getIPFSService } from '@/lib/backend/ipfs-service';
import { withAuthAndRateLimit, errorResponse, successResponse } from '@/lib/auth/middleware';
import { RATE_LIMITS } from '@/lib/auth';

// Import contract ABI
import VeriCredSBTABI from '@/lib/contracts/abis/VeriCredSBT.json';

export const POST = withAuthAndRateLimit(
  async (req, auth) => {
    try {
      const body = await req.json();
      const {
        recipientAddress,
        credentialType,
        recipientName,
        additionalData,
        expirationDate,
      } = body;

      if (!recipientAddress || !credentialType) {
        return errorResponse(
          'Invalid request',
          'recipientAddress and credentialType are required',
          'MISSING_PARAMS',
          400
        );
      }

      console.log('[Issue] Starting credential issuance:', {
        issuer: auth.address,
        recipient: recipientAddress,
        type: credentialType,
      });

      // 1. Verify delegation exists and is valid
      const delegation = await DelegationModel.findActiveByIssuer(auth.address);

      if (!delegation) {
        return errorResponse(
          'No active delegation',
          'Please set up delegation first',
          'NO_DELEGATION',
          403
        );
      }

      const validationResult = await DelegationModel.isValid(
        delegation._id!.toString()
      );

      if (!validationResult.valid) {
        return errorResponse(
          'Invalid delegation',
          validationResult.reason || 'Delegation is not valid',
          'INVALID_DELEGATION',
          403
        );
      }

      // 2. Initialize backend services
      const backend = getBackendWallet();
      await backend.initialize();

      const ipfs = getIPFSService();
      await ipfs.initialize();

      // 3. Generate credential hash
      const credentialData = JSON.stringify({
        recipient: recipientAddress,
        type: credentialType,
        issuer: auth.address,
        timestamp: Date.now(),
        additionalData,
      });
      const credentialHash = keccak256(toHex(credentialData));

      // 4. Build and upload metadata to IPFS
      const metadata = ipfs.buildCredentialMetadata({
        credentialType,
        issuerName: 'VeriCred Issuer', // TODO: Get from user profile in DB
        issuerAddress: auth.address,
        recipientAddress,
        recipientName,
        issuedDate: new Date(),
        expirationDate: expirationDate ? new Date(expirationDate) : undefined,
        credentialHash,
        additionalData,
      });

      console.log('[Issue] Uploading metadata to IPFS...');
      const metadataURI = await ipfs.uploadMetadata(metadata);
      console.log('[Issue] Metadata uploaded:', metadataURI);

      // 5. Call smart contract to mint credential
      const walletClient = backend.getWalletClient();

      console.log('[Issue] Minting credential on-chain...');

      const hash = await walletClient.writeContract({
        address: process.env.NEXT_PUBLIC_VERICRED_SBT_ADDRESS! as `0x${string}`,
        abi: VeriCredSBTABI,
        functionName: 'mintCredential',
        args: [
          recipientAddress,
          credentialType,
          metadataURI,
          expirationDate ? Math.floor(new Date(expirationDate).getTime() / 1000) : 0,
          credentialHash,
        ],
      });

      console.log('[Issue] Transaction sent:', hash);

      // 6. Wait for transaction receipt
      const publicClient = backend.getPublicClient();
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      console.log('[Issue] Transaction confirmed:', receipt.blockNumber);

      // 7. Increment delegation usage counter
      await DelegationModel.incrementCallCount(delegation._id!.toString());

      // 8. Extract token ID from logs (if needed)
      // const tokenId = ...; // Parse from receipt.logs

      return successResponse({
        success: true,
        transactionHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        metadataURI,
        credentialHash,
      });
    } catch (error: any) {
      console.error('[Issue] Credential issuance error:', error);

      return errorResponse(
        'Issuance failed',
        error.message || 'Failed to issue credential',
        'ISSUANCE_ERROR',
        500
      );
    }
  },
  RATE_LIMITS.CREDENTIAL_ISSUE
);
```

---

## 3. Credential Verification API

**File**: `/frontend/app/api/credentials/verify/route.ts`

```typescript
/**
 * Credential Verification API
 * GET /api/credentials/verify?tokenId=123
 *
 * Verifies credential status via Envio
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCredentialById } from '@/lib/server/envio';
import { withRateLimit, errorResponse, successResponse } from '@/lib/auth/middleware';
import { RATE_LIMITS } from '@/lib/auth';

export const GET = withRateLimit(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const tokenId = searchParams.get('tokenId');

      if (!tokenId) {
        return errorResponse(
          'Invalid request',
          'tokenId query parameter is required',
          'MISSING_PARAMS',
          400
        );
      }

      console.log('[Verify] Verifying credential:', tokenId);

      // Query Envio for credential
      const credential = await getCredentialById(tokenId);

      if (!credential) {
        return successResponse({
          verified: false,
          status: 'NOT_FOUND',
          message: 'Credential not found',
        });
      }

      // Check status
      let verified = false;
      let message = '';

      if (credential.status === 'REVOKED') {
        message = `❌ Revoked: This credential has been revoked. Reason: ${credential.revocationReason || 'Not specified'}`;
      } else if (credential.status === 'ACTIVE') {
        verified = true;
        message = '✅ Verified: This credential is valid and active';
      } else {
        message = '⚠️ Invalid: This credential status is unknown';
      }

      console.log('[Verify] Result:', { verified, status: credential.status });

      return successResponse({
        verified,
        status: credential.status,
        credential: {
          tokenId: credential.tokenId,
          recipient: credential.recipient,
          issuer: credential.issuer,
          credentialType: credential.credentialType,
          metadataURI: credential.metadataURI,
          issuedAt: credential.issuedAt,
          revokedAt: credential.revokedAt,
          revocationReason: credential.revocationReason,
          blockNumber: credential.blockNumber,
          transactionHash: credential.transactionHash,
        },
        message,
      });
    } catch (error: any) {
      console.error('[Verify] Verification error:', error);

      return errorResponse(
        'Verification failed',
        error.message || 'Failed to verify credential',
        'VERIFICATION_ERROR',
        500
      );
    }
  },
  RATE_LIMITS.CREDENTIAL_VERIFY
);
```

---

## 4. Credential Revocation API

**File**: `/frontend/app/api/credentials/revoke/route.ts`

```typescript
/**
 * Credential Revocation API
 * POST /api/credentials/revoke
 *
 * Revokes credential (only original issuer can revoke)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCredentialById } from '@/lib/server/envio';
import { getBackendWallet } from '@/lib/backend/wallet-service';
import { withAuthAndRateLimit, errorResponse, successResponse } from '@/lib/auth/middleware';
import { RATE_LIMITS } from '@/lib/auth';

// Import contract ABI
import VeriCredSBTABI from '@/lib/contracts/abis/VeriCredSBT.json';

export const POST = withAuthAndRateLimit(
  async (req, auth) => {
    try {
      const body = await req.json();
      const { tokenId, reason } = body;

      if (!tokenId || !reason) {
        return errorResponse(
          'Invalid request',
          'tokenId and reason are required',
          'MISSING_PARAMS',
          400
        );
      }

      console.log('[Revoke] Revoking credential:', tokenId);

      // 1. Get credential from Envio to verify issuer
      const credential = await getCredentialById(tokenId);

      if (!credential) {
        return errorResponse(
          'Credential not found',
          'No credential with this token ID exists',
          'NOT_FOUND',
          404
        );
      }

      // 2. Verify caller is the original issuer
      if (credential.issuer.toLowerCase() !== auth.address.toLowerCase()) {
        return errorResponse(
          'Unauthorized',
          'Only the original issuer can revoke this credential',
          'UNAUTHORIZED',
          403
        );
      }

      // 3. Check if already revoked
      if (credential.status === 'REVOKED') {
        return errorResponse(
          'Already revoked',
          'This credential has already been revoked',
          'ALREADY_REVOKED',
          400
        );
      }

      // 4. Initialize backend wallet
      const backend = getBackendWallet();
      await backend.initialize();

      // 5. Call smart contract to revoke credential
      // NOTE: Revocation might need to be done by issuer's wallet, not backend
      // If so, return signing request to frontend instead
      const walletClient = backend.getWalletClient();

      console.log('[Revoke] Calling smart contract...');

      const hash = await walletClient.writeContract({
        address: process.env.NEXT_PUBLIC_VERICRED_SBT_ADDRESS! as `0x${string}`,
        abi: VeriCredSBTABI,
        functionName: 'revokeCredential',
        args: [BigInt(tokenId), reason],
      });

      console.log('[Revoke] Transaction sent:', hash);

      // 6. Wait for confirmation
      const publicClient = backend.getPublicClient();
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      console.log('[Revoke] Transaction confirmed:', receipt.blockNumber);

      return successResponse({
        success: true,
        transactionHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        tokenId,
        reason,
      });
    } catch (error: any) {
      console.error('[Revoke] Revocation error:', error);

      return errorResponse(
        'Revocation failed',
        error.message || 'Failed to revoke credential',
        'REVOCATION_ERROR',
        500
      );
    }
  },
  RATE_LIMITS.GENERAL
);
```

---

## 5. Delegation Status API (Bonus)

**File**: `/frontend/app/api/delegation/status/route.ts`

```typescript
/**
 * Delegation Status API
 * GET /api/delegation/status
 *
 * Get current delegation status for authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { DelegationModel } from '@/lib/database';
import { withAuth, errorResponse, successResponse } from '@/lib/auth/middleware';

export const GET = withAuth(async (req, auth) => {
  try {
    const delegation = await DelegationModel.findActiveByIssuer(auth.address);

    if (!delegation) {
      return successResponse({
        active: false,
        message: 'No active delegation found',
      });
    }

    const stats = await DelegationModel.getUsageStats(
      delegation._id!.toString()
    );

    return successResponse({
      active: true,
      delegationId: delegation._id!.toString(),
      smartAccountAddress: delegation.smartAccountAddress,
      createdAt: delegation.createdAt.toISOString(),
      expiresAt: delegation.expiresAt.toISOString(),
      maxCalls: stats?.maxCalls,
      callsUsed: stats?.callsUsed,
      callsRemaining: stats?.callsRemaining,
      percentUsed: stats?.percentUsed,
    });
  } catch (error: any) {
    console.error('[Delegation] Status check error:', error);

    return errorResponse(
      'Status check failed',
      error.message || 'Failed to check delegation status',
      'STATUS_ERROR',
      500
    );
  }
});
```

---

## Required Contract ABI

You'll need the VeriCredSBT ABI. Create:

**File**: `/frontend/lib/contracts/abis/VeriCredSBT.json`

```json
[
  {
    "inputs": [
      { "name": "recipient", "type": "address" },
      { "name": "credentialType", "type": "string" },
      { "name": "metadataURI", "type": "string" },
      { "name": "expirationDate", "type": "uint256" },
      { "name": "credentialHash", "type": "bytes32" }
    ],
    "name": "mintCredential",
    "outputs": [{ "name": "tokenId", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "tokenId", "type": "uint256" },
      { "name": "reason", "type": "string" }
    ],
    "name": "revokeCredential",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
```

---

## Testing the APIs

### 1. Test Delegation Registration

```bash
curl -X POST http://localhost:3000/api/delegation/register \
  -H "Content-Type: application/json" \
  -H "x-address: 0xYOUR_ADDRESS" \
  -H "x-signature: 0xSIGNATURE" \
  -H "x-timestamp: $(date +%s)000" \
  -d '{
    "delegation": {...},
    "smartAccountAddress": "0x..."
  }'
```

### 2. Test Credential Issuance

```bash
curl -X POST http://localhost:3000/api/credentials/issue \
  -H "Content-Type: application/json" \
  -H "x-address: 0xYOUR_ADDRESS" \
  -H "x-signature: 0xSIGNATURE" \
  -H "x-timestamp: $(date +%s)000" \
  -d '{
    "recipientAddress": "0x...",
    "credentialType": "UNIVERSITY_DEGREE",
    "recipientName": "John Doe",
    "additionalData": { "major": "Computer Science" }
  }'
```

### 3. Test Verification

```bash
curl "http://localhost:3000/api/credentials/verify?tokenId=123"
```

### 4. Test Revocation

```bash
curl -X POST http://localhost:3000/api/credentials/revoke \
  -H "Content-Type: application/json" \
  -H "x-address: 0xYOUR_ADDRESS" \
  -H "x-signature: 0xSIGNATURE" \
  -H "x-timestamp: $(date +%s)000" \
  -d '{
    "tokenId": "123",
    "reason": "Credential obtained fraudulently"
  }'
```

---

## Notes

1. **Contract ABI**: You'll need the actual ABI from your deployed contracts. The example above is simplified.

2. **Error Handling**: Each route has basic error handling. Add more specific error cases as needed.

3. **Token ID Extraction**: In the issuance route, you may need to parse the token ID from transaction logs if you want to return it to the frontend.

4. **Revocation Permission**: The revocation route uses backend wallet. You might want issuers to sign revocations themselves. If so, return a signing request instead of executing directly.

5. **Rate Limiting**: All routes use appropriate rate limits. Adjust as needed.

6. **Authentication**: All routes (except verification) require signature authentication.

---

*Copy these files to your project and adjust as needed!*
