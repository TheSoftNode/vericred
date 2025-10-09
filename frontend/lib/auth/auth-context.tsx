"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Address, createPublicClient, http, createWalletClient, custom } from 'viem'
import { createWebAuthnCredential, toWebAuthnAccount } from 'viem/account-abstraction'
import { toMetaMaskSmartAccount, Implementation } from '@metamask/delegation-toolkit'
import { PublicKey, Hex } from 'ox'

// MetaMask Ethereum provider type
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      isMetaMask?: boolean
    }
    PublicKeyCredential?: any
  }
}

// Monad Testnet configuration
const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
    public: { http: ['https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://explorer.testnet.monad.xyz' },
  },
}

export type UserType = 'issuer' | 'holder' | 'verifier' | null
export type AuthMethod = 'metamask' | 'passkey' | 'email' | null

interface AuthState {
  isAuthenticated: boolean
  walletAddress: Address | null
  userType: UserType
  authMethod: AuthMethod
  smartAccountAddress: Address | null
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  connectMetaMask: (userType: UserType) => Promise<void>
  connectPasskey: (userType: UserType) => Promise<void>
  connectEmail: (email: string, userType: UserType) => Promise<void>
  disconnect: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    walletAddress: null,
    userType: null,
    authMethod: null,
    smartAccountAddress: null,
    isLoading: false,
  })

  // Load persisted session on mount
  useEffect(() => {
    const loadSession = () => {
      const session = localStorage.getItem('vericred_session')
      if (session) {
        try {
          const data = JSON.parse(session)
          setState(prev => ({ ...prev, ...data, isLoading: false }))
        } catch (e) {
          console.error('Failed to load session:', e)
        }
      }
    }
    loadSession()
  }, [])

  // Persist session whenever state changes
  useEffect(() => {
    if (state.isAuthenticated) {
      localStorage.setItem('vericred_session', JSON.stringify({
        isAuthenticated: state.isAuthenticated,
        walletAddress: state.walletAddress,
        userType: state.userType,
        authMethod: state.authMethod,
        smartAccountAddress: state.smartAccountAddress,
      }))
    }
  }, [state])

  const connectMetaMask = async (userType: UserType) => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed. Please install MetaMask to continue.')
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as Address[]

      const eoaAddress = accounts[0]

      // Switch to Monad testnet
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x279F' }], // 10143 in hex
        })
      } catch (switchError: any) {
        // Chain doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x279F',
              chainName: 'Monad Testnet',
              nativeCurrency: {
                name: 'MON',
                symbol: 'MON',
                decimals: 18,
              },
              rpcUrls: ['https://testnet-rpc.monad.xyz'],
              blockExplorerUrls: ['https://explorer.testnet.monad.xyz'],
            }],
          })
        } else {
          throw switchError
        }
      }

      // Create public client
      const publicClient = createPublicClient({
        chain: monadTestnet,
        transport: http(),
      })

      // Create wallet client
      const walletClient = createWalletClient({
        account: eoaAddress,
        chain: monadTestnet,
        transport: custom(window.ethereum),
      })

      // Create Hybrid smart account owned by EOA
      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [eoaAddress, [], [], []], // EOA owner, no passkeys
        deploySalt: '0x0000000000000000000000000000000000000000000000000000000000000001',
        signer: { walletClient },
      })

      setState({
        isAuthenticated: true,
        walletAddress: eoaAddress,
        userType,
        authMethod: 'metamask',
        smartAccountAddress: smartAccount.address,
        isLoading: false,
      })
    } catch (error: any) {
      console.error('MetaMask connection failed:', error)
      setState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const connectPasskey = async (userType: UserType) => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error('Passkeys not supported in this browser. Please use Chrome, Safari, or Edge.')
      }

      // Create public client
      const publicClient = createPublicClient({
        chain: monadTestnet,
        transport: http(),
      })

      // Create WebAuthn credential (passkey)
      const credential = await createWebAuthnCredential({
        name: 'VeriCred+ Account',
      })

      // Create WebAuthn account
      const webAuthnAccount = toWebAuthnAccount({ credential })

      // Deserialize compressed public key
      const publicKey = PublicKey.fromHex(credential.publicKey as `0x${string}`)

      // Convert credential ID to hex
      const credentialIdHex = Hex.fromString(credential.id)

      // Create Hybrid smart account with passkey as owner
      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [
          '0x0000000000000000000000000000000000000000',  // No EOA owner for passkey-only accounts
          [credentialIdHex],
          [publicKey.x],
          [publicKey.y]
        ],
        deploySalt: '0x0000000000000000000000000000000000000000000000000000000000000002',
        signer: { webAuthnAccount, keyId: credentialIdHex },
      })

      // Store credential ID for future authentications
      localStorage.setItem('vericred_passkey_credential_id', credential.id)

      setState({
        isAuthenticated: true,
        walletAddress: smartAccount.address,
        userType,
        authMethod: 'passkey',
        smartAccountAddress: smartAccount.address,
        isLoading: false,
      })
    } catch (error: any) {
      console.error('Passkey authentication failed:', error)
      setState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const connectEmail = async (email: string, userType: UserType) => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      // In production, this would:
      // 1. Send magic link to email
      // 2. User clicks link
      // 3. Create embedded wallet via Turnkey or similar
      // 4. Create smart account from embedded wallet

      // For MVP, simulate this with a mock wallet
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Generate mock address for demonstration
      const mockAddress = `0x${Array.from(crypto.getRandomValues(new Uint8Array(20)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')}` as Address

      setState({
        isAuthenticated: true,
        walletAddress: mockAddress,
        userType,
        authMethod: 'email',
        smartAccountAddress: null, // Would be created after email verification
        isLoading: false,
      })
    } catch (error: any) {
      console.error('Email authentication failed:', error)
      setState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const disconnect = () => {
    setState({
      isAuthenticated: false,
      walletAddress: null,
      userType: null,
      authMethod: null,
      smartAccountAddress: null,
      isLoading: false,
    })
    localStorage.removeItem('vericred_session')
    localStorage.removeItem('vericred_passkey_credential_id')
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        connectMetaMask,
        connectPasskey,
        connectEmail,
        disconnect,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
