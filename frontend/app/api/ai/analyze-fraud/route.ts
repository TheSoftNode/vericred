/**
 * AI Fraud Analysis API Route
 *
 * Feature 2 from PRD: AI-Powered Issuance Delegation
 *
 * Flow:
 * 1. Issuer enters recipient address and credential details
 * 2. System queries Envio for recipient's on-chain history
 * 3. AI (OpenAI GPT-4) analyzes data and generates risk report
 * 4. Report shown to issuer before delegation
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getRecipientActivitySummary,
  checkPriorInteractions,
  getIssuerInfo,
} from '@/lib/server/envio';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

interface FraudAnalysisRequest {
  recipientAddress: string;
  issuerAddress: string;
  credentialType: string;
}

interface RiskAnalysisResponse {
  riskScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
  analysis: {
    priorInteractions: number;
    recipientHistory: string;
    issuerReputation: string;
    redFlags: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: FraudAnalysisRequest = await request.json();
    const { recipientAddress, issuerAddress, credentialType } = body;

    // Validate inputs
    if (!recipientAddress || !issuerAddress || !credentialType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('[AI] Starting fraud analysis:', {
      recipient: recipientAddress,
      issuer: issuerAddress,
      type: credentialType,
    });

    // Step 1: Query Envio for on-chain data
    const [recipientActivity, priorInteractions, issuerInfo] = await Promise.all([
      getRecipientActivitySummary(recipientAddress),
      checkPriorInteractions(issuerAddress, recipientAddress),
      getIssuerInfo(issuerAddress),
    ]);

    console.log('[AI] On-chain data fetched:', {
      recipientCredentials: recipientActivity.totalCredentials,
      priorInteractions,
      issuerVerified: issuerInfo?.isVerified,
    });

    // Step 2: Prepare data for AI analysis
    const analysisContext = {
      recipient: {
        address: recipientAddress,
        totalCredentials: recipientActivity.totalCredentials,
        activeCredentials: recipientActivity.activeCredentials,
        revokedCredentials: recipientActivity.revokedCredentials,
        credentialTypes: recipientActivity.credentialTypes,
        recentActivity: recipientActivity.recentActivity.map((event: any) => ({
          type: event.credentialType,
          issuer: event.issuer,
          timestamp: event.blockTimestamp,
        })),
      },
      issuer: {
        address: issuerAddress,
        name: issuerInfo?.name || 'Unknown',
        isVerified: issuerInfo?.isVerified || false,
        totalIssued: issuerInfo?.totalCredentialsIssued || '0',
        activeCredentials: issuerInfo?.totalActiveCredentials || '0',
      },
      priorInteractions,
      requestedCredentialType: credentialType,
    };

    // Step 3: Call OpenAI for AI analysis
    const riskAnalysis = await analyzeWithOpenAI(analysisContext);

    console.log('[AI] Analysis complete:', {
      riskScore: riskAnalysis.riskScore,
      riskLevel: riskAnalysis.riskLevel,
    });

    return NextResponse.json(riskAnalysis);

  } catch (error) {
    console.error('[AI] Error during fraud analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze fraud risk' },
      { status: 500 }
    );
  }
}

/**
 * Analyze fraud risk using OpenAI GPT-4
 * Based on PRD prompt engineering requirements
 */
