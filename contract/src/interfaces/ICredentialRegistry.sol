// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title ICredentialRegistry
 * @notice Interface for managing credential metadata, verification, and global registry operations
 * @dev Central registry for all credential-related operations and queries
 */
interface ICredentialRegistry {
    /**
     * @dev Credential status enumeration
     */
    enum CredentialStatus {
        Invalid,    // Credential doesn't exist or was never valid
        Valid,      // Credential is currently valid
        Revoked,    // Credential was revoked by issuer
        Expired,    // Credential has passed its expiration date
        Suspended   // Credential is temporarily suspended
    }

    /**
     * @dev Comprehensive credential metadata structure
     */
    struct CredentialMetadata {
        uint256 tokenId;           // NFT token ID
        address issuer;            // Original issuer address
        address recipient;         // Credential holder address
        string credentialType;     // Type/category of credential
        string metadataURI;        // IPFS or other metadata URI
        uint256 issuanceDate;      // When credential was issued
        uint256 expirationDate;    // When credential expires (0 = no expiration)
        CredentialStatus status;   // Current credential status
        bytes32 credentialHash;    // Hash of credential content for integrity
        mapping(bytes32 => bytes) attributes; // Custom attributes storage
    }

    /**
     * @dev Issuer profile structure
     */
    struct IssuerProfile {
        string name;               // Issuer organization name
        string website;            // Official website
        string logoURI;            // Logo image URI
        bool isVerified;           // Whether issuer is verified by system
        uint256 totalIssued;       // Total credentials issued
        uint256 totalRevoked;      // Total credentials revoked
        uint256 registrationDate;  // When issuer registered
        mapping(string => bool) authorizedTypes; // Credential types they can issue
    }

    /**
     * @dev Events
     */
    event CredentialRegistered(
        uint256 indexed tokenId,
        address indexed issuer,
        address indexed recipient,
        string credentialType,
        bytes32 credentialHash
    );

    event CredentialStatusChanged(
        uint256 indexed tokenId,
        CredentialStatus oldStatus,
        CredentialStatus newStatus,
        address changedBy,
        string reason
    );

    event IssuerRegistered(
        address indexed issuer,
        string name,
        bool isVerified
    );

    event IssuerVerificationChanged(
        address indexed issuer,
        bool isVerified,
        address changedBy
    );

    event CredentialTypeAuthorized(
        address indexed issuer,
        string credentialType,
        bool authorized
    );

    event AttributeSet(
        uint256 indexed tokenId,
        bytes32 indexed attributeKey,
        bytes attributeValue
    );

    /**
     * @notice Register a new credential in the global registry
     * @param tokenId NFT token ID
     * @param issuer Address of the credential issuer
     * @param recipient Address of the credential recipient
     * @param credentialType Type/category of the credential
     * @param metadataURI URI pointing to credential metadata
     * @param credentialHash Hash of the credential content
     * @param expirationDate Expiration timestamp (0 for no expiration)
     */
    function registerCredential(
        uint256 tokenId,
        address issuer,
        address recipient,
        string calldata credentialType,
        string calldata metadataURI,
        bytes32 credentialHash,
        uint256 expirationDate
    ) external;

    /**
     * @notice Update credential status
     * @param tokenId NFT token ID
     * @param newStatus New status for the credential
     * @param reason Reason for status change
     */
    function updateCredentialStatus(
        uint256 tokenId,
        CredentialStatus newStatus,
        string calldata reason
    ) external;

    /**
     * @notice Register a new issuer profile
     * @param issuer Address of the issuer
     * @param name Organization name
     * @param website Official website URL
     * @param logoURI Logo image URI
     */
    function registerIssuer(
        address issuer,
        string calldata name,
        string calldata website,
        string calldata logoURI
    ) external;

    /**
     * @notice Verify or unverify an issuer (admin only)
     * @param issuer Address of the issuer
     * @param verified Whether to verify or unverify
     */
    function setIssuerVerification(address issuer, bool verified) external;

    /**
     * @notice Authorize issuer for specific credential type
     * @param issuer Address of the issuer
     * @param credentialType Type of credential to authorize
     * @param authorized Whether to authorize or revoke authorization
     */
    function authorizeCredentialType(
        address issuer,
        string calldata credentialType,
        bool authorized
    ) external;

