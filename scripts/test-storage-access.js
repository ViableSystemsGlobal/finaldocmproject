#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials!');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create test clients
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

// Create service role client if available
const serviceClient = serviceRoleKey 
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

console.log('Supabase URL:', supabaseUrl);
console.log('Using anon key:', supabaseAnonKey.substring(0, 5) + '...');
if (serviceClient) {
  console.log('Service role key available');
} else {
  console.log('Service role key not available');
}

// Create a test file
const createTestFile = () => {
  const content = `Test file created at ${new Date().toISOString()}`;
  const filePath = path.join(__dirname, 'test-file.txt');
  fs.writeFileSync(filePath, content);
  console.log('Created test file:', filePath);
  return { path: filePath, content };
};

const runTests = async () => {
  console.log('\n==== STORAGE ACCESS TESTS ====\n');

  // 1. List buckets
  try {
    console.log('1. Listing buckets with anon client...');
    const { data: buckets, error } = await anonClient.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
    } else {
      console.log(`Found ${buckets.length} buckets:`, buckets.map(b => b.name).join(', '));
      
      // Check if profile-images exists
      const profileBucket = buckets.find(b => b.name === 'profile-images');
      if (profileBucket) {
        console.log('✅ profile-images bucket exists');
        console.log('Public:', profileBucket.public);
        console.log('Owner:', profileBucket.owner);
      } else {
        console.log('❌ profile-images bucket does not exist!');
      }
    }
  } catch (err) {
    console.error('Error checking buckets:', err);
  }

  // 2. Try to create profile-images bucket if it doesn't exist
  try {
    console.log('\n2. Ensuring profile-images bucket exists...');
    const { data: existingBuckets } = await anonClient.storage.listBuckets();
    const profileBucket = existingBuckets?.find(b => b.name === 'profile-images');
    
    if (!profileBucket) {
      console.log('Attempting to create profile-images bucket...');
      const { data, error } = await anonClient.storage.createBucket('profile-images', {
        public: true
      });
      
      if (error) {
        console.error('❌ Failed to create bucket with anon client:', error);
        
        if (serviceClient) {
          console.log('Trying with service role client...');
          const { data: svcData, error: svcError } = await serviceClient.storage.createBucket('profile-images', {
            public: true
          });
          
          if (svcError) {
            console.error('❌ Also failed with service role client:', svcError);
          } else {
            console.log('✅ Created bucket with service role client');
          }
        }
      } else {
        console.log('✅ Created bucket with anon client');
      }
    } else {
      console.log('✅ Bucket already exists');
    }
  } catch (err) {
    console.error('Error creating bucket:', err);
  }

  // 3. Try to upload a file with anon client
  const { path: testFilePath } = createTestFile();
  try {
    console.log('\n3. Uploading a test file with anon client...');
    const fileName = 'test-upload-' + Date.now() + '.txt';
    
    const { data, error } = await anonClient.storage
      .from('profile-images')
      .upload(fileName, fs.readFileSync(testFilePath), {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('❌ Upload failed with anon client:', error);
      
      if (serviceClient) {
        console.log('Trying with service role client...');
        const { data: svcData, error: svcError } = await serviceClient.storage
          .from('profile-images')
          .upload(fileName, fs.readFileSync(testFilePath), {
            contentType: 'text/plain',
            cacheControl: '3600',
            upsert: true
          });
          
        if (svcError) {
          console.error('❌ Also failed with service role client:', svcError);
        } else {
          console.log('✅ Uploaded file with service role client:', svcData);
          
          // Get public URL
          const { data: urlData } = serviceClient.storage
            .from('profile-images')
            .getPublicUrl(fileName);
            
          console.log('Public URL:', urlData.publicUrl);
        }
      }
    } else {
      console.log('✅ Uploaded file with anon client:', data);
      
      // Get public URL
      const { data: urlData } = anonClient.storage
        .from('profile-images')
        .getPublicUrl(fileName);
        
      console.log('Public URL:', urlData.publicUrl);
      
      // List files
      const { data: files, error: listError } = await anonClient.storage
        .from('profile-images')
        .list();
        
      if (listError) {
        console.error('Error listing files:', listError);
      } else {
        console.log(`Found ${files.length} files in the bucket`);
      }
    }
  } catch (err) {
    console.error('Error uploading file:', err);
  }

  // Clean up
  try {
    fs.unlinkSync(testFilePath);
    console.log('\nCleaned up test file');
  } catch (e) {
    console.warn('Failed to clean up test file:', e);
  }
  
  console.log('\nTests completed');
};

runTests(); 