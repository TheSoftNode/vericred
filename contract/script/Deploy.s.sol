// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "forge-std/console.sol";

import "../src/contracts/VeriCredSBT.sol";
import "../src/contracts/CredentialRegistry.sol";

/**
 * @title Deploy
 * @notice Deployment script for VeriCred contracts on Monad Testnet
 * @dev Deploys and configures the complete VeriCred system
 */
contract Deploy is Script {
    // Configuration constants
    string constant SBT_NAME = "VeriCred Credentials";
    string constant SBT_SYMBOL = "VCRED";
    
    // Deployment addresses will be stored here
    address public sbtContract;
    address public registryContract;
    
    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy CredentialRegistry first
        console.log("Deploying CredentialRegistry...");
        CredentialRegistry registry = new CredentialRegistry(deployer);
        registryContract = address(registry);
        console.log("CredentialRegistry deployed at:", registryContract);
        
        // 2. Deploy VeriCredSBT
        console.log("Deploying VeriCredSBT...");
        VeriCredSBT sbt = new VeriCredSBT(SBT_NAME, SBT_SYMBOL, deployer);
        sbtContract = address(sbt);
        console.log("VeriCredSBT deployed at:", sbtContract);
        
        // 3. Configure the contracts
        console.log("Configuring contracts...");
        
        // Authorize SBT contract in registry
        registry.addAuthorizedSBTContract(sbtContract);
        console.log("Authorized SBT contract in registry");
        
        // Set registry in SBT contract
        sbt.setCredentialRegistry(registryContract);
        console.log("Set registry address in SBT contract");
        
        // Grant issuer role to deployer for testing
        sbt.grantIssuerRole(deployer);
        console.log("Granted issuer role to deployer");
        
        // Register deployer as an issuer in registry
        registry.registerIssuer(
            deployer,
            "VeriCred Team",
            "https://vericred.com",
            "https://vericred.com/logo.png"
        );
        console.log("Registered deployer as issuer");
        
        // Verify deployer as trusted issuer
        registry.setIssuerVerification(deployer, true);
        console.log("Verified deployer as trusted issuer");
        
        // Authorize deployer for test credential types
        registry.authorizeCredentialType(deployer, "Bachelor_Degree", true);
        registry.authorizeCredentialType(deployer, "Master_Degree", true);
        registry.authorizeCredentialType(deployer, "PhD_Degree", true);
        registry.authorizeCredentialType(deployer, "Professional_Certificate", true);
        console.log("Authorized deployer for test credential types");
        
        vm.stopBroadcast();
        
        // Output deployment summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Network: Monad Testnet");
        console.log("Deployer:", deployer);
        console.log("VeriCredSBT:", sbtContract);
        console.log("CredentialRegistry:", registryContract);
        console.log("========================\n");
        
        // Save deployment addresses to file
        _saveDeploymentAddresses();
        
        // Verify contracts are working
        _verifyDeployment();
        
        console.log("Deployment completed successfully!");
    }
    
    function _saveDeploymentAddresses() internal {
        string memory deploymentFile = string.concat(
            "{\n",
            '  "network": "monad-testnet",\n',
            '  "chainId": 10143,\n',
            '  "timestamp": "', vm.toString(block.timestamp), '",\n',
            '  "deployer": "', vm.toString(vm.addr(vm.envUint("PRIVATE_KEY"))), '",\n',
            '  "contracts": {\n',
            '    "VeriCredSBT": "', vm.toString(sbtContract), '",\n',
            '    "CredentialRegistry": "', vm.toString(registryContract), '"\n',
            '  }\n',
            '}'
        );
        
        vm.writeFile("./deployments/monad-testnet.json", deploymentFile);
        console.log("Deployment addresses saved to ./deployments/monad-testnet.json");
    }
    
    function _verifyDeployment() internal view {
        console.log("Verifying deployment...");
        
        // Check SBT contract
        VeriCredSBT sbt = VeriCredSBT(sbtContract);
        require(bytes(sbt.name()).length > 0, "SBT name not set");
        require(bytes(sbt.symbol()).length > 0, "SBT symbol not set");
        console.log("SBT contract verified");
        
        // Check Registry contract
        CredentialRegistry registry = CredentialRegistry(registryContract);
        require(registry.getTotalIssuers() > 0, "No issuers registered");
        require(registry.isAuthorizedSBTContract(sbtContract), "SBT not authorized");
        console.log("Registry contract verified");
        
        console.log("All contracts verified successfully");
    }
}