    /**
     * @notice Set custom attribute for a credential
     * @param tokenId NFT token ID
     * @param attributeKey Key for the attribute
     * @param attributeValue Value for the attribute
     */
    function setCredentialAttribute(
        uint256 tokenId,
        bytes32 attributeKey,
        bytes calldata attributeValue
    ) external;

    /**
     * @notice Get comprehensive credential information
     * @param tokenId NFT token ID
     * @return metadata Complete credential metadata
     */
    function getCredentialMetadata(uint256 tokenId)
        external
        view
        returns (
            uint256,      // tokenId
            address,      // issuer
            address,      // recipient
            string memory, // credentialType
            string memory, // metadataURI
            uint256,      // issuanceDate
            uint256,      // expirationDate
            CredentialStatus, // status
            bytes32       // credentialHash
        );

    /**
     * @notice Get credential status
     * @param tokenId NFT token ID
     * @return status Current credential status
     */
    function getCredentialStatus(uint256 tokenId) external view returns (CredentialStatus status);

    /**
     * @notice Check if credential is currently valid
     * @param tokenId NFT token ID
     * @return isValid True if credential is valid and not expired
     */
    function isCredentialValid(uint256 tokenId) external view returns (bool isValid);

    /**
     * @notice Get issuer profile information
     * @param issuer Address of the issuer
     * @return name Organization name
     * @return website Official website
     * @return logoURI Logo image URI
     * @return isVerified Whether issuer is verified
     * @return totalIssued Total credentials issued
     * @return totalRevoked Total credentials revoked
     * @return registrationDate When issuer registered
     */
    function getIssuerProfile(address issuer)
        external
        view
        returns (
            string memory name,
            string memory website,
            string memory logoURI,
            bool isVerified,
            uint256 totalIssued,
            uint256 totalRevoked,
            uint256 registrationDate
        );

    /**
     * @notice Check if issuer is authorized for credential type
     * @param issuer Address of the issuer
     * @param credentialType Type of credential
     * @return authorized True if issuer is authorized
     */
    function isIssuerAuthorized(address issuer, string calldata credentialType)
        external
        view
        returns (bool authorized);

    /**
     * @notice Get custom attribute for a credential
     * @param tokenId NFT token ID
     * @param attributeKey Key for the attribute
     * @return attributeValue Value for the attribute
     */
    function getCredentialAttribute(uint256 tokenId, bytes32 attributeKey)
        external
        view
        returns (bytes memory attributeValue);

    /**
     * @notice Get all credentials by issuer with pagination
     * @param issuer Address of the issuer
     * @param offset Starting index for pagination
     * @param limit Maximum number of results
     * @return tokenIds Array of credential token IDs
     * @return hasMore Whether there are more results
     */
    function getCredentialsByIssuer(address issuer, uint256 offset, uint256 limit)
        external
        view
        returns (uint256[] memory tokenIds, bool hasMore);

    /**
     * @notice Get all credentials by recipient with pagination
     * @param recipient Address of the recipient
     * @param offset Starting index for pagination
     * @param limit Maximum number of results
     * @return tokenIds Array of credential token IDs
     * @return hasMore Whether there are more results
     */
    function getCredentialsByRecipient(address recipient, uint256 offset, uint256 limit)
        external
        view
        returns (uint256[] memory tokenIds, bool hasMore);

    /**
     * @notice Get credentials by type with pagination
     * @param credentialType Type of credential
     * @param offset Starting index for pagination
     * @param limit Maximum number of results
     * @return tokenIds Array of credential token IDs
     * @return hasMore Whether there are more results
     */
    function getCredentialsByType(string calldata credentialType, uint256 offset, uint256 limit)
        external
        view
        returns (uint256[] memory tokenIds, bool hasMore);

    /**
     * @notice Get total number of credentials in registry
     * @return total Total number of registered credentials
     */
    function getTotalCredentials() external view returns (uint256 total);

    /**
     * @notice Get total number of registered issuers
     * @return total Total number of registered issuers
     */
    function getTotalIssuers() external view returns (uint256 total);
}