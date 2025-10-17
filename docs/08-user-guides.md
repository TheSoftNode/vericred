# VeriCred+ User Guides

## Overview

This guide provides step-by-step instructions for all three user personas: Issuers, Holders, and Verifiers.

---

## User Personas

### Isabella - University Registrar (Issuer)
**Goal**: Issue digital diplomas to graduates efficiently and securely

### Alex - Recent Graduate (Holder)
**Goal**: Store and share verifiable credentials with employers

### David - HR Manager (Verifier)
**Goal**: Verify candidate credentials instantly

---

## Part 1: Issuer Guide

### Getting Started as an Issuer

#### Step 1: Connect Your Wallet

1. Visit https://vericred.xyz
2. Click **"Connect Wallet"** in top-right corner
3. MetaMask will open → Click **"Next"** → **"Connect"**
4. MetaMask may prompt you to add Monad Testnet:
   - Click **"Approve"** to add network
   - Click **"Switch network"** to Monad Testnet

**✅ Success**: You should see your address in the navbar (e.g., `0x1234...5678`)

---

#### Step 2: Navigate to Issuer Dashboard

1. Click **"Dashboard"** in navbar
2. Select **"I'm an Issuer"**
3. Click **"Get Started"**

You'll be taken to the Issuer Onboarding flow.

---

#### Step 3: Complete Issuer Onboarding

**Onboarding Checklist**:

1. **Organization Information**
   - Enter your organization name (e.g., "Stanford University")
   - Enter website URL (e.g., "https://stanford.edu")
   - Enter contact email
   - Upload logo (optional)

2. **Create Smart Account**
   - Click **"Create Smart Account"**
   - MetaMask will prompt you to sign a message
   - Click **"Sign"**
   - Wait 5-10 seconds for smart account creation
   - **✅ Success**: Smart account address displayed

3. **Enable Delegation**
   - Review delegation explanation:
     > "This allows VeriCred+ backend to issue credentials on your behalf, making the process gasless and automated."

   - Click **"Grant Permission"**
   - MetaMask will show delegation signing prompt:
     ```
     Sign Delegation Request

     You are granting permission to:
     Backend: 0xBACKEND...

     To perform:
     - Mint credentials on VeriCredSBT contract

     Restrictions:
     - Maximum 100 credentials
     - Expires in 30 days
     - Only specific function

     [Cancel] [Sign]
     ```

   - Click **"Sign"**
   - **✅ Success**: "Delegation Active ✅" message appears

4. **Complete Onboarding**
   - Click **"Go to Dashboard"**

---

### Issuing Your First Credential

#### Step 1: Navigate to Issue Page

From Issuer Dashboard sidebar:
- Click **"Issue Credential"**

---

#### Step 2: Enter Recipient Information

**Form Fields**:

1. **Recipient Address** (required)
   - Enter Ethereum address of credential holder
   - Example: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
   - Or paste ENS name (e.g., `alex.eth`)

2. **Click "Analyze Fraud Risk"**
   - This triggers AI analysis of recipient's on-chain history
   - Wait 3-5 seconds for analysis

---

#### Step 3: Review AI Risk Analysis

**AI Analysis Display**:

**Example: Low Risk** 🟢
```
🤖 AI Risk Analysis

🟢 Low Risk (25/100)   Confidence: 85%

Analysis:
Recipient has a clean history with 15 total credentials,
only 3 revoked (20% revocation rate, within normal range).
Prior interaction with this issuer (2 previous credentials)
reduces risk. Recent activity shows steady pace over 6 months.

Recommendation: Approve ✅
```

**Example: High Risk** 🔴
```
🤖 AI Risk Analysis

🔴 High Risk (85/100)   Confidence: 95%

Analysis:
CRITICAL: Recipient received 50 credentials in last 24 hours
from 10 different issuers, all of type 'DEGREE'.
Revocation rate is 60% (30/50).

⚠️ Red Flags:
• Abnormal minting velocity (50 in 24h)
• High revocation rate (60%)
• No prior issuer relationship

Recommendation: Reject ❌
```

