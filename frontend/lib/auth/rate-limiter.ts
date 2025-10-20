/**
 * Rate Limiter
 * Prevents API abuse by limiting requests per address/IP
 */

import { getDatabase } from '../database/mongodb';

interface RateLimitEntry {
  key: string;
  count: number;
  resetAt: Date;
}

const COLLECTION_NAME = 'rateLimits';

export interface RateLimitConfig {
  maxRequests: number; // Maximum requests allowed
  windowMs: number; // Time window in milliseconds
}

export class RateLimiter {
  /**
   * Check if request is within rate limit
   * Returns true if allowed, false if rate limited
   */
  static async checkLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  }> {
    const db = await getDatabase();
    const collection = db.collection<RateLimitEntry>(COLLECTION_NAME);

    const now = new Date();
    const resetAt = new Date(now.getTime() + config.windowMs);

    // Find or create rate limit entry
    let entry = await collection.findOne({ key });

    if (!entry || entry.resetAt < now) {
      // No entry or expired - create new one
      const newEntry = {
        key,
        count: 1,
        resetAt,
      };

      await collection.updateOne(
        { key },
        { $set: newEntry },
        { upsert: true }
      );

      entry = newEntry as any;

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt,
      };
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    // Increment counter
    await collection.updateOne({ key }, { $inc: { count: 1 } });

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count - 1,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Rate limit by IP address
   */
  static async checkByIP(
    ip: string,
    config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 } // 100 per minute
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    return this.checkLimit(`ip:${ip}`, config);
  }

  /**
   * Rate limit by wallet address
   */
  static async checkByAddress(
    address: string,
    config: RateLimitConfig = { maxRequests: 50, windowMs: 60000 } // 50 per minute
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    return this.checkLimit(`address:${address.toLowerCase()}`, config);
  }

  /**
   * Rate limit for specific endpoint
   */
  static async checkByEndpoint(
    address: string,
    endpoint: string,
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    return this.checkLimit(`endpoint:${address.toLowerCase()}:${endpoint}`, config);
  }

  /**
   * Clear rate limit for key
   */
  static async clearLimit(key: string): Promise<void> {
    const db = await getDatabase();
    const collection = db.collection<RateLimitEntry>(COLLECTION_NAME);

    await collection.deleteOne({ key });
  }

  /**
   * Clean up expired entries
   */
  static async cleanup(): Promise<number> {
    const db = await getDatabase();
    const collection = db.collection<RateLimitEntry>(COLLECTION_NAME);

    const result = await collection.deleteMany({
      resetAt: { $lt: new Date() },
    });

    return result.deletedCount;
  }

  /**
   * Create indexes
   */
  static async createIndexes(): Promise<void> {
    const db = await getDatabase();
    const collection = db.collection<RateLimitEntry>(COLLECTION_NAME);

    await collection.createIndex({ key: 1 }, { unique: true });
    await collection.createIndex({ resetAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

    console.log('✅ RateLimiter indexes created');
  }
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // AI fraud analysis (expensive operation)
  AI_FRAUD_ANALYSIS: {
    maxRequests: 10,
    windowMs: 60000, // 10 per minute
  },

  // Credential issuance
  CREDENTIAL_ISSUE: {
    maxRequests: 20,
    windowMs: 60000, // 20 per minute
  },

  // Credential verification (lightweight)
  CREDENTIAL_VERIFY: {
    maxRequests: 100,
    windowMs: 60000, // 100 per minute
  },

  // General API calls
  GENERAL: {
    maxRequests: 50,
    windowMs: 60000, // 50 per minute
  },
};
