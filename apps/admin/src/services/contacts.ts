import { supabase } from '@/lib/supabase'
import type { Contact } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { handleContactCreationError, handleContactUpdateError, handleContactDeletionError } from '@/lib/errorHandling'

// Get these from the environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'set' : 'missing',
    key: supabaseAnonKey ? 'set' : 'missing'
  });
} else {
  console.log('Supabase environment variables are configured');
  // Log partial key for debugging (first 5 chars only)
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key (first 5 chars):', supabaseAnonKey.substring(0, 5) + '...');
}

export async function fetchContacts() {
  return supabase
    .from('contacts')
    .select('*');
}

export async function fetchContact(id: string) {
  return supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single();
}

export async function createContact(data: Partial<Contact>): Promise<void> {
  try {
    // Add a default tenant_id if not provided
    const contactData = {
      ...data,
      tenant_id: data.tenant_id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // Default UUID for now
    }
    
    console.log('Attempting to create contact with data:', JSON.stringify(contactData, null, 2));
    
    // Use public schema (default)
    const { error, data: result } = await supabase
      .from('contacts')
      .insert(contactData);
    
    if (error) {
      console.error('Error creating contact:', error);
      throw handleContactCreationError(error);
    }
    
    console.log('Contact created successfully:', result);
  } catch (err) {
    console.error('Error in createContact:', err);
    throw err;
  }
}

export async function updateContact(data: Partial<Contact>): Promise<void> {
  if (!data.id) throw new Error('Contact ID is required')
  const { error } = await supabase
    .from('contacts')
    .update(data)
    .eq('id', data.id);
  
  if (error) throw handleContactUpdateError(error);
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id);
  
  if (error) throw handleContactDeletionError(error);
}

/**
 * Export contacts to an Excel file
 */
/**
 * Download a template Excel file for importing contacts
 */
export function downloadContactsTemplate(): void {
  // Create template data with example row
  const templateData = [
    {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      lifecycle: 'soul',
      date_of_birth: '1990-01-15',
      location: 'Denver, CO',
      occupation: 'Software Engineer'
    }
  ];
  
  // Create a worksheet
  const worksheet = XLSX.utils.json_to_sheet(templateData);
  
  // Add column widths for better readability
  worksheet['!cols'] = [
    { wch: 15 }, // first_name
    { wch: 15 }, // last_name
    { wch: 30 }, // email
    { wch: 15 }, // phone
    { wch: 12 }, // lifecycle
    { wch: 15 }, // date_of_birth
    { wch: 20 }, // location
    { wch: 20 }  // occupation
  ];
  
  // Create a workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts Template');
  
  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `contacts_import_template.xlsx`;
  link.click();
  
  // Clean up
  URL.revokeObjectURL(url);
}

export async function exportContacts(): Promise<void> {
  try {
    // Fetch all contacts
    const { data, error } = await supabase
      .from('contacts')
      .select('*');
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      throw new Error('No contacts to export');
    }
    
    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Create a workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contacts_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    
    // Clean up
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export contacts:', err);
    throw err;
  }
}

/**
 * Import contacts from an Excel file with duplicate detection
 */
