# VeriCred+ API Documentation

## Overview

VeriCred+ uses Next.js API Routes as the backend. All APIs are located in `/frontend/app/api/`.

**Base URL:** `http://localhost:3000/api` (development)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS APP                               │
│                                                              │
│  Frontend (React)          API Routes (Backend)             │
│  ┌──────────────┐         ┌────────────────────┐            │
│  │ Components   │────────►│ /api/ai/           │            │
│  │ - Delegation │         │ - analyze-fraud    │            │
│  │ - Verify     │         │                    │            │
│  └──────────────┘         │ /api/delegations/  │            │
│                           │ - POST /           │            │
│                           │ - GET  /           │            │
│                           │                    │            │
│                           │ /api/credentials/  │            │
│                           │ - verify           │            │
│                           │                    │            │
│                           │ /api/frames/       │            │
│                           │ - verify/[id]      │            │
│                           └────────────────────┘            │
│                                    │                         │
└────────────────────────────────────┼─────────────────────────┘
                                     │
                          ┌──────────▼──────────┐
                          │   EXTERNAL SERVICES  │
                          │                      │
                          │  - Envio HyperIndex  │
                          │  - OpenAI GPT-4o     │
                          │  - Monad Blockchain  │
                          └─────────────────────┘
```

---

## API Endpoints

### 1. AI Fraud Analysis

**Feature:** AI-Powered Issuance Delegation (PRD Feature 2)

#### POST `/api/ai/analyze-fraud`

Analyzes fraud risk using on-chain data and OpenAI.

**Request Body:**
```json
{
  "recipientAddress": "0x...",
  "issuerAddress": "0x...",
  "credentialType": "Bachelor_Degree"
}
```

**Response:**
```json
{
  "riskScore": 15,
  "riskLevel": "LOW",
  "recommendation": "🟢 Low Risk: Found 3 prior interactions between these addresses.",
  "analysis": {
    "priorInteractions": 3,
    "recipientHistory": "5 credentials, 5 active",
    "issuerReputation": "Verified issuer",
    "redFlags": []
  }
}
```

**Risk Levels:**
- `LOW` (0-30): Safe to proceed
- `MEDIUM` (31-70): Caution advised
- `HIGH` (71-100): Manual verification required

**Flow:**
1. Query Envio for recipient's on-chain history
2. Check prior interactions between issuer and recipient
3. Fetch issuer reputation
4. Send data to OpenAI GPT-4o for analysis
5. Return risk assessment

---

### 2. Delegation Management

#### POST `/api/delegations`

Store signed delegation from frontend.

**Request Body:**
```json
{
  "delegation": {
    "from": "0xSmartAccountAddress",
    "to": "0xBackendAddress",
    "scope": {...},
    "caveats": [...],
    "signature": "0x..."
  },
  "smartAccountAddress": "0x...",
  "issuerAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "delegationId": "del_1234567890_abc123",
  "message": "Delegation stored successfully"
}
```

#### GET `/api/delegations`

List delegations for a user.

**Query Parameters:**
- `smartAccountAddress` (optional): Filter by smart account
- `issuerAddress` (optional): Filter by issuer EOA

**Response:**
```json
{
  "delegations": [
    {
      "id": "del_...",
      "delegation": {...},
      "smartAccountAddress": "0x...",
      "issuerAddress": "0x...",
      "createdAt": "2025-10-09T...",
      "status": "active",
      "usageCount": 0,
      "maxUsageCount": 100
    }
  ],
  "count": 1
}
```

---

### 3. Credential Verification

**Feature:** Instant, Trustless Verification (PRD Feature 3)

#### GET `/api/credentials/verify`

Verify credential status via Envio indexer.

**Query Parameters:**
- `tokenId` (required): Credential token ID

**Response (Verified):**
```json
{
  "verified": true,
  "status": "ACTIVE",
  "credential": {
    "tokenId": "123",
    "recipient": "0x...",
    "issuer": "0x...",
    "credentialType": "Bachelor_Degree",
    "issuedAt": "2025-10-09T...",
    "metadataURI": "ipfs://...",
    "transactionHash": "0x...",
    "blockNumber": "12345"
  },
  "message": "✅ Verified: This credential is valid and active"
}
```

**Response (Not Found):**
```json
{
  "verified": false,
  "status": "NOT_FOUND",
  "message": "Credential not found"
}
```

**Statuses:**
- `ACTIVE`: Credential is valid
- `REVOKED`: Credential has been revoked
- `TRANSFERRED`: Credential has been transferred (SBT violation)
- `NOT_FOUND`: Credential doesn't exist

---

### 4. Farcaster Frame Verification

**Feature:** Farcaster Mini App (PRD Bonus Feature)

#### GET `/api/frames/verify/[credentialId]`

Returns Farcaster Frame HTML for social verification.

**URL:** `/api/frames/verify/123`

**Response:** HTML with Farcaster Frame meta tags

**Frame Meta Tags:**
```html
<meta property="fc:frame" content="vNext" />
<meta property="fc:frame:image" content="..." />
<meta property="fc:frame:button:1" content="✅ Verified on VeriCred+" />
<meta property="fc:frame:button:1:action" content="link" />
<meta property="fc:frame:button:1:target" content="..." />
```

**Usage in Farcaster:**
1. User mints credential
2. Clicks "Share on Farcaster"
3. Posts cast with Frame link: `https://vericred.com/api/frames/verify/123`
4. Viewers click button to verify instantly
5. Frame queries Envio and displays status

---

## Server-Side Services

### Envio Service

**Location:** `/frontend/lib/server/envio.ts`

