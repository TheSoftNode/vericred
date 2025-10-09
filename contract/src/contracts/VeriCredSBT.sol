// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

import "../interfaces/IVeriCredSBT.sol";
import "../interfaces/ICredentialRegistry.sol";
import "../interfaces/IDelegationManager.sol";
import "../interfaces/IRiskAssessment.sol";
import "../libraries/CredentialUtils.sol";

/**
 * @title VeriCredSBT
 * @notice Soulbound Token implementation for VeriCred credential system
 * @dev Non-transferable NFTs with delegation support and AI-powered fraud detection
 */
contract VeriCredSBT is 
    ERC721,
    ERC721URIStorage,
    ERC721Enumerable,
    AccessControl,
    ReentrancyGuard,
    Pausable,
    IVeriCredSBT
{
    using CredentialUtils for string;
    using CredentialUtils for address;

    /**
     * @dev Role definitions
     */
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant DELEGATOR_ROLE = keccak256("DELEGATOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /**
     * @dev Counter for token IDs
     */
    uint256 private _tokenIdCounter;

    /**
     * @dev Core credential data structure
     */
    struct CredentialData {
        address recipient;
        address issuer;
        string credentialType;
        uint256 issuanceTime;
        uint256 expirationTime;
        bool isRevoked;
        string revokeReason;
        bytes32 credentialHash;
    }

    /**
     * @dev Delegation permission structure
     */
    struct DelegationPermission {
        address issuer;
        string credentialType;
        uint256 expirationTime;
        bool isActive;
    }

    /**
     * @dev Storage mappings
     */
    mapping(uint256 => CredentialData) private _credentials;
    mapping(address => mapping(string => DelegationPermission)) private _delegations;
    mapping(address => uint256[]) private _credentialsByRecipient;
    mapping(address => uint256[]) private _credentialsByIssuer;
    mapping(string => uint256[]) private _credentialsByType;
    mapping(uint256 => uint256) private _recipientTokenIndex;
    mapping(uint256 => uint256) private _issuerTokenIndex;

    /**
     * @dev External contract interfaces
     */
    ICredentialRegistry public credentialRegistry;
    IDelegationManager public delegationManager;
    IRiskAssessment public riskAssessment;

    /**
     * @dev Configuration parameters
     */
    bool public riskAssessmentRequired;
    bool public registryIntegrationEnabled;
    uint256 public maxCredentialsPerRecipient;

    /**
     * @dev Events (additional to interface events)
     */
    event ContractUpgraded(address indexed newImplementation);
    event ConfigurationUpdated(string parameter, bool value);
    event ExternalContractUpdated(string contractType, address contractAddress);

    /**
     * @dev Custom errors
     */
    error SoulboundTokenNotTransferable();
    error UnauthorizedIssuer();
    error InvalidCredentialData();
    error CredentialAlreadyRevoked();
    error CredentialNotFound();
    error DelegationExpired();
    error RiskAssessmentFailed();
    error MaxCredentialsExceeded();
    error InvalidExternalContract();

    /**
     * @dev Constructor
     */
    constructor(
        string memory name,
        string memory symbol,
        address defaultAdmin
    ) ERC721(name, symbol) {
        if (!defaultAdmin.isValidAddress()) revert InvalidCredentialData();
        
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(ADMIN_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);
        
        maxCredentialsPerRecipient = 100; // Default limit
        riskAssessmentRequired = true;
        registryIntegrationEnabled = true;
    }

    /**
     * @notice Mint a new credential
     */
    function mintCredential(
        address recipient,
        string calldata credentialType,
        string calldata metadataURI,
        uint256 expirationTime
    ) external override nonReentrant whenNotPaused returns (uint256 tokenId) {
        // Validate inputs
        if (!recipient.isValidAddress()) revert InvalidCredentialData();
        if (!credentialType.validateCredentialType()) revert InvalidCredentialData();
        if (!metadataURI.validateMetadataURI()) revert InvalidCredentialData();
        if (!CredentialUtils.validateExpirationTime(expirationTime)) revert InvalidCredentialData();

        // Check authorization
        address issuer = msg.sender;
        if (!_canIssueCredential(issuer, credentialType)) revert UnauthorizedIssuer();

        // Check recipient limits
        if (_credentialsByRecipient[recipient].length >= maxCredentialsPerRecipient) {
            revert MaxCredentialsExceeded();
        }

        // Perform risk assessment if required
        if (riskAssessmentRequired && address(riskAssessment) != address(0)) {
            (bool passed,,) = riskAssessment.checkRiskThreshold(recipient, credentialType);
            if (!passed) revert RiskAssessmentFailed();
        }

        // Generate token ID and mint
        tokenId = ++_tokenIdCounter;
        
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, metadataURI);

        // Store credential data
        bytes32 credentialHash = CredentialUtils.generateCredentialHash(
            recipient,
            issuer,
            credentialType,
            metadataURI,
            block.timestamp
        );

        _credentials[tokenId] = CredentialData({
            recipient: recipient,
            issuer: issuer,
            credentialType: credentialType,
            issuanceTime: block.timestamp,
            expirationTime: expirationTime,
            isRevoked: false,
            revokeReason: "",
            credentialHash: credentialHash
        });

        // Update indices
        _credentialsByRecipient[recipient].push(tokenId);
        _credentialsByIssuer[issuer].push(tokenId);
        _credentialsByType[credentialType].push(tokenId);
        
        _recipientTokenIndex[tokenId] = _credentialsByRecipient[recipient].length - 1;
        _issuerTokenIndex[tokenId] = _credentialsByIssuer[issuer].length - 1;

        // Register with external registry if enabled
        if (registryIntegrationEnabled && address(credentialRegistry) != address(0)) {
            credentialRegistry.registerCredential(
                tokenId,
                issuer,
                recipient,
                credentialType,
                metadataURI,
                credentialHash,
                expirationTime
            );
        }

        emit CredentialMinted(tokenId, recipient, issuer, credentialType, metadataURI);
    }

    /**
     * @notice Revoke an existing credential
     */
    function revokeCredential(uint256 tokenId, string calldata reason) 
        external 
        override 
        nonReentrant 
        whenNotPaused 
    {
        if (_ownerOf(tokenId) == address(0)) revert CredentialNotFound();
        
        CredentialData storage credential = _credentials[tokenId];
        if (credential.isRevoked) revert CredentialAlreadyRevoked();

        // Check authorization (issuer or admin)
        if (!_canRevokeCredential(msg.sender, credential.issuer)) {
            revert UnauthorizedIssuer();
        }

        // Revoke credential
        credential.isRevoked = true;
        credential.revokeReason = reason;

        // Update external registry if enabled
        if (registryIntegrationEnabled && address(credentialRegistry) != address(0)) {
            credentialRegistry.updateCredentialStatus(
                tokenId,
                ICredentialRegistry.CredentialStatus.Revoked,
                reason
            );
        }

        emit CredentialRevoked(tokenId, msg.sender, reason);
    }

    /**
     * @notice Grant delegation permission
     */
    function grantDelegation(
        address delegate,
        string calldata credentialType,
        uint256 expirationTime
    ) external override nonReentrant whenNotPaused {
        if (!delegate.isValidAddress()) revert InvalidCredentialData();
        if (!credentialType.validateCredentialType()) revert InvalidCredentialData();
        if (expirationTime <= block.timestamp) revert InvalidCredentialData();
        
        // Only issuers can grant delegations
        if (!hasRole(ISSUER_ROLE, msg.sender)) revert UnauthorizedIssuer();

        // Store delegation
        _delegations[delegate][credentialType] = DelegationPermission({
            issuer: msg.sender,
            credentialType: credentialType,
            expirationTime: expirationTime,
            isActive: true
        });

        // Register with delegation manager if available
        if (address(delegationManager) != address(0)) {
            IDelegationManager.PermissionType[] memory permissions = 
                new IDelegationManager.PermissionType[](1);
            permissions[0] = IDelegationManager.PermissionType.MintCredential;
            
            string[] memory types = new string[](1);
            types[0] = credentialType;
            
            delegationManager.grantDelegation(
                delegate,
                permissions,
                types,
                expirationTime,
                0, // unlimited uses
                bytes32(0) // no additional conditions
            );
        }

        emit DelegationGranted(msg.sender, delegate, credentialType, expirationTime);
    }

    /**
     * @notice Revoke delegation permission
     */
    function revokeDelegation(address delegate, string calldata credentialType) 
        external 
        override 
        nonReentrant 
        whenNotPaused 
    {
        DelegationPermission storage delegation = _delegations[delegate][credentialType];
        
        // Check authorization
        if (delegation.issuer != msg.sender && !hasRole(ADMIN_ROLE, msg.sender)) {
            revert UnauthorizedIssuer();
        }
        
        delegation.isActive = false;

        emit DelegationRevoked(msg.sender, delegate, credentialType);
    }

    /**
     * @notice Check delegation permission
     */
    function hasDelegationPermission(
        address issuer,
        address delegate,
        string calldata credentialType
    ) external view override returns (bool hasPermission) {
        DelegationPermission memory delegation = _delegations[delegate][credentialType];
        
        return delegation.isActive && 
               delegation.issuer == issuer &&
               delegation.expirationTime > block.timestamp;
    }

    /**
     * @notice Check if credential is valid
     */
    function isCredentialValid(uint256 tokenId) external view override returns (bool isValid) {
        if (_ownerOf(tokenId) == address(0)) return false;
        
        CredentialData memory credential = _credentials[tokenId];
        
        return !credential.isRevoked && 
               !CredentialUtils.isExpired(credential.expirationTime);
    }

    /**
     * @notice Get credential information
     */
    function getCredentialInfo(uint256 tokenId)
        external
        view
        override
        returns (
            address recipient,
            address issuer,
            string memory credentialType,
            string memory metadataURI,
            uint256 issuanceTime,
            uint256 expirationTime,
            bool isRevoked
        )
    {
        if (_ownerOf(tokenId) == address(0)) revert CredentialNotFound();
        
        CredentialData memory credential = _credentials[tokenId];
        
        return (
            credential.recipient,
            credential.issuer,
            credential.credentialType,
            tokenURI(tokenId),
            credential.issuanceTime,
            credential.expirationTime,
            credential.isRevoked
        );
    }

    /**
     * @notice Get credentials by owner
     */
    function getCredentialsByOwner(address owner) 
        external 
        view 
        override 
        returns (uint256[] memory tokenIds) 
    {
        return _credentialsByRecipient[owner];
    }

    /**
     * @notice Get credentials by issuer
     */
    function getCredentialsByIssuer(address issuer) 
        external 
        view 
        override 
        returns (uint256[] memory tokenIds) 
    {
        return _credentialsByIssuer[issuer];
    }

    /**
     * @notice Override update function to make tokens soulbound
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from = address(0)) and burning (to = address(0))
        // Prevent all other transfers
        if (from != address(0) && to != address(0)) {
            revert SoulboundTokenNotTransferable();
        }
        
        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Override increase balance function
     */
    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    /**
     * @notice Override token URI functions
     */

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl, ERC721URIStorage, IERC165)
        returns (bool)
    {
        return super.supportsInterface(interfaceId) || 
               interfaceId == type(IVeriCredSBT).interfaceId;
    }

    /**
     * @dev Internal authorization functions
     */
    function _canIssueCredential(address issuer, string memory credentialType) 
        internal 
        view 
        returns (bool) 
    {
        // Check if user has issuer role
        if (hasRole(ISSUER_ROLE, issuer)) return true;
        
        // Check delegation permissions
        if (address(delegationManager) != address(0)) {
            (bool hasPermission,) = delegationManager.hasPermission(
                issuer,
                IDelegationManager.PermissionType.MintCredential,
                credentialType
            );
            return hasPermission;
        }
        
        return false;
    }

    function _canRevokeCredential(address revoker, address originalIssuer) 
        internal 
        view 
        returns (bool) 
    {
        return revoker == originalIssuer || hasRole(ADMIN_ROLE, revoker);
    }

    /**
     * @dev Admin functions
     */
    function setCredentialRegistry(address registry) external onlyRole(ADMIN_ROLE) {
        if (registry != address(0) && registry.code.length == 0) {
            revert InvalidExternalContract();
        }
        credentialRegistry = ICredentialRegistry(registry);
        emit ExternalContractUpdated("CredentialRegistry", registry);
    }

    function setDelegationManager(address manager) external onlyRole(ADMIN_ROLE) {
        if (manager != address(0) && manager.code.length == 0) {
            revert InvalidExternalContract();
        }
        delegationManager = IDelegationManager(manager);
        emit ExternalContractUpdated("DelegationManager", manager);
    }

    function setRiskAssessment(address assessment) external onlyRole(ADMIN_ROLE) {
        if (assessment != address(0) && assessment.code.length == 0) {
            revert InvalidExternalContract();
        }
        riskAssessment = IRiskAssessment(assessment);
        emit ExternalContractUpdated("RiskAssessment", assessment);
    }

    function setRiskAssessmentRequired(bool required) external onlyRole(ADMIN_ROLE) {
        riskAssessmentRequired = required;
        emit ConfigurationUpdated("riskAssessmentRequired", required);
    }

    function setRegistryIntegrationEnabled(bool enabled) external onlyRole(ADMIN_ROLE) {
        registryIntegrationEnabled = enabled;
        emit ConfigurationUpdated("registryIntegrationEnabled", enabled);
    }

    function setMaxCredentialsPerRecipient(uint256 maxCredentials) external onlyRole(ADMIN_ROLE) {
        maxCredentialsPerRecipient = maxCredentials;
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function grantIssuerRole(address issuer) external onlyRole(ADMIN_ROLE) {
        _grantRole(ISSUER_ROLE, issuer);
    }

    function revokeIssuerRole(address issuer) external onlyRole(ADMIN_ROLE) {
        _revokeRole(ISSUER_ROLE, issuer);
    }
}