# VeriCred Smart Contracts

Production-ready smart contract system for VeriCred+ - AI-powered, delegated, tamper-proof credential management on Monad Testnet.

## 🏗️ Architecture Overview

VeriCred implements a comprehensive soulbound token (SBT) system with advanced features:

- **Soulbound NFTs**: Non-transferable credentials that remain permanently bound to recipients
- **AI Fraud Detection**: Integration with off-chain AI services for risk assessment
- **MetaMask Smart Account Delegation**: Time-bounded, granular permissions for credential operations
- **Global Registry**: Centralized tracking and verification of all credentials
- **Enterprise Security**: Role-based access control, pausability, and comprehensive validation

## 📁 Contract Structure

```
src/
├── contracts/
│   ├── VeriCredSBT.sol          # Main soulbound token contract
│   └── CredentialRegistry.sol   # Global credential registry
├── interfaces/
│   ├── IVeriCredSBT.sol         # SBT interface
│   ├── ICredentialRegistry.sol  # Registry interface
│   ├── IRiskAssessment.sol      # AI risk assessment interface
│   └── IDelegationManager.sol   # Delegation management interface
├── libraries/
│   └── CredentialUtils.sol      # Utility functions and validations
└── utils/
    └── (reserved for future utilities)
```

## 🔧 Key Features

### VeriCredSBT Contract
- **Soulbound Properties**: Prevents transfers while allowing minting/revocation
- **Role-Based Access**: ISSUER, DELEGATOR, ADMIN, and PAUSER roles
- **Delegation Support**: MetaMask Smart Account integration for time-bounded permissions
- **AI Integration**: Risk assessment before credential issuance
- **Comprehensive Validation**: Input validation and security checks
- **Registry Integration**: Automatic registration of credentials

### CredentialRegistry Contract
- **Global Tracking**: Centralized registry of all credentials
- **Issuer Management**: Verification and authorization of credential issuers
- **Status Management**: Valid, Revoked, Expired, Suspended states
- **Query APIs**: Efficient pagination and filtering
- **Metadata Storage**: Custom attributes and comprehensive credential data

## 🚀 Deployment

