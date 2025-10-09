// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

import "../interfaces/ICredentialRegistry.sol";
import "../interfaces/IVeriCredSBT.sol";
import "../libraries/CredentialUtils.sol";

/**
 * @title CredentialRegistry
 * @notice Central registry for all credential metadata, verification, and global operations
 * @dev Provides comprehensive credential management and querying capabilities
 */
contract CredentialRegistry is 
    AccessControl,
    ReentrancyGuard,
    Pausable,
    ICredentialRegistry
{
    using CredentialUtils for string;
    using CredentialUtils for address;

    /**
     * @dev Role definitions
     */
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /**
     * @dev Counters
     */
    uint256 private _credentialCounter;
    uint256 private _issuerCounter;

    /**
     * @dev Storage structures
     */
    struct StoredCredentialMetadata {
        uint256 tokenId;
        address issuer;
        address recipient;
        string credentialType;
        string metadataURI;
        uint256 issuanceDate;
        uint256 expirationDate;
        CredentialStatus status;
        bytes32 credentialHash;
        mapping(bytes32 => bytes) attributes;
    }

    struct StoredIssuerProfile {
        string name;
        string website;
        string logoURI;
        bool isVerified;
        uint256 totalIssued;
        uint256 totalRevoked;
        uint256 registrationDate;
        mapping(string => bool) authorizedTypes;
    }

    /**
     * @dev Storage mappings
     */
    mapping(uint256 => StoredCredentialMetadata) private _credentials;
    mapping(address => StoredIssuerProfile) private _issuers;
    mapping(address => uint256[]) private _credentialsByIssuer;
    mapping(address => uint256[]) private _credentialsByRecipient;
    mapping(string => uint256[]) private _credentialsByType;
    mapping(uint256 => uint256) private _issuerCredentialIndex;
    mapping(uint256 => uint256) private _recipientCredentialIndex;
    mapping(uint256 => uint256) private _typeCredentialIndex;
    
    // Registry of authorized SBT contracts
    mapping(address => bool) private _authorizedSBTContracts;
    
    // Global settings
    uint256 public maxCredentialsPerQuery;
    bool public requireVerifiedIssuers;

    /**
     * @dev Custom errors
     */
    error UnauthorizedSBTContract();
    error CredentialAlreadyExists();
    error CredentialNotFound();
    error IssuerNotRegistered();
    error IssuerAlreadyRegistered();
    error InvalidQueryParameters();
    error UnauthorizedIssuer();
    error AttributeNotFound();

    /**
     * @dev Modifiers
     */
    modifier onlyAuthorizedSBT() {
        if (!_authorizedSBTContracts[msg.sender]) revert UnauthorizedSBTContract();
        _;
    }

    modifier onlyValidCredential(uint256 tokenId) {
        if (_credentials[tokenId].tokenId == 0) revert CredentialNotFound();
        _;
    }

    modifier onlyRegisteredIssuer(address issuer) {
        if (_issuers[issuer].registrationDate == 0) revert IssuerNotRegistered();
        _;
    }

    /**
     * @dev Constructor
     */
    constructor(address defaultAdmin) {
        if (!defaultAdmin.isValidAddress()) revert InvalidQueryParameters();
        
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(ADMIN_ROLE, defaultAdmin);
        _grantRole(VERIFIER_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);
        
        maxCredentialsPerQuery = 100;
        requireVerifiedIssuers = false;
    }

    /**
     * @notice Register a new credential in the global registry
     */
    function registerCredential(
        uint256 tokenId,
        address issuer,
        address recipient,
        string calldata credentialType,
        string calldata metadataURI,
        bytes32 credentialHash,
        uint256 expirationDate
    ) external override onlyAuthorizedSBT nonReentrant whenNotPaused {
        // Validate inputs
        if (!issuer.isValidAddress() || !recipient.isValidAddress()) {
            revert InvalidQueryParameters();
        }
        if (!credentialType.validateCredentialType()) {
            revert InvalidQueryParameters();
        }
        if (!metadataURI.validateMetadataURI()) {
            revert InvalidQueryParameters();
        }
        
        // Check if credential already exists
        if (_credentials[tokenId].tokenId != 0) revert CredentialAlreadyExists();
        
        // Ensure issuer is registered
        if (_issuers[issuer].registrationDate == 0) {
            // Auto-register issuer with basic info
            _registerIssuerInternal(issuer, "", "", "");
        }
        
        // Store credential metadata
        StoredCredentialMetadata storage credential = _credentials[tokenId];
        credential.tokenId = tokenId;
        credential.issuer = issuer;
        credential.recipient = recipient;
        credential.credentialType = credentialType;
        credential.metadataURI = metadataURI;
        credential.issuanceDate = block.timestamp;
        credential.expirationDate = expirationDate;
        credential.status = CredentialStatus.Valid;
        credential.credentialHash = credentialHash;

        // Update indices
        _credentialsByIssuer[issuer].push(tokenId);
        _credentialsByRecipient[recipient].push(tokenId);
        _credentialsByType[credentialType].push(tokenId);
        
        _issuerCredentialIndex[tokenId] = _credentialsByIssuer[issuer].length - 1;
        _recipientCredentialIndex[tokenId] = _credentialsByRecipient[recipient].length - 1;
        _typeCredentialIndex[tokenId] = _credentialsByType[credentialType].length - 1;

        // Update issuer statistics
        _issuers[issuer].totalIssued++;
        
        // Increment global counter
        ++_credentialCounter;

        emit CredentialRegistered(tokenId, issuer, recipient, credentialType, credentialHash);
    }

    /**
     * @notice Update credential status
     */
    function updateCredentialStatus(
        uint256 tokenId,
        CredentialStatus newStatus,
        string calldata reason
    ) external override onlyAuthorizedSBT nonReentrant whenNotPaused onlyValidCredential(tokenId) {
        StoredCredentialMetadata storage credential = _credentials[tokenId];
        CredentialStatus oldStatus = credential.status;
        
        credential.status = newStatus;
        
        // Update issuer statistics
        if (oldStatus != CredentialStatus.Revoked && newStatus == CredentialStatus.Revoked) {
            _issuers[credential.issuer].totalRevoked++;
        }

        emit CredentialStatusChanged(tokenId, oldStatus, newStatus, msg.sender, reason);
    }

    /**
     * @notice Register a new issuer profile
     */
    function registerIssuer(
        address issuer,
        string calldata name,
        string calldata website,
        string calldata logoURI
    ) external override nonReentrant whenNotPaused {
        if (!issuer.isValidAddress()) revert InvalidQueryParameters();
        if (_issuers[issuer].registrationDate != 0) revert IssuerAlreadyRegistered();
        
        _registerIssuerInternal(issuer, name, website, logoURI);
        
        emit IssuerRegistered(issuer, name, false);
    }

    /**
     * @notice Set issuer verification status (admin only)
     */
    function setIssuerVerification(address issuer, bool verified) 
        external 
        override 
        onlyRole(VERIFIER_ROLE) 
        onlyRegisteredIssuer(issuer) 
    {
        _issuers[issuer].isVerified = verified;
        emit IssuerVerificationChanged(issuer, verified, msg.sender);
    }

    /**
     * @notice Authorize issuer for specific credential type
     */
    function authorizeCredentialType(
        address issuer,
        string calldata credentialType,
        bool authorized
    ) external override onlyRole(VERIFIER_ROLE) onlyRegisteredIssuer(issuer) {
        if (!credentialType.validateCredentialType()) revert InvalidQueryParameters();
        
        _issuers[issuer].authorizedTypes[credentialType] = authorized;
        emit CredentialTypeAuthorized(issuer, credentialType, authorized);
    }

    /**
     * @notice Set custom attribute for a credential
     */
    function setCredentialAttribute(
        uint256 tokenId,
        bytes32 attributeKey,
        bytes calldata attributeValue
    ) external override onlyAuthorizedSBT onlyValidCredential(tokenId) {
        _credentials[tokenId].attributes[attributeKey] = attributeValue;
        emit AttributeSet(tokenId, attributeKey, attributeValue);
    }

    /**
     * @notice Get comprehensive credential information
     */
    function getCredentialMetadata(uint256 tokenId)
        external
        view
        override
        onlyValidCredential(tokenId)
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
        )
    {
        StoredCredentialMetadata storage credential = _credentials[tokenId];
        
        return (
            credential.tokenId,
            credential.issuer,
            credential.recipient,
            credential.credentialType,
            credential.metadataURI,
            credential.issuanceDate,
            credential.expirationDate,
            credential.status,
            credential.credentialHash
        );
    }

    /**
     * @notice Get credential status
     */
    function getCredentialStatus(uint256 tokenId) 
        external 
        view 
        override 
        returns (CredentialStatus status) 
    {
        if (_credentials[tokenId].tokenId == 0) return CredentialStatus.Invalid;
        
        StoredCredentialMetadata storage credential = _credentials[tokenId];
        
        // Check if expired
        if (credential.expirationDate != 0 && 
            credential.expirationDate <= block.timestamp) {
            return CredentialStatus.Expired;
        }
        
        return credential.status;
    }

    /**
     * @notice Check if credential is currently valid
     */
    function isCredentialValid(uint256 tokenId) external view override returns (bool isValid) {
        CredentialStatus status = this.getCredentialStatus(tokenId);
        return status == CredentialStatus.Valid;
    }

    /**
     * @notice Get issuer profile information
     */
    function getIssuerProfile(address issuer)
        external
        view
        override
        onlyRegisteredIssuer(issuer)
        returns (
            string memory name,
            string memory website,
            string memory logoURI,
            bool isVerified,
            uint256 totalIssued,
            uint256 totalRevoked,
            uint256 registrationDate
        )
    {
        StoredIssuerProfile storage profile = _issuers[issuer];
        
        return (
            profile.name,
            profile.website,
            profile.logoURI,
            profile.isVerified,
            profile.totalIssued,
            profile.totalRevoked,
            profile.registrationDate
        );
    }

    /**
     * @notice Check if issuer is authorized for credential type
     */
    function isIssuerAuthorized(address issuer, string calldata credentialType)
        external
        view
        override
        returns (bool authorized)
    {
        if (_issuers[issuer].registrationDate == 0) return false;
        if (requireVerifiedIssuers && !_issuers[issuer].isVerified) return false;
        
        return _issuers[issuer].authorizedTypes[credentialType];
    }

    /**
     * @notice Get custom attribute for a credential
     */
    function getCredentialAttribute(uint256 tokenId, bytes32 attributeKey)
        external
        view
        override
        onlyValidCredential(tokenId)
        returns (bytes memory attributeValue)
    {
        return _credentials[tokenId].attributes[attributeKey];
    }

    /**
     * @notice Get credentials by issuer with pagination
     */
    function getCredentialsByIssuer(address issuer, uint256 offset, uint256 limit)
        external
        view
        override
        returns (uint256[] memory tokenIds, bool hasMore)
    {
        return _getPaginatedArray(_credentialsByIssuer[issuer], offset, limit);
    }

    /**
     * @notice Get credentials by recipient with pagination
     */
    function getCredentialsByRecipient(address recipient, uint256 offset, uint256 limit)
        external
        view
        override
        returns (uint256[] memory tokenIds, bool hasMore)
    {
        return _getPaginatedArray(_credentialsByRecipient[recipient], offset, limit);
    }

    /**
     * @notice Get credentials by type with pagination
     */
    function getCredentialsByType(string calldata credentialType, uint256 offset, uint256 limit)
        external
        view
        override
        returns (uint256[] memory tokenIds, bool hasMore)
    {
        return _getPaginatedArray(_credentialsByType[credentialType], offset, limit);
    }

    /**
     * @notice Get total number of credentials in registry
     */
    function getTotalCredentials() external view override returns (uint256 total) {
        return _credentialCounter;
    }

    /**
     * @notice Get total number of registered issuers
     */
    function getTotalIssuers() external view override returns (uint256 total) {
        return _issuerCounter;
    }

    /**
     * @dev Internal helper functions
     */
    function _registerIssuerInternal(
        address issuer,
        string memory name,
        string memory website,
        string memory logoURI
    ) internal {
        StoredIssuerProfile storage profile = _issuers[issuer];
        profile.name = name;
        profile.website = website;
        profile.logoURI = logoURI;
        profile.isVerified = false;
        profile.totalIssued = 0;
        profile.totalRevoked = 0;
        profile.registrationDate = block.timestamp;
        
        ++_issuerCounter;
    }

    function _getPaginatedArray(
        uint256[] storage sourceArray,
        uint256 offset,
        uint256 limit
    ) internal view returns (uint256[] memory result, bool hasMore) {
        uint256 arrayLength = sourceArray.length;
        
        if (offset >= arrayLength) {
            return (new uint256[](0), false);
        }
        
        uint256 actualLimit = limit;
        if (actualLimit > maxCredentialsPerQuery) {
            actualLimit = maxCredentialsPerQuery;
        }
        
        uint256 end = offset + actualLimit;
        if (end > arrayLength) {
            end = arrayLength;
        }
        
        uint256 resultLength = end - offset;
        result = new uint256[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = sourceArray[offset + i];
        }
        
        hasMore = end < arrayLength;
    }

    /**
     * @dev Admin functions
     */
    function addAuthorizedSBTContract(address sbtContract) external onlyRole(ADMIN_ROLE) {
        if (sbtContract.code.length == 0) revert InvalidQueryParameters();
        _authorizedSBTContracts[sbtContract] = true;
    }

    function removeAuthorizedSBTContract(address sbtContract) external onlyRole(ADMIN_ROLE) {
        _authorizedSBTContracts[sbtContract] = false;
    }

    function isAuthorizedSBTContract(address sbtContract) external view returns (bool) {
        return _authorizedSBTContracts[sbtContract];
    }

    function setMaxCredentialsPerQuery(uint256 maxCredentials) external onlyRole(ADMIN_ROLE) {
        maxCredentialsPerQuery = maxCredentials;
    }

    function setRequireVerifiedIssuers(bool required) external onlyRole(ADMIN_ROLE) {
        requireVerifiedIssuers = required;
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Emergency functions
     */
    function emergencyUpdateCredentialStatus(
        uint256 tokenId,
        CredentialStatus newStatus,
        string calldata reason
    ) external onlyRole(ADMIN_ROLE) onlyValidCredential(tokenId) {
        StoredCredentialMetadata storage credential = _credentials[tokenId];
        CredentialStatus oldStatus = credential.status;
        
        credential.status = newStatus;
        
        emit CredentialStatusChanged(tokenId, oldStatus, newStatus, msg.sender, reason);
    }

    function emergencyRevokeIssuer(address issuer, string calldata reason) 
        external 
        onlyRole(ADMIN_ROLE) 
        onlyRegisteredIssuer(issuer) 
    {
        _issuers[issuer].isVerified = false;
        
        // Revoke all credentials from this issuer
        uint256[] storage issuerCredentials = _credentialsByIssuer[issuer];
        for (uint256 i = 0; i < issuerCredentials.length; i++) {
            uint256 tokenId = issuerCredentials[i];
            if (_credentials[tokenId].status == CredentialStatus.Valid) {
                _credentials[tokenId].status = CredentialStatus.Revoked;
                emit CredentialStatusChanged(
                    tokenId, 
                    CredentialStatus.Valid, 
                    CredentialStatus.Revoked, 
                    msg.sender, 
                    reason
                );
            }
        }
        
        emit IssuerVerificationChanged(issuer, false, msg.sender);
    }
}