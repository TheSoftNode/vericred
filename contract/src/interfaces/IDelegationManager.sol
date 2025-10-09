// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title IDelegationManager
 * @notice Interface for managing MetaMask Smart Account delegations and permissions
 * @dev Handles time-bounded, granular permissions for credential operations
 */
interface IDelegationManager {
    /**
     * @dev Permission type enumeration
     */
    enum PermissionType {
        None,               // No permissions
        MintCredential,     // Permission to mint credentials
        RevokeCredential,   // Permission to revoke credentials
        UpdateMetadata,     // Permission to update credential metadata
        GrantDelegation,    // Permission to grant sub-delegations
        RevokeDelegation,   // Permission to revoke delegations
        AdministerIssuer,   // Permission to manage issuer settings
        All                 // All permissions combined
    }

    /**
     * @dev Delegation structure
     */
    struct Delegation {
        uint256 delegationId;        // Unique delegation identifier
        address delegator;           // Address granting the delegation
        address delegate;            // Address receiving the delegation
        PermissionType[] permissions; // Array of granted permissions
        string[] credentialTypes;    // Credential types covered by delegation
        uint256 startTime;           // When delegation becomes active
        uint256 expirationTime;      // When delegation expires
        uint256 maxUses;             // Maximum number of uses (0 = unlimited)
        uint256 usedCount;           // Number of times delegation has been used
        bool isActive;               // Whether delegation is currently active
        bool isRevoked;              // Whether delegation has been revoked
        bytes32 conditionsHash;      // Hash of additional conditions
        mapping(bytes32 => bytes) metadata; // Additional delegation metadata
    }

    /**
     * @dev Delegation usage record
     */
    struct DelegationUsage {
        uint256 delegationId;        // Related delegation ID
        address usedBy;              // Address that used the delegation
        PermissionType permission;   // Permission that was used
        string credentialType;       // Credential type affected
        uint256 timestamp;           // When delegation was used
        bytes32 transactionHash;     // Transaction hash of the usage
        bytes additionalData;        // Additional usage context
    }

    /**
     * @dev Events
     */
    event DelegationGranted(
        uint256 indexed delegationId,
        address indexed delegator,
        address indexed delegate,
        PermissionType[] permissions,
        string[] credentialTypes,
        uint256 expirationTime
    );

    event DelegationRevoked(
        uint256 indexed delegationId,
        address indexed delegator,
        address indexed delegate,
        string reason
    );

    event DelegationUsed(
        uint256 indexed delegationId,
        address indexed delegate,
        PermissionType permission,
        string credentialType,
        uint256 usageCount
    );

    event DelegationExpired(
        uint256 indexed delegationId,
        address indexed delegator,
        address indexed delegate
    );

    event PermissionTemplateCreated(
        bytes32 indexed templateId,
        string name,
        PermissionType[] permissions
    );

    event SubDelegationCreated(
        uint256 indexed parentDelegationId,
        uint256 indexed subDelegationId,
        address indexed subDelegate
    );

    /**
     * @notice Grant delegation to another address
     * @param delegate Address to receive delegation
     * @param permissions Array of permissions to grant
     * @param credentialTypes Array of credential types covered
     * @param expirationTime When delegation expires
     * @param maxUses Maximum uses allowed (0 = unlimited)
     * @param conditions Additional conditions hash
     * @return delegationId Unique identifier for the delegation
     */
    function grantDelegation(
        address delegate,
        PermissionType[] calldata permissions,
        string[] calldata credentialTypes,
        uint256 expirationTime,
        uint256 maxUses,
        bytes32 conditions
    ) external returns (uint256 delegationId);

    /**
     * @notice Revoke an existing delegation
     * @param delegationId Delegation to revoke
     * @param reason Reason for revocation
     */
    function revokeDelegation(uint256 delegationId, string calldata reason) external;

    /**
     * @notice Use a delegation to perform an action
     * @param delegationId Delegation to use
     * @param permission Permission type being used
     * @param credentialType Credential type being acted upon
     * @param additionalData Additional context data
     * @return success True if delegation was successfully used
     */
    function useDelegation(
        uint256 delegationId,
        PermissionType permission,
        string calldata credentialType,
        bytes calldata additionalData
    ) external returns (bool success);

    /**
     * @notice Create a sub-delegation from an existing delegation
     * @param parentDelegationId Parent delegation ID
     * @param subDelegate Address to receive sub-delegation
     * @param permissions Subset of parent permissions to grant
     * @param credentialTypes Subset of parent credential types
     * @param expirationTime Expiration time (must be <= parent expiration)
     * @param maxUses Maximum uses for sub-delegation
     * @return subDelegationId Unique identifier for the sub-delegation
     */
    function createSubDelegation(
        uint256 parentDelegationId,
        address subDelegate,
        PermissionType[] calldata permissions,
        string[] calldata credentialTypes,
        uint256 expirationTime,
        uint256 maxUses
    ) external returns (uint256 subDelegationId);

    /**
     * @notice Check if address has specific permission for credential type
     * @param delegate Address to check
     * @param permission Permission type to verify
     * @param credentialType Credential type to check
     * @return hasPermission True if delegate has valid permission
     * @return delegationId ID of the delegation providing permission
     */
    function hasPermission(
        address delegate,
        PermissionType permission,
        string calldata credentialType
    ) external view returns (bool hasPermission, uint256 delegationId);