async function analyzeWithOpenAI(context: any): Promise<RiskAnalysisResponse> {
  if (!OPENAI_API_KEY) {
    // Fallback: Simple rule-based analysis without AI
    return fallbackAnalysis(context);
  }

  const prompt = `You are a fraud detection AI for a credential issuance system.

ON-CHAIN HISTORY for recipient address ${context.recipient.address}:
- Total credentials received: ${context.recipient.totalCredentials}
- Active credentials: ${context.recipient.activeCredentials}
- Revoked credentials: ${context.recipient.revokedCredentials}
- Credential types: ${context.recipient.credentialTypes.join(', ') || 'None'}
- Recent activity: ${JSON.stringify(context.recipient.recentActivity, null, 2)}

ISSUER address: ${context.issuer.address}
- Name: ${context.issuer.name}
- Verified: ${context.issuer.isVerified}
- Total issued: ${context.issuer.totalIssued}
- Active: ${context.issuer.activeCredentials}

PRIOR INTERACTIONS between these addresses: ${context.priorInteractions}

REQUESTED CREDENTIAL TYPE: ${context.requestedCredentialType}

Based on this history, analyze the likelihood that this issuance request is legitimate.

Focus on:
1. Prior interactions between these addresses (strong positive signal)
2. Recipient's general on-chain behavior (suspicious patterns?)
3. Issuer's reputation and verification status
4. Credential type consistency with recipient's history

Respond ONLY with a valid JSON object containing:
- "riskScore" (number 0-100, where 0=no risk, 100=maximum risk)
- "riskLevel" (string: "LOW", "MEDIUM", or "HIGH")
- "recommendation" (string: brief explanation for issuer)
- "redFlags" (array of strings: specific concerns, empty if none)

Example:
{
  "riskScore": 15,
  "riskLevel": "LOW",
  "recommendation": "Low risk. Found 3 prior interactions between these addresses. Recipient has legitimate credential history.",
  "redFlags": []
}`;

  try {
    // Use responses.create API for gpt-5-nano
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: `You are a fraud detection AI analyzing credential issuance risk. ${prompt}\n\nRespond ONLY with valid JSON in this exact format:\n{"riskScore": <number 0-100>, "riskLevel": "<LOW|MEDIUM|HIGH>", "recommendation": "<string>", "redFlags": [<array of strings>]}`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI] OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.output_text || '{}';

    // Parse AI response
    const aiAnalysis = JSON.parse(aiResponse);

    return {
      riskScore: aiAnalysis.riskScore || 50,
      riskLevel: aiAnalysis.riskLevel || 'MEDIUM',
      recommendation: aiAnalysis.recommendation || 'Unable to complete analysis',
      analysis: {
        priorInteractions: context.priorInteractions,
        recipientHistory: `${context.recipient.totalCredentials} credentials, ${context.recipient.activeCredentials} active`,
        issuerReputation: context.issuer.isVerified ? 'Verified issuer' : 'Unverified issuer',
        redFlags: aiAnalysis.redFlags || [],
      },
    };

  } catch (error) {
    console.error('[AI] OpenAI API error:', error);
    return fallbackAnalysis(context);
  }
}

/**
 * Fallback rule-based analysis when OpenAI is unavailable
 */
function fallbackAnalysis(context: any): RiskAnalysisResponse {
  let riskScore = 50; // Start at medium risk
  const redFlags: string[] = [];

  // Positive signals (reduce risk)
  if (context.priorInteractions > 0) {
    riskScore -= 20;
  }
  if (context.issuer.isVerified) {
    riskScore -= 15;
  }
  if (context.recipient.totalCredentials > 0 && context.recipient.revokedCredentials === 0) {
    riskScore -= 10;
  }

  // Negative signals (increase risk)
  if (context.recipient.revokedCredentials > 2) {
    riskScore += 25;
    redFlags.push('Multiple revoked credentials in history');
  }
  if (context.priorInteractions === 0 && context.recipient.totalCredentials === 0) {
    riskScore += 10;
    redFlags.push('No prior on-chain history');
  }
  if (!context.issuer.isVerified) {
    redFlags.push('Issuer not verified');
  }

  // Clamp between 0-100
  riskScore = Math.max(0, Math.min(100, riskScore));

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  if (riskScore < 30) riskLevel = 'LOW';
  else if (riskScore > 70) riskLevel = 'HIGH';

  let recommendation = '';
  if (riskLevel === 'LOW') {
    recommendation = `🟢 Low Risk${context.priorInteractions > 0 ? `: Found ${context.priorInteractions} prior interaction(s) between these addresses.` : '. Legitimate on-chain history detected.'}`;
  } else if (riskLevel === 'MEDIUM') {
    recommendation = `🟡 Medium Risk: ${redFlags.length > 0 ? redFlags[0] : 'No prior history found. Verify manually.'}`;
  } else {
    recommendation = `🔴 High Risk: ${redFlags.join('. ')}. Recommend manual verification.`;
  }

  return {
    riskScore,
    riskLevel,
    recommendation,
    analysis: {
      priorInteractions: context.priorInteractions,
      recipientHistory: `${context.recipient.totalCredentials} credentials, ${context.recipient.activeCredentials} active`,
      issuerReputation: context.issuer.isVerified ? 'Verified issuer' : 'Unverified issuer',
      redFlags,
    },
  };
}
