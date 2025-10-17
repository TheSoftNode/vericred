# VeriCred+ API Reference

## Overview

VeriCred+ uses Next.js API routes for backend functionality. All API routes are located in `/frontend/app/api/`.

**Base URL**: `https://your-domain.vercel.app/api`

---

## Authentication

Currently, API routes use address-based authentication:
- User's wallet address is passed in request body
- Smart contract checks on-chain ownership/permissions

**Future**: Add JWT-based authentication for API rate limiting.

---

## API Routes

### AI Routes

#### POST /api/ai/analyze-fraud

Analyzes fraud risk for a potential credential recipient using AI and on-chain data.

**Location**: [app/api/ai/analyze-fraud/route.ts](../frontend/app/api/ai/analyze-fraud/route.ts)

**Request Body**:
```typescript
{
  recipientAddress: string;    // Address to analyze
  issuerAddress: string;       // Issuer requesting analysis
  credentialType: string;      // Type of credential (e.g., "DEGREE")
}
```

**Response**:
```typescript
{
  riskScore: number;           // 0-100, where 0 = no risk
  riskLevel: "Low" | "Medium" | "High";
  analysis: string;            // Detailed explanation
  recommendation: "Approve" | "Reject" | "Review";
  redFlags: string[];          // List of warning signs
  confidence: number;          // 0-100, AI confidence level
}
```

**Example**:
```bash
curl -X POST https://your-domain.vercel.app/api/ai/analyze-fraud \
  -H "Content-Type: application/json" \
  -d '{
    "recipientAddress": "0x123...",
    "issuerAddress": "0xabc...",
    "credentialType": "UNIVERSITY_DEGREE"
  }'
```

**Response**:
```json
{
  "riskScore": 25,
  "riskLevel": "Low",
  "analysis": "Recipient has a clean history with 15 total credentials...",
  "recommendation": "Approve",
  "redFlags": [],
  "confidence": 85
}
```

**Error Responses**:
- `400`: Missing required fields
- `500`: AI analysis failed or Envio query error

---

### Credential Routes

#### POST /api/credentials/issue

Issues a new credential via delegated minting.

**Location**: [app/api/credentials/issue/route.ts](../frontend/app/api/credentials/issue/route.ts)

**Request Body**:
```typescript
{
  recipientAddress: string;    // Who receives the credential
  credentialType: string;      // Type (e.g., "DEGREE")
  metadataURI: string;         // IPFS URI with credential details
  expirationDate?: number;     // Unix timestamp (0 = no expiration)
  credentialHash?: string;     // Hash of credential data
  issuerAddress: string;       // Issuer's address
  delegation: object;          // Signed delegation object
}
```

**Response**:
```typescript
{
  success: boolean;
  transactionHash: string;     // Blockchain transaction hash
  tokenId: string;             // NFT token ID
  blockNumber: string;         // Block number
}
```

**Example**:
```bash
curl -X POST https://your-domain.vercel.app/api/credentials/issue \
  -H "Content-Type: application/json" \
  -d '{
    "recipientAddress": "0x123...",
    "credentialType": "UNIVERSITY_DEGREE",
    "metadataURI": "ipfs://QmXyz...",
    "expirationDate": 1735689600,
    "credentialHash": "0xabcd...",
    "issuerAddress": "0xabc...",
    "delegation": { ... }
  }'
```

**Response**:
```json
{
  "success": true,
  "transactionHash": "0x789...",
  "tokenId": "123",
  "blockNumber": "12345"
}
```

**Error Responses**:
- `400`: Missing required fields
- `403`: Invalid or expired delegation
- `500`: Transaction failed

---

#### POST /api/credentials/revoke

Revokes an existing credential.

**Location**: [app/api/credentials/revoke/route.ts](../frontend/app/api/credentials/revoke/route.ts)

**Request Body**:
```typescript
{
  tokenId: string;             // Credential token ID to revoke
  reason: string;              // Revocation reason
  issuerAddress: string;       // Must be original issuer
}
```

**Response**:
```typescript
{
  success: boolean;
  transactionHash: string;
  blockNumber: string;
}
```

**Example**:
```bash
curl -X POST https://your-domain.vercel.app/api/credentials/revoke \
  -H "Content-Type: application/json" \
  -d '{
    "tokenId": "123",
    "reason": "Credential obtained fraudulently",
    "issuerAddress": "0xabc..."
  }'
```

**Response**:
```json
{
  "success": true,
  "transactionHash": "0x456...",
  "blockNumber": "12350"
}
```

**Error Responses**:
- `400`: Missing tokenId or reason
- `403`: Not authorized (not original issuer)
- `404`: Credential not found
- `500`: Transaction failed

---

#### GET /api/credentials/verify

Verifies a credential's status using Envio indexer.

**Location**: [app/api/credentials/verify/route.ts](../frontend/app/api/credentials/verify/route.ts)

**Query Parameters**:
```
tokenId: string              // Credential token ID
```

