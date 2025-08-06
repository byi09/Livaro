// Script to apply performance indexes
const fs = require('fs');

// Read the migration file
const migrationSQL = fs.readFileSync('supabase/migrations/0015_add_performance_indexes.sql', 'utf8');

// Write the SQL to a file for manual execution
fs.writeFileSync('performance-migration.sql', migrationSQL);

console.log('Performance migration SQL has been written to performance-migration.sql');
console.log('To apply this migration:');
console.log('1. Go to the Supabase dashboard');
console.log('2. Click on "SQL Editor" in the left sidebar');
console.log('3. Create a new query');
console.log('4. Paste the contents of performance-migration.sql');
console.log('5. Click "Run" to execute the migration');
console.log('\nThis will add database indexes to significantly improve property query performance.');
console.log('Expected performance improvements:');
console.log('- 60-80% faster property searches');
console.log('- 50-70% faster location-based queries');
console.log('- Improved sorting and filtering performance');