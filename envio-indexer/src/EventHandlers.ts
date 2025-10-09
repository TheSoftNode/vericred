/*
 * VeriCred+ Enterprise Indexer - Complete Event Handlers
 * Handles ALL events selected during pnpx envio init
 * Production-grade handlers with aggregation entities for backend integration
 */

import {
  CredentialRegistry,
  VeriCredSBT,
} from "generated";

import type { CredentialStatus_t } from "../generated/src/db/Enums.gen";

// ===============================================
// VERICREDSBT CONTRACT HANDLERS
// ===============================================

VeriCredSBT.CredentialMinted.handler(async ({ event, context }) => {
  try {
    // 1. Create the basic event entity
    const mintEventEntity = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      tokenId: event.params.tokenId,
      recipient: event.params.recipient.toLowerCase(),
      issuer: event.params.issuer.toLowerCase(),
      credentialType: event.params.credentialType,
      metadataURI: event.params.metadataURI,
      blockNumber: BigInt(event.block.number),
      blockTimestamp: new Date(event.block.timestamp * 1000),
      logIndex: event.logIndex,
      transactionHash: event.transaction.hash,
      gasUsed: event.transaction.gasUsed,
      gasPrice: undefined,
      credential_id: `credential_${event.params.tokenId}`,
    };
    context.VeriCredSBT_CredentialMinted.set(mintEventEntity);

    // 2. Create Credential aggregation entity
    const credentialEntity = {
      id: `credential_${event.params.tokenId}`,
      tokenId: event.params.tokenId,
      recipient: event.params.recipient.toLowerCase(),
      issuer: event.params.issuer.toLowerCase(),
      credentialType: event.params.credentialType,
      metadataURI: event.params.metadataURI,
      credentialHash: undefined,
      status: "ACTIVE" as CredentialStatus_t,
      issuedAt: new Date(event.block.timestamp * 1000),
      revokedAt: undefined,
      revokedBy: undefined,
      revocationReason: undefined,
      blockNumber: BigInt(event.block.number),
      transactionHash: event.transaction.hash,
      mintEvent_id: mintEventEntity.id,
      registryEvent_id: undefined,
      revokeEvent_id: undefined,
    };
    context.Credential.set(credentialEntity);

    // 3. Update Issuer aggregation entity
    const issuerId = `issuer_${event.params.issuer.toLowerCase()}`;
    let issuer = await context.Issuer.get(issuerId);
    
    if (!issuer) {
      issuer = {
        id: issuerId,
        name: "",
        isVerified: false,
        registeredAt: new Date(event.block.timestamp * 1000),
        logoURI: undefined,
        websiteURI: undefined,
        totalCredentialsIssued: BigInt(1),
        totalActiveCredentials: BigInt(1),
        authorizedTypes: [event.params.credentialType],
      };
    } else {
      issuer = {
        ...issuer,
        totalCredentialsIssued: issuer.totalCredentialsIssued + BigInt(1),
        totalActiveCredentials: issuer.totalActiveCredentials + BigInt(1),
        authorizedTypes: issuer.authorizedTypes.includes(event.params.credentialType) 
          ? issuer.authorizedTypes 
          : [...issuer.authorizedTypes, event.params.credentialType],
      };
    }
    context.Issuer.set(issuer);

    // 4. Update CredentialType aggregation entity
    const credentialTypeId = `type_${event.params.credentialType.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`;
    let credentialType = await context.CredentialType.get(credentialTypeId);
    
    if (!credentialType) {
      credentialType = {
        id: credentialTypeId,
        name: event.params.credentialType,
        totalIssued: BigInt(1),
        totalActive: BigInt(1),
        authorizedIssuers: [event.params.issuer.toLowerCase()],
      };
    } else {
      credentialType = {
        ...credentialType,
        totalIssued: credentialType.totalIssued + BigInt(1),
        totalActive: credentialType.totalActive + BigInt(1),
        authorizedIssuers: credentialType.authorizedIssuers.includes(event.params.issuer.toLowerCase())
          ? credentialType.authorizedIssuers
          : [...credentialType.authorizedIssuers, event.params.issuer.toLowerCase()],
      };
    }
    context.CredentialType.set(credentialType);

    context.log.info(`✅ Credential minted: Token ${event.params.tokenId}`);
  } catch (error) {
    context.log.error(`❌ Error processing CredentialMinted: ${error}`);
  }
});

