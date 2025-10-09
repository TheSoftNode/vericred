# VeriCred+ Complete Setup Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Deployment Guide](#deployment-guide)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: v18+ ([Download](https://nodejs.org))
- **pnpm**: v8+ (`npm install -g pnpm`)
- **Foundry**: Latest ([Install](https://book.getfoundry.sh/getting-started/installation))
- **MetaMask**: Browser extension with Monad testnet configured
- **Git**: For version control

### Required Accounts

1. **OpenAI API Key**: [Get API key](https://platform.openai.com/api-keys) (for AI fraud analysis)
2. **Monad Testnet Tokens**: [Get from faucet](https://testnet-faucet.monad.xyz)
3. **Envio Account**: [Sign up](https://envio.dev) (for indexer deployment)

---

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd VeriCred

# Install frontend dependencies
cd frontend
pnpm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.local.example .env.local

# Edit .env.local and add your values
nano .env.local
```

**Required variables:**
```env
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Blockchain (Monad Testnet)
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_VERICRED_SBT_ADDRESS=<from-step-3>
NEXT_PUBLIC_BACKEND_ADDRESS=<from-step-3>

# Envio (from step 4)
ENVIO_API_URL=<from-step-4>

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
```

### 3. Deploy Smart Contracts

```bash
# Go to contract directory
cd ../contract

# Install dependencies
forge install

# Create .env file
cp .env.example .env

# Add private key to .env
echo "PRIVATE_KEY=<your-private-key>" >> .env

# Deploy to Monad testnet
forge script script/Deploy.s.sol --rpc-url https://testnet-rpc.monad.xyz --broadcast --verify

# Copy deployed contract addresses to frontend/.env.local
```

### 4. Deploy Envio Indexer

```bash
# Go to envio-indexer directory
cd ../envio-indexer

# Install dependencies
pnpm install

# Update config.yaml with deployed contract addresses
nano config.yaml

# Start indexer in dev mode
pnpm envio dev

# Copy GraphQL endpoint URL to frontend/.env.local as ENVIO_API_URL
# Example: https://indexer.bigdevenergy.link/<your-project>/v1/graphql
```

### 5. Start Frontend

```bash
# Go to frontend directory
cd ../frontend

# Start development server
pnpm dev

# Open http://localhost:3000
```

---

## Detailed Setup

### Frontend Architecture

The VeriCred+ frontend is a Next.js 14 App Router application that serves both as the UI and API backend.

**Directory Structure:**
```
frontend/
├── app/                          # Next.js App Router
│   ├── api/                      # Backend API routes
│   │   ├── ai/analyze-fraud/     # AI fraud detection
│   │   ├── credentials/verify/   # Credential verification
│   │   ├── delegations/          # Delegation storage
│   │   └── frames/verify/        # Farcaster frames
│   ├── issuer/                   # Issuer pages
│   ├── verify/                   # Verification pages
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── delegation/               # Delegation UI components
│   │   └── IssuerOnboarding.tsx  # 3-step onboarding flow
│   └── ui/                       # Reusable UI components
├── lib/                          # Utilities
│   ├── delegation/               # Delegation hooks
│   │   ├── useWallet.ts          # Wallet connection
│   │   ├── useSmartAccount.ts    # Smart account creation
│   │   └── useDelegation.ts      # Delegation signing
│   └── server/                   # Server-side services
│       └── envio.ts              # Envio GraphQL queries
└── public/                       # Static assets
```

### Delegation Setup

VeriCred+ uses MetaMask's Delegation Toolkit to enable issuers to delegate credential minting to the backend.

**Flow:**
1. **Connect Wallet** → User connects MetaMask (`useWallet` hook)
2. **Create Smart Account** → User creates a smart account (`useSmartAccount` hook)
3. **Grant Delegation** → User signs delegation with caveats (`useDelegation` hook)
4. **Store Delegation** → Frontend sends to `/api/delegations`
5. **Backend Mints** → Backend redeems delegation to mint credentials

**Key Files:**
- [lib/delegation/useWallet.ts](frontend/lib/delegation/useWallet.ts) - Wallet connection and chain switching
- [lib/delegation/useSmartAccount.ts](frontend/lib/delegation/useSmartAccount.ts) - Smart account creation with Hybrid implementation
- [lib/delegation/useDelegation.ts](frontend/lib/delegation/useDelegation.ts) - Delegation creation with caveats
- [components/delegation/IssuerOnboarding.tsx](frontend/components/delegation/IssuerOnboarding.tsx) - Complete 3-step UI

**Caveats Applied:**
```typescript
// Only allow VeriCredSBT contract
caveatBuilder.addCaveat('allowedTargets', {
  targets: [veriCredSBTAddress],
});

// Only allow mintCredential function
caveatBuilder.addCaveat('allowedMethods', {
  methods: [{ target: veriCredSBTAddress, selector: '0x...' }],
});

// Limit to 100 credentials
caveatBuilder.addCaveat('limitedCalls', { limit: 100 });

// Valid for 30 days
caveatBuilder.addCaveat('timestamp', {
  validAfter: nowInSeconds,
  validUntil: nowInSeconds + (30 * 24 * 60 * 60),
});
```

### API Routes

All backend logic is implemented as Next.js API routes in `app/api/`.

#### 1. AI Fraud Analysis - `/api/ai/analyze-fraud`

**Purpose:** PRD Feature 2 - AI-Powered Issuance Delegation

**Flow:**
```
User submits form → Query Envio for on-chain data → Send to OpenAI GPT-4o → Return risk analysis
```

**Implementation:**
- Queries Envio for recipient's credential history
- Checks prior interactions between issuer and recipient
- Fetches issuer reputation
- Sends context to OpenAI with specific prompt
- Returns risk score (0-100), risk level (LOW/MEDIUM/HIGH), recommendations

**Example:**
```bash
curl -X POST http://localhost:3000/api/ai/analyze-fraud \
  -H "Content-Type: application/json" \
  -d '{
    "recipientAddress": "0x1234...",
    "issuerAddress": "0x5678...",
    "credentialType": "Bachelor_Degree"
  }'
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

#### 2. Credential Verification - `/api/credentials/verify`

**Purpose:** PRD Feature 3 - Instant, Trustless Verification

**Flow:**
```
User provides tokenId → Query Envio → Return credential status
```

**Implementation:**
- Queries Envio HyperIndex for credential by token ID
- Returns full credential data + verification status
- Sub-2 second response time (Envio's real-time indexing)

**Example:**
```bash
curl http://localhost:3000/api/credentials/verify?tokenId=123
```

**Response:**
```json
{
  "verified": true,
  "status": "ACTIVE",
  "credential": {
    "tokenId": "123",
    "recipient": "0x...",
    "issuer": "0x...",
    "credentialType": "Bachelor_Degree",
    "issuedAt": "2025-10-09T12:00:00Z",
    "metadataURI": "ipfs://...",
    "transactionHash": "0x...",
    "blockNumber": "12345"
  },
  "message": "✅ Verified: This credential is valid and active"
}
```

#### 3. Delegation Storage - `/api/delegations`

**Purpose:** Store signed delegations from frontend

**POST `/api/delegations`:**
```typescript
// Store delegation
const response = await fetch('/api/delegations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    delegation: { from, to, scope, caveats, signature },
    smartAccountAddress: '0x...',
    issuerAddress: '0x...',
  }),
});

// Returns { delegationId, success: true }
```

**GET `/api/delegations`:**
```typescript
// List delegations
const response = await fetch('/api/delegations?issuerAddress=0x...');

// Returns { delegations: [...], count: N }
```

**Note:** Currently uses in-memory Map storage. Replace with database for production.

#### 4. Farcaster Frame - `/api/frames/verify/[credentialId]`

**Purpose:** PRD Bonus Feature - Social verification on Farcaster

**Implementation:**
- Generates Farcaster Frame HTML with meta tags
- Queries Envio for credential status
- Returns frame with verification badge

**Usage:**
1. User mints credential
2. Share link: `https://vericred.com/api/frames/verify/123`
3. Farcaster displays frame with "✅ Verified on VeriCred+" button
4. Anyone can click to verify instantly

### Envio Integration

Envio HyperIndex provides real-time blockchain data via GraphQL.

**Service:** [lib/server/envio.ts](frontend/lib/server/envio.ts)

**Key Functions:**
```typescript
// Get credential by token ID
await getCredentialById(tokenId)

// Get all credentials for recipient
await getCredentialsByRecipient(address)

// Get recent mint events (for AI analysis)
await getRecentMintEvents(address, limit)

// Check prior interactions
await checkPriorInteractions(issuerAddress, recipientAddress)

// Get issuer info and stats
await getIssuerInfo(address)

// Get comprehensive activity summary
await getRecipientActivitySummary(address)
```

**GraphQL Schema:** See [envio-indexer/schema.graphql](envio-indexer/schema.graphql)

**Key Entities:**
- `Credential` - Aggregated credential data (current state)
- `Issuer` - Issuer statistics and reputation
- `CredentialType` - Analytics by credential type
- `VeriCredSBT_CredentialMinted` - Mint event logs
- `VeriCredSBT_CredentialRevoked` - Revoke event logs

**Event Handlers:** See [envio-indexer/src/EventHandlers.ts](envio-indexer/src/EventHandlers.ts)

**Readiness:** 27/27 event handlers complete (100%) - See [resources/envio_indexer_readiness_assessment.md](resources/envio_indexer_readiness_assessment.md)

---

## Deployment Guide

### 1. Deploy Smart Contracts

**Deployment Script:** [contract/script/Deploy.s.sol](contract/script/Deploy.s.sol)

```bash
cd contract

# Deploy VeriCredSBT
forge script script/Deploy.s.sol \
  --rpc-url https://testnet-rpc.monad.xyz \
  --broadcast \
  --verify

# Save contract addresses
# VeriCredSBT: 0x...
# CredentialRegistry: 0x...
```

**Update frontend/.env.local:**
```env
NEXT_PUBLIC_VERICRED_SBT_ADDRESS=0x...
```

### 2. Deploy Envio Indexer

**Config:** [envio-indexer/config.yaml](envio-indexer/config.yaml)

```bash
cd envio-indexer

# Update contract addresses in config.yaml
nano config.yaml

# Deploy to Envio cloud
pnpm envio deploy

# Get GraphQL endpoint URL
# Example: https://indexer.bigdevenergy.link/<project-id>/v1/graphql
```

**Update frontend/.env.local:**
```env
ENVIO_API_URL=https://indexer.bigdevenergy.link/<project-id>/v1/graphql
```

### 3. Configure Backend Wallet

The backend needs a wallet to redeem delegations and mint credentials.

```bash
# Generate new wallet (or use existing)
cast wallet new

# Fund with Monad testnet tokens
# Get from: https://testnet-faucet.monad.xyz

# Add to .env.local
echo "BACKEND_PRIVATE_KEY=0x..." >> .env.local
echo "NEXT_PUBLIC_BACKEND_ADDRESS=0x..." >> .env.local
```

**Security:** Never commit private keys. Use environment variable management in production.

### 4. Deploy Frontend

**Recommended platforms:**
- [Vercel](https://vercel.com) - Optimal for Next.js (easiest)
- [Railway](https://railway.app) - Good for full-stack apps
- [Google Cloud Run](https://cloud.google.com/run) - Containerized deployment

**Vercel Deployment:**

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Settings → Environment Variables
# Add all variables from .env.local
```

**Environment Variables to Set:**
```
NEXT_PUBLIC_APP_URL=https://vericred.vercel.app
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_VERICRED_SBT_ADDRESS=0x...
NEXT_PUBLIC_BACKEND_ADDRESS=0x...
ENVIO_API_URL=https://indexer.bigdevenergy.link/.../v1/graphql
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
BACKEND_PRIVATE_KEY=0x...
```

### 5. Post-Deployment Verification

**Checklist:**

- [ ] Frontend loads at production URL
- [ ] MetaMask connects successfully
- [ ] Smart account creation works
- [ ] Delegation signing works
- [ ] `/api/credentials/verify?tokenId=123` returns data
- [ ] `/api/ai/analyze-fraud` returns risk analysis
- [ ] Farcaster frame renders at `/api/frames/verify/123`
- [ ] Envio indexer is syncing blocks
- [ ] OpenAI API key works (check logs)

---

## Testing

### Unit Testing

**Test delegation hooks:**

```bash
cd frontend
pnpm test
```

### Integration Testing

**Test complete issuer flow:**

1. Open [http://localhost:3000/issuer](http://localhost:3000/issuer)
2. Click "Connect MetaMask"
3. Approve MetaMask connection
4. Click "Create Smart Account"
5. Confirm transaction
6. Click "Grant Delegation"
7. Sign delegation in MetaMask
8. Verify delegation stored at `/api/delegations`

**Test verification:**

```bash
# Query Envio directly
curl -X POST $ENVIO_API_URL \
  -H "Content-Type: application/json" \
  -d '{"query": "{ Credential(id: \"credential_1\") { tokenId status recipient } }"}'

# Test verification API
curl http://localhost:3000/api/credentials/verify?tokenId=1
```

**Test AI analysis:**

```bash
curl -X POST http://localhost:3000/api/ai/analyze-fraud \
  -H "Content-Type: application/json" \
  -d '{
    "recipientAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "issuerAddress": "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
    "credentialType": "Bachelor_Degree"
  }'
```

### Load Testing

**Test Envio performance:**

```bash
# Install k6
brew install k6

# Create load test script
cat > load-test.js <<EOF
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 100,
  duration: '30s',
};

export default function() {
  let res = http.get('http://localhost:3000/api/credentials/verify?tokenId=1');
  check(res, { 'status is 200': (r) => r.status === 200 });
}
EOF

# Run load test
k6 run load-test.js
```

---

## Troubleshooting

### Common Issues

#### 1. MetaMask Not Connecting

**Symptoms:** "Could not detect MetaMask" error

**Solutions:**
- Install MetaMask browser extension
- Refresh page after installing MetaMask
- Check browser console for errors
- Ensure MetaMask is unlocked

#### 2. Wrong Network

**Symptoms:** "Please switch to Monad Testnet" message

**Solutions:**
- Click "Switch Network" button in UI
- Approve network switch in MetaMask
- Manually add Monad testnet to MetaMask:
  - Network Name: Monad Testnet
  - RPC URL: https://testnet-rpc.monad.xyz
  - Chain ID: 10143
  - Currency Symbol: MON

#### 3. Smart Account Creation Fails

**Symptoms:** Transaction reverts or times out

**Solutions:**
- Ensure wallet has testnet MON tokens
- Get from faucet: https://testnet-faucet.monad.xyz
- Check RPC URL is correct in `.env.local`
- Verify contract is deployed on Monad testnet

#### 4. Delegation Signature Error

**Symptoms:** "Invalid delegation signature" error

**Solutions:**
- Ensure smart account is created first
- Check that `NEXT_PUBLIC_BACKEND_ADDRESS` is set correctly
- Verify caveats are properly formatted
- Check MetaMask connection is active

#### 5. Envio GraphQL Error

**Symptoms:** "Failed to fetch credential" or "ENVIO_API_URL not configured"

**Solutions:**
- Check `ENVIO_API_URL` in `.env.local`
- Verify Envio indexer is running (`pnpm envio dev`)
- Test GraphQL endpoint directly:
  ```bash
  curl -X POST $ENVIO_API_URL \
    -H "Content-Type: application/json" \
    -d '{"query": "{ Credential { id } }"}'
  ```
- Check indexer logs for errors

#### 6. OpenAI API Error

**Symptoms:** "OpenAI API error" or "Invalid API key"

**Solutions:**
- Verify `OPENAI_API_KEY` is correct (starts with `sk-`)
- Check OpenAI account has credits
- Test API key:
  ```bash
  curl https://api.openai.com/v1/models \
    -H "Authorization: Bearer $OPENAI_API_KEY"
  ```
- Ensure `OPENAI_MODEL=gpt-4o` (not gpt-4 or gpt-3.5-turbo)

#### 7. "Cannot find module" Errors

**Symptoms:** Import errors in Next.js

**Solutions:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
pnpm install

# Clear Next.js cache
rm -rf .next

# Restart dev server
pnpm dev
```

#### 8. Contract Not Found

**Symptoms:** "Contract not deployed at address" error

**Solutions:**
- Verify contract address in `.env.local` matches deployed address
- Check contract is deployed on correct network (Chain ID 10143)
- Use block explorer to verify contract exists
- Re-deploy if necessary

---

## Project Structure Reference

```
VeriCred/
├── frontend/                   # Next.js frontend + API backend
│   ├── app/                    # App Router
│   │   ├── api/                # Backend API routes
│   │   │   ├── ai/
│   │   │   │   └── analyze-fraud/route.ts
│   │   │   ├── credentials/
│   │   │   │   └── verify/route.ts
│   │   │   ├── delegations/route.ts
│   │   │   └── frames/
│   │   │       └── verify/[credentialId]/route.ts
│   │   ├── issuer/             # Issuer pages
│   │   ├── verify/             # Verification pages
│   │   └── layout.tsx
│   ├── components/
│   │   ├── delegation/
│   │   │   └── IssuerOnboarding.tsx
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/
│   │   ├── delegation/
│   │   │   ├── useWallet.ts
│   │   │   ├── useSmartAccount.ts
│   │   │   └── useDelegation.ts
│   │   └── server/
│   │       └── envio.ts        # Envio GraphQL service
│   ├── public/
│   ├── .env.local.example
│   └── package.json
├── contract/                   # Foundry smart contracts
│   ├── src/
│   │   ├── VeriCredSBT.sol
│   │   └── CredentialRegistry.sol
│   ├── script/
│   │   └── Deploy.s.sol
│   ├── test/
│   └── foundry.toml
├── envio-indexer/              # Envio HyperIndex
│   ├── src/
│   │   └── EventHandlers.ts    # 27/27 handlers complete
│   ├── schema.graphql          # GraphQL schema
│   ├── config.yaml             # Envio configuration
│   └── package.json
├── resources/                  # Documentation
│   ├── prd.md                  # Product Requirements
│   ├── delegation/             # MetaMask Delegation Toolkit docs
│   ├── metamask-docs/          # MetaMask integration guides
│   └── *.md                    # Technical docs
├── API_DOCUMENTATION.md        # API reference
└── SETUP_GUIDE.md             # This file
```

---

## Next Steps After Setup

### For Development

1. **Create UI Pages:**
   - Issuer dashboard with AI fraud analysis display
   - Credential verification page at `/verify`
   - Credential holder dashboard
   - Admin panel for managing issuers

2. **Implement Delegation Redemption:**
   - Backend service to redeem stored delegations
   - Batch minting for efficiency
   - Usage tracking and limits enforcement

3. **Add Authentication:**
   - NextAuth.js for session management
   - API route protection middleware
   - Role-based access control (Issuer, Verifier, Holder)

4. **Database Integration:**
   - Replace in-memory delegation storage with PostgreSQL
   - Add delegation history tracking
   - Implement delegation revocation

5. **Testing:**
   - Unit tests for hooks and API routes
   - Integration tests for complete flows
   - E2E tests with Playwright

### For Production

1. **Security Hardening:**
   - Rate limiting on API routes
   - Input validation and sanitization
   - CORS configuration
   - CSP headers
   - Secure key management (AWS Secrets Manager, Vault)

2. **Monitoring:**
   - Error tracking (Sentry)
   - Analytics (Plausible, PostHog)
   - Performance monitoring (Vercel Analytics)
   - Uptime monitoring (UptimeRobot)

3. **Optimization:**
   - Image optimization
   - Code splitting
   - Caching strategies
   - Database indexing

4. **Documentation:**
   - User guides
   - API documentation (this is done)
   - Video tutorials
   - FAQ

---

## Resources

### Official Documentation

- **VeriCred PRD:** [resources/prd.md](resources/prd.md)
- **API Docs:** [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Envio Readiness:** [resources/envio_indexer_readiness_assessment.md](resources/envio_indexer_readiness_assessment.md)

### External Documentation

- **Next.js:** https://nextjs.org/docs
- **MetaMask Delegation Toolkit:** https://docs.metamask.io/delegation-toolkit
- **Envio:** https://docs.envio.dev
- **Monad:** https://docs.monad.xyz
- **Foundry:** https://book.getfoundry.sh
- **OpenAI:** https://platform.openai.com/docs

### Community

- **GitHub Issues:** [Report bugs or request features]
- **Discord:** [Join community for support]
- **Twitter:** [Follow for updates]

---

## FAQ

### Q: Do I need a separate backend server?

**A:** No. VeriCred+ uses Next.js API Routes as the backend. Everything runs in a single Next.js application.

### Q: Is the in-memory delegation storage production-ready?

**A:** No. It's for MVP/demo purposes. For production, replace with PostgreSQL, MongoDB, or Redis.

### Q: How long does verification take?

**A:** Verification via Envio takes <2 seconds thanks to real-time indexing.

### Q: Can I use this on mainnet?

**A:** Yes, but update the chain ID, RPC URL, and deploy contracts to mainnet first. Ensure proper security audits.

### Q: What if OpenAI is down?

**A:** The AI fraud analysis feature will fail. Consider implementing fallback logic or caching previous analyses.

### Q: How do I revoke a delegation?

**A:** Delegation revocation is not yet implemented. You can manually mark delegations as `status: 'revoked'` in storage and add checks before redemption.

### Q: Is the smart account non-custodial?

**A:** Yes. The user's EOA is the owner of the smart account. They maintain full control.

---

**Last Updated:** October 9, 2025
**Version:** 1.0.0
**Status:** ✅ Ready for Development
