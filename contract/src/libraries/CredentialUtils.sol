// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title CredentialUtils
 * @notice Utility library for credential operations and validations
 * @dev Contains common functions used across the VeriCred system
 */
library CredentialUtils {
    /**
     * @dev Custom errors for better gas efficiency
     */
    error InvalidCredentialType();
    error InvalidExpirationTime();
    error InvalidMetadataURI();
    error InvalidAddress();
    error CredentialExpired();
    error InvalidSignature();

    /**
     * @dev Constants for validation
     */
    uint256 public constant MAX_CREDENTIAL_TYPE_LENGTH = 100;
    uint256 public constant MAX_METADATA_URI_LENGTH = 500;
    uint256 public constant MIN_EXPIRATION_DURATION = 1 days;
    uint256 public constant MAX_EXPIRATION_DURATION = 10 * 365 days; // 10 years

    /**
     * @notice Validate credential type string
     * @param credentialType The credential type to validate
     * @return isValid True if credential type is valid
     */
    function validateCredentialType(string memory credentialType) internal pure returns (bool isValid) {
        bytes memory typeBytes = bytes(credentialType);
        
        // Check length
        if (typeBytes.length == 0 || typeBytes.length > MAX_CREDENTIAL_TYPE_LENGTH) {
            return false;
        }
        
        // Check for valid characters (alphanumeric, hyphen, underscore, space)
        for (uint256 i = 0; i < typeBytes.length; i++) {
            bytes1 char = typeBytes[i];
            if (!(
                (char >= 0x30 && char <= 0x39) || // 0-9
                (char >= 0x41 && char <= 0x5A) || // A-Z
                (char >= 0x61 && char <= 0x7A) || // a-z
                char == 0x2D ||                   // -
                char == 0x5F ||                   // _
                char == 0x20                      // space
            )) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * @notice Validate metadata URI
     * @param metadataURI The URI to validate
     * @return isValid True if URI is valid
     */
    function validateMetadataURI(string memory metadataURI) internal pure returns (bool isValid) {
        bytes memory uriBytes = bytes(metadataURI);
        
        // Check length
        if (uriBytes.length == 0 || uriBytes.length > MAX_METADATA_URI_LENGTH) {
            return false;
        }
        
        // Basic URI format validation (starts with http:// or https:// or ipfs://)
        if (uriBytes.length >= 7) {
            // Check for http://
            if (uriBytes[0] == 0x68 && uriBytes[1] == 0x74 && uriBytes[2] == 0x74 && 
                uriBytes[3] == 0x70 && uriBytes[4] == 0x3A && uriBytes[5] == 0x2F && 
                uriBytes[6] == 0x2F) {
                return true;
            }
        }
        
        if (uriBytes.length >= 8) {
            // Check for https://
            if (uriBytes[0] == 0x68 && uriBytes[1] == 0x74 && uriBytes[2] == 0x74 && 
                uriBytes[3] == 0x70 && uriBytes[4] == 0x73 && uriBytes[5] == 0x3A && 
                uriBytes[6] == 0x2F && uriBytes[7] == 0x2F) {
                return true;
            }
        }
        
        if (uriBytes.length >= 7) {
            // Check for ipfs://
            if (uriBytes[0] == 0x69 && uriBytes[1] == 0x70 && uriBytes[2] == 0x66 && 
                uriBytes[3] == 0x73 && uriBytes[4] == 0x3A && uriBytes[5] == 0x2F && 
                uriBytes[6] == 0x2F) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * @notice Validate expiration time
     * @param expirationTime The expiration timestamp to validate
     * @return isValid True if expiration time is valid
     */
    function validateExpirationTime(uint256 expirationTime) internal view returns (bool isValid) {
        // Allow 0 for non-expiring credentials
        if (expirationTime == 0) {
            return true;
        }
        
        // Must be in the future
        if (expirationTime <= block.timestamp) {
            return false;
        }
        
        // Must be within reasonable bounds
        uint256 duration = expirationTime - block.timestamp;
        if (duration < MIN_EXPIRATION_DURATION || duration > MAX_EXPIRATION_DURATION) {
            return false;
        }
        
        return true;
    }

    /**
     * @notice Check if credential is expired
     * @param expirationTime The expiration timestamp
     * @return expired True if credential is expired
     */
    function isExpired(uint256 expirationTime) internal view returns (bool expired) {
        return expirationTime != 0 && expirationTime <= block.timestamp;
    }

    /**
     * @notice Generate credential hash for integrity verification
     * @param recipient Address of credential recipient
     * @param issuer Address of credential issuer
     * @param credentialType Type of credential
     * @param metadataURI URI pointing to credential metadata
     * @param issuanceTime When credential was issued
     * @return credentialHash Hash of credential data
     */
    function generateCredentialHash(
        address recipient,
        address issuer,
        string memory credentialType,
        string memory metadataURI,
        uint256 issuanceTime
    ) internal pure returns (bytes32 credentialHash) {
        return keccak256(abi.encodePacked(
            recipient,
            issuer,
            credentialType,
            metadataURI,
            issuanceTime
        ));
    }

    /**
     * @notice Verify credential hash integrity
     * @param recipient Address of credential recipient
     * @param issuer Address of credential issuer
     * @param credentialType Type of credential
     * @param metadataURI URI pointing to credential metadata
     * @param issuanceTime When credential was issued
     * @param expectedHash Expected hash value
     * @return isValid True if hash matches
     */
    function verifyCredentialHash(
        address recipient,
        address issuer,
        string memory credentialType,
        string memory metadataURI,
        uint256 issuanceTime,
        bytes32 expectedHash
    ) internal pure returns (bool isValid) {
        bytes32 computedHash = generateCredentialHash(
            recipient,
            issuer,
            credentialType,
            metadataURI,
            issuanceTime
        );
        return computedHash == expectedHash;
    }

    /**
     * @notice Normalize credential type to standard format
     * @param credentialType Raw credential type string
     * @return normalized Normalized credential type
     */
    function normalizeCredentialType(string memory credentialType) 
        internal 
        pure 
        returns (string memory normalized) 
    {
        bytes memory typeBytes = bytes(credentialType);
        bytes memory result = new bytes(typeBytes.length);
        
        for (uint256 i = 0; i < typeBytes.length; i++) {
            bytes1 char = typeBytes[i];
            // Convert to lowercase and replace spaces with underscores
            if (char >= 0x41 && char <= 0x5A) {
                result[i] = bytes1(uint8(char) + 32); // Convert to lowercase
            } else if (char == 0x20) {
                result[i] = 0x5F; // Replace space with underscore
            } else {
                result[i] = char;
            }
        }
        
        return string(result);
    }

    /**
     * @notice Extract domain from metadata URI
     * @param metadataURI Full metadata URI
     * @return domain Extracted domain name
     */
    function extractDomain(string memory metadataURI) internal pure returns (string memory domain) {
        bytes memory uriBytes = bytes(metadataURI);
        
        // Find start of domain (after protocol)
        uint256 start = 0;
        if (uriBytes.length > 8) {
            // Skip past https://
            if (uriBytes[0] == 0x68 && uriBytes[4] == 0x73) {
                start = 8;
            } else if (uriBytes[0] == 0x68 && uriBytes[4] == 0x3A) {
                start = 7; // Skip past http://
            }
        }
        
        // Find end of domain (first slash after protocol)
        uint256 end = start;
        for (uint256 i = start; i < uriBytes.length; i++) {
            if (uriBytes[i] == 0x2F) { // Forward slash
                end = i;
                break;
            }
        }
        
        if (end == start) {
            end = uriBytes.length;
        }
        
        // Extract domain substring
        bytes memory domainBytes = new bytes(end - start);
        for (uint256 i = 0; i < end - start; i++) {
            domainBytes[i] = uriBytes[start + i];
        }
        
        return string(domainBytes);
    }

    /**
     * @notice Calculate time until expiration
     * @param expirationTime Expiration timestamp
     * @return timeRemaining Seconds until expiration (0 if expired or non-expiring)
     */
    function getTimeUntilExpiration(uint256 expirationTime) 
        internal 
        view 
        returns (uint256 timeRemaining) 
    {
        if (expirationTime == 0 || expirationTime <= block.timestamp) {
            return 0;
        }
        return expirationTime - block.timestamp;
    }

    /**
     * @notice Check if address is a valid Ethereum address
     * @param addr Address to validate
     * @return isValid True if address is valid (not zero address)
     */
    function isValidAddress(address addr) internal pure returns (bool isValid) {
        return addr != address(0);
    }

    /**
     * @notice Compare two strings for equality
     * @param a First string
     * @param b Second string
     * @return equal True if strings are equal
     */
    function stringEqual(string memory a, string memory b) internal pure returns (bool equal) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }

    /**
     * @notice Convert string to bytes32 (for storage optimization)
     * @param source String to convert
     * @return result Bytes32 representation
     */
    function stringToBytes32(string memory source) internal pure returns (bytes32 result) {
        bytes memory sourceBytes = bytes(source);
        if (sourceBytes.length == 0) {
            return 0x0;
        }
        
        assembly {
            result := mload(add(source, 32))
        }
    }

    /**
     * @notice Convert bytes32 to string
     * @param source Bytes32 to convert
     * @return result String representation
     */
    function bytes32ToString(bytes32 source) internal pure returns (string memory result) {
        uint8 length = 0;
        for (uint8 i = 0; i < 32; i++) {
            if (source[i] != 0) {
                length = i + 1;
            }
        }
        
        bytes memory bytesArray = new bytes(length);
        for (uint8 i = 0; i < length; i++) {
            bytesArray[i] = source[i];
        }
        
        return string(bytesArray);
    }

    /**
     * @notice Create deterministic token ID from credential data
     * @param recipient Address of credential recipient
     * @param issuer Address of credential issuer
     * @param credentialType Type of credential
     * @param nonce Unique nonce to prevent collisions
     * @return tokenId Deterministic token ID
     */
    function generateTokenId(
        address recipient,
        address issuer,
        string memory credentialType,
        uint256 nonce
    ) internal view returns (uint256 tokenId) {
        return uint256(keccak256(abi.encodePacked(
            recipient,
            issuer,
            credentialType,
            nonce,
            block.timestamp
        )));
    }
}