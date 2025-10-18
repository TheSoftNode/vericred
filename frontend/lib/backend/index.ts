/**
 * Backend Services Export
 */

export {
  getBackendWallet,
  initializeBackendWallet,
  BackendWalletService,
} from './wallet-service';

export {
  getIPFSService,
  initializeIPFSService,
  IPFSService,
  type CredentialMetadata,
} from './ipfs-service';
