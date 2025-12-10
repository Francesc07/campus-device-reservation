// Integration test setup
// This file runs before integration tests

export {};

// Environment variable validation
const requiredEnvVars = [
  'COSMOS_DB_ENDPOINT',
  'COSMOS_DB_KEY',
  'COSMOS_DB_DATABASE_NAME',
  'COSMOS_DB_CONTAINER_NAME',
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn(`
⚠️  WARNING: Integration tests require the following environment variables:
${missingVars.map(v => `   - ${v}`).join('\n')}

These tests will use mock values. To test against real Azure resources:
1. Copy local.settings.json values to environment
2. Or run: export $(cat local.settings.json | jq -r '.Values | to_entries[] | "\\(.key)=\\(.value)"')
3. Or use Azure Cosmos DB Emulator locally
  `);

  // Set defaults for emulator
  process.env.COSMOS_DB_ENDPOINT = process.env.COSMOS_DB_ENDPOINT || 'https://localhost:8081';
  process.env.COSMOS_DB_KEY = process.env.COSMOS_DB_KEY || 'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==';
  process.env.COSMOS_DB_DATABASE_NAME = process.env.COSMOS_DB_DATABASE_NAME || 'TestDB';
  process.env.COSMOS_DB_CONTAINER_NAME = process.env.COSMOS_DB_CONTAINER_NAME || 'TestReservations';
}

console.log('🧪 Integration test environment initialized');
console.log(`   Database: ${process.env.COSMOS_DB_DATABASE_NAME}`);
console.log(`   Container: ${process.env.COSMOS_DB_CONTAINER_NAME}`);
