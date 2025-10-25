// Debug video upload - run this in browser console
// This will help us see exactly where the video upload is failing

async function debugVideoUpload() {
  console.log('🎥 Starting video upload debug...');
  
  // Test 1: Check what happens when we try to insert a video directly
  console.log('\n1. Testing direct database insertion for video...');
  try {
    const testVideoData = {
      url: 'https://test.com/video.mp4',
      type: 'video',
      alt_text: 'Test video'
    };
    
    console.log('Inserting test video data:', testVideoData);
    
    const { data: insertData, error: insertError } = await supabase
      .from('media_library')
      .insert(testVideoData)
      .select()
      .single();
      
    if (insertError) {
      console.error('❌ Database insertion failed:', insertError);
    } else {
      console.log('✅ Database insertion successful:', insertData);
      
      // Clean up test data
      await supabase.from('media_library').delete().eq('id', insertData.id);
      console.log('✅ Test data cleaned up');
    }
  } catch (err) {
    console.error('❌ Database test failed:', err);
  }
  
  // Test 2: Check what file types are detected
  console.log('\n2. Testing file type detection...');
  const testFiles = [
    { name: 'video.mp4', type: 'video/mp4' },
    { name: 'video.webm', type: 'video/webm' },
    { name: 'image.jpg', type: 'image/jpeg' },
    { name: 'doc.pdf', type: 'application/pdf' }
  ];
  
  testFiles.forEach(file => {
    const fileType = file.type.split('/')[0];
    console.log(`File: ${file.name} | MIME: ${file.type} | Detected type: ${fileType}`);
  });
  
  // Test 3: Check what's currently in the media library
  console.log('\n3. Checking current media library contents...');
  try {
    const { data: allMedia, error: fetchError } = await supabase
      .from('media_library')
      .select('*')
      .order('uploaded_at', { ascending: false });
      
    if (fetchError) {
      console.error('❌ Failed to fetch media:', fetchError);
    } else {
      console.log(`✅ Found ${allMedia?.length || 0} total media items:`);
      
      if (allMedia && allMedia.length > 0) {
        const groupedByType = allMedia.reduce((acc, item) => {
          acc[item.type] = (acc[item.type] || 0) + 1;
          return acc;
        }, {});
        
        console.log('Media by type:', groupedByType);
        
        // Show recent uploads
        console.log('\nRecent uploads:');
        allMedia.slice(0, 5).forEach(item => {
          console.log(`- ${item.type}: ${item.url.split('/').pop()} (${item.uploaded_at})`);
        });
      }
    }
  } catch (err) {
    console.error('❌ Media fetch failed:', err);
  }
  
  // Test 4: Check storage bucket contents
  console.log('\n4. Checking storage bucket contents...');
  try {
    const { data: files, error: listError } = await supabase.storage
      .from('uploadmedia')
      .list('', { limit: 10, sortBy: { column: 'created_at', order: 'desc' } });
      
    if (listError) {
      console.error('❌ Failed to list storage files:', listError);
    } else {
      console.log(`✅ Found ${files?.length || 0} files in storage:`);
      files?.forEach(file => {
        console.log(`- ${file.name} (${file.metadata?.size || 'unknown size'})`);
      });
    }
  } catch (err) {
    console.error('❌ Storage list failed:', err);
  }
  
  console.log('\n🏁 Debug complete');
}

// Instructions
console.log('🎥 Video Upload Debug Ready');
console.log('Run: debugVideoUpload()');
console.log('This will test the video upload process step by step.'); 