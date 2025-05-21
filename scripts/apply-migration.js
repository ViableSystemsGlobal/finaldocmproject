#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get Supabase credentials from .env file or environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Check if a specific migration file was provided
const specificMigration = process.argv[2];
let migrationPath;

if (specificMigration) {
  // Use the specified migration file
  migrationPath = path.resolve(specificMigration);
  console.log(`Using specified migration: ${migrationPath}`);
  
  if (!fs.existsSync(migrationPath)) {
    console.error('Specified migration file does not exist:', migrationPath);
    process.exit(1);
  }
} else {
  // Get the latest migration file
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  if (files.length === 0) {
    console.error('No migration files found in', migrationsDir);
    process.exit(1);
  }

  const latestMigration = files[files.length - 1];
  console.log(`Applying latest migration: ${latestMigration}`);
  migrationPath = path.join(migrationsDir, latestMigration);
}

// Read the migration file
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

// Create a temporary file with the credentials and SQL
const tempFile = path.join(__dirname, 'temp_migration.sql');
fs.writeFileSync(tempFile, migrationSql);

// Build the psql command
// This assumes you have the Supabase CLI installed or psql available
console.log('Applying migration to Supabase...');

// Option 1: Use Supabase CLI if available
const command = `supabase db execute --file ${tempFile}`;

// Option 2: Or use psql directly if you have connection string
// const command = `psql "${SUPABASE_URL}" -f ${tempFile}`;

exec(command, (error, stdout, stderr) => {
  // Clean up the temp file
  try {
    fs.unlinkSync(tempFile);
  } catch (e) {
    console.warn('Failed to delete temp file:', e);
  }

  if (error) {
    console.error('Migration failed:', error);
    console.error(stderr);
    process.exit(1);
  }

  console.log('Migration output:');
  console.log(stdout);
  console.log('Migration applied successfully!');
}); 