### Prerequisites
- [Foundry](https://getfoundry.sh/) installed
- Access to Monad Testnet RPC
- Test MON tokens from [Monad Faucet](https://testnet.monad.xyz)

### Environment Setup
```bash
# Clone and setup
cd contract/
cp .env.example .env

# Configure environment variables
PRIVATE_KEY=your_private_key_here
RPC_URL=https://testnet-rpc.monad.xyz
ETHERSCAN_API_KEY=not_needed_for_monad
```

### Deploy to Monad Testnet
```bash
# Compile contracts
forge build

# Deploy to Monad Testnet
forge script script/Deploy.s.sol --rpc-url https://testnet-rpc.monad.xyz --broadcast --verify

# Verify contracts (optional)
forge verify-contract \
    <contract_address> \
    src/contracts/VeriCredSBT.sol:VeriCredSBT \
    --chain 10143 \
    --verifier sourcify \
    --verifier-url https://sourcify-api-monad.blockvision.org
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
forge test

# Run tests with gas reporting
forge test --gas-report

# Run specific test file
forge test --match-path test/VeriCredSBT.t.sol

# Run with verbosity for debugging
forge test -vvv
```

### Test Coverage
```bash
# Generate coverage report
forge coverage

# Generate detailed HTML coverage report
forge coverage --report lcov
genhtml lcov.info --output-directory coverage
```

## 📋 Usage Examples

### Minting a Credential
```solidity
// As an authorized issuer
uint256 tokenId = sbt.mintCredential(
    studentAddress,
    "Bachelor_Degree",
    "https://university.edu/credentials/123",
    1735689600  // Expiration timestamp
);
```

### Granting Delegation
```solidity
// Grant time-bounded permission to mint credentials
sbt.grantDelegation(
    delegateAddress,
    "Bachelor_Degree",
    block.timestamp + 30 days  // Expires in 30 days
);
```

### Querying Credentials
```solidity
// Get all credentials for a recipient
uint256[] memory credentials = sbt.getCredentialsByOwner(recipientAddress);

// Check if credential is valid
bool isValid = sbt.isCredentialValid(tokenId);

// Get comprehensive credential info
(
    address recipient,
    address issuer,
    string memory credentialType,
    string memory metadataURI,
    uint256 issuanceTime,
    uint256 expirationTime,
    bool isRevoked
) = sbt.getCredentialInfo(tokenId);
```

## 🔒 Security Features

### Access Control
- **Role-based permissions** with OpenZeppelin AccessControl
- **Multi-signature support** for admin operations
- **Time-bounded delegations** with automatic expiry

### Validation & Security
- **Input validation** for all parameters
- **Reentrancy protection** on state-changing functions
- **Pausability** for emergency stops
- **Custom errors** for gas-efficient error handling

### Fraud Prevention
- **AI risk assessment** integration
- **Transaction pattern analysis**
- **Issuer verification** requirements
- **Credential integrity** hashing

## 🌐 Monad Testnet Configuration

### Network Details
- **Chain ID**: 10143
- **RPC URL**: https://testnet-rpc.monad.xyz
- **WebSocket**: wss://testnet-rpc.monad.xyz
- **Block Time**: 400ms
- **Finality**: 800ms (2 blocks)
- **Explorer**: https://testnet.monadexplorer.com

### Gas Configuration
- **Gas Limit**: 30M per transaction, 150M per block
- **Base Fee**: 50 gwei (testnet), dynamic on mainnet
- **Max Contract Size**: 128KB (vs 24.5KB on Ethereum)

## 📊 Integration with Envio

The contracts are designed for seamless integration with Envio HyperIndex:

### Indexed Events
- `CredentialMinted`: Real-time credential issuance tracking
- `CredentialRevoked`: Revocation monitoring
- `DelegationGranted`: Permission tracking
- `CredentialStatusChanged`: Status updates

### GraphQL Schema Example
```graphql
type Credential @entity {
  id: ID!
  tokenId: BigInt!
  issuer: Bytes!
  recipient: Bytes!
  credentialType: String!
  issuanceDate: BigInt!
  expirationDate: BigInt
  isRevoked: Boolean!
  metadataURI: String!
  credentialHash: Bytes!
}
```

## 🎯 Farcaster Frame Integration

Events are optimized for the VeriCred Verify Frame:

```javascript
// Example Envio handler for Farcaster integration
CredentialMinted.handler(async ({ event, context }) => {
  const credential = {
    id: event.params.tokenId,
    issuer: event.params.issuer,
    recipient: event.params.recipient,
    credentialType: event.params.credentialType,
    isValid: true,
    issuanceDate: event.block.timestamp
  };
  
  context.Credential.set(credential);
  
  // Trigger Farcaster Frame update
  await generateFrameForCredential(credential);
});
```

## 📈 Gas Optimization

Contracts are optimized for Monad's high-throughput environment:

- **Custom errors** instead of string messages
- **Packed structs** for efficient storage
- **Batch operations** for multiple actions
- **Efficient indexing** with minimal storage reads

## 🛠️ Development Tools

### Foundry Configuration
```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
metadata = true
metadata_hash = "none"
use_literal_content = true

# Monad Testnet Configuration
eth-rpc-url = "https://testnet-rpc.monad.xyz"
chain_id = 10143
```

### Useful Commands
```bash
# Format code
forge fmt

# Check for common issues
forge bind

# Generate documentation
forge doc

# Analyze gas usage
forge test --gas-report

# Simulation and debugging
forge run --debug <script>
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write comprehensive tests
4. Ensure all tests pass
5. Follow the existing code style
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- [Monad Documentation](https://docs.monad.xyz)
- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Envio Documentation](https://docs.envio.dev)
- [VeriCred+ Frontend](../frontend/)

---

Built for the MetaMask x Monad x Envio Hackathon 🚀