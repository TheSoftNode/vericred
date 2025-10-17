# VeriCred+ Deployment Guide

## Overview

This guide covers deploying all components of VeriCred+ to production:
1. Smart Contracts (Monad Testnet)
2. Envio Indexer (Envio Cloud)
3. Frontend + API (Vercel)

---

## Prerequisites

### Required Tools

```bash
# Node.js 20+
node --version  # v20.0.0+

# pnpm (package manager)
npm install -g pnpm

# Foundry (smart contracts)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Envio CLI (indexer)
npm install -g envio
```

### Required Accounts

- **MetaMask Wallet** with Monad testnet configured
- **Monad Testnet Faucet** tokens (https://faucet.monad.xyz)
- **Envio Cloud Account** (https://envio.dev)
- **Vercel Account** (https://vercel.com)
- **OpenAI API Key** (https://platform.openai.com)
- **GitHub Account** (for CI/CD)

---

## Part 1: Smart Contract Deployment

### Step 1: Configure Environment

Create `/contract/.env`:

```bash
# Monad Testnet RPC
MONAD_TESTNET_RPC=https://testnet.monad.network

# Deployer private key (NEVER commit this!)
DEPLOYER_PRIVATE_KEY=0x...

# Monad Testnet Chain ID
CHAIN_ID=10143

# Block explorer (for verification)
MONAD_EXPLORER_URL=https://explorer-testnet.monad.xyz
```

**⚠️ IMPORTANT**: Add `.env` to `.gitignore`

### Step 2: Compile Contracts

```bash
cd contract

# Install dependencies
forge install

# Compile contracts
forge build

# Run tests
forge test

# Gas report
forge test --gas-report
```

**Expected Output**:
```
[⠊] Compiling...
[⠒] Compiling 25 files with 0.8.30
[⠢] Solc 0.8.30 finished in 3.42s
Compiler run successful!

Running 45 tests for src/test/VeriCredSBT.t.sol:VeriCredSBTTest
[PASS] testMintCredential() (gas: 157234)
[PASS] testRevokeCredential() (gas: 52143)
[PASS] testSoulboundTransferBlocked() (gas: 89234)
...
Test result: ok. 45 passed; 0 failed; finished in 12.34s
```

### Step 3: Deploy Contracts

Create deployment script at `/contract/script/Deploy.s.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../src/contracts/VeriCredSBT.sol";
import "../src/contracts/CredentialRegistry.sol";
import "../src/contracts/DelegationManager.sol";
import "../src/contracts/RiskAssessment.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy CredentialRegistry
        CredentialRegistry credentialRegistry = new CredentialRegistry();
        console.log("CredentialRegistry deployed:", address(credentialRegistry));

        // 2. Deploy RiskAssessment
        address oracleAddress = vm.envAddress("ORACLE_ADDRESS");
        RiskAssessment riskAssessment = new RiskAssessment(oracleAddress);
        console.log("RiskAssessment deployed:", address(riskAssessment));

        // 3. Deploy DelegationManager
        DelegationManager delegationManager = new DelegationManager();
        console.log("DelegationManager deployed:", address(delegationManager));

        // 4. Deploy VeriCredSBT
        VeriCredSBT veriCredSBT = new VeriCredSBT(
            address(credentialRegistry),
            address(delegationManager),
            address(riskAssessment)
        );
        console.log("VeriCredSBT deployed:", address(veriCredSBT));

        // 5. Configure contracts
        credentialRegistry.setSBTContract(address(veriCredSBT));
        veriCredSBT.setRiskAssessmentEnabled(true);
        veriCredSBT.setRiskThreshold(70); // Reject if risk > 70

        vm.stopBroadcast();

        // Save addresses to file
        string memory addresses = string(
            abi.encodePacked(
                "VERICRED_SBT_ADDRESS=", vm.toString(address(veriCredSBT)), "\n",
                "CREDENTIAL_REGISTRY_ADDRESS=", vm.toString(address(credentialRegistry)), "\n",
                "DELEGATION_MANAGER_ADDRESS=", vm.toString(address(delegationManager)), "\n",
                "RISK_ASSESSMENT_ADDRESS=", vm.toString(address(riskAssessment)), "\n"
            )
        );

        vm.writeFile("deployed-addresses.txt", addresses);
    }
}
```

**Run Deployment**:

```bash
# Deploy to Monad Testnet
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $MONAD_TESTNET_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  -vvvv

# Output will show deployed addresses
```

**Expected Output**:
```
== Logs ==
CredentialRegistry deployed: 0x1234...
RiskAssessment deployed: 0x5678...
DelegationManager deployed: 0x9abc...
VeriCredSBT deployed: 0xdef0...

ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.
Total Paid: 0.0234 MON

Saved addresses to deployed-addresses.txt
```

### Step 4: Verify Contracts on Block Explorer

```bash
# Verify VeriCredSBT
forge verify-contract \
  --chain-id 10143 \
  --compiler-version 0.8.30 \
  --constructor-args $(cast abi-encode "constructor(address,address,address)" $REGISTRY $DELEGATION $RISK) \
  $VERICRED_SBT_ADDRESS \
  src/contracts/VeriCredSBT.sol:VeriCredSBT

# Repeat for other contracts
```

**Check verification**: Visit https://explorer-testnet.monad.xyz/address/{CONTRACT_ADDRESS}

### Step 5: Grant Roles

```bash
# Grant ISSUER_ROLE to initial issuers
cast send $VERICRED_SBT_ADDRESS \
  "grantRole(bytes32,address)" \
  $(cast keccak "ISSUER_ROLE") \
  $ISSUER_ADDRESS \
  --rpc-url $MONAD_TESTNET_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY

# Grant DELEGATOR_ROLE to backend
cast send $VERICRED_SBT_ADDRESS \
  "grantRole(bytes32,address)" \
  $(cast keccak "DELEGATOR_ROLE") \
  $BACKEND_ADDRESS \
  --rpc-url $MONAD_TESTNET_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY
```

---

## Part 2: Envio Indexer Deployment

### Step 1: Configure Indexer

Update `/envio-indexer/config.yaml`:

```yaml
name: VeriCred_Enterprise_Indexer
version: 1.0.0

networks:
  - id: 10143
    start_block: 0  # Or block where contracts were deployed
    contracts:
      - name: VeriCredSBT
        address: "0xdef0..."  # From deployment
        abi_file_path: ./abis/VeriCredSBT.json
        handler: src/EventHandlers.ts
        events:
          - CredentialMinted(...)
          - CredentialRevoked(...)
          - DelegationGranted(...)
          - Transfer(...)

      - name: CredentialRegistry
        address: "0x1234..."  # From deployment
        abi_file_path: ./abis/CredentialRegistry.json
        handler: src/EventHandlers.ts
        events:
          - IssuerRegistered(...)
          - CredentialTypeRegistered(...)
```

### Step 2: Add Contract ABIs

Copy ABIs from compiled contracts:

```bash
cd envio-indexer

# Copy ABIs from contract build output
cp ../contract/out/VeriCredSBT.sol/VeriCredSBT.json ./abis/
cp ../contract/out/CredentialRegistry.sol/CredentialRegistry.json ./abis/
```

### Step 3: Generate Types

```bash
cd envio-indexer

# Install dependencies
npm install

# Generate TypeScript types from schema
envio codegen

# Output: generated/index.ts with all types
```

### Step 4: Test Locally

```bash
# Start local Postgres (required for local testing)
docker run -d \
  --name envio-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=envio \
  -p 5432:5432 \
  postgres:15

# Run local indexer
envio dev

# GraphQL playground available at http://localhost:8080
```

**Test Query** in playground:
```graphql
query {
  Credential(limit: 10) {
    id
    tokenId
    recipient
    issuer
    credentialType
    status
  }
}
```

### Step 5: Deploy to Envio Cloud

```bash
# Login to Envio Cloud
envio login

# Deploy indexer
envio deploy --env production

# Output will show GraphQL endpoint
```

**Expected Output**:
```
✅ Indexer deployed successfully!

Deployment Details:
- Name: VeriCred_Enterprise_Indexer
- Network: Monad Testnet (10143)
- Status: Indexing...

GraphQL Endpoint:
https://indexer.envio.dev/v1/vericred-enterprise/graphql

Dashboard:
https://app.envio.dev/project/vericred-enterprise
```

### Step 6: Monitor Indexing

```bash
# Check indexer status
envio status

# View logs
envio logs --follow

# Check current block
envio info
```

**Wait for indexing** to catch up to chain tip (may take 10-30 minutes for full sync).

---

## Part 3: Frontend + API Deployment

### Step 1: Configure Environment Variables

Create `/frontend/.env.local`:

```bash
# Monad Testnet
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet.monad.network
NEXT_PUBLIC_CHAIN_ID=10143

# Contract Addresses (from Part 1)
NEXT_PUBLIC_VERICRED_SBT_ADDRESS=0xdef0...
NEXT_PUBLIC_CREDENTIAL_REGISTRY_ADDRESS=0x1234...
NEXT_PUBLIC_DELEGATION_MANAGER_ADDRESS=0x9abc...
NEXT_PUBLIC_RISK_ASSESSMENT_ADDRESS=0x5678...

# Backend Delegation Address
NEXT_PUBLIC_BACKEND_DELEGATION_ADDRESS=0xBACKEND...

# Envio GraphQL API (from Part 2)
ENVIO_API_URL=https://indexer.envio.dev/v1/vericred-enterprise/graphql

# OpenAI API (server-side only, won't be exposed to client)
OPENAI_API_KEY=sk-...

# Backend Private Key (NEVER commit this!)
BACKEND_PRIVATE_KEY=0x...
```

**⚠️ IMPORTANT**:
- Add `.env.local` to `.gitignore`
- Never commit private keys or API keys

### Step 2: Install Dependencies

```bash
cd frontend

# Install dependencies
pnpm install

# Build project
pnpm build

# Test production build locally
pnpm start
```

**Expected Output**:
```
✓ Compiled successfully
✓ Ready in 3.2s
- Local:        http://localhost:3000
- Network:      http://192.168.1.x:3000
```

### Step 3: Deploy to Vercel

#### Option A: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Option B: Vercel Dashboard (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Select "frontend" as root directory

3. **Configure Environment Variables**:
   - In Vercel dashboard, go to "Settings" → "Environment Variables"
   - Add all variables from `.env.local`
   - Mark `BACKEND_PRIVATE_KEY` and `OPENAI_API_KEY` as **sensitive**

   | Key | Value | Environment |
   |-----|-------|-------------|
   | NEXT_PUBLIC_MONAD_RPC_URL | https://testnet.monad.network | Production |
   | NEXT_PUBLIC_CHAIN_ID | 10143 | Production |
   | NEXT_PUBLIC_VERICRED_SBT_ADDRESS | 0xdef0... | Production |
   | ENVIO_API_URL | https://indexer.envio.dev/... | Production |
   | OPENAI_API_KEY | sk-... | Production |
   | BACKEND_PRIVATE_KEY | 0x... | Production |

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)

**Expected Output**:
```
✅ Deployment Complete

Production URL: https://vericred.vercel.app

Build Logs:
✓ Installing dependencies
✓ Building Next.js application
✓ Exporting static pages
✓ Deployment ready
```

### Step 4: Configure Custom Domain (Optional)

In Vercel dashboard:
1. Go to "Settings" → "Domains"
2. Add custom domain (e.g., `vericred.xyz`)
3. Update DNS records as instructed
4. Wait for SSL certificate (auto-issued by Vercel)

---

## Part 4: Post-Deployment Configuration

### Configure MetaMask Smart Accounts

Update backend delegation address in frontend:

1. Generate backend wallet:
   ```bash
   # Generate new wallet
   cast wallet new

   # Output:
   # Address: 0xBACKEND...
   # Private Key: 0x...
   ```

2. Fund backend wallet with MON tokens:
   ```bash
   # Send MON from deployer to backend
   cast send $BACKEND_ADDRESS \
     --value 1ether \
     --rpc-url $MONAD_TESTNET_RPC \
     --private-key $DEPLOYER_PRIVATE_KEY
   ```

3. Grant DELEGATOR_ROLE to backend (if not done in Part 1):
   ```bash
   cast send $VERICRED_SBT_ADDRESS \
     "grantRole(bytes32,address)" \
     $(cast keccak "DELEGATOR_ROLE") \
     $BACKEND_ADDRESS \
     --rpc-url $MONAD_TESTNET_RPC \
     --private-key $DEPLOYER_PRIVATE_KEY
   ```

### Register Initial Issuers

```bash
# Register issuer in CredentialRegistry
cast send $CREDENTIAL_REGISTRY_ADDRESS \
  "registerIssuer(address,string,string,string,string[])" \
  $ISSUER_ADDRESS \
  "Stanford University" \
  "ipfs://logo..." \
  "https://stanford.edu" \
  '["UNIVERSITY_DEGREE","CERTIFICATE"]' \
  --rpc-url $MONAD_TESTNET_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY
```

### Register Credential Types

```bash
# Register UNIVERSITY_DEGREE type
cast send $CREDENTIAL_REGISTRY_ADDRESS \
  "registerCredentialType(string,string,uint256)" \
  "UNIVERSITY_DEGREE" \
  "Academic degree from accredited university" \
  157680000 \
  --rpc-url $MONAD_TESTNET_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY
```

---

## Part 5: Testing Deployment

### Test 1: Wallet Connection

1. Visit https://vericred.vercel.app
2. Click "Connect Wallet"
3. MetaMask should prompt to switch to Monad Testnet
4. Verify connected address shown in navbar

### Test 2: Smart Account Creation

1. Navigate to Issuer Dashboard
2. Go through onboarding flow
3. Sign smart account creation
4. Verify smart account address displayed

### Test 3: Delegation Setup

1. In Issuer Dashboard, click "Enable Delegation"
2. MetaMask should show delegation signing prompt
3. Sign delegation
4. Verify "✅ Delegation Active" message

### Test 4: AI Fraud Analysis

1. Go to "Issue Credential"
2. Enter test recipient address
3. Click "Analyze Fraud Risk"
4. Verify AI analysis appears with risk score

### Test 5: Credential Issuance

1. After AI analysis shows low risk, click "Issue Credential"
2. Verify transaction appears in Monad explorer
3. Wait for transaction confirmation
4. Check Envio indexer updated (query GraphQL endpoint)

### Test 6: Credential Verification

1. Navigate to Verifier Dashboard
2. Enter credential token ID
3. Click "Verify"
4. Verify credential details shown instantly

---

## Part 6: Monitoring & Maintenance

### Monitor Smart Contracts

**Monad Block Explorer**: https://explorer-testnet.monad.xyz

Track:
- Transaction count
- Gas usage
- Contract events
- Failed transactions

### Monitor Envio Indexer

**Envio Dashboard**: https://app.envio.dev

Track:
- Indexing lag (current block vs chain tip)
- Events processed per second
- Query response times
- Error rates

**Health Check**:
```bash
# Check indexer status
curl https://indexer.envio.dev/v1/vericred-enterprise/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ _meta { block { number } } }"}'
```

### Monitor Frontend/API

**Vercel Analytics**: https://vercel.com/analytics

Track:
- Page views
- API response times
- Error rates
- User geography

**Custom Monitoring**:
```typescript
// Add to frontend analytics
export function trackEvent(event: string, data: any) {
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics service
    fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify({ event, data, timestamp: Date.now() }),
    });
  }
}
```

### Log Aggregation

Use Vercel's built-in logging or integrate with external service:

**Vercel Logs**:
```bash
# View real-time logs
vercel logs --follow
```

**Optional: Integrate Datadog/Sentry**:
```bash
npm install @sentry/nextjs

# Configure in next.config.js
```

---

## Part 7: Continuous Deployment

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy VeriCred+

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1

      - name: Run contract tests
        run: |
          cd contract
          forge test

      - name: Install Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Test frontend build
        run: |
          cd frontend
          pnpm install
          pnpm build

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend

  deploy-envio:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Envio CLI
        run: npm install -g envio

      - name: Deploy indexer
        run: |
          cd envio-indexer
          envio login --token ${{ secrets.ENVIO_TOKEN }}
          envio deploy --env production
```

**Add GitHub Secrets**:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `ENVIO_TOKEN`

---

## Part 8: Scaling Considerations

### Optimize Smart Contracts

**Gas Optimization**:
```solidity
// Use packed storage
struct CredentialData {
    uint96 issuanceDate;    // Packed into single slot
    uint96 expirationDate;
    uint64 credentialHash;
}

// Batch operations
function mintCredentialBatch(address[] memory recipients, ...) external {
    for (uint i = 0; i < recipients.length; i++) {
        _mintCredential(recipients[i], ...);
    }
}
```

### Optimize Envio Queries

**Add Indexes**:
```graphql
type Credential {
  recipient: String! @index
  issuer: String! @index
  credentialType: String! @index
  status: CredentialStatus! @index
}
```

**Use Pagination**:
```typescript
// Frontend: Load credentials in batches
const { data } = useSWR(
  `/api/credentials?recipient=${address}&limit=50&offset=${page * 50}`,
  fetcher
);
```

### Optimize Frontend

**Code Splitting**:
```typescript
// Lazy load heavy components
const DashboardChart = dynamic(() => import('./DashboardChart'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

**API Caching**:
```typescript
// Cache AI analysis results (24h)
export const revalidate = 86400;
```

---

## Troubleshooting

### Issue: Contract deployment fails

**Error**: `insufficient funds for gas * price + value`

**Solution**: Fund deployer wallet with more MON tokens from faucet.

---

### Issue: Envio indexer not syncing

**Error**: `Error: failed to fetch block`

**Solution**:
1. Check RPC URL is correct in config.yaml
2. Verify contracts deployed at specified addresses
3. Restart indexer: `envio restart`

---

### Issue: MetaMask delegation not working

**Error**: `User rejected the request`

**Solution**:
1. Check delegation parameters are correct
2. Verify user is on Monad Testnet
3. Clear MetaMask cache and retry

---

### Issue: API routes returning 500

**Error**: `OPENAI_API_KEY not found`

**Solution**:
1. Add environment variable in Vercel dashboard
2. Redeploy: `vercel --prod`

---

## Production Checklist

- [ ] Smart contracts deployed and verified
- [ ] Contract roles granted (ISSUER_ROLE, DELEGATOR_ROLE)
- [ ] Envio indexer deployed and synced
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Analytics set up
- [ ] Error monitoring configured
- [ ] GitHub Actions CI/CD configured
- [ ] Documentation updated
- [ ] Demo video recorded
- [ ] Team notified of URLs

---

## Production URLs

After deployment, update these in documentation:

```bash
# Smart Contracts
VeriCredSBT: https://explorer-testnet.monad.xyz/address/0xdef0...
CredentialRegistry: https://explorer-testnet.monad.xyz/address/0x1234...

# Envio Indexer
GraphQL API: https://indexer.envio.dev/v1/vericred-enterprise/graphql
Dashboard: https://app.envio.dev/project/vericred-enterprise

# Frontend
Production: https://vericred.vercel.app
Custom Domain: https://vericred.xyz (if configured)

# API
Base URL: https://vericred.vercel.app/api
```

---

*VeriCred+ is now live on Monad Testnet! 🚀*
