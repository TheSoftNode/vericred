/**
 * User Model
 * Stores user profile and preferences
 */

import { ObjectId } from 'mongodb';
import { getDatabase } from '../mongodb';

export type UserType = 'issuer' | 'holder' | 'verifier';

export interface User {
  _id?: ObjectId;
  address: string; // Ethereum address (lowercase)
  userType: UserType;
  email?: string;
  profile: {
    name?: string;
    organizationName?: string;
    website?: string;
    logoURI?: string;
  };
  smartAccountAddress?: string;
  settings: {
    notifications: {
      email: boolean;
      credentialReceived: boolean;
      credentialRevoked: boolean;
      accessRequested: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const COLLECTION_NAME = 'users';

export class UserModel {
  /**
   * Create new user
   */
  static async create(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const db = await getDatabase();
    const collection = db.collection<User>(COLLECTION_NAME);

    const user: User = {
      ...userData,
      address: userData.address.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(user);

    return {
      ...user,
      _id: result.insertedId,
    };
  }

  /**
   * Find user by address
   */
  static async findByAddress(address: string): Promise<User | null> {
    const db = await getDatabase();
    const collection = db.collection<User>(COLLECTION_NAME);

    return await collection.findOne({ address: address.toLowerCase() });
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    address: string,
    updates: Partial<User['profile']>
  ): Promise<User | null> {
    const db = await getDatabase();
    const collection = db.collection<User>(COLLECTION_NAME);

    const result = await collection.findOneAndUpdate(
      { address: address.toLowerCase() },
      {
        $set: {
          profile: updates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    return result || null;
  }

  /**
   * Update settings
   */
  static async updateSettings(
    address: string,
    settings: Partial<User['settings']>
  ): Promise<User | null> {
    const db = await getDatabase();
    const collection = db.collection<User>(COLLECTION_NAME);

    const updateDoc: any = {
      $set: {
        updatedAt: new Date(),
      },
    };

    if (settings) {
      updateDoc.$set.settings = settings;
    }

    const result = await collection.findOneAndUpdate(
      { address: address.toLowerCase() },
      updateDoc,
      { returnDocument: 'after' }
    );

    return result || null;
  }

  /**
   * Set smart account address
   */
  static async setSmartAccountAddress(
    address: string,
    smartAccountAddress: string
  ): Promise<User | null> {
    const db = await getDatabase();
    const collection = db.collection<User>(COLLECTION_NAME);

    const result = await collection.findOneAndUpdate(
      { address: address.toLowerCase() },
      {
        $set: {
          smartAccountAddress: smartAccountAddress.toLowerCase(),
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    return result || null;
  }

  /**
   * Create indexes
   */
  static async createIndexes(): Promise<void> {
    const db = await getDatabase();
    const collection = db.collection<User>(COLLECTION_NAME);

    await collection.createIndex({ address: 1 }, { unique: true });
    await collection.createIndex({ smartAccountAddress: 1 });
    await collection.createIndex({ userType: 1 });
    await collection.createIndex({ createdAt: -1 });

    console.log('✅ User indexes created');
  }
}