**Actions**:
- **If Low Risk**: Proceed to next step
- **If Medium/High Risk**: Review carefully or reject

---

#### Step 4: Complete Credential Details

3. **Credential Type** (required)
   - Select from dropdown:
     - University Degree
     - Professional License
     - Certification
     - Employment Verification
     - Other

4. **Student/Recipient Name** (required)
   - Example: "Alex Johnson"

5. **Degree/Certificate Name** (required)
   - Example: "Bachelor of Science in Computer Science"

6. **Graduation/Issue Date** (required)
   - Select date from calendar

7. **Expiration Date** (optional)
   - Leave empty for "Never expires"
   - Or select date (e.g., professional licenses)

8. **Additional Information** (optional)
   - GPA, honors, major, etc.
   - Example: "Graduated with Honors, GPA 3.85"

---

#### Step 5: Issue Credential

1. Click **"Issue Credential"** button
2. Wait for transaction processing (~5-10 seconds)
3. **✅ Success**: Confirmation screen appears:

```
✅ Credential Issued Successfully!

Token ID: 123
Transaction: 0x789abc...
Block: 12345

The credential has been minted on Monad blockchain
and is now verifiable by anyone.
```

4. Click **"Issue Another"** or **"View Credentials"**

---

### Managing Your Credentials

#### View Issued Credentials

1. From sidebar, click **"Credentials"**
2. View all credentials you've issued

**Credential List Features**:
- **Search**: Filter by recipient address or credential type
- **Filter**: All / Active / Revoked
- **Sort**: By issue date, type, status

**Stats Cards** (top of page):
```
┌─────────────┬─────────────┬─────────────┐
│ Total Issued│   Active    │   Revoked   │
│     127     │     118     │      9      │
└─────────────┴─────────────┴─────────────┘
```

---

#### Revoke a Credential

**When to Revoke**:
- Credential obtained fraudulently
- Recipient no longer qualifies
- Error in issuance

**How to Revoke**:

1. Find credential in list
2. Click **"⋮"** (three dots) → **"Revoke"**
3. Modal appears:
   ```
   Revoke Credential

   Token ID: 123
   Recipient: 0x1234...
   Type: University Degree

   Reason for Revocation:
   [Text area: Enter reason...]

   [Cancel] [Revoke Credential]
   ```

4. Enter revocation reason
5. Click **"Revoke Credential"**
6. Sign transaction in MetaMask
7. **✅ Success**: Credential status updated to "Revoked"

**⚠️ Warning**: Revocation is permanent and publicly visible on-chain.

---

### Issuer Settings

#### Update Organization Profile

1. From sidebar, click **"Settings"**
2. Update information:
   - Organization name
   - Website URL
   - Contact email
   - Logo (upload new image)

3. Click **"Save Changes"**

---

#### Manage Delegation

**View Delegation Status**:
- Active delegation shown in "Delegation" section
- Shows expiration date and credentials remaining

**Revoke Delegation**:
1. Click **"Revoke Delegation"**
2. Confirm in modal
3. Sign transaction in MetaMask

**Renew Delegation**:
1. Click **"Renew Delegation"**
2. Sign new delegation request
3. Extends for another 30 days

---

## Part 2: Holder Guide

### Getting Started as a Holder

#### Step 1: Connect Wallet

Same as Issuer (see Part 1, Step 1)

---

#### Step 2: Navigate to Holder Dashboard

1. Click **"Dashboard"** in navbar
2. Select **"I'm a Holder"**
3. Click **"Get Started"**

---

### Viewing Your Credentials

#### Access Your Credentials

1. From sidebar, click **"Credentials"**
2. View all credentials issued to you

