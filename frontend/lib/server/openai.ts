/**
 * OpenAI Service
 * AI-powered fraud detection for credential issuance
 */

import OpenAI from 'openai';
import { getRecipientActivitySummary, checkPriorInteractions } from './envio';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface FraudAnalysisResult {
  riskScore: number; // 0-100
  riskLevel: 'Low' | 'Medium' | 'High';
  analysis: string;
  recommendation: 'Approve' | 'Reject' | 'Review';
  redFlags: string[];
  confidence: number; // 0-100
}

/**
 * Analyze fraud risk for credential issuance
 */
export async function analyzeFraudRisk(params: {
  recipientAddress: string;
  issuerAddress: string;
  credentialType: string;
}): Promise<FraudAnalysisResult> {
  try {
    // 1. Gather on-chain data via Envio
    const [activity, priorInteractions] = await Promise.all([
      getRecipientActivitySummary(params.recipientAddress),
      checkPriorInteractions(params.issuerAddress, params.recipientAddress),
    ]);

    // 2. Build AI prompt
    const prompt = buildFraudAnalysisPrompt(
      params.recipientAddress,
      params.issuerAddress,
      params.credentialType,
      activity,
      priorInteractions
    );

    // 3. Call OpenAI GPT-4o
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: FRAUD_DETECTION_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for consistent analysis
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    // 4. Validate and return result
    return {
      riskScore: Math.min(100, Math.max(0, result.riskScore || 0)),
      riskLevel: result.riskLevel || 'Medium',
      analysis: result.analysis || 'Analysis unavailable',
      recommendation: result.recommendation || 'Review',
      redFlags: result.redFlags || [],
      confidence: Math.min(100, Math.max(0, result.confidence || 70)),
    };
  } catch (error: any) {
    console.error('AI fraud analysis error:', error);

    // Fallback to safe default
    return {
      riskScore: 50,
      riskLevel: 'Medium',
      analysis: `Error during AI analysis: ${error.message}. Manual review recommended.`,
      recommendation: 'Review',
      redFlags: ['AI analysis failed'],
      confidence: 0,
    };
  }
}

/**
 * Build fraud analysis prompt
 */
function buildFraudAnalysisPrompt(
  recipientAddress: string,
  issuerAddress: string,
  credentialType: string,
  activity: any,
  priorInteractions: number
): string {
  return `Analyze fraud risk for credential issuance.

**Context:**
- **Recipient Address**: ${recipientAddress}
- **Issuer Address**: ${issuerAddress}
- **Credential Type**: ${credentialType}

**Recipient's On-Chain Activity:**
- **Total Credentials Held**: ${activity.totalCredentials}
- **Active Credentials**: ${activity.activeCredentials}
- **Revoked Credentials**: ${activity.revokedCredentials}
- **Prior Interactions with Issuer**: ${priorInteractions}
- **Credential Types Held**: ${activity.credentialTypes.join(', ') || 'None'}
- **Unique Issuers**: ${activity.issuers.length}

**Recent Activity (Last 10 Mints):**
${JSON.stringify(activity.recentActivity, null, 2)}

**Task:**
Analyze the above data and assess the fraud risk of issuing a credential to this recipient.

**Consider:**
1. **Revocation Rate**: High revoked/total ratio indicates fraud history
2. **Velocity**: Too many credentials in short time = suspicious
3. **Issuer Relationship**: No prior interaction = higher risk
4. **Credential Diversity**: Only one type from one issuer = potential fraud ring
5. **Abnormal Patterns**: Minting patterns that don't match normal behavior

**Output (JSON format):**
{
  "riskScore": 0-100,  // 0 = no risk, 100 = maximum risk
  "riskLevel": "Low" | "Medium" | "High",
  "analysis": "Detailed explanation of risk factors",
  "recommendation": "Approve" | "Reject" | "Review",
  "redFlags": ["flag1", "flag2", ...],
  "confidence": 0-100  // AI confidence in assessment
}`;
}

/**
 * System prompt for fraud detection
 */
const FRAUD_DETECTION_SYSTEM_PROMPT = `You are an expert fraud detection analyst specializing in blockchain credential verification.

Your role is to analyze on-chain activity patterns to identify potential credential fraud before issuance.

**Analysis Guidelines:**

**Low Risk (0-30):**
- Clean credential history
- Steady, organic growth
- Diverse credential types
- Low revocation rate (<10%)
- Established relationship with issuer

**Medium Risk (31-70):**
- Some concerning patterns
- Moderate revocation rate (10-30%)
- Rapid recent credential acquisition
- Limited issuer diversity
- First interaction with this issuer

**High Risk (71-100):**
- High revocation rate (>30%)
- Abnormal minting velocity
- Single credential type concentration
- No prior relationship with issuer
- Patterns matching known fraud schemes

**Red Flags to Watch:**
- Multiple credentials from same issuer in < 24 hours
- All credentials of same type
- Recently revoked credentials
- Sudden spike in credential acquisition
- Only one or two unique issuers
- Account age vs credential count mismatch

**Important:**
- Base analysis ONLY on provided on-chain data
- Do not make assumptions about off-chain behavior
- Provide specific, actionable red flags
- Balance security with user experience
- When uncertain, recommend manual review

Always output valid JSON matching the specified format.`;

/**
 * Get cached fraud analysis (if available)
 * Reduces OpenAI API costs by caching results
 */
export async function getCachedFraudAnalysis(
  recipientAddress: string
): Promise<FraudAnalysisResult | null> {
  // TODO: Implement caching using MongoDB or Redis
  // For now, return null (always perform fresh analysis)
  return null;
}

/**
 * Cache fraud analysis result
 */
export async function cacheFraudAnalysis(
  recipientAddress: string,
  result: FraudAnalysisResult
): Promise<void> {
  // TODO: Implement caching using MongoDB or Redis
  // Cache for 24 hours to reduce API costs
  console.log(`[OpenAI] Would cache result for ${recipientAddress}`);
}
