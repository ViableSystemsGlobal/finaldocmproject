// Test upload debug script - run this in your browser console
// This will help identify where the OpaqueResponseBlocking error is coming from

async function testUploadDebug() {
  console.log('🔍 Starting upload debug test...');
  
  // Test 1: Check authentication
  console.log('\n1. Testing authentication...');
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('✅ Authenticated as:', session.user.email);
    } else {
      console.log('❌ Not authenticated');
      return;
    }
  } catch (err) {
    console.error('❌ Auth check failed:', err);
    return;
  }
  
  // Test 2: Check if bucket exists
  console.log('\n2. Testing storage bucket access...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('❌ Bucket list error:', error);
    } else {
      console.log('✅ Available buckets:', buckets?.map(b => b.name).join(', '));
      const uploadBucket = buckets?.find(b => b.name === 'uploadmedia');
      if (uploadBucket) {
        console.log('✅ uploadmedia bucket exists, public:', uploadBucket.public);
      } else {
        console.log('❌ uploadmedia bucket not found');
      }
    }
  } catch (err) {
    console.error('❌ Bucket check failed:', err);
  }
  
  // Test 3: Test direct upload with a small text file
  console.log('\n3. Testing direct file upload...');
  try {
    // Create a small test file
    const testContent = 'Test upload at ' + new Date().toISOString();
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
    
    console.log('📤 Uploading test file...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploadmedia')
      .upload(`test-${Date.now()}.txt`, testFile, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError);
      
      // Test fallback to server-side upload
      console.log('\n4. Testing server-side upload fallback...');
      const formData = new FormData();
      formData.append('file', testFile);
      formData.append('altText', 'Test upload');
      
      const response = await fetch('/api/upload-media', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      if (response.ok) {
        console.log('✅ Server-side upload successful:', result);
      } else {
        console.error('❌ Server-side upload failed:', result);
      }
    } else {
      console.log('✅ Direct upload successful:', uploadData);
      
      // Test getting public URL
      const { data: urlData } = supabase.storage
        .from('uploadmedia')
        .getPublicUrl(uploadData.path);
      
      console.log('✅ Public URL:', urlData.publicUrl);
      
      // Test if URL is accessible (this might trigger OpaqueResponseBlocking)
      console.log('\n4. Testing URL accessibility...');
      try {
        const urlResponse = await fetch(urlData.publicUrl, { 
          method: 'HEAD',
          mode: 'no-cors' // This prevents CORS errors but limits response info
        });
        console.log('✅ URL is accessible');
      } catch (urlError) {
        console.error('❌ URL access error (this might be the OpaqueResponseBlocking):', urlError);
      }
    }
  } catch (err) {
    console.error('❌ Upload test failed:', err);
  }
  
  console.log('\n🏁 Debug test complete');
}

// Instructions
console.log('📋 Upload Debug Test Ready');
console.log('Run: testUploadDebug()');
console.log('This will test each step of the upload process to identify the issue.'); 