**Credential Card Example**:
```
┌───────────────────────────────────────┐
│ 🎓 University Degree                  │
├───────────────────────────────────────┤
│ Bachelor of Science in Computer Science│
│                                       │
│ Issued by: Stanford University        │
│ Issued: Jan 15, 2024                  │
│ Status: Active ✅                     │
│                                       │
│ [View Details] [Share] [Download]    │
└───────────────────────────────────────┘
```

**Filter Credentials**:
- All
- Active
- Expired
- Revoked

**Sort By**:
- Issue Date (newest first)
- Credential Type
- Issuer

---

#### View Credential Details

1. Click **"View Details"** on any credential
2. Modal shows full information:

```
Credential Details

Token ID: 123
Type: University Degree
Status: Active ✅

Recipient: 0x1234... (You)
Issuer: 0xabcd... (Stanford University)

Issued: Jan 15, 2024, 10:30 AM
Expires: Never

Additional Information:
Graduated with Honors, GPA 3.85

Blockchain Details:
Transaction: 0x789... [View on Explorer]
Block: 12345

[Download as PDF] [Generate QR Code]
```

---

### Sharing Credentials

#### Option 1: Generate QR Code

1. Open credential details
2. Click **"Generate QR Code"**
3. QR code appears with credential verification link
4. Verifier can scan with phone to verify instantly

**QR Code Example**:
```
┌─────────────────┐
│  ▄▄▄▄▄ ▄  ▄▄▄▄▄ │
│  █   █ ▄█ █   █ │
│  █▄▄▄█ ▄▄ █▄▄▄█ │
│  ▄▄▄▄▄▄▀▄▀▄▀▄▄▄ │
│  ▀ ▄▀▀ ▄▄▀▀  █  │
│  ▄▄▄▄▄ ▀ ▄ ▄ ▀  │
│  █   █  ▀▀▀▄▄▄  │
│  █▄▄▄█ ▀▄▀  ▀▀  │
└─────────────────┘

Scan to verify credential #123
```

---

#### Option 2: Share Verification Link

1. Open credential details
2. Click **"Copy Verification Link"**
3. Share link via email, LinkedIn, etc.

**Link format**: `https://vericred.xyz/verify/123`

---

#### Option 3: Download PDF

1. Open credential details
2. Click **"Download as PDF"**
3. PDF includes:
   - Credential information
   - QR code for verification
   - Blockchain proof
   - Issuer signature

**Use cases**: Print for physical verification, attach to resume

---

### Managing Access Requests

#### View Access Requests

1. From sidebar, click **"Requests"**
2. See all access requests from verifiers

**Request Card Example**:
```
┌───────────────────────────────────────┐
│ 📋 Access Request                     │
├───────────────────────────────────────┤
│ From: TechCorp HR Department          │
│ Email: hr@techcorp.com                │
│                                       │
│ Requesting:                           │
│ • University Degree                   │
│ • Employment Verification             │
│                                       │
│ Expires: Jan 30, 2025                 │
│ Status: Pending                       │
│                                       │
│ [Approve] [Reject]                    │
└───────────────────────────────────────┘
```

---

#### Approve Access Request

1. Review request details
2. Click **"Approve"**
3. Select credentials to share
4. Set access duration (e.g., 7 days)
5. Click **"Grant Access"**
6. Verifier receives email notification

**✅ Success**: Request status changes to "Approved ✅"

---

#### Reject Access Request

1. Click **"Reject"** on request
2. Optional: Enter reason
3. Click **"Confirm Rejection"**

**Verifier receives**: "Request declined" notification

---

#### Revoke Access

For approved requests:

1. Find approved request
2. Click **"Revoke Access"**
3. Confirm in modal
4. **✅ Success**: Verifier can no longer view credentials

---

## Part 3: Verifier Guide

### Getting Started as a Verifier

#### Step 1: Connect Wallet

Same as Issuer (see Part 1, Step 1)

---