export async function importContacts(file: File): Promise<{
  imported: number;
  duplicates: string[];
  duplicatesFound: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        if (!e.target?.result) {
          throw new Error('Failed to read file');
        }
        
        // Parse Excel file
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first worksheet
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convert to JSON
        const contacts = XLSX.utils.sheet_to_json(worksheet);
        
        if (contacts.length === 0) {
          throw new Error('No contacts found in file');
        }
        
        const tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Default UUID
        
        // Validate and prepare contacts with all current form fields
        const validContacts = contacts.map((contact: any) => ({
          first_name: contact.first_name || contact.firstName || '',
          last_name: contact.last_name || contact.lastName || '',
          email: contact.email || '',
          phone: contact.phone || '',
          lifecycle: contact.lifecycle || 'soul', // Default to 'soul' to match form
          date_of_birth: contact.date_of_birth || contact.dateOfBirth || contact.dob || null,
          location: contact.location || contact.city || contact.address || null,
          occupation: contact.occupation || contact.job || contact.profession || null,
          tenant_id
        }));

        // Check for existing contacts to detect duplicates
        const { data: existingContacts, error: fetchError } = await supabase
          .from('contacts')
          .select('email, phone, first_name, last_name');

        if (fetchError) {
          throw new Error(`Failed to check existing contacts: ${fetchError.message}`);
        }

        // Create sets for efficient lookup
        const existingEmails = new Set(existingContacts?.map(c => c.email?.toLowerCase()).filter(Boolean) || []);
        const existingPhones = new Set(existingContacts?.map(c => c.phone).filter(Boolean) || []);

        // Separate new contacts from duplicates
        const newContacts: typeof validContacts = [];
        const duplicates: string[] = [];

        for (const contact of validContacts) {
          const email = contact.email?.toLowerCase();
          const phone = contact.phone;
          
          let isDuplicate = false;
          let duplicateReason = '';

          // Check for email duplicates
          if (email && existingEmails.has(email)) {
            isDuplicate = true;
            duplicateReason = `email: ${email}`;
          }
          // Check for phone duplicates (only if no email duplicate found)
          else if (phone && existingPhones.has(phone)) {
            isDuplicate = true;
            duplicateReason = `phone: ${phone}`;
          }

          if (isDuplicate) {
            const name = `${contact.first_name} ${contact.last_name}`.trim() || 'Unknown';
            duplicates.push(`${name} (${duplicateReason})`);
          } else {
            newContacts.push(contact);
            // Add to existing sets to prevent duplicates within the import file itself
            if (email) existingEmails.add(email);
            if (phone) existingPhones.add(phone);
          }
        }
        
        // Insert only new contacts
        let importedCount = 0;
        if (newContacts.length > 0) {
          const { error: insertError } = await supabase
            .from('contacts')
            .insert(newContacts);
          
          if (insertError) {
            throw new Error(`Failed to import contacts: ${insertError.message}`);
          }
          importedCount = newContacts.length;
        }
        
        resolve({
          imported: importedCount,
          duplicates: duplicates,
          duplicatesFound: duplicates.length
        });
      } catch (err) {
        console.error('Error importing contacts:', err);
        reject(err);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Upload a profile image to Supabase Storage
 */
export async function uploadContactImage(contactId: string, file: File): Promise<string> {
  try {
    console.log('=== Starting image upload process ===');
    console.log('Contact ID:', contactId);
    console.log('File type:', file.type, 'size:', Math.round(file.size / 1024), 'KB');
    
    // Create a unique filename with timestamp and random string
    const fileExt = file.name.split('.').pop();
    const randomId = Math.random().toString(36).substring(2, 10);
    
    // Create a path that includes 'authenticated/' prefix to work around "must be owner" errors
    // Supabase RLS treats files in authenticated/ path as owned by the authenticated user
    const fileName = `authenticated/${contactId}-${Date.now()}-${randomId}.${fileExt}`;
    
    console.log('Uploading file to path:', fileName);
    console.log('Checking supabase client:', !!supabase);
    console.log('Checking supabase storage:', !!supabase.storage);
    
    // First check if the bucket exists - just to be sure
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      console.log('Available buckets:', buckets?.map(b => b.name).join(', '));
      
      const profileBucket = buckets?.find(b => b.name === 'profile-images');
      if (!profileBucket) {
        console.log('profile-images bucket not found - will use server-side upload instead');
        // Skip bucket creation and go straight to server-side upload
        return await uploadViaServer(file, contactId, fileName);
      } else {
        console.log('profile-images bucket exists, proceeding with client-side upload');
      }
    } catch (bucketError) {
      console.error('Error checking buckets:', bucketError);
      // Continue anyway - we'll try the upload and fall back if needed
    }
    
    // Try to upload directly
    console.log('Attempting upload now...');
    let uploadError = null;
    let uploadData = null;
    
    // First try with the authenticated/ prefix path
    try {
      const result = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // Overwrite if exists
        });
      
      uploadError = result.error;
      uploadData = result.data;
    } catch (err) {
      console.error('Error in first upload attempt:', err);
      uploadError = err;
    }
    
    // If first attempt failed with ownership error, try direct server upload
    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      
      // Create a properly typed error variable
      const errorMessage = uploadError instanceof Error 
        ? uploadError.message 
        : typeof uploadError === 'object' && uploadError !== null && 'message' in uploadError
          ? String(uploadError.message)
          : 'Unknown error';
      
      // Handle RLS issues specifically
      if (errorMessage.includes('row level security') || 
          errorMessage.includes('permission denied') ||
          errorMessage.includes('must be owner')) {
        console.log('RLS error detected, using server fallback approach...');
        return await uploadViaServer(file, contactId, fileName);
      }
      
      throw new Error(`Failed to upload image: ${errorMessage}`);
    }
    
    console.log('File uploaded successfully:', uploadData);
    
    // Get the public URL
    console.log('Getting public URL...');
    const { data } = supabase.storage
      .from('profile-images')
      .getPublicUrl(fileName);
    
    if (!data || !data.publicUrl) {
      console.error('Failed to get public URL, data:', data);
      throw new Error('Failed to get public URL');
    }
    
    const publicUrl = data.publicUrl;
    console.log('Image uploaded successfully, public URL:', publicUrl);
    
    // Update the contact with the image URL
    await updateContactImage(contactId, publicUrl);
    
    return publicUrl;
  } catch (err) {
    console.error('Error in uploadContactImage:', err);
    throw err;
  }
}