**Response**:
```typescript
{
  verified: boolean;
  status: "ACTIVE" | "REVOKED" | "NOT_FOUND";
  credential?: {
    tokenId: string;
    recipient: string;
    issuer: string;
    credentialType: string;
    issuedAt: string;
    revokedAt?: string;
    revocationReason?: string;
    metadataURI: string;
    transactionHash: string;
    blockNumber: string;
  };
  message: string;
}
```

**Example**:
```bash
curl https://your-domain.vercel.app/api/credentials/verify?tokenId=123
```

**Response (Active)**:
```json
{
  "verified": true,
  "status": "ACTIVE",
  "credential": {
    "tokenId": "123",
    "recipient": "0x123...",
    "issuer": "0xabc...",
    "credentialType": "UNIVERSITY_DEGREE",
    "issuedAt": "1735689600",
    "revokedAt": null,
    "revocationReason": null,
    "metadataURI": "ipfs://QmXyz...",
    "transactionHash": "0x789...",
    "blockNumber": "12345"
  },
  "message": "✅ Verified: This credential is valid and active"
}
```

**Response (Revoked)**:
```json
{
  "verified": false,
  "status": "REVOKED",
  "credential": {
    "tokenId": "123",
    "revokedAt": "1735776000",
    "revocationReason": "Credential obtained fraudulently",
    ...
  },
  "message": "❌ Revoked: This credential has been revoked"
}
```

**Response (Not Found)**:
```json
{
  "verified": false,
  "status": "NOT_FOUND",
  "message": "Credential not found"
}
```

**Error Responses**:
- `400`: Missing tokenId parameter
- `500`: Envio query failed

---

### Delegation Routes

#### POST /api/delegation/register

Registers a signed delegation on the backend.

**Location**: [app/api/delegation/register/route.ts](../frontend/app/api/delegation/register/route.ts)

**Request Body**:
```typescript
{
  issuerAddress: string;
  smartAccountAddress: string;
  delegation: object;          // Signed delegation from MetaMask
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
  expiresAt: number;           // Unix timestamp
}
```

**Example**:
```bash
curl -X POST https://your-domain.vercel.app/api/delegation/register \
  -H "Content-Type: application/json" \
  -d '{
    "issuerAddress": "0xabc...",
    "smartAccountAddress": "0xdef...",
    "delegation": { ... }
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Delegation registered successfully",
  "expiresAt": 1738368000
}
```

**Error Responses**:
- `400`: Missing required fields or invalid delegation
- `500`: Database error

---

#### POST /api/delegation/revoke

Revokes an active delegation.

**Request Body**:
```typescript
{
  issuerAddress: string;
  smartAccountAddress: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

**Example**:
```bash
curl -X POST https://your-domain.vercel.app/api/delegation/revoke \
  -H "Content-Type: application/json" \
  -d '{
    "issuerAddress": "0xabc...",
    "smartAccountAddress": "0xdef..."
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Delegation revoked successfully"
}
```

---

#### GET /api/delegation/status

Checks delegation status.

**Query Parameters**:
```
issuerAddress: string
smartAccountAddress: string
```

**Response**:
```typescript
{
  active: boolean;
  expiresAt?: number;
  callsRemaining?: number;
  createdAt?: number;
}
```

**Example**:
```bash
curl "https://your-domain.vercel.app/api/delegation/status?issuerAddress=0xabc...&smartAccountAddress=0xdef..."
```

**Response**:
```json
{
  "active": true,
  "expiresAt": 1738368000,
  "callsRemaining": 95,
  "createdAt": 1735689600
}
```

---

## GraphQL Queries (Envio)

VeriCred+ uses Envio's GraphQL API for blockchain data queries.

**Endpoint**: Configured in `ENVIO_API_URL` environment variable

### Query: Get Credential by ID

```graphql
query GetCredential($id: ID!) {
  Credential(id: $id) {
    id
    tokenId
    recipient
    issuer
    credentialType
    metadataURI
    credentialHash
    status
    issuedAt
    revokedAt
    revokedBy
    revocationReason
    blockNumber
    transactionHash
  }
}
```

**Variables**:
```json
{
  "id": "credential_123"
}
```

**TypeScript Usage**:
```typescript
import { getCredentialById } from '@/lib/server/envio';

const credential = await getCredentialById('123');
```

---

### Query: Get Credentials by Recipient

```graphql
query GetCredentialsByRecipient($recipient: String!) {
  Credential(
    where: { recipient: { _eq: $recipient } }
    order_by: { issuedAt: desc }
  ) {
    id
    tokenId
    recipient
    issuer
    credentialType
    metadataURI
    status
    issuedAt
    revokedAt
    blockNumber
    transactionHash
  }
}
```

**Variables**:
```json
{
  "recipient": "0x123..."
}
```

**TypeScript Usage**:
```typescript
import { getCredentialsByRecipient } from '@/lib/server/envio';

const credentials = await getCredentialsByRecipient('0x123...');
```

---

### Query: Get Recent Mint Events

```graphql
query GetRecentMintEvents($recipient: String!, $limit: Int!) {
  VeriCredSBT_CredentialMinted(
    where: { recipient: { _eq: $recipient } }
    order_by: { blockTimestamp: desc }
    limit: $limit
  ) {
    id
    tokenId
    recipient
    issuer
    credentialType
    metadataURI
    blockNumber
    blockTimestamp
    transactionHash
  }
}
```

**Variables**:
```json
{
  "recipient": "0x123...",
  "limit": 50
}
```

**TypeScript Usage**:
```typescript
import { getRecentMintEvents } from '@/lib/server/envio';