#### Step 2: Navigate to Verifier Dashboard

1. Click **"Dashboard"** in navbar
2. Select **"I'm a Verifier"**
3. Click **"Get Started"**

---

### Verifying Credentials

#### Option 1: Verify by Token ID

1. From sidebar, click **"Verify"**
2. Enter **Credential ID** (Token ID)
   - Example: `123`
3. Click **"Verify Credential"**

**Result (Valid)**:
```
✅ Verified: This credential is valid and active

Credential Details:

Type: University Degree
Holder: 0x1234...
Issuer: Stanford University ✓ Verified

Credential Information:
Bachelor of Science in Computer Science
Graduated with Honors, GPA 3.85

Issued: Jan 15, 2024
Expires: Never
Status: Active ✅

Blockchain Proof:
Transaction: 0x789... [View on Explorer]
Block: 12345
Confirmations: 5,432
```

**Result (Revoked)**:
```
❌ Revoked: This credential has been revoked

Credential Details:

Type: University Degree
Holder: 0x1234...
Issuer: Stanford University ✓ Verified

Status: Revoked ❌
Revoked: Feb 1, 2024
Reason: Credential obtained fraudulently

Original Issue Date: Jan 15, 2024
```

**Result (Not Found)**:
```
⚠️ Not Found: Credential does not exist

Token ID #999 was not found in the registry.

Possible reasons:
• Credential ID is incorrect
• Credential was never issued
• Credential is from different network
```

---

#### Option 2: Scan QR Code

1. Click **"Scan QR Code"**
2. Allow camera access
3. Point camera at credential QR code
4. Verification results appear automatically

**Mobile Friendly**: Works on phones and tablets

---

#### Option 3: Verify by Link

1. Receive verification link from holder
2. Click link (opens verify page with pre-filled token ID)
3. Results appear automatically

---

### Verification History

#### View Past Verifications

1. From sidebar, click **"History"**
2. See all credentials you've verified

**History Table**:
```
┌────────┬─────────────────┬──────────────┬────────┬──────────────┐
│Token ID│ Type            │ Issuer       │ Status │ Verified     │
├────────┼─────────────────┼──────────────┼────────┼──────────────┤
│ 123    │ University Deg. │ Stanford     │ Valid  │ 2 mins ago   │
│ 124    │ License         │ State Govt   │ Valid  │ 1 hour ago   │
│ 125    │ Certificate     │ Coursera     │ Revoked│ Yesterday    │
│ 126    │ Employment      │ TechCorp     │ Valid  │ 2 days ago   │
└────────┴─────────────────┴──────────────┴────────┴──────────────┘
```

**Filter By**:
- All
- Valid
- Revoked
- Expired

**Export Options**:
- Download CSV
- Export to PDF
- Share report

---

#### View Statistics

**Stats Cards** (top of history page):
```
┌─────────────┬─────────────┬─────────────┐
│   Total     │    Valid    │   Invalid   │
│  Verified   │             │             │
│     247     │     231     │     16      │
└─────────────┴─────────────┴─────────────┘
```

---

### Best Practices for Verifiers

#### ✅ Do's

1. **Always verify on-chain**
   - Don't trust PDF or screenshots alone
   - Use VeriCred+ verification tool

2. **Check issuer reputation**
   - Verify issuer is legitimate organization
   - Look for "✓ Verified" badge

3. **Confirm holder identity**
   - Ask holder to sign message with their wallet
   - Ensure wallet address matches credential recipient

4. **Check expiration dates**
   - Some credentials (licenses) expire
   - Verify credential was valid at time needed

5. **Keep records**
   - Export verification history
   - Document verification date for compliance

---

#### ❌ Don'ts

1. **Don't accept unverified credentials**
   - Always use blockchain verification

2. **Don't ignore revocation status**
   - Revoked = invalid, regardless of reason

