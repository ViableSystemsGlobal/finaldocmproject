#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const https = require('https');

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file');
  process.exit(1);
}

async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    // Parse the URL to get hostname and path
    const url = new URL(supabaseUrl);
    const hostname = url.hostname;
    
    const options = {
      hostname: hostname,
      port: 443,
      path: '/rest/v1/rpc/pg_transport',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (e) {
            resolve({ success: true, message: 'SQL executed successfully' });
          }
        } else {
          reject(`HTTP Error: ${res.statusCode} - ${data}`);
        }
      });
    });
    
    req.on('error', (e) => {
      reject(`Problem with request: ${e.message}`);
    });
    
    // The request body
    const postData = JSON.stringify({
      query: sql
    });
    
    req.write(postData);
    req.end();
  });
}

async function runMigration(fileName) {
  try {
    const filePath = path.join(__dirname, '../migrations', fileName);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`Running migration: ${fileName}`);
    
    await executeSql(sql);
    
    console.log(`Migration ${fileName} completed successfully`);
    return true;
  } catch (error) {
    console.error(`Error executing migration ${fileName}:`, error);
    return false;
  }
}

async function main() {
  // Get all SQL files in the migrations directory
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql') && !file.startsWith('README'))
    .sort(); // Sort to ensure migrations run in order
  
  console.log(`Found ${files.length} migration files`);
  
  let success = true;
  
  // Run each migration
  for (const file of files) {
    const result = await runMigration(file);
    if (!result) {
      success = false;
      break;
    }
  }
  
  if (success) {
    console.log('All migrations completed successfully');
  } else {
    console.error('Migration process failed');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
}); 