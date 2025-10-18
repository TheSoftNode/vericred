/**
 * Delegation Model
 * Stores delegation permissions from issuers to backend
 */

import { ObjectId } from 'mongodb';
import type { Delegation as DelegationToolkitType } from '@metamask/delegation-toolkit';
import { getDatabase } from '../mongodb';

export interface Delegation {
  _id?: ObjectId;
  issuerAddress: string; // Issuer's EOA (lowercase)
  smartAccountAddress: string; // Issuer's smart account (lowercase)
  backendAddress: string; // Backend's address (lowercase)
  delegation: DelegationToolkitType; // Signed delegation object from MetaMask toolkit
  maxCalls: number; // Maximum number of credentials this delegation allows
  callsUsed: number; // How many credentials have been minted
  createdAt: Date; // When delegation was created
  expiresAt: Date; // When delegation expires
  isRevoked: boolean; // Whether delegation has been manually revoked
  revokedAt?: Date; // When it was revoked
  revokedReason?: string; // Why it was revoked
  metadata: {
    veriCredSBTAddress: string; // Contract address delegation is for
    caveats: string[]; // List of caveat types applied
  };
}

const COLLECTION_NAME = 'delegations';

export class DelegationModel {
  /**
   * Create new delegation
   */
  static async create(
    delegationData: Omit<Delegation, '_id' | 'callsUsed' | 'isRevoked' | 'createdAt'>
  ): Promise<Delegation> {
    const db = await getDatabase();
    const collection = db.collection<Delegation>(COLLECTION_NAME);

    const delegation: Delegation = {
      ...delegationData,
      issuerAddress: delegationData.issuerAddress.toLowerCase(),
      smartAccountAddress: delegationData.smartAccountAddress.toLowerCase(),
      backendAddress: delegationData.backendAddress.toLowerCase(),
      callsUsed: 0,
      isRevoked: false,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(delegation);

    return {
      ...delegation,
      _id: result.insertedId,
    };
  }

  /**
   * Find active delegation for issuer
   * Returns the most recent non-revoked, non-expired delegation
   */
  static async findActiveByIssuer(issuerAddress: string): Promise<Delegation | null> {
    const db = await getDatabase();
    const collection = db.collection<Delegation>(COLLECTION_NAME);

    return await collection.findOne(
      {
        issuerAddress: issuerAddress.toLowerCase(),
        isRevoked: false,
        expiresAt: { $gt: new Date() },
      },
      { sort: { createdAt: -1 } }
    );
  }

  /**
   * Find delegation by ID
   */
  static async findById(id: string): Promise<Delegation | null> {
    const db = await getDatabase();
    const collection = db.collection<Delegation>(COLLECTION_NAME);

    return await collection.findOne({ _id: new ObjectId(id) });
  }

  /**
   * Increment call counter
   * Returns true if increment was successful, false if limit reached
   */
  static async incrementCallCount(id: string): Promise<boolean> {
    const db = await getDatabase();
    const collection = db.collection<Delegation>(COLLECTION_NAME);

    const delegation = await collection.findOne({ _id: new ObjectId(id) });

    if (!delegation) {
      throw new Error('Delegation not found');
    }

    // Check if still has calls remaining
    if (delegation.callsUsed >= delegation.maxCalls) {
      return false;
    }

    // Increment counter
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $inc: { callsUsed: 1 } }
    );

    return true;
  }

  /**
   * Revoke delegation
   */
  static async revoke(id: string, reason: string): Promise<Delegation | null> {
    const db = await getDatabase();
    const collection = db.collection<Delegation>(COLLECTION_NAME);

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: reason,
        },
      },
      { returnDocument: 'after' }
    );

    return result || null;
  }

  /**
   * Revoke all delegations for issuer
   */
  static async revokeAllForIssuer(issuerAddress: string): Promise<number> {
    const db = await getDatabase();
    const collection = db.collection<Delegation>(COLLECTION_NAME);

    const result = await collection.updateMany(
      {
        issuerAddress: issuerAddress.toLowerCase(),
        isRevoked: false,
      },
      {
        $set: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: 'Revoked by issuer',
        },
      }
    );

    return result.modifiedCount;
  }

  /**
   * Get delegation usage stats
   */
  static async getUsageStats(id: string): Promise<{
    callsUsed: number;
    maxCalls: number;
    callsRemaining: number;
    percentUsed: number;
  } | null> {
    const db = await getDatabase();
    const collection = db.collection<Delegation>(COLLECTION_NAME);

    const delegation = await collection.findOne({ _id: new ObjectId(id) });

    if (!delegation) {
      return null;
    }

    const callsRemaining = delegation.maxCalls - delegation.callsUsed;
    const percentUsed = (delegation.callsUsed / delegation.maxCalls) * 100;

    return {
      callsUsed: delegation.callsUsed,
      maxCalls: delegation.maxCalls,
      callsRemaining,
      percentUsed,
    };
  }

  /**
   * Check if delegation is valid and can be used
   */
  static async isValid(id: string): Promise<{
    valid: boolean;
    reason?: string;
  }> {
    const db = await getDatabase();
    const collection = db.collection<Delegation>(COLLECTION_NAME);

    const delegation = await collection.findOne({ _id: new ObjectId(id) });

    if (!delegation) {
      return { valid: false, reason: 'Delegation not found' };
    }

    if (delegation.isRevoked) {
      return { valid: false, reason: 'Delegation revoked' };
    }

    if (delegation.expiresAt < new Date()) {
      return { valid: false, reason: 'Delegation expired' };
    }

    if (delegation.callsUsed >= delegation.maxCalls) {
      return { valid: false, reason: 'Call limit reached' };
    }

    return { valid: true };
  }

  /**
   * Get all delegations for issuer
   */
  static async getAllForIssuer(issuerAddress: string): Promise<Delegation[]> {
    const db = await getDatabase();
    const collection = db.collection<Delegation>(COLLECTION_NAME);

    return await collection
      .find({ issuerAddress: issuerAddress.toLowerCase() })
      .sort({ createdAt: -1 })
      .toArray();
  }

  /**
   * Create indexes
   */
  static async createIndexes(): Promise<void> {
    const db = await getDatabase();
    const collection = db.collection<Delegation>(COLLECTION_NAME);

    await collection.createIndex({ issuerAddress: 1 });
    await collection.createIndex({ smartAccountAddress: 1 });
    await collection.createIndex({ backendAddress: 1 });
    await collection.createIndex({ isRevoked: 1 });
    await collection.createIndex({ expiresAt: 1 });
    await collection.createIndex({ createdAt: -1 });

    // Compound index for finding active delegations
    await collection.createIndex({
      issuerAddress: 1,
      isRevoked: 1,
      expiresAt: 1,
    });

    console.log('✅ Delegation indexes created');
  }
}