/**
 * Helper function for server-side upload
 */
async function uploadViaServer(file: File, contactId: string, fileName: string): Promise<string> {
  console.log('Using server-side upload via API route...');
  
  // Create form data for the file
  const formData = new FormData();
  formData.append('file', file);
  formData.append('contactId', contactId);
  formData.append('fileName', fileName);
  
  const response = await fetch('/api/upload-image', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Server upload failed: ${errorData.error || response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.url) {
    throw new Error('Server upload succeeded but no URL was returned');
  }
  
  console.log('Server upload successful, URL:', data.url);
  
  // Update the contact with the image URL
  await updateContactImage(contactId, data.url);
  
  return data.url;
}

/**
 * Helper function to update a contact's profile image URL
 */
async function updateContactImage(contactId: string, imageUrl: string): Promise<void> {
  console.log('Updating contact record with new image URL...');
  const { error: updateError } = await supabase
    .from('contacts')
    .update({ profile_image: imageUrl })
    .eq('id', contactId);
  
  if (updateError) {
    console.error('Error updating contact profile image:', updateError);
    throw new Error(`Failed to update contact with image URL: ${updateError.message}`);
  }
  
  console.log('Contact updated successfully with new image URL');
}

/**
 * Test function to check if the bucket exists and is accessible
 */
export async function testStorageBucket(): Promise<boolean> {
  try {
    // Check if the bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('Error listing buckets:', bucketError);
      return false;
    }
    
    const profileBucket = buckets?.find(b => b.name === 'profile-images');
    if (!profileBucket) {
      console.log('Profile images bucket does not exist');
      return false;
    }
    
    console.log('Profile images bucket exists');
    
    // Try to list files in the bucket
    const { data: files, error: fileError } = await supabase.storage
      .from('profile-images')
      .list();
    
    if (fileError) {
      console.error('Error listing files in bucket:', fileError);
      return false;
    }
    
    console.log('Files in bucket:', files);
    return true;
  } catch (err) {
    console.error('Error testing bucket access:', err);
    return false;
  }
}

/**
 * Direct test to upload a simple text file to the bucket
 */
