// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title IVeriCredSBT
 * @notice Interface for VeriCred Soulbound Token (Non-transferable NFT)
 * @dev Extends ERC721 but prevents transfers to ensure credentials remain soulbound
 */
interface IVeriCredSBT is IERC721 {
    /**
     * @dev Emitted when a new credential is minted
     * @param tokenId The unique identifier for the credential
     * @param recipient The address receiving the credential
     * @param issuer The address of the credential issuer
     * @param credentialType The type/category of credential
     * @param metadataURI URI pointing to credential metadata
     */
    event CredentialMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        address indexed issuer,
        string credentialType,
        string metadataURI
    );

    /**
     * @dev Emitted when a credential is revoked
     * @param tokenId The unique identifier for the revoked credential
     * @param revoker The address that revoked the credential
     * @param reason The reason for revocation
     */
    event CredentialRevoked(
        uint256 indexed tokenId,
        address indexed revoker,
        string reason
    );

    /**
     * @dev Emitted when delegation permission is granted
     * @param issuer The credential issuer
     * @param delegate The address receiving delegation permission
     * @param credentialType The type of credential they can issue
     * @param expirationTime When the delegation expires
     */
    event DelegationGranted(
        address indexed issuer,
        address indexed delegate,
        string credentialType,
        uint256 expirationTime
    );

    /**
     * @dev Emitted when delegation permission is revoked
     * @param issuer The credential issuer
     * @param delegate The address losing delegation permission
     * @param credentialType The type of credential affected
     */
    event DelegationRevoked(
        address indexed issuer,
        address indexed delegate,
        string credentialType
    );

    /**
     * @notice Mint a new credential
     * @param recipient The address to receive the credential
     * @param credentialType The type/category of credential
     * @param metadataURI URI pointing to credential metadata
     * @param expirationTime Optional expiration timestamp (0 for no expiration)
     * @return tokenId The unique identifier for the minted credential
     */
    function mintCredential(
        address recipient,
        string calldata credentialType,
        string calldata metadataURI,
        uint256 expirationTime
    ) external returns (uint256 tokenId);

    /**
     * @notice Revoke an existing credential
     * @param tokenId The unique identifier for the credential to revoke
     * @param reason The reason for revocation
     */
    function revokeCredential(uint256 tokenId, string calldata reason) external;

    /**
     * @notice Grant delegation permission to another address
     * @param delegate The address to grant permission to
     * @param credentialType The type of credential they can issue
     * @param expirationTime When the delegation expires
     */
    function grantDelegation(
        address delegate,
        string calldata credentialType,
        uint256 expirationTime
    ) external;

    /**
     * @notice Revoke delegation permission from an address
     * @param delegate The address to revoke permission from
     * @param credentialType The type of credential affected
     */
    function revokeDelegation(address delegate, string calldata credentialType) external;

    /**
     * @notice Check if an address has delegation permission
     * @param issuer The original credential issuer
     * @param delegate The address to check
     * @param credentialType The type of credential
     * @return hasPermission True if delegation is valid and not expired
     */
    function hasDelegationPermission(
        address issuer,
        address delegate,
        string calldata credentialType
    ) external view returns (bool hasPermission);

    /**
     * @notice Check if a credential is currently valid (not revoked and not expired)
     * @param tokenId The unique identifier for the credential
     * @return isValid True if credential is valid
     */
    function isCredentialValid(uint256 tokenId) external view returns (bool isValid);

    /**
     * @notice Get detailed information about a credential
     * @param tokenId The unique identifier for the credential
     * @return recipient The address that owns the credential
     * @return issuer The address that issued the credential
     * @return credentialType The type/category of credential
     * @return metadataURI URI pointing to credential metadata
     * @return issuanceTime When the credential was issued
     * @return expirationTime When the credential expires (0 for no expiration)
     * @return isRevoked Whether the credential has been revoked
     */
    function getCredentialInfo(uint256 tokenId)
        external
        view
        returns (
            address recipient,
            address issuer,
            string memory credentialType,
            string memory metadataURI,
            uint256 issuanceTime,
            uint256 expirationTime,
            bool isRevoked
        );

    /**
     * @notice Get all credentials owned by an address
     * @param owner The address to query
     * @return tokenIds Array of credential token IDs owned by the address
     */
    function getCredentialsByOwner(address owner) external view returns (uint256[] memory tokenIds);

    /**
     * @notice Get all credentials issued by an address
     * @param issuer The issuer address to query
     * @return tokenIds Array of credential token IDs issued by the address
     */
    function getCredentialsByIssuer(address issuer) external view returns (uint256[] memory tokenIds);
}