// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import "../src/contracts/VeriCredSBT.sol";
import "../src/contracts/CredentialRegistry.sol";
import "../src/libraries/CredentialUtils.sol";

/**
 * @title VeriCredSBTTest
 * @notice Comprehensive test suite for VeriCred Soulbound Token system
 * @dev Tests all core functionality including minting, revoking, delegation, and security
 */
contract VeriCredSBTTest is Test {
    using CredentialUtils for string;

    // Contracts
    VeriCredSBT public sbt;
    CredentialRegistry public registry;
    
    // Test accounts
    address public admin = makeAddr("admin");
    address public issuer1 = makeAddr("issuer1");
    address public issuer2 = makeAddr("issuer2");
    address public student1 = makeAddr("student1");
    address public student2 = makeAddr("student2");
    address public delegate = makeAddr("delegate");
    address public unauthorized = makeAddr("unauthorized");
    
    // Test data
    string constant CREDENTIAL_TYPE = "Bachelor_Degree";
    string constant METADATA_URI = "https://example.com/metadata/1";
    uint256 constant EXPIRATION_TIME = 1735689600; // Jan 1, 2025
    
    // Events to test
    event CredentialMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        address indexed issuer,
        string credentialType,
        string metadataURI
    );
    
    event CredentialRevoked(
        uint256 indexed tokenId,
        address indexed revoker,
        string reason
    );
    
    event DelegationGranted(
        address indexed issuer,
        address indexed delegate,
        string credentialType,
        uint256 expirationTime
    );

    function setUp() public {
        vm.startPrank(admin);
        
        // Deploy contracts
        registry = new CredentialRegistry(admin);
        sbt = new VeriCredSBT("VeriCred Test", "VCTEST", admin);
        
        // Configure contracts
        registry.addAuthorizedSBTContract(address(sbt));
        sbt.setCredentialRegistry(address(registry));
        
        // Set up issuers
        sbt.grantIssuerRole(issuer1);
        sbt.grantIssuerRole(issuer2);
        
        // Register issuers in registry
        registry.registerIssuer(issuer1, "University A", "https://univa.edu", "");
        registry.registerIssuer(issuer2, "University B", "https://univb.edu", "");
        
        // Verify and authorize issuers
        registry.setIssuerVerification(issuer1, true);
        registry.setIssuerVerification(issuer2, true);
        registry.authorizeCredentialType(issuer1, CREDENTIAL_TYPE, true);
        registry.authorizeCredentialType(issuer2, CREDENTIAL_TYPE, true);
        
        vm.stopPrank();
    }

    function testMintCredential() public {
        vm.startPrank(issuer1);
        
        // Test successful minting
        vm.expectEmit(true, true, true, true);
        emit CredentialMinted(1, student1, issuer1, CREDENTIAL_TYPE, METADATA_URI);
        
        uint256 tokenId = sbt.mintCredential(
            student1,
            CREDENTIAL_TYPE,
            METADATA_URI,
            EXPIRATION_TIME
        );
        
        // Verify token was minted
        assertEq(tokenId, 1);
        assertEq(sbt.ownerOf(tokenId), student1);
        assertEq(sbt.tokenURI(tokenId), METADATA_URI);
        assertTrue(sbt.isCredentialValid(tokenId));
        
        // Verify credential info
        (
            address recipient,
            address issuer,
            string memory credType,
            string memory metaURI,
            uint256 issuanceTime,
            uint256 expirationTime,
            bool isRevoked
        ) = sbt.getCredentialInfo(tokenId);
        
        assertEq(recipient, student1);
        assertEq(issuer, issuer1);
        assertEq(credType, CREDENTIAL_TYPE);
        assertEq(metaURI, METADATA_URI);
        assertGt(issuanceTime, 0);
        assertEq(expirationTime, EXPIRATION_TIME);
        assertFalse(isRevoked);
        
        vm.stopPrank();
    }

    function testMintCredentialFailures() public {
        // Test unauthorized issuer
        vm.startPrank(unauthorized);
        vm.expectRevert(VeriCredSBT.UnauthorizedIssuer.selector);
        sbt.mintCredential(student1, CREDENTIAL_TYPE, METADATA_URI, EXPIRATION_TIME);
        vm.stopPrank();
        
        vm.startPrank(issuer1);
        
        // Test invalid recipient
        vm.expectRevert(VeriCredSBT.InvalidCredentialData.selector);
        sbt.mintCredential(address(0), CREDENTIAL_TYPE, METADATA_URI, EXPIRATION_TIME);
        
        // Test invalid credential type
        vm.expectRevert(VeriCredSBT.InvalidCredentialData.selector);
        sbt.mintCredential(student1, "", METADATA_URI, EXPIRATION_TIME);
        
        // Test invalid metadata URI
        vm.expectRevert(VeriCredSBT.InvalidCredentialData.selector);
        sbt.mintCredential(student1, CREDENTIAL_TYPE, "invalid-uri", EXPIRATION_TIME);
        
        // Test invalid expiration time (past date)
        vm.expectRevert(VeriCredSBT.InvalidCredentialData.selector);
        sbt.mintCredential(student1, CREDENTIAL_TYPE, METADATA_URI, block.timestamp - 1);
        
        vm.stopPrank();
    }

    function testRevokeCredential() public {
        // First mint a credential
        vm.prank(issuer1);
        uint256 tokenId = sbt.mintCredential(
            student1,
            CREDENTIAL_TYPE,
            METADATA_URI,
            EXPIRATION_TIME
        );
        
        // Test successful revocation by issuer
        vm.startPrank(issuer1);
        vm.expectEmit(true, true, false, true);
        emit CredentialRevoked(tokenId, issuer1, "Academic misconduct");
        
        sbt.revokeCredential(tokenId, "Academic misconduct");
        
        // Verify revocation
        assertFalse(sbt.isCredentialValid(tokenId));
        
        (,,,,,,bool isRevoked) = sbt.getCredentialInfo(tokenId);
        assertTrue(isRevoked);
        
        vm.stopPrank();
    }

    function testRevokeCredentialFailures() public {
        // Mint credential first
        vm.prank(issuer1);
        uint256 tokenId = sbt.mintCredential(
            student1,
            CREDENTIAL_TYPE,
            METADATA_URI,
            EXPIRATION_TIME
        );
        
        // Test unauthorized revocation
        vm.startPrank(issuer2);
        vm.expectRevert(VeriCredSBT.UnauthorizedIssuer.selector);
        sbt.revokeCredential(tokenId, "Test");
        vm.stopPrank();
        
        // Test revoking non-existent credential
        vm.startPrank(issuer1);
        vm.expectRevert(VeriCredSBT.CredentialNotFound.selector);
        sbt.revokeCredential(999, "Test");
        
        // Revoke the credential
        sbt.revokeCredential(tokenId, "Test");
        
        // Test revoking already revoked credential
        vm.expectRevert(VeriCredSBT.CredentialAlreadyRevoked.selector);
        sbt.revokeCredential(tokenId, "Test again");
        
        vm.stopPrank();
    }

    function testDelegation() public {
        vm.startPrank(issuer1);
        
        // Test granting delegation
        uint256 delegationExpiry = block.timestamp + 1 days;
        
        vm.expectEmit(true, true, false, true);
        emit DelegationGranted(issuer1, delegate, CREDENTIAL_TYPE, delegationExpiry);
        
        sbt.grantDelegation(delegate, CREDENTIAL_TYPE, delegationExpiry);
        
        // Verify delegation exists
        assertTrue(sbt.hasDelegationPermission(issuer1, delegate, CREDENTIAL_TYPE));
        
        vm.stopPrank();
        
        // Test delegate can mint credentials
        vm.startPrank(delegate);
        uint256 tokenId = sbt.mintCredential(
            student1,
            CREDENTIAL_TYPE,
            METADATA_URI,
            EXPIRATION_TIME
        );
        
        assertEq(sbt.ownerOf(tokenId), student1);
        assertTrue(sbt.isCredentialValid(tokenId));
        
        vm.stopPrank();
    }

    function testDelegationExpiry() public {
        vm.startPrank(issuer1);
        
        // Grant delegation that expires in 1 second
        uint256 delegationExpiry = block.timestamp + 1;
        sbt.grantDelegation(delegate, CREDENTIAL_TYPE, delegationExpiry);
        
        vm.stopPrank();
        
        // Fast forward time past expiry
        vm.warp(block.timestamp + 2);
        
        // Verify delegation is expired
        assertFalse(sbt.hasDelegationPermission(issuer1, delegate, CREDENTIAL_TYPE));
        
        // Test that expired delegate cannot mint
        vm.startPrank(delegate);
        vm.expectRevert(VeriCredSBT.UnauthorizedIssuer.selector);
        sbt.mintCredential(student1, CREDENTIAL_TYPE, METADATA_URI, EXPIRATION_TIME);
        vm.stopPrank();
    }

    function testRevokeDelegation() public {
        vm.startPrank(issuer1);
        
        // Grant delegation
        uint256 delegationExpiry = block.timestamp + 1 days;
        sbt.grantDelegation(delegate, CREDENTIAL_TYPE, delegationExpiry);
        
        // Verify delegation exists
        assertTrue(sbt.hasDelegationPermission(issuer1, delegate, CREDENTIAL_TYPE));
        
        // Revoke delegation
        sbt.revokeDelegation(delegate, CREDENTIAL_TYPE);
        
        // Verify delegation is revoked
        assertFalse(sbt.hasDelegationPermission(issuer1, delegate, CREDENTIAL_TYPE));
        
        vm.stopPrank();
    }

    function testSoulboundTransferRestriction() public {
        // Mint a credential
        vm.prank(issuer1);
        uint256 tokenId = sbt.mintCredential(
            student1,
            CREDENTIAL_TYPE,
            METADATA_URI,
            EXPIRATION_TIME
        );
        
        // Test that transfers are not allowed
        vm.startPrank(student1);
        vm.expectRevert(VeriCredSBT.SoulboundTokenNotTransferable.selector);
        sbt.transferFrom(student1, student2, tokenId);
        
        vm.expectRevert(VeriCredSBT.SoulboundTokenNotTransferable.selector);
        sbt.safeTransferFrom(student1, student2, tokenId);
        
        vm.expectRevert(VeriCredSBT.SoulboundTokenNotTransferable.selector);
        sbt.safeTransferFrom(student1, student2, tokenId, "");
        
        vm.stopPrank();
    }

    function testCredentialQueries() public {
        // Mint multiple credentials
        vm.startPrank(issuer1);
        uint256 tokenId1 = sbt.mintCredential(student1, CREDENTIAL_TYPE, METADATA_URI, EXPIRATION_TIME);
        uint256 tokenId2 = sbt.mintCredential(student1, "Master_Degree", METADATA_URI, EXPIRATION_TIME);
        uint256 tokenId3 = sbt.mintCredential(student2, CREDENTIAL_TYPE, METADATA_URI, EXPIRATION_TIME);
        vm.stopPrank();
        
        // Test getting credentials by owner
        uint256[] memory student1Credentials = sbt.getCredentialsByOwner(student1);
        assertEq(student1Credentials.length, 2);
        assertEq(student1Credentials[0], tokenId1);
        assertEq(student1Credentials[1], tokenId2);
        
        uint256[] memory student2Credentials = sbt.getCredentialsByOwner(student2);
        assertEq(student2Credentials.length, 1);
        assertEq(student2Credentials[0], tokenId3);
        
        // Test getting credentials by issuer
        uint256[] memory issuer1Credentials = sbt.getCredentialsByIssuer(issuer1);
        assertEq(issuer1Credentials.length, 3);
    }

    function testAccessControl() public {
        // Test that only admin can grant issuer role
        vm.startPrank(unauthorized);
        vm.expectRevert();
        sbt.grantIssuerRole(unauthorized);
        vm.stopPrank();
        
        // Test that admin can grant issuer role
        vm.startPrank(admin);
        sbt.grantIssuerRole(unauthorized);
        assertTrue(sbt.hasRole(sbt.ISSUER_ROLE(), unauthorized));
        vm.stopPrank();
        
        // Test that only admin can revoke issuer role
        vm.startPrank(issuer1);
        vm.expectRevert();
        sbt.revokeIssuerRole(unauthorized);
        vm.stopPrank();
        
        vm.startPrank(admin);
        sbt.revokeIssuerRole(unauthorized);
        assertFalse(sbt.hasRole(sbt.ISSUER_ROLE(), unauthorized));
        vm.stopPrank();
    }

    function testPauseUnpause() public {
        // Test that only pauser can pause
        vm.startPrank(unauthorized);
        vm.expectRevert();
        sbt.pause();
        vm.stopPrank();
        
        // Test pausing
        vm.startPrank(admin);
        sbt.pause();
        assertTrue(sbt.paused());
        vm.stopPrank();
        
        // Test that minting is disabled when paused
        vm.startPrank(issuer1);
        vm.expectRevert("Pausable: paused");
        sbt.mintCredential(student1, CREDENTIAL_TYPE, METADATA_URI, EXPIRATION_TIME);
        vm.stopPrank();
        
        // Test unpausing
        vm.startPrank(admin);
        sbt.unpause();
        assertFalse(sbt.paused());
        vm.stopPrank();
        
        // Test that minting works after unpause
        vm.startPrank(issuer1);
        uint256 tokenId = sbt.mintCredential(student1, CREDENTIAL_TYPE, METADATA_URI, EXPIRATION_TIME);
        assertGt(tokenId, 0);
        vm.stopPrank();
    }

    function testCredentialExpiry() public {
        // Mint credential that expires soon
        uint256 shortExpiry = block.timestamp + 10;
        
        vm.prank(issuer1);
        uint256 tokenId = sbt.mintCredential(
            student1,
            CREDENTIAL_TYPE,
            METADATA_URI,
            shortExpiry
        );
        
        // Verify credential is initially valid
        assertTrue(sbt.isCredentialValid(tokenId));
        
        // Fast forward past expiry
        vm.warp(block.timestamp + 20);
        
        // Verify credential is no longer valid
        assertFalse(sbt.isCredentialValid(tokenId));
    }

    function testMaxCredentialsLimit() public {
        // Set low limit for testing
        vm.prank(admin);
        sbt.setMaxCredentialsPerRecipient(2);
        
        vm.startPrank(issuer1);
        
        // Mint up to limit
        sbt.mintCredential(student1, CREDENTIAL_TYPE, METADATA_URI, EXPIRATION_TIME);
        sbt.mintCredential(student1, "Master_Degree", METADATA_URI, EXPIRATION_TIME);
        
        // Test that exceeding limit fails
        vm.expectRevert(VeriCredSBT.MaxCredentialsExceeded.selector);
        sbt.mintCredential(student1, "PhD_Degree", METADATA_URI, EXPIRATION_TIME);
        
        vm.stopPrank();
    }

    function testInterfaceSupport() public {
        // Test ERC165 interface support
        assertTrue(sbt.supportsInterface(type(IERC165).interfaceId));
        assertTrue(sbt.supportsInterface(type(IERC721).interfaceId));
        assertTrue(sbt.supportsInterface(type(IAccessControl).interfaceId));
        assertTrue(sbt.supportsInterface(type(IVeriCredSBT).interfaceId));
    }

    function testRegistryIntegration() public {
        // Verify registry integration is enabled
        vm.startPrank(issuer1);
        
        uint256 tokenId = sbt.mintCredential(
            student1,
            CREDENTIAL_TYPE,
            METADATA_URI,
            EXPIRATION_TIME
        );
        
        // Check that credential was registered
        assertTrue(registry.isCredentialValid(tokenId));
        
        (
            uint256 regTokenId,
            address regIssuer,
            address regRecipient,
            string memory regType,
            ,,,
            ICredentialRegistry.CredentialStatus status,
        ) = registry.getCredentialMetadata(tokenId);
        
        assertEq(regTokenId, tokenId);
        assertEq(regIssuer, issuer1);
        assertEq(regRecipient, student1);
        assertEq(regType, CREDENTIAL_TYPE);
        assertEq(uint256(status), uint256(ICredentialRegistry.CredentialStatus.Valid));
        
        vm.stopPrank();
    }
}