VeriCredSBT.CredentialRevoked.handler(async ({ event, context }) => {
  try {
    // 1. Create revocation event entity
    const revokeEventEntity = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      tokenId: event.params.tokenId,
      revoker: event.params.revoker.toLowerCase(),
      reason: event.params.reason,
    };
    context.VeriCredSBT_CredentialRevoked.set(revokeEventEntity);

    // 2. Update Credential aggregation entity
    const credentialId = `credential_${event.params.tokenId}`;
    let credential = await context.Credential.get(credentialId);
    
    if (credential) {
      const updatedCredential = {
        ...credential,
        status: "REVOKED" as CredentialStatus_t,
        revokedAt: new Date(event.block.timestamp * 1000),
        revokedBy: event.params.revoker.toLowerCase(),
        revocationReason: event.params.reason,
        revokeEvent_id: revokeEventEntity.id,
      };
      context.Credential.set(updatedCredential);

      // Update aggregation stats
      const issuerId = `issuer_${credential.issuer}`;
      let issuer = await context.Issuer.get(issuerId);
      if (issuer && issuer.totalActiveCredentials > BigInt(0)) {
        context.Issuer.set({
          ...issuer,
          totalActiveCredentials: issuer.totalActiveCredentials - BigInt(1),
        });
      }

      const credentialTypeId = `type_${credential.credentialType.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`;
      let credentialType = await context.CredentialType.get(credentialTypeId);
      if (credentialType && credentialType.totalActive > BigInt(0)) {
        context.CredentialType.set({
          ...credentialType,
          totalActive: credentialType.totalActive - BigInt(1),
        });
      }
    }
    
    context.log.info(`🚫 Credential revoked: Token ${event.params.tokenId}`);
  } catch (error) {
    context.log.error(`❌ Error processing CredentialRevoked: ${error}`);
  }
});

// Basic handlers for all other VeriCredSBT events
VeriCredSBT.Approval.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    owner: event.params.owner.toLowerCase(),
    approved: event.params.approved.toLowerCase(),
    tokenId: event.params.tokenId,
  };
  context.VeriCredSBT_Approval.set(entity);
});

VeriCredSBT.ApprovalForAll.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    owner: event.params.owner.toLowerCase(),
    operator: event.params.operator.toLowerCase(),
    approved: event.params.approved,
  };
  context.VeriCredSBT_ApprovalForAll.set(entity);
});

VeriCredSBT.BatchMetadataUpdate.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    _fromTokenId: event.params._fromTokenId,
    _toTokenId: event.params._toTokenId,
  };
  context.VeriCredSBT_BatchMetadataUpdate.set(entity);
});

VeriCredSBT.ConfigurationUpdated.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    parameter: event.params.parameter,
    value: event.params.value,
  };
  context.VeriCredSBT_ConfigurationUpdated.set(entity);
});

VeriCredSBT.ContractUpgraded.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    newImplementation: event.params.newImplementation.toLowerCase(),
  };
  context.VeriCredSBT_ContractUpgraded.set(entity);
});

VeriCredSBT.DelegationGranted.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    issuer: event.params.issuer.toLowerCase(),
    delegate: event.params.delegate.toLowerCase(),
    credentialType: event.params.credentialType,
    expirationTime: event.params.expirationTime,
  };
  context.VeriCredSBT_DelegationGranted.set(entity);
});

VeriCredSBT.DelegationRevoked.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    issuer: event.params.issuer.toLowerCase(),
    delegate: event.params.delegate.toLowerCase(),
    credentialType: event.params.credentialType,
  };
  context.VeriCredSBT_DelegationRevoked.set(entity);
});

VeriCredSBT.ExternalContractUpdated.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    contractType: event.params.contractType,
    contractAddress: event.params.contractAddress.toLowerCase(),
  };
  context.VeriCredSBT_ExternalContractUpdated.set(entity);
});

VeriCredSBT.MetadataUpdate.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    _tokenId: event.params._tokenId,
  };
  context.VeriCredSBT_MetadataUpdate.set(entity);
});

VeriCredSBT.Paused.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    account: event.params.account.toLowerCase(),
  };
  context.VeriCredSBT_Paused.set(entity);
});

VeriCredSBT.RoleAdminChanged.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    role: event.params.role,
    previousAdminRole: event.params.previousAdminRole,
    newAdminRole: event.params.newAdminRole,
  };
  context.VeriCredSBT_RoleAdminChanged.set(entity);
});

VeriCredSBT.RoleGranted.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    role: event.params.role,
    account: event.params.account.toLowerCase(),
    sender: event.params.sender.toLowerCase(),
  };
  context.VeriCredSBT_RoleGranted.set(entity);
});

VeriCredSBT.RoleRevoked.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    role: event.params.role,
    account: event.params.account.toLowerCase(),
    sender: event.params.sender.toLowerCase(),
  };
  context.VeriCredSBT_RoleRevoked.set(entity);
});

VeriCredSBT.Transfer.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from.toLowerCase(),
    to: event.params.to.toLowerCase(),
    tokenId: event.params.tokenId,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: new Date(event.block.timestamp * 1000),
    logIndex: event.logIndex,
    transactionHash: event.transaction.hash,
    credential_id: `credential_${event.params.tokenId}`,
  };
  context.VeriCredSBT_Transfer.set(entity);
});

VeriCredSBT.Unpaused.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    account: event.params.account.toLowerCase(),
  };
  context.VeriCredSBT_Unpaused.set(entity);
});

// ===============================================
// CREDENTIAL REGISTRY CONTRACT HANDLERS
// ===============================================

