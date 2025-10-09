// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import "../src/contracts/CredentialRegistry.sol";
import "../src/contracts/VeriCredSBT.sol";
import "../src/libraries/CredentialUtils.sol";

/**
 * @title CredentialRegistryTest
 * @notice Comprehensive test suite for CredentialRegistry contract
 * @dev Tests all registry functionality including issuer management, credential tracking, and authorization
 */
contract CredentialRegistryTest is Test {
    using CredentialUtils for string;

    // Contracts
    CredentialRegistry public registry;
    VeriCredSBT public sbt;
    
    // Test accounts
    address public admin = makeAddr("admin");
    address public verifier = makeAddr("verifier");
    address public issuer1 = makeAddr("issuer1");
    address public issuer2 = makeAddr("issuer2");
    address public student1 = makeAddr("student1");
    address public student2 = makeAddr("student2");
    address public unauthorized = makeAddr("unauthorized");
    
    // Test data
    string constant CREDENTIAL_TYPE_1 = "Bachelor_Degree";
    string constant CREDENTIAL_TYPE_2 = "Master_Degree";
    string constant METADATA_URI = "https://example.com/metadata/1";
    uint256 constant EXPIRATION_TIME = 1735689600; // Jan 1, 2025
    
    // Events to test
    event CredentialRegistered(
        uint256 indexed tokenId,
        address indexed issuer,
        address indexed recipient,
        string credentialType,
        bytes32 credentialHash
    );
    
    event CredentialStatusChanged(
        uint256 indexed tokenId,
        ICredentialRegistry.CredentialStatus oldStatus,
        ICredentialRegistry.CredentialStatus newStatus,
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

    function setUp() public {
        vm.startPrank(admin);
        
        // Deploy contracts
        registry = new CredentialRegistry(admin);
        sbt = new VeriCredSBT("VeriCred Test", "VCTEST", admin);
        
        // Configure contracts
        registry.addAuthorizedSBTContract(address(sbt));
        sbt.setCredentialRegistry(address(registry));
        
        // Grant verifier role
        registry.grantRole(registry.VERIFIER_ROLE(), verifier);
        
        vm.stopPrank();
    }

    function testIssuerRegistration() public {
        vm.startPrank(issuer1);
        
        // Test successful issuer registration
        vm.expectEmit(true, false, false, true);
        emit IssuerRegistered(issuer1, "University A", false);
        
        registry.registerIssuer(
            issuer1,
            "University A", 
            "https://univa.edu",
            "https://univa.edu/logo.png"
        );
        
        // Verify issuer profile
        (
            string memory name,
            string memory website,
            string memory logoURI,
            bool isVerified,
            uint256 totalIssued,
            uint256 totalRevoked,
            uint256 registrationDate
        ) = registry.getIssuerProfile(issuer1);
        
        assertEq(name, "University A");
        assertEq(website, "https://univa.edu");
        assertEq(logoURI, "https://univa.edu/logo.png");
        assertFalse(isVerified);
        assertEq(totalIssued, 0);
        assertEq(totalRevoked, 0);
        assertGt(registrationDate, 0);
        
        // Verify total issuers count
        assertEq(registry.getTotalIssuers(), 1);
        
        vm.stopPrank();
    }

    function testIssuerRegistrationFailures() public {
        vm.startPrank(issuer1);
        
        // Test invalid issuer address
        vm.expectRevert(CredentialRegistry.InvalidQueryParameters.selector);
        registry.registerIssuer(address(0), "Test", "https://test.com", "");
        
        // Register issuer successfully
        registry.registerIssuer(issuer1, "University A", "https://univa.edu", "");
        
        // Test duplicate registration
        vm.expectRevert(CredentialRegistry.IssuerAlreadyRegistered.selector);
        registry.registerIssuer(issuer1, "University A Again", "https://univa.edu", "");
        
        vm.stopPrank();
    }

    function testIssuerVerification() public {
        // Register issuer first
        vm.prank(issuer1);
        registry.registerIssuer(issuer1, "University A", "https://univa.edu", "");
        
        vm.startPrank(verifier);
        
        // Test setting verification
        vm.expectEmit(true, false, false, true);
        emit IssuerVerificationChanged(issuer1, true, verifier);
        
        registry.setIssuerVerification(issuer1, true);
        
        // Verify verification status
        (,,, bool isVerified,,,) = registry.getIssuerProfile(issuer1);
        assertTrue(isVerified);
        
        // Test removing verification
        registry.setIssuerVerification(issuer1, false);
        (,,, isVerified,,,) = registry.getIssuerProfile(issuer1);
        assertFalse(isVerified);
        
        vm.stopPrank();
    }

    function testIssuerVerificationFailures() public {
        // Test verifying non-existent issuer
        vm.startPrank(verifier);
        vm.expectRevert(CredentialRegistry.IssuerNotRegistered.selector);
        registry.setIssuerVerification(issuer1, true);
        vm.stopPrank();
        
        // Register issuer
        vm.prank(issuer1);
        registry.registerIssuer(issuer1, "University A", "https://univa.edu", "");
        
        // Test unauthorized verification
        vm.startPrank(unauthorized);
        vm.expectRevert();
        registry.setIssuerVerification(issuer1, true);
        vm.stopPrank();
    }

    function testCredentialTypeAuthorization() public {
        // Register issuer first
        vm.prank(issuer1);
        registry.registerIssuer(issuer1, "University A", "https://univa.edu", "");
        
        vm.startPrank(verifier);
        
        // Test authorizing credential type
        vm.expectEmit(true, false, false, true);
        emit CredentialTypeAuthorized(issuer1, CREDENTIAL_TYPE_1, true);
        
        registry.authorizeCredentialType(issuer1, CREDENTIAL_TYPE_1, true);
        
        // Verify authorization
        assertTrue(registry.isIssuerAuthorized(issuer1, CREDENTIAL_TYPE_1));
        assertFalse(registry.isIssuerAuthorized(issuer1, CREDENTIAL_TYPE_2));
        
        // Test revoking authorization
        registry.authorizeCredentialType(issuer1, CREDENTIAL_TYPE_1, false);
        assertFalse(registry.isIssuerAuthorized(issuer1, CREDENTIAL_TYPE_1));
        
        vm.stopPrank();
    }

    function testCredentialRegistration() public {
        // Setup: Register and authorize issuer
        vm.prank(issuer1);
        registry.registerIssuer(issuer1, "University A", "https://univa.edu", "");
        
        vm.startPrank(verifier);
        registry.setIssuerVerification(issuer1, true);
        registry.authorizeCredentialType(issuer1, CREDENTIAL_TYPE_1, true);
        vm.stopPrank();
        
        // Setup SBT contract for authorized calls
        vm.startPrank(address(sbt));
        
        uint256 tokenId = 1;
        bytes32 credentialHash = keccak256(abi.encodePacked(
            student1, issuer1, CREDENTIAL_TYPE_1, METADATA_URI, block.timestamp
        ));
        
        // Test successful credential registration
        vm.expectEmit(true, true, true, true);
        emit CredentialRegistered(tokenId, issuer1, student1, CREDENTIAL_TYPE_1, credentialHash);
        
        registry.registerCredential(
            tokenId,
            issuer1,
            student1,
            CREDENTIAL_TYPE_1,
            METADATA_URI,
            credentialHash,
            EXPIRATION_TIME
        );
        
        // Verify credential was registered
        assertTrue(registry.isCredentialValid(tokenId));
        assertEq(registry.getTotalCredentials(), 1);
        
        // Verify credential metadata
        (
            uint256 regTokenId,
            address regIssuer,
            address regRecipient,
            string memory regType,
            string memory regURI,
            uint256 issuanceDate,
            uint256 expirationDate,
            ICredentialRegistry.CredentialStatus status,
            bytes32 regHash
        ) = registry.getCredentialMetadata(tokenId);
        
        assertEq(regTokenId, tokenId);
        assertEq(regIssuer, issuer1);
        assertEq(regRecipient, student1);
        assertEq(regType, CREDENTIAL_TYPE_1);
        assertEq(regURI, METADATA_URI);
        assertGt(issuanceDate, 0);
        assertEq(expirationDate, EXPIRATION_TIME);
        assertEq(uint256(status), uint256(ICredentialRegistry.CredentialStatus.Valid));
        assertEq(regHash, credentialHash);
        
        vm.stopPrank();
    }

    function testCredentialRegistrationFailures() public {
        vm.startPrank(address(sbt));
        
        // Test invalid parameters
        vm.expectRevert(CredentialRegistry.InvalidQueryParameters.selector);
        registry.registerCredential(1, address(0), student1, CREDENTIAL_TYPE_1, METADATA_URI, bytes32(0), EXPIRATION_TIME);
        
        vm.expectRevert(CredentialRegistry.InvalidQueryParameters.selector);
        registry.registerCredential(1, issuer1, address(0), CREDENTIAL_TYPE_1, METADATA_URI, bytes32(0), EXPIRATION_TIME);
        
        vm.expectRevert(CredentialRegistry.InvalidQueryParameters.selector);
        registry.registerCredential(1, issuer1, student1, "", METADATA_URI, bytes32(0), EXPIRATION_TIME);
        
        vm.expectRevert(CredentialRegistry.InvalidQueryParameters.selector);
        registry.registerCredential(1, issuer1, student1, CREDENTIAL_TYPE_1, "invalid-uri", bytes32(0), EXPIRATION_TIME);
        
        vm.stopPrank();
        
        // Test unauthorized SBT contract
        vm.startPrank(unauthorized);
        vm.expectRevert(CredentialRegistry.UnauthorizedSBTContract.selector);
        registry.registerCredential(1, issuer1, student1, CREDENTIAL_TYPE_1, METADATA_URI, bytes32(0), EXPIRATION_TIME);
        vm.stopPrank();
    }

    function testCredentialStatusUpdate() public {
        // Register credential first
        vm.prank(issuer1);
        registry.registerIssuer(issuer1, "University A", "https://univa.edu", "");
        
        vm.startPrank(address(sbt));
        uint256 tokenId = 1;
        registry.registerCredential(
            tokenId, issuer1, student1, CREDENTIAL_TYPE_1, METADATA_URI, bytes32(0), EXPIRATION_TIME
        );
        
        // Test status update
        vm.expectEmit(true, false, false, true);
        emit CredentialStatusChanged(
            tokenId,
            ICredentialRegistry.CredentialStatus.Valid,
            ICredentialRegistry.CredentialStatus.Revoked,
            address(sbt),
            "Test revocation"
        );
        
        registry.updateCredentialStatus(
            tokenId,
            ICredentialRegistry.CredentialStatus.Revoked,
            "Test revocation"
        );
        
        // Verify status change
        assertEq(
            uint256(registry.getCredentialStatus(tokenId)),
            uint256(ICredentialRegistry.CredentialStatus.Revoked)
        );
        assertFalse(registry.isCredentialValid(tokenId));
        
        vm.stopPrank();
    }

    function testCredentialQueries() public {
        // Setup issuers and credentials
        vm.prank(issuer1);
        registry.registerIssuer(issuer1, "University A", "https://univa.edu", "");
        vm.prank(issuer2);
        registry.registerIssuer(issuer2, "University B", "https://univb.edu", "");
        
        vm.startPrank(address(sbt));
        
        // Register multiple credentials
        registry.registerCredential(1, issuer1, student1, CREDENTIAL_TYPE_1, METADATA_URI, bytes32(0), EXPIRATION_TIME);
        registry.registerCredential(2, issuer1, student1, CREDENTIAL_TYPE_2, METADATA_URI, bytes32(0), EXPIRATION_TIME);
        registry.registerCredential(3, issuer1, student2, CREDENTIAL_TYPE_1, METADATA_URI, bytes32(0), EXPIRATION_TIME);
        registry.registerCredential(4, issuer2, student1, CREDENTIAL_TYPE_1, METADATA_URI, bytes32(0), EXPIRATION_TIME);
        
        vm.stopPrank();
        
        // Test queries by issuer
        (uint256[] memory issuer1Creds, bool hasMore1) = registry.getCredentialsByIssuer(issuer1, 0, 10);
        assertEq(issuer1Creds.length, 3);
        assertEq(issuer1Creds[0], 1);
        assertEq(issuer1Creds[1], 2);
        assertEq(issuer1Creds[2], 3);
        assertFalse(hasMore1);
        
        (uint256[] memory issuer2Creds, bool hasMore2) = registry.getCredentialsByIssuer(issuer2, 0, 10);
        assertEq(issuer2Creds.length, 1);
        assertEq(issuer2Creds[0], 4);
        assertFalse(hasMore2);
        
        // Test queries by recipient
        (uint256[] memory student1Creds, bool hasMore3) = registry.getCredentialsByRecipient(student1, 0, 10);
        assertEq(student1Creds.length, 3);
        assertFalse(hasMore3);
        
        (uint256[] memory student2Creds, bool hasMore4) = registry.getCredentialsByRecipient(student2, 0, 10);
        assertEq(student2Creds.length, 1);
        assertEq(student2Creds[0], 3);
        assertFalse(hasMore4);
        
        // Test queries by type
        (uint256[] memory type1Creds, bool hasMore5) = registry.getCredentialsByType(CREDENTIAL_TYPE_1, 0, 10);
        assertEq(type1Creds.length, 3);
        assertFalse(hasMore5);
        
        (uint256[] memory type2Creds, bool hasMore6) = registry.getCredentialsByType(CREDENTIAL_TYPE_2, 0, 10);
        assertEq(type2Creds.length, 1);
        assertEq(type2Creds[0], 2);
        assertFalse(hasMore6);
    }

    function testPagination() public {
        // Setup
        vm.prank(issuer1);
        registry.registerIssuer(issuer1, "University A", "https://univa.edu", "");
        
        vm.startPrank(address(sbt));
        
        // Register many credentials
        for (uint256 i = 1; i <= 5; i++) {
            registry.registerCredential(i, issuer1, student1, CREDENTIAL_TYPE_1, METADATA_URI, bytes32(0), EXPIRATION_TIME);
        }
        
        vm.stopPrank();
        
        // Test pagination with limit
        (uint256[] memory page1, bool hasMore1) = registry.getCredentialsByIssuer(issuer1, 0, 2);
        assertEq(page1.length, 2);
        assertEq(page1[0], 1);
        assertEq(page1[1], 2);
        assertTrue(hasMore1);
        
        (uint256[] memory page2, bool hasMore2) = registry.getCredentialsByIssuer(issuer1, 2, 2);
        assertEq(page2.length, 2);
        assertEq(page2[0], 3);
        assertEq(page2[1], 4);
        assertTrue(hasMore2);
        
        (uint256[] memory page3, bool hasMore3) = registry.getCredentialsByIssuer(issuer1, 4, 2);
        assertEq(page3.length, 1);
        assertEq(page3[0], 5);
        assertFalse(hasMore3);
        
        // Test offset beyond array
        (uint256[] memory emptyPage, bool hasMore4) = registry.getCredentialsByIssuer(issuer1, 10, 2);
        assertEq(emptyPage.length, 0);
        assertFalse(hasMore4);
    }

    function testCredentialAttributes() public {
        // Register credential first
        vm.prank(issuer1);
        registry.registerIssuer(issuer1, "University A", "https://univa.edu", "");
        
        vm.startPrank(address(sbt));
        uint256 tokenId = 1;
        registry.registerCredential(
            tokenId, issuer1, student1, CREDENTIAL_TYPE_1, METADATA_URI, bytes32(0), EXPIRATION_TIME
        );
        
        // Test setting attributes
        bytes32 attributeKey = keccak256("grade");
        bytes memory attributeValue = abi.encode("A+");
        
        registry.setCredentialAttribute(tokenId, attributeKey, attributeValue);
        
        // Test getting attributes
        bytes memory retrievedValue = registry.getCredentialAttribute(tokenId, attributeKey);
        assertEq(retrievedValue, attributeValue);
        
        string memory decodedGrade = abi.decode(retrievedValue, (string));
        assertEq(decodedGrade, "A+");
        
        vm.stopPrank();
    }

    function testCredentialExpiry() public {
        // Register credential with short expiry
        vm.prank(issuer1);
        registry.registerIssuer(issuer1, "University A", "https://univa.edu", "");
        
        vm.startPrank(address(sbt));
        uint256 tokenId = 1;
        uint256 shortExpiry = block.timestamp + 10;
        
        registry.registerCredential(
            tokenId, issuer1, student1, CREDENTIAL_TYPE_1, METADATA_URI, bytes32(0), shortExpiry
        );
        
        // Verify initially valid
        assertTrue(registry.isCredentialValid(tokenId));
        assertEq(
            uint256(registry.getCredentialStatus(tokenId)),
            uint256(ICredentialRegistry.CredentialStatus.Valid)
        );
        
        // Fast forward past expiry
        vm.warp(block.timestamp + 20);
        
        // Verify expired
        assertFalse(registry.isCredentialValid(tokenId));
        assertEq(
            uint256(registry.getCredentialStatus(tokenId)),
            uint256(ICredentialRegistry.CredentialStatus.Expired)
        );
        
        vm.stopPrank();
    }

    function testAuthorizedSBTContract() public {
        address newSBT = makeAddr("newSBT");
        
        vm.startPrank(admin);
        
        // Test adding authorized contract
        registry.addAuthorizedSBTContract(newSBT);
        assertTrue(registry.isAuthorizedSBTContract(newSBT));
        
        // Test removing authorized contract
        registry.removeAuthorizedSBTContract(newSBT);
        assertFalse(registry.isAuthorizedSBTContract(newSBT));
        
        vm.stopPrank();
        
        // Test unauthorized access
        vm.startPrank(newSBT);
        vm.expectRevert(CredentialRegistry.UnauthorizedSBTContract.selector);
        registry.registerCredential(1, issuer1, student1, CREDENTIAL_TYPE_1, METADATA_URI, bytes32(0), EXPIRATION_TIME);
        vm.stopPrank();
    }

    function testEmergencyFunctions() public {
        // Setup credential
        vm.prank(issuer1);
        registry.registerIssuer(issuer1, "University A", "https://univa.edu", "");
        
        vm.prank(address(sbt));
        uint256 tokenId = 1;
        registry.registerCredential(
            tokenId, issuer1, student1, CREDENTIAL_TYPE_1, METADATA_URI, bytes32(0), EXPIRATION_TIME
        );
        
        vm.startPrank(admin);
        
        // Test emergency status update
        registry.emergencyUpdateCredentialStatus(
            tokenId,
            ICredentialRegistry.CredentialStatus.Suspended,
            "Emergency suspension"
        );
        
        assertEq(
            uint256(registry.getCredentialStatus(tokenId)),
            uint256(ICredentialRegistry.CredentialStatus.Suspended)
        );
        
        // Test emergency issuer revocation
        registry.emergencyRevokeIssuer(issuer1, "Security breach");
        
        // Verify issuer is no longer verified
        (,,, bool isVerified,,,) = registry.getIssuerProfile(issuer1);
        assertFalse(isVerified);
        
        vm.stopPrank();
    }

    function testAccessControl() public {
        // Test that only admin can add authorized contracts
        vm.startPrank(unauthorized);
        vm.expectRevert();
        registry.addAuthorizedSBTContract(makeAddr("test"));
        vm.stopPrank();
        
        // Test that only verifier can verify issuers
        vm.prank(issuer1);
        registry.registerIssuer(issuer1, "University A", "https://univa.edu", "");
        
        vm.startPrank(unauthorized);
        vm.expectRevert();
        registry.setIssuerVerification(issuer1, true);
        vm.stopPrank();
        
        // Test that only verifier can authorize credential types
        vm.startPrank(unauthorized);
        vm.expectRevert();
        registry.authorizeCredentialType(issuer1, CREDENTIAL_TYPE_1, true);
        vm.stopPrank();
    }

    function testConfigurationUpdates() public {
        vm.startPrank(admin);
        
        // Test max credentials per query
        registry.setMaxCredentialsPerQuery(50);
        
        // Test require verified issuers
        registry.setRequireVerifiedIssuers(true);
        
        // Test that unverified issuer is not authorized when requirement is enabled
        vm.stopPrank();
        
        vm.prank(issuer1);
        registry.registerIssuer(issuer1, "University A", "https://univa.edu", "");
        
        vm.prank(verifier);
        registry.authorizeCredentialType(issuer1, CREDENTIAL_TYPE_1, true);
        
        // Should not be authorized because issuer is not verified and verification is required
        assertFalse(registry.isIssuerAuthorized(issuer1, CREDENTIAL_TYPE_1));
        
        // Verify issuer and test again
        vm.prank(verifier);
        registry.setIssuerVerification(issuer1, true);
        
        assertTrue(registry.isIssuerAuthorized(issuer1, CREDENTIAL_TYPE_1));
    }

    function testPauseUnpause() public {
        vm.startPrank(admin);
        
        // Test pausing
        registry.pause();
        assertTrue(registry.paused());
        
        // Test that operations are blocked when paused
        vm.stopPrank();
        
        vm.startPrank(issuer1);
        vm.expectRevert("Pausable: paused");
        registry.registerIssuer(issuer1, "University A", "https://univa.edu", "");
        vm.stopPrank();
        
        vm.startPrank(admin);
        
        // Test unpausing
        registry.unpause();
        assertFalse(registry.paused());
        
        vm.stopPrank();
        
        // Test that operations work after unpause
        vm.startPrank(issuer1);
        registry.registerIssuer(issuer1, "University A", "https://univa.edu", "");
        vm.stopPrank();
    }

    function testNonExistentCredentialQueries() public {
        // Test querying non-existent credential
        vm.expectRevert(CredentialRegistry.CredentialNotFound.selector);
        registry.getCredentialMetadata(999);
        
        vm.expectRevert(CredentialRegistry.CredentialNotFound.selector);
        registry.getCredentialAttribute(999, bytes32(0));
        
        // Test status of non-existent credential
        assertEq(
            uint256(registry.getCredentialStatus(999)),
            uint256(ICredentialRegistry.CredentialStatus.Invalid)
        );
        
        assertFalse(registry.isCredentialValid(999));
    }

    function testDuplicateCredentialRegistration() public {
        vm.prank(issuer1);
        registry.registerIssuer(issuer1, "University A", "https://univa.edu", "");
        
        vm.startPrank(address(sbt));
        
        uint256 tokenId = 1;
        registry.registerCredential(
            tokenId, issuer1, student1, CREDENTIAL_TYPE_1, METADATA_URI, bytes32(0), EXPIRATION_TIME
        );
        
        // Test registering same token ID again
        vm.expectRevert(CredentialRegistry.CredentialAlreadyExists.selector);
        registry.registerCredential(
            tokenId, issuer1, student1, CREDENTIAL_TYPE_1, METADATA_URI, bytes32(0), EXPIRATION_TIME
        );
        
        vm.stopPrank();
    }

    function testStatistics() public {
        // Initial state
        assertEq(registry.getTotalCredentials(), 0);
        assertEq(registry.getTotalIssuers(), 0);
        
        // Register issuers
        vm.prank(issuer1);
        registry.registerIssuer(issuer1, "University A", "https://univa.edu", "");
        vm.prank(issuer2);
        registry.registerIssuer(issuer2, "University B", "https://univb.edu", "");
        
        assertEq(registry.getTotalIssuers(), 2);
        
        // Register credentials
        vm.startPrank(address(sbt));
        registry.registerCredential(1, issuer1, student1, CREDENTIAL_TYPE_1, METADATA_URI, bytes32(0), EXPIRATION_TIME);
        registry.registerCredential(2, issuer1, student2, CREDENTIAL_TYPE_1, METADATA_URI, bytes32(0), EXPIRATION_TIME);
        registry.registerCredential(3, issuer2, student1, CREDENTIAL_TYPE_2, METADATA_URI, bytes32(0), EXPIRATION_TIME);
        vm.stopPrank();
        
        assertEq(registry.getTotalCredentials(), 3);
        
        // Check issuer statistics
        (,,, bool isVerified1, uint256 totalIssued1, uint256 totalRevoked1,) = registry.getIssuerProfile(issuer1);
        assertFalse(isVerified1);
        assertEq(totalIssued1, 2);
        assertEq(totalRevoked1, 0);
        
        (,,, bool isVerified2, uint256 totalIssued2, uint256 totalRevoked2,) = registry.getIssuerProfile(issuer2);
        assertFalse(isVerified2);
        assertEq(totalIssued2, 1);
        assertEq(totalRevoked2, 0);
        
        // Test revocation statistics
        vm.prank(address(sbt));
        registry.updateCredentialStatus(1, ICredentialRegistry.CredentialStatus.Revoked, "Test");
        
        (,,, , , totalRevoked1,) = registry.getIssuerProfile(issuer1);
        assertEq(totalRevoked1, 1);
    }
}