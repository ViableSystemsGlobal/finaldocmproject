import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface MediaItem {
  id: string;
  url: string;
  type: string;
  alt_text: string | null;
  uploaded_at: string;
  collection_name?: string | null;
  collection_category?: string | null;
  collection_date?: string | null;
  description?: string | null;
}

interface CollectionData {
  collectionName?: string;
  collectionCategory?: string;
  collectionDate?: string;
  description?: string;
}

// Fetch all media items via API endpoint
export async function fetchMedia() {
  try {
    const response = await fetch('/api/media-fetch');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return { data: result.data, error: result.error || null };
  } catch (error) {
    console.error('fetchMedia error:', error);
    return { data: null, error };
  }
}

// Fetch a single media item
export async function fetchMediaItem(id: string) {
  return supabase
    .from('media_library')
    .select('*')
    .eq('id', id)
    .single();
}

// Update media metadata
export async function updateMediaItem(id: string, data: Pick<MediaItem, 'alt_text'>) {
  return supabase
    .from('media_library')
    .update(data)
    .eq('id', id);
}

// Delete media item
export async function deleteMedia(id: string) {
  // First get the URL to delete from storage
  const { data: mediaItem, error: fetchError } = await fetchMediaItem(id);
  
  if (fetchError || !mediaItem) {
    return { error: fetchError || new Error('Media item not found'), data: null };
  }
  
  // Extract the path from the URL
  const urlParts = mediaItem.url.split('/');
  const filePath = urlParts[urlParts.length - 1];
  
  // Delete from storage
  const { error: storageError } = await supabase
    .storage
    .from('uploadmedia')
    .remove([filePath]);
    
  if (storageError) {
    return { error: storageError, data: null };
  }
  
  // Delete from database
  return supabase
    .from('media_library')
    .delete()
    .eq('id', id);
}

// Upload media file
export async function uploadmedia(file: File, altText: string = '', collectionData?: CollectionData) {
  try {
    // Check auth status first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('No active session found');
      return { data: null, error: new Error('Authentication required') };
    }
    
    console.log('Authenticated as:', session.user.email);
    
    // Try client-side upload first
    try {
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('uploadmedia')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) {
        console.error('Client-side storage upload error:', uploadError);
        throw uploadError;
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('uploadmedia')
        .getPublicUrl(fileName);
        
      // Determine file type
      const fileType = file.type.split('/')[0]; // 'image', 'video', 'application', etc.
      console.log('🎯 File type detection:', {
        originalMimeType: file.type,
        detectedType: fileType,
        fileName: file.name
      });
      
      // Insert into media_library
      console.log('💾 Attempting database insertion...');
      const insertData = {
        url: publicUrl,
        type: fileType,
        alt_text: altText,
        collection_name: collectionData?.collectionName || null,
        collection_category: collectionData?.collectionCategory || null,
        collection_date: collectionData?.collectionDate || null,
        description: collectionData?.description || null
      };
      console.log('💾 Data to insert:', insertData);
      
      const { data, error } = await supabase
        .from('media_library')
        .insert(insertData)
        .select()
        .single();
        
      if (error) {
        console.error('❌ Database insertion error:', error);
        throw error;
      }
      
      console.log('✅ Database insertion successful:', data);
      return { data, error: null };
      
    } catch (clientError) {
      console.log('Client-side upload failed, trying server-side upload...', clientError);
      
      // Fallback to server-side upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('altText', altText);
      
      // Add collection data to form
      if (collectionData?.collectionName) {
        formData.append('collectionName', collectionData.collectionName);
      }
      if (collectionData?.collectionCategory) {
        formData.append('collectionCategory', collectionData.collectionCategory);
      }
      if (collectionData?.collectionDate) {
        formData.append('collectionDate', collectionData.collectionDate);
      }
      if (collectionData?.description) {
        formData.append('description', collectionData.description);
      }
      
      const response = await fetch('/api/upload-media', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Server-side upload failed');
      }
      
      return { data: result.data, error: null };
    }
    
  } catch (error) {
    console.error('Error uploading media:', error);
    return { data: null, error };
  }
}

// Search media items
export async function searchMedia(query: string) {
  return supabase
    .from('media_library')
    .select('*')
    .or(`alt_text.ilike.%${query}%,url.ilike.%${query}%`)
    .order('uploaded_at', { ascending: false });
}

// Get media by type
export async function getMediaByType(type: string) {
  return supabase
    .from('media_library')
    .select('*')
    .eq('type', type)
    .order('uploaded_at', { ascending: false });
} 