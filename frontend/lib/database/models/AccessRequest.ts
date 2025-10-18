/**
 * Access Request Model
 * Stores credential access requests from verifiers to holders
 */

import { ObjectId } from 'mongodb';
import { getDatabase } from '../mongodb';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface AccessRequest {
  _id?: ObjectId;
  verifierAddress: string; // Verifier's address (lowercase)
  holderAddress: string; // Holder's address (lowercase)
  credentialTypes: string[]; // Types of credentials requested
  purpose: string; // Why verifier needs access
  status: RequestStatus;
  requestedAt: Date;
  respondedAt?: Date;
  expiresAt?: Date; // For approved requests, when access expires
  credentialIds?: string[]; // Token IDs of credentials shared
  metadata: {
    verifierName?: string;
    verifierOrganization?: string;
    verifierEmail?: string;
  };
}

const COLLECTION_NAME = 'accessRequests';

export class AccessRequestModel {
  /**
   * Create new access request
   */
  static async create(
    requestData: Omit<AccessRequest, '_id' | 'status' | 'requestedAt'>
  ): Promise<AccessRequest> {
    const db = await getDatabase();
    const collection = db.collection<AccessRequest>(COLLECTION_NAME);

    const request: AccessRequest = {
      ...requestData,
      verifierAddress: requestData.verifierAddress.toLowerCase(),
      holderAddress: requestData.holderAddress.toLowerCase(),
      status: 'pending',
      requestedAt: new Date(),
    };

    const result = await collection.insertOne(request);

    return {
      ...request,
      _id: result.insertedId,
    };
  }

  /**
   * Find request by ID
   */
  static async findById(id: string): Promise<AccessRequest | null> {
    const db = await getDatabase();
    const collection = db.collection<AccessRequest>(COLLECTION_NAME);

    return await collection.findOne({ _id: new ObjectId(id) });
  }

  /**
   * Get all requests for holder
   */
  static async getForHolder(
    holderAddress: string,
    status?: RequestStatus
  ): Promise<AccessRequest[]> {
    const db = await getDatabase();
    const collection = db.collection<AccessRequest>(COLLECTION_NAME);

    const filter: any = {
      holderAddress: holderAddress.toLowerCase(),
    };

    if (status) {
      filter.status = status;
    }

    return await collection
      .find(filter)
      .sort({ requestedAt: -1 })
      .toArray();
  }

  /**
   * Get all requests from verifier
   */
  static async getForVerifier(
    verifierAddress: string,
    status?: RequestStatus
  ): Promise<AccessRequest[]> {
    const db = await getDatabase();
    const collection = db.collection<AccessRequest>(COLLECTION_NAME);

    const filter: any = {
      verifierAddress: verifierAddress.toLowerCase(),
    };

    if (status) {
      filter.status = status;
    }

    return await collection
      .find(filter)
      .sort({ requestedAt: -1 })
      .toArray();
  }

  /**
   * Approve request
   */
  static async approve(
    id: string,
    credentialIds: string[],
    expiresAt: Date
  ): Promise<AccessRequest | null> {
    const db = await getDatabase();
    const collection = db.collection<AccessRequest>(COLLECTION_NAME);

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), status: 'pending' },
      {
        $set: {
          status: 'approved',
          respondedAt: new Date(),
          expiresAt,
          credentialIds,
        },
      },
      { returnDocument: 'after' }
    );

    return result || null;
  }

  /**
   * Reject request
   */
  static async reject(id: string): Promise<AccessRequest | null> {
    const db = await getDatabase();
    const collection = db.collection<AccessRequest>(COLLECTION_NAME);

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), status: 'pending' },
      {
        $set: {
          status: 'rejected',
          respondedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    return result || null;
  }

  /**
   * Revoke approved access
   */
  static async revokeAccess(id: string): Promise<AccessRequest | null> {
    const db = await getDatabase();
    const collection = db.collection<AccessRequest>(COLLECTION_NAME);

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), status: 'approved' },
      {
        $set: {
          status: 'rejected',
          expiresAt: new Date(), // Set to now to expire immediately
        },
      },
      { returnDocument: 'after' }
    );

    return result || null;
  }

  /**
   * Check if access is still valid
   */
  static async isAccessValid(id: string): Promise<boolean> {
    const db = await getDatabase();
    const collection = db.collection<AccessRequest>(COLLECTION_NAME);

    const request = await collection.findOne({
      _id: new ObjectId(id),
      status: 'approved',
    });

    if (!request || !request.expiresAt) {
      return false;
    }

    return request.expiresAt > new Date();
  }

  /**
   * Expire old requests
   * Run this periodically to clean up
   */
  static async expireOldRequests(): Promise<number> {
    const db = await getDatabase();
    const collection = db.collection<AccessRequest>(COLLECTION_NAME);

    const result = await collection.updateMany(
      {
        status: 'approved',
        expiresAt: { $lt: new Date() },
      },
      {
        $set: {
          status: 'expired',
        },
      }
    );

    return result.modifiedCount;
  }

  /**
   * Get pending requests count for holder
   */
  static async getPendingCount(holderAddress: string): Promise<number> {
    const db = await getDatabase();
    const collection = db.collection<AccessRequest>(COLLECTION_NAME);

    return await collection.countDocuments({
      holderAddress: holderAddress.toLowerCase(),
      status: 'pending',
    });
  }

  /**
   * Create indexes
   */
  static async createIndexes(): Promise<void> {
    const db = await getDatabase();
    const collection = db.collection<AccessRequest>(COLLECTION_NAME);

    await collection.createIndex({ verifierAddress: 1 });
    await collection.createIndex({ holderAddress: 1 });
    await collection.createIndex({ status: 1 });
    await collection.createIndex({ requestedAt: -1 });
    await collection.createIndex({ expiresAt: 1 });

    // Compound indexes for common queries
    await collection.createIndex({
      holderAddress: 1,
      status: 1,
      requestedAt: -1,
    });

    await collection.createIndex({
      verifierAddress: 1,
      status: 1,
      requestedAt: -1,
    });

    console.log('✅ AccessRequest indexes created');
  }
}