CredentialRegistry.CredentialRegistered.handler(async ({ event, context }) => {
  try {
    // 1. Create registry event entity
    const registryEventEntity = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      tokenId: event.params.tokenId,
      issuer: event.params.issuer.toLowerCase(),
      recipient: event.params.recipient.toLowerCase(),
      credentialType: event.params.credentialType,
      credentialHash: event.params.credentialHash,
      blockNumber: BigInt(event.block.number),
      blockTimestamp: new Date(event.block.timestamp * 1000),
      logIndex: event.logIndex,
      transactionHash: event.transaction.hash,
      credential_id: `credential_${event.params.tokenId}`,
    };
    context.CredentialRegistry_CredentialRegistered.set(registryEventEntity);

    // 2. Update Credential with hash
    const credentialId = `credential_${event.params.tokenId}`;
    let credential = await context.Credential.get(credentialId);
    if (credential) {
      context.Credential.set({
        ...credential,
        credentialHash: event.params.credentialHash,
        registryEvent_id: registryEventEntity.id,
      });
    }
    
    context.log.info(`🔗 Credential registered: Token ${event.params.tokenId}`);
  } catch (error) {
    context.log.error(`❌ Error processing CredentialRegistered: ${error}`);
  }
});

CredentialRegistry.IssuerRegistered.handler(async ({ event, context }) => {
  try {
    // 1. Create issuer registration event
    const issuerRegistrationEntity = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      issuer: event.params.issuer.toLowerCase(),
      name: event.params.name,
      isVerified: event.params.isVerified,
    };
    context.CredentialRegistry_IssuerRegistered.set(issuerRegistrationEntity);

    // 2. Update Issuer aggregation entity
    const issuerId = `issuer_${event.params.issuer.toLowerCase()}`;
    let issuer = await context.Issuer.get(issuerId);
    
    if (issuer) {
      context.Issuer.set({
        ...issuer,
        name: event.params.name,
        isVerified: event.params.isVerified,
      });
    } else {
      const newIssuer = {
        id: issuerId,
        name: event.params.name,
        isVerified: event.params.isVerified,
        registeredAt: new Date(event.block.timestamp * 1000),
        logoURI: undefined,
        websiteURI: undefined,
        totalCredentialsIssued: BigInt(0),
        totalActiveCredentials: BigInt(0),
        authorizedTypes: [],
      };
      context.Issuer.set(newIssuer);
    }
    
    context.log.info(`📝 Issuer registered: ${event.params.name}`);
  } catch (error) {
    context.log.error(`❌ Error processing IssuerRegistered: ${error}`);
  }
});

// Basic handlers for all other CredentialRegistry events
CredentialRegistry.AttributeSet.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    tokenId: event.params.tokenId,
    attributeKey: event.params.attributeKey,
    attributeValue: event.params.attributeValue,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: new Date(event.block.timestamp * 1000),
    logIndex: event.logIndex,
    transactionHash: event.transaction.hash,
    credential_id: `credential_${event.params.tokenId}`,
  };
  context.CredentialRegistry_AttributeSet.set(entity);
});

CredentialRegistry.CredentialStatusChanged.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    tokenId: event.params.tokenId,
    oldStatus: event.params.oldStatus,
    newStatus: event.params.newStatus,
    changedBy: event.params.changedBy.toLowerCase(),
    reason: event.params.reason,
  };
  context.CredentialRegistry_CredentialStatusChanged.set(entity);
});

CredentialRegistry.CredentialTypeAuthorized.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    issuer: event.params.issuer.toLowerCase(),
    credentialType: event.params.credentialType,
    authorized: event.params.authorized,
  };
  context.CredentialRegistry_CredentialTypeAuthorized.set(entity);
});

CredentialRegistry.IssuerVerificationChanged.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    issuer: event.params.issuer.toLowerCase(),
    isVerified: event.params.isVerified,
    changedBy: event.params.changedBy.toLowerCase(),
  };
  context.CredentialRegistry_IssuerVerificationChanged.set(entity);
});

CredentialRegistry.Paused.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    account: event.params.account.toLowerCase(),
  };
  context.CredentialRegistry_Paused.set(entity);
});

CredentialRegistry.RoleAdminChanged.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    role: event.params.role,
    previousAdminRole: event.params.previousAdminRole,
    newAdminRole: event.params.newAdminRole,
  };
  context.CredentialRegistry_RoleAdminChanged.set(entity);
});

CredentialRegistry.RoleGranted.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    role: event.params.role,
    account: event.params.account.toLowerCase(),
    sender: event.params.sender.toLowerCase(),
  };
  context.CredentialRegistry_RoleGranted.set(entity);
});

CredentialRegistry.RoleRevoked.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    role: event.params.role,
    account: event.params.account.toLowerCase(),
    sender: event.params.sender.toLowerCase(),
  };
  context.CredentialRegistry_RoleRevoked.set(entity);
});

CredentialRegistry.Unpaused.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    account: event.params.account.toLowerCase(),
  };
  context.CredentialRegistry_Unpaused.set(entity);
});