**Functions:**

```typescript
// Get credential by token ID
getCredentialById(tokenId: string): Promise<Credential | null>

// Get credentials for recipient
getCredentialsByRecipient(address: string): Promise<Credential[]>

// Get recent mint events for AI analysis
getRecentMintEvents(address: string, limit?: number): Promise<CredentialMintEvent[]>

// Check prior interactions
checkPriorInteractions(issuerAddress: string, recipientAddress: string): Promise<number>

// Get issuer info
getIssuerInfo(address: string): Promise<Issuer | null>

// Get activity summary (for AI)
getRecipientActivitySummary(address: string): Promise<{...}>
```

**GraphQL Queries:**

All queries hit Envio HyperIndex GraphQL API based on schema from `/envio-indexer/schema.graphql`.

**Key Entities:**
- `Credential`: Aggregated credential data
- `Issuer`: Issuer statistics
- `CredentialType`: Type analytics
- `VeriCredSBT_CredentialMinted`: Mint events
- `VeriCredSBT_CredentialRevoked`: Revoke events

---

## Environment Variables

### Required for Development

```bash
# Copy example file
cp .env.local.example .env.local
```

### Configuration

```env
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Blockchain
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_VERICRED_SBT_ADDRESS=0x...
NEXT_PUBLIC_BACKEND_ADDRESS=0x...

# Envio (server-side only)
ENVIO_API_URL=https://indexer.bigdevenergy.link/.../v1/graphql

# OpenAI (server-side only)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
```

**Important:**
- `ENVIO_API_URL` and `OPENAI_API_KEY` are server-side only (no `NEXT_PUBLIC_` prefix)
- Frontend cannot access these secrets
- API routes run on server and can access them securely

---

## Testing

### 1. Test AI Fraud Analysis

```bash
curl -X POST http://localhost:3000/api/ai/analyze-fraud \
  -H "Content-Type: application/json" \
  -d '{
    "recipientAddress": "0x1234...",
    "issuerAddress": "0x5678...",
    "credentialType": "Bachelor_Degree"
  }'
```

### 2. Test Credential Verification

```bash
curl http://localhost:3000/api/credentials/verify?tokenId=123
```

### 3. Test Delegation Storage

```bash
curl -X POST http://localhost:3000/api/delegations \
  -H "Content-Type: application/json" \
  -d '{
    "delegation": {
      "from": "0x...",
      "to": "0x...",
      "signature": "0x..."
    },
    "smartAccountAddress": "0x...",
    "issuerAddress": "0x..."
  }'
```

### 4. Test Farcaster Frame

Visit in browser: `http://localhost:3000/api/frames/verify/123`

---

## Integration with Frontend

### Example: Issuer Dashboard Flow

```typescript
// 1. User fills form
const formData = {
  recipientAddress: '0x...',
  credentialType: 'Bachelor_Degree',
};

// 2. Call AI analysis
const riskAnalysis = await fetch('/api/ai/analyze-fraud', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...formData,
    issuerAddress: wallet.address,
  }),
}).then(r => r.json());

// 3. Show risk report to user
console.log(riskAnalysis.recommendation);
// "🟢 Low Risk: Found 3 prior interactions..."

// 4. If approved, create delegation (frontend)
const delegation = await createDelegation(...);

// 5. Sign with MetaMask
const signature = await smartAccount.signDelegation(delegation);

// 6. Store delegation
await fetch('/api/delegations', {
  method: 'POST',
  body: JSON.stringify({
    delegation: { ...delegation, signature },
    smartAccountAddress,
    issuerAddress,
  }),
});

// 7. Done! Backend can now redeem delegation to mint credentials
```

---

## Next Steps

### Before Deployment

1. **Deploy Envio Indexer:**
   ```bash
   cd envio-indexer
   pnpm envio dev
   # Get GraphQL URL and update ENVIO_API_URL
   ```

2. **Deploy Smart Contracts:**
   ```bash
   cd contract
   forge script script/Deploy.s.sol --rpc-url $MONAD_RPC_URL --broadcast
   # Update contract addresses in .env.local
   ```

3. **Add OpenAI API Key:**
   - Get from https://platform.openai.com/api-keys
   - Add to `.env.local` as `OPENAI_API_KEY`

4. **Set Backend Address:**
   - Generate a wallet for backend
   - Add private key to secure storage
   - Add public address to `NEXT_PUBLIC_BACKEND_ADDRESS`

### For Production

1. Replace in-memory delegation storage with database (PostgreSQL/Redis)
2. Add authentication middleware to API routes
3. Implement rate limiting
4. Add proper error handling and logging
5. Deploy to Vercel/Railway/Cloud Run
6. Set up monitoring and alerts

---

## Error Handling

All API routes return consistent error format:

```json
{
  "error": "Error message here",
  "code": "ERROR_CODE", // Optional
  "details": {...} // Optional
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (invalid input)
- `404`: Not Found
- `500`: Internal Server Error

---

## Security Notes

1. **Server-side Secrets:** Never expose `OPENAI_API_KEY` or `ENVIO_API_URL` to client
2. **Input Validation:** All user inputs are validated before processing
3. **Delegation Verification:** Signatures are verified before storage
4. **Rate Limiting:** Implement in production to prevent abuse
5. **CORS:** Configure for production domains only

---

## Support

- **Issues:** https://github.com/vericred/issues
- **Docs:** See `/resources` folder for detailed technical docs
- **Envio:** https://docs.envio.dev
- **MetaMask Delegation:** https://docs.metamask.io/delegation-toolkit
