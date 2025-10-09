// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title IRiskAssessment
 * @notice Interface for AI-powered fraud detection and risk assessment
 * @dev Integrates with off-chain AI services and on-chain validation for credential issuance
 */
interface IRiskAssessment {
    /**
     * @dev Risk level enumeration
     */
    enum RiskLevel {
        Unknown,    // Risk assessment not performed or failed
        Low,        // Low fraud risk - proceed with issuance
        Medium,     // Medium fraud risk - require additional verification
        High,       // High fraud risk - block issuance
        Critical    // Critical fraud risk - flag for investigation
    }

    /**
     * @dev Risk assessment result structure
     */
    struct RiskAssessment {
        uint256 assessmentId;      // Unique assessment identifier
        address subject;           // Address being assessed
        address assessor;          // Address requesting assessment
        RiskLevel riskLevel;       // Computed risk level
        uint256 riskScore;         // Numerical risk score (0-100)
        string[] riskFactors;      // Array of identified risk factors
        bytes32 dataHash;          // Hash of assessment input data
        uint256 timestamp;         // When assessment was performed
        uint256 expiryTime;        // When assessment expires
        bool isValid;              // Whether assessment is still valid
    }

    /**
     * @dev On-chain transaction pattern structure for analysis
     */
    struct TransactionPattern {
        uint256 totalTransactions;     // Total transaction count
        uint256 totalVolume;           // Total transaction volume in wei
        uint256 averageGasPrice;       // Average gas price used
        uint256 uniqueInteractions;    // Number of unique addresses interacted with
        uint256 firstTransactionTime;  // Timestamp of first transaction
        uint256 lastTransactionTime;   // Timestamp of most recent transaction
        bool hasContractInteractions;  // Whether address has interacted with contracts
        bool hasHighValueTransactions; // Whether address has high-value transactions
    }

    /**
     * @dev Events
     */
    event RiskAssessmentRequested(
        uint256 indexed assessmentId,
        address indexed subject,
        address indexed assessor,
        bytes32 dataHash
    );

    event RiskAssessmentCompleted(
        uint256 indexed assessmentId,
        address indexed subject,
        RiskLevel riskLevel,
        uint256 riskScore
    );

    event RiskAssessmentExpired(
        uint256 indexed assessmentId,
        address indexed subject
    );

    event RiskThresholdUpdated(
        RiskLevel indexed level,
        uint256 oldThreshold,
        uint256 newThreshold
    );

    event TrustedOracleUpdated(
        address indexed oracle,
        bool trusted
    );

    /**
     * @notice Request risk assessment for an address
     * @param subject Address to assess for fraud risk
     * @param credentialType Type of credential being issued
     * @param additionalData Additional context data for assessment
     * @return assessmentId Unique identifier for the assessment request
     */
    function requestRiskAssessment(
        address subject,
        string calldata credentialType,
        bytes calldata additionalData
    ) external returns (uint256 assessmentId);

    /**
     * @notice Submit risk assessment result (oracle only)
     * @param assessmentId Assessment identifier
     * @param riskLevel Computed risk level
     * @param riskScore Numerical risk score (0-100)
     * @param riskFactors Array of identified risk factors
     * @param validityDuration How long the assessment remains valid (in seconds)
     */
    function submitRiskAssessment(
        uint256 assessmentId,
        RiskLevel riskLevel,
        uint256 riskScore,
        string[] calldata riskFactors,
        uint256 validityDuration
    ) external;

    /**
     * @notice Get risk assessment for an address
     * @param subject Address to query
     * @return assessment Most recent valid risk assessment
     */
    function getRiskAssessment(address subject) external view returns (RiskAssessment memory assessment);

    /**
     * @notice Get risk assessment by ID
     * @param assessmentId Assessment identifier
     * @return assessment Risk assessment details
     */
    function getRiskAssessmentById(uint256 assessmentId) external view returns (RiskAssessment memory assessment);

    /**
     * @notice Check if address passes risk threshold for credential type
     * @param subject Address to check
     * @param credentialType Type of credential
     * @return passed True if risk assessment passes threshold
     * @return riskLevel Current risk level
     * @return riskScore Current risk score
     */
    function checkRiskThreshold(address subject, string calldata credentialType)
        external
        view
        returns (bool passed, RiskLevel riskLevel, uint256 riskScore);

    /**
     * @notice Analyze on-chain transaction patterns for an address
     * @param subject Address to analyze
     * @param lookbackPeriod Time period to analyze (in seconds)
     * @return pattern Transaction pattern analysis
     */
    function analyzeTransactionPattern(address subject, uint256 lookbackPeriod)
        external
        view
        returns (TransactionPattern memory pattern);

    /**
     * @notice Check if two addresses have prior interaction history
     * @param address1 First address
     * @param address2 Second address
     * @return hasInteracted True if addresses have transaction history
     * @return interactionCount Number of interactions
     * @return firstInteraction Timestamp of first interaction
     * @return lastInteraction Timestamp of last interaction
     */
    function checkInteractionHistory(address address1, address address2)
        external
        view
        returns (
            bool hasInteracted,
            uint256 interactionCount,
            uint256 firstInteraction,
            uint256 lastInteraction
        );

    /**
     * @notice Set risk threshold for credential type (admin only)
     * @param credentialType Type of credential
     * @param riskLevel Maximum allowed risk level
     * @param maxRiskScore Maximum allowed risk score
     */
    function setRiskThreshold(
        string calldata credentialType,
        RiskLevel riskLevel,
        uint256 maxRiskScore
    ) external;

    /**
     * @notice Add or remove trusted AI oracle (admin only)
     * @param oracle Address of the AI oracle
     * @param trusted Whether to trust this oracle
     */
    function setTrustedOracle(address oracle, bool trusted) external;

    /**
     * @notice Check if oracle is trusted
     * @param oracle Address to check
     * @return trusted True if oracle is trusted
     */
    function isTrustedOracle(address oracle) external view returns (bool trusted);

    /**
     * @notice Get risk threshold for credential type
     * @param credentialType Type of credential
     * @return riskLevel Maximum allowed risk level
     * @return maxRiskScore Maximum allowed risk score
     */
    function getRiskThreshold(string calldata credentialType)
        external
        view
        returns (RiskLevel riskLevel, uint256 maxRiskScore);

    /**
     * @notice Get total number of risk assessments performed
     * @return total Total assessments performed
     */
    function getTotalAssessments() external view returns (uint256 total);

    /**
     * @notice Get risk assessments by level with pagination
     * @param riskLevel Risk level to filter by
     * @param offset Starting index for pagination
     * @param limit Maximum number of results
     * @return assessmentIds Array of assessment IDs
     * @return hasMore Whether there are more results
     */
    function getAssessmentsByRiskLevel(RiskLevel riskLevel, uint256 offset, uint256 limit)
        external
        view
        returns (uint256[] memory assessmentIds, bool hasMore);

    /**
     * @notice Check if risk assessment is expired
     * @param assessmentId Assessment identifier
     * @return expired True if assessment has expired
     */
    function isAssessmentExpired(uint256 assessmentId) external view returns (bool expired);

    /**
     * @notice Invalidate expired assessments (maintenance function)
     * @param assessmentIds Array of assessment IDs to check and invalidate
     * @return invalidatedCount Number of assessments invalidated
     */
    function invalidateExpiredAssessments(uint256[] calldata assessmentIds)
        external
        returns (uint256 invalidatedCount);
}