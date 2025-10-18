/**
 * Database Initialization
 * Run this to create all indexes and verify connection
 */

import { testDatabaseConnection } from './mongodb';
import { UserModel } from './models/User';
import { DelegationModel } from './models/Delegation';
import { AccessRequestModel } from './models/AccessRequest';

export async function initializeDatabase(): Promise<void> {
  console.log('🔄 Initializing database...');

  // Test connection
  const connected = await testDatabaseConnection();

  if (!connected) {
    throw new Error('Failed to connect to database');
  }

  // Create all indexes
  await Promise.all([
    UserModel.createIndexes(),
    DelegationModel.createIndexes(),
    AccessRequestModel.createIndexes(),
  ]);

  console.log('✅ Database initialized successfully');
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to initialize database:', error);
      process.exit(1);
    });
}