export async function testDirectUpload(): Promise<string> {
  try {
    console.log('Starting direct test upload...');
    
    // Check if the bucket exists, create it if not
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }
    
    console.log('Available buckets:', buckets?.map(b => b.name).join(', ') || 'None');
    
    const profileBucket = buckets?.find(b => b.name === 'profile-images');
    if (!profileBucket) {
      console.log('Creating profile-images bucket...');
      const { error: createError } = await supabase.storage.createBucket('profile-images', {
        public: true,
      });
      
      if (createError) {
        console.error('Failed to create bucket:', createError);
        throw new Error(`Failed to create bucket: ${createError.message}`);
      }
      console.log('Bucket created successfully');
    } else {
      console.log('Bucket already exists');
    }
    
    // Create a simple text file in memory
    const content = 'This is a test file ' + new Date().toISOString();
    const blob = new Blob([content], { type: 'text/plain' });
    const testFile = new File([blob], 'test.txt', { type: 'text/plain' });
    
    // Upload the test file
    console.log('Uploading test file...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload('test.txt', testFile, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      console.error('Failed to upload test file:', uploadError);
      throw new Error(`Failed to upload test file: ${uploadError.message}`);
    }
    
    console.log('Test file uploaded successfully:', uploadData);
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('profile-images')
      .getPublicUrl('test.txt');
    
    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to get public URL for test file');
    }
    
    console.log('Test file public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (err) {
    console.error('Test upload failed:', err);
    throw err;
  }
}

// Get contacts for leader selection
export function getContactsForLeaderSelection(searchQuery?: string) {
  const query = supabase
    .from('contacts')
    .select('id, first_name, last_name, email')
    .order('first_name', { ascending: true })
    .limit(10);
    
  if (searchQuery) {
    const searchTerm = searchQuery.toLowerCase();
    query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
  }
  
  return query;
}

/**
 * Simple fallback function to check basic contact dependencies
 * This doesn't require a custom SQL function
 */
export async function checkBasicContactDependencies(contactId: string): Promise<{
  canDelete: boolean;
  dependencies: Array<{
    category: string;
    count: number;
    details: string;
  }>;
}> {
  const dependencies = [];

  try {
    // Check group memberships
    const { data: groupMemberships, error: groupError } = await supabase
      .from('group_memberships')
      .select('group_id, role, groups:group_id(name, type)')
      .eq('contact_id', contactId);

    if (!groupError && groupMemberships && groupMemberships.length > 0) {
      const groupNames = groupMemberships.map(gm => {
        const group = gm.groups as any; // Type assertion for the relation
        return `${group?.name || 'Unknown Group'} (${gm.role || 'Member'})`;
      }).join(', ');
      
      dependencies.push({
        category: 'Group Memberships',
        count: groupMemberships.length,
        details: groupNames
      });
    }

    // Check if contact is a member
    const { data: memberRecord, error: memberError } = await supabase
      .from('members')
      .select('contact_id')
      .eq('contact_id', contactId);

    if (!memberError && memberRecord && memberRecord.length > 0) {
      dependencies.push({
        category: 'Member Status',
        count: 1,
        details: 'Active member record'
      });
    }

    // Check if contact leads any groups
    const { data: ledGroups, error: leaderError } = await supabase
      .from('groups')
      .select('id, name, type')
      .eq('leader_id', contactId);

    if (!leaderError && ledGroups && ledGroups.length > 0) {
      const groupNames = ledGroups.map(g => `${g.name} (${g.type})`).join(', ');
      dependencies.push({
        category: 'Groups Led',
        count: ledGroups.length,
        details: groupNames
      });
    }

    return {
      canDelete: dependencies.length === 0,
      dependencies
    };
  } catch (error) {
    console.error('Error in basic dependency check:', error);
    return {
      canDelete: false,
      dependencies: [{
        category: 'Error',
        count: 1,
        details: 'Unable to check dependencies due to an error'
      }]
    };
  }
} 