    /**
     * @notice Get delegation details by ID
     * @param delegationId Delegation identifier
     * @return delegator Address that granted the delegation
     * @return delegate Address that received the delegation
     * @return permissions Array of granted permissions
     * @return credentialTypes Array of covered credential types
     * @return startTime When delegation became active
     * @return expirationTime When delegation expires
     * @return maxUses Maximum allowed uses
     * @return usedCount Current usage count
     * @return isActive Whether delegation is active
     * @return isRevoked Whether delegation is revoked
     */
    function getDelegation(uint256 delegationId)
        external
        view
        returns (
            address delegator,
            address delegate,
            PermissionType[] memory permissions,
            string[] memory credentialTypes,
            uint256 startTime,
            uint256 expirationTime,
            uint256 maxUses,
            uint256 usedCount,
            bool isActive,
            bool isRevoked
        );

    /**
     * @notice Get all delegations granted by an address
     * @param delegator Address that granted delegations
     * @param offset Starting index for pagination
     * @param limit Maximum number of results
     * @return delegationIds Array of delegation IDs
     * @return hasMore Whether there are more results
     */
    function getDelegationsByDelegator(address delegator, uint256 offset, uint256 limit)
        external
        view
        returns (uint256[] memory delegationIds, bool hasMore);

    /**
     * @notice Get all delegations received by an address
     * @param delegate Address that received delegations
     * @param offset Starting index for pagination
     * @param limit Maximum number of results
     * @return delegationIds Array of delegation IDs
     * @return hasMore Whether there are more results
     */
    function getDelegationsByDelegate(address delegate, uint256 offset, uint256 limit)
        external
        view
        returns (uint256[] memory delegationIds, bool hasMore);

    /**
     * @notice Get usage history for a delegation
     * @param delegationId Delegation identifier
     * @param offset Starting index for pagination
     * @param limit Maximum number of results
     * @return usages Array of delegation usages
     * @return hasMore Whether there are more results
     */
    function getDelegationUsage(uint256 delegationId, uint256 offset, uint256 limit)
        external
        view
        returns (DelegationUsage[] memory usages, bool hasMore);

    /**
     * @notice Check if delegation is currently valid and usable
     * @param delegationId Delegation identifier
     * @return isValid True if delegation can be used
     * @return reason Reason if delegation is invalid
     */
    function isDelegationValid(uint256 delegationId)
        external
        view
        returns (bool isValid, string memory reason);

    /**
     * @notice Get remaining uses for a delegation
     * @param delegationId Delegation identifier
     * @return remainingUses Number of uses remaining (type(uint256).max for unlimited)
     */
    function getRemainingUses(uint256 delegationId) external view returns (uint256 remainingUses);

    /**
     * @notice Get all active delegations for an address and permission type
     * @param delegate Address to check
     * @param permission Permission type to filter by
     * @return delegationIds Array of active delegation IDs
     */
    function getActiveDelegations(address delegate, PermissionType permission)
        external
        view
        returns (uint256[] memory delegationIds);

    /**
     * @notice Create a permission template for reuse
     * @param templateId Unique template identifier
     * @param name Human-readable template name
     * @param permissions Array of permissions in template
     * @param credentialTypes Array of credential types in template
     */
    function createPermissionTemplate(
        bytes32 templateId,
        string calldata name,
        PermissionType[] calldata permissions,
        string[] calldata credentialTypes
    ) external;

    /**
     * @notice Grant delegation using a permission template
     * @param delegate Address to receive delegation
     * @param templateId Template to use
     * @param expirationTime When delegation expires
     * @param maxUses Maximum uses allowed
     * @return delegationId Unique identifier for the delegation
     */
    function grantDelegationFromTemplate(
        address delegate,
        bytes32 templateId,
        uint256 expirationTime,
        uint256 maxUses
    ) external returns (uint256 delegationId);

    /**
     * @notice Get permission template details
     * @param templateId Template identifier
     * @return name Template name
     * @return permissions Array of permissions in template
     * @return credentialTypes Array of credential types in template
     */
    function getPermissionTemplate(bytes32 templateId)
        external
        view
        returns (
            string memory name,
            PermissionType[] memory permissions,
            string[] memory credentialTypes
        );

    /**
     * @notice Batch revoke multiple delegations
     * @param delegationIds Array of delegation IDs to revoke
     * @param reason Reason for batch revocation
     * @return revokedCount Number of delegations successfully revoked
     */
    function batchRevokeDelegations(uint256[] calldata delegationIds, string calldata reason)
        external
        returns (uint256 revokedCount);

    /**
     * @notice Clean up expired delegations (maintenance function)
     * @param limit Maximum number of expired delegations to process
     * @return cleanedCount Number of expired delegations cleaned up
     */
    function cleanupExpiredDelegations(uint256 limit) external returns (uint256 cleanedCount);

    /**
     * @notice Get total number of delegations in the system
     * @return total Total delegation count
     */
    function getTotalDelegations() external view returns (uint256 total);

    /**
     * @notice Get delegation statistics for an address
     * @param account Address to get statistics for
     * @return totalGranted Total delegations granted by this address
     * @return totalReceived Total delegations received by this address
     * @return activeGranted Currently active delegations granted
     * @return activeReceived Currently active delegations received
     */
    function getDelegationStats(address account)
        external
        view
        returns (
            uint256 totalGranted,
            uint256 totalReceived,
            uint256 activeGranted,
            uint256 activeReceived
        );
}