const events = await getRecentMintEvents('0x123...', 50);
```

---

### Query: Check Prior Interactions

```graphql
query CheckInteractions($issuer: String!, $recipient: String!) {
  Credential_aggregate(
    where: {
      issuer: { _eq: $issuer }
      recipient: { _eq: $recipient }
    }
  ) {
    aggregate {
      count
    }
  }
}
```

**Variables**:
```json
{
  "issuer": "0xabc...",
  "recipient": "0x123..."
}
```

**TypeScript Usage**:
```typescript
import { checkPriorInteractions } from '@/lib/server/envio';

const count = await checkPriorInteractions('0xabc...', '0x123...');
console.log(`Prior interactions: ${count}`);
```

---

### Query: Get Issuer Info

```graphql
query GetIssuer($id: ID!) {
  Issuer(id: $id) {
    id
    name
    isVerified
    registeredAt
    logoURI
    websiteURI
    totalCredentialsIssued
    totalActiveCredentials
    authorizedTypes
  }
}
```

**Variables**:
```json
{
  "id": "issuer_0xabc..."
}
```

**TypeScript Usage**:
```typescript
import { getIssuerInfo } from '@/lib/server/envio';

const issuer = await getIssuerInfo('0xabc...');
```

---

## Rate Limits

Currently **no rate limiting** implemented. Future considerations:

| Tier | Requests/Hour | Use Case |
|------|---------------|----------|
| Free | 100 | Testing, development |
| Basic | 1,000 | Small issuers |
| Pro | 10,000 | Large institutions |
| Enterprise | Unlimited | Universities, governments |

---

## Error Handling

### Standard Error Response

```typescript
{
  error: string;               // Error message
  code?: string;              // Error code (e.g., "INVALID_DELEGATION")
  details?: any;              // Additional error details
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `MISSING_PARAMS` | 400 | Required parameters missing |
| `INVALID_ADDRESS` | 400 | Invalid Ethereum address |
| `INVALID_DELEGATION` | 403 | Delegation signature invalid |
| `DELEGATION_EXPIRED` | 403 | Delegation has expired |
| `NOT_AUTHORIZED` | 403 | User not authorized |
| `CREDENTIAL_NOT_FOUND` | 404 | Credential does not exist |
| `TRANSACTION_FAILED` | 500 | Blockchain transaction failed |
| `AI_ANALYSIS_FAILED` | 500 | AI service error |
| `ENVIO_QUERY_FAILED` | 500 | Envio indexer error |

---

## Client Libraries

### TypeScript/JavaScript

Use the built-in service functions:

```typescript
// Envio queries
import {
  getCredentialById,
  getCredentialsByRecipient,
  getRecentMintEvents,
  checkPriorInteractions,
  getIssuerInfo,
} from '@/lib/server/envio';

// API calls
const response = await fetch('/api/credentials/verify?tokenId=123');
const data = await response.json();
```

### Python

```python
import requests

# Verify credential
response = requests.get(
    "https://your-domain.vercel.app/api/credentials/verify",
    params={"tokenId": "123"}
)
data = response.json()

if data["verified"]:
    print(f"✅ Credential valid: {data['credential']['credentialType']}")
else:
    print(f"❌ Credential invalid: {data['message']}")
```

### cURL

```bash
# Analyze fraud risk
curl -X POST https://your-domain.vercel.app/api/ai/analyze-fraud \
  -H "Content-Type: application/json" \
  -d '{"recipientAddress":"0x123...","issuerAddress":"0xabc...","credentialType":"DEGREE"}'

# Verify credential
curl https://your-domain.vercel.app/api/credentials/verify?tokenId=123

# Revoke credential
curl -X POST https://your-domain.vercel.app/api/credentials/revoke \
  -H "Content-Type: application/json" \
  -d '{"tokenId":"123","reason":"Fraud detected","issuerAddress":"0xabc..."}'
```

---

## Webhooks (Future)

Planned webhook support for real-time notifications:

### Events
- `credential.issued` - New credential minted
- `credential.revoked` - Credential revoked
- `delegation.granted` - Delegation created
- `delegation.revoked` - Delegation revoked
- `delegation.expired` - Delegation expired

### Webhook Payload
```typescript
{
  event: string;
  timestamp: number;
  data: {
    tokenId?: string;
    issuer: string;
    recipient?: string;
    credentialType?: string;
    transactionHash: string;
  };
}
```

---

## OpenAPI Specification

Full OpenAPI 3.0 spec available at:
`/api/openapi.json` (future)

Import into Postman, Insomnia, or Swagger UI for interactive API testing.

---

## Support

For API issues or questions:
- GitHub Issues: https://github.com/your-repo/issues
- Documentation: https://docs.vericred.xyz
- Discord: https://discord.gg/vericred

---

*VeriCred+ API provides secure, efficient access to credential issuance, verification, and AI-powered fraud detection.*