3. **Don't rely on visual inspection**
   - PDFs and images can be forged
   - Always verify on-chain

4. **Don't skip issuer verification**
   - Ensure issuer is authorized to issue that credential type

---

## Troubleshooting

### Common Issues

#### Issue: MetaMask not connecting

**Symptoms**:
- "Connect Wallet" does nothing
- Error: "No Ethereum provider found"

**Solutions**:
1. Install MetaMask extension: https://metamask.io
2. Refresh page after installation
3. Check browser compatibility (Chrome, Firefox, Brave)

---

#### Issue: Wrong network

**Symptoms**:
- Error: "Please switch to Monad Testnet"
- Transactions failing

**Solutions**:
1. Click network dropdown in MetaMask
2. Select "Monad Testnet"
3. If not listed, add manually:
   - Network Name: `Monad Testnet`
   - RPC URL: `https://testnet.monad.network`
   - Chain ID: `10143`
   - Currency: `MON`
   - Explorer: `https://explorer-testnet.monad.xyz`

---

#### Issue: Transaction stuck

**Symptoms**:
- Transaction pending for > 5 minutes
- Loading spinner never stops

**Solutions**:
1. Check Monad block explorer for transaction status
2. If transaction failed, try again
3. Clear browser cache and retry
4. Increase gas limit in MetaMask (Advanced settings)

---

#### Issue: AI analysis taking too long

**Symptoms**:
- "Analyzing..." for > 30 seconds

**Solutions**:
1. Refresh page and try again
2. Check recipient address is correct
3. If issue persists, proceed without AI analysis (manual review)

---

#### Issue: Credential not appearing

**Symptoms**:
- Issued credential but not showing in dashboard
- Verification says "Not found"

**Solutions**:
1. Wait 30-60 seconds for indexer to sync
2. Refresh page
3. Check transaction succeeded on block explorer
4. If transaction confirmed but still missing, contact support

---

## FAQ

### For Issuers

**Q: How much does it cost to issue credentials?**
A: After initial delegation setup (one-time gas fee), all credential issuance is gasless for you. Backend covers gas costs.

**Q: Can I issue credentials in bulk?**
A: Yes, contact us for bulk issuance API access for 100+ credentials.

**Q: What if I accidentally issue wrong credential?**
A: You can revoke the incorrect credential and issue a corrected one.

**Q: How long does delegation last?**
A: 30 days. You'll be notified before expiration to renew.

**Q: Can I customize credential templates?**
A: Currently limited to predefined types. Custom templates coming soon.

---

### For Holders

**Q: Are my credentials private?**
A: Credential existence is public on blockchain, but detailed information is stored off-chain. You control who can view details.

**Q: Can credentials be transferred?**
A: No, credentials are Soulbound (non-transferable). They're tied to your address permanently.

**Q: What if I lose my wallet?**
A: Contact issuer for credential re-issuance to new address. Original credential remains with old address.

**Q: Can I delete credentials?**
A: You cannot delete on-chain records, but you can hide them in your dashboard view.

---

### For Verifiers

**Q: Do I need to pay to verify?**
A: No, verification is free and instant via Envio indexer.

**Q: How do I know issuer is legitimate?**
A: Look for "✓ Verified" badge. Check issuer website and cross-reference address.

**Q: Can verification be faked?**
A: No, verification queries blockchain directly. Results are tamper-proof.

**Q: What if credential was valid but later revoked?**
A: Always verify at time of decision. Check status before making hiring/admission decisions.

---

## Support

### Get Help

- **Documentation**: https://docs.vericred.xyz
- **Discord**: https://discord.gg/vericred
- **Email**: support@vericred.xyz
- **GitHub**: https://github.com/vericred/vericred-plus

### Report Issues

- **Bug Reports**: https://github.com/vericred/vericred-plus/issues
- **Feature Requests**: https://github.com/vericred/vericred-plus/discussions

---

*Happy credentialing! 🎓*
