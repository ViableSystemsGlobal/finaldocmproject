'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CalendarIcon, Camera, Upload, Check, X, Users, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'

// Mock format function
const format = (date: Date, format: string) => {
  return date.toLocaleDateString()
}

// Utility function from utils.ts
const cn = (...classes: any[]) => {
  return classes.filter(Boolean).join(' ')
}

import { createMember, getContactsNotMembers } from '@/services/members'
import { uploadContactImage, testStorageBucket, testDirectUpload } from '@/services/contacts'

type Contact = {
  id: string
  first_name: string
  last_name: string
  email: string
  profile_image?: string
}

export default function NewMemberPage() {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Change single contactId to array for multi-select
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([])
  const [joinedDate, setJoinedDate] = useState<Date | undefined>(new Date())
  const [notes, setNotes] = useState('')
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [testingStorage, setTestingStorage] = useState(false)
  const [testUrl, setTestUrl] = useState<string | null>(null)
  const [serverTestResults, setServerTestResults] = useState<any>(null)
  const [testingServerStorage, setTestingServerStorage] = useState(false)
  const [adminCheckResults, setAdminCheckResults] = useState<any>(null)
  const [checkingAdmin, setCheckingAdmin] = useState(false)
  const [directTesting, setDirectTesting] = useState(false)
  
  // Add new state for contact search/filtering
  const [searchQuery, setSearchQuery] = useState('')
  const [groupedContacts, setGroupedContacts] = useState<{[key: string]: Contact[]}>({})

  useEffect(() => {
    const loadData = async () => {
      try {
        // Test bucket access
        const bucketExists = await testStorageBucket();
        console.log('Storage bucket accessible:', bucketExists);
        
        // Load contacts
        setLoading(true);
        const { data, error } = await getContactsNotMembers();
        
        if (error) {
          console.error('Failed to load contacts:', error);
          throw new Error(error.message || 'Unknown error');
        }
        
        if (!data || data.length === 0) {
          console.warn('No contacts available to convert to members');
        }
        
        setContacts(data || []);
      } catch (err) {
        console.error('Failed to load contacts', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err instanceof Error 
            ? `Failed to load contacts: ${err.message}` 
            : 'Failed to load contacts'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Add a new useEffect to handle contact grouping and filtering
  useEffect(() => {
    if (contacts.length === 0) return;
    
    // Filter contacts based on search query
    const filteredContacts = searchQuery 
      ? contacts.filter(contact => 
          `${contact.first_name} ${contact.last_name} ${contact.email}`.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : contacts;
    
    // Group contacts by first letter of last name for easier navigation
    const grouped: {[key: string]: Contact[]} = {};
    
    filteredContacts.forEach(contact => {
      // Use last name's first letter, or fall back to first name if no last name
      const firstLetter = (contact.last_name || contact.first_name || '?')[0].toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(contact);
    });
    
    // Sort the groups alphabetically
    const sortedGroups: {[key: string]: Contact[]} = {};
    Object.keys(grouped).sort().forEach(key => {
      sortedGroups[key] = grouped[key];
    });
    
    setGroupedContacts(sortedGroups);
  }, [contacts, searchQuery]);

  // Updated to handle multiple selections
  const handleContactSelect = (id: string) => {
    // If selecting a new contact
    if (!selectedContactIds.includes(id)) {
      const newSelectedIds = [...selectedContactIds, id];
      setSelectedContactIds(newSelectedIds);

      // Only set selected contact info if it's a single selection
      if (newSelectedIds.length === 1) {
        const contact = contacts.find(c => c.id === id);
        setSelectedContact(contact || null);
        setProfileImage(contact?.profile_image || null);
      } else {
        // Clear the selected contact and profile image when multiple contacts are selected
        setSelectedContact(null);
        setProfileImage(null);
      }
    } else {
      // If deselecting a contact
      const newSelectedIds = selectedContactIds.filter(contactId => contactId !== id);
      setSelectedContactIds(newSelectedIds);

      // If we're down to one selection again, update the selectedContact
      if (newSelectedIds.length === 1) {
        const contact = contacts.find(c => c.id === newSelectedIds[0]);
        setSelectedContact(contact || null);
        setProfileImage(contact?.profile_image || null);
      } else {
        setSelectedContact(null);
        setProfileImage(null);
      }
    }

    // Always reset image file when selection changes
    setImageFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Log file details
      console.log('File selected:', file.name);
      console.log('File type:', file.type);
      console.log('File size:', Math.round(file.size / 1024), 'KB');
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error('Invalid file type:', file.type);
        toast({
          variant: 'destructive',
          title: 'Invalid File',
          description: 'Please select an image file (JPEG, PNG, etc.)'
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.error('File too large:', Math.round(file.size / 1024 / 1024), 'MB');
        toast({
          variant: 'destructive',
          title: 'File Too Large',
          description: 'Please select an image under 5MB'
        });
        return;
      }
      
      setImageFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const previewUrl = event.target.result as string;
          console.log('Preview generated, length:', previewUrl.length);
          setProfileImage(previewUrl);
        }
      };
      reader.onerror = (err) => {
        console.error('Error creating preview:', err);
      };
      reader.readAsDataURL(file);
    }
  }

  const handleImageUpload = async () => {
    if (!imageFile || !selectedContactIds.length) {
      console.error('Missing file or selectedContactIds');
      console.log('imageFile:', !!imageFile);
      console.log('selectedContactIds:', selectedContactIds);
      return;
    }
    
    setUploadingImage(true);
    try {
      console.log('Starting upload process with file:', imageFile.name, imageFile.type, imageFile.size);
      
      // Upload the image to Supabase storage
      const imageUrl = await uploadContactImage(selectedContactIds[0], imageFile);
      console.log('Upload successful! Received URL:', imageUrl);
      
      // Update the local profile image display
      console.log('Setting profile image to URL:', imageUrl);
      setProfileImage(imageUrl);
      
      // Verify the selectedContact state
      console.log('Current selectedContact:', selectedContact);
      
      // Also update the selectedContact reference with the new image URL
      if (selectedContact) {
        const updatedContact = {
          ...selectedContact,
          profile_image: imageUrl
        };
        console.log('Updating selectedContact with new image URL');
        setSelectedContact(updatedContact);
      }
      
      toast({
        title: "Success",
        description: "Profile image uploaded successfully"
      });
    } catch (err) {
      console.error('Failed to upload image', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to upload profile image'
      });
    } finally {
      setUploadingImage(false)
    }
  }

  const handleTestStorage = async () => {
    try {
      setTestingStorage(true);
      setTestUrl(null);
      
      toast({
        title: "Testing Storage",
        description: "Attempting to upload a test file..."
      });
      
      const url = await testDirectUpload();
      setTestUrl(url);
      
      toast({
        title: "Test Successful",
        description: "Test file uploaded successfully"
      });
    } catch (err) {
      console.error('Storage test failed:', err);
      toast({
        variant: 'destructive',
        title: 'Storage Test Failed',
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setTestingStorage(false);
    }
  };

  const handleServerStorageTest = async () => {
    try {
      setTestingServerStorage(true);
      setServerTestResults(null);
      
      toast({
        title: "Testing Server Storage",
        description: "Testing storage from the server side..."
      });
      
      const response = await fetch('/api/test-storage');
      const results = await response.json();
      
      setServerTestResults(results);
      
      if (results.success) {
        toast({
          title: "Server Test Successful",
          description: "Storage is working from the server"
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Server Test Failed',
          description: results.error || 'Unknown error'
        });
      }
    } catch (err) {
      console.error('Server storage test failed:', err);
      setServerTestResults({ 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error',
        steps: ['Test failed with exception']
      });
      
      toast({
        variant: 'destructive',
        title: 'Server Test Failed',
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setTestingServerStorage(false);
    }
  };

  const handleAdminCheck = async () => {
    try {
      setCheckingAdmin(true);
      setAdminCheckResults(null);
      
      toast({
        title: "Checking Supabase Config",
        description: "Checking Supabase settings..."
      });
      
      const response = await fetch('/api/test-storage/check-admin');
      const results = await response.json();
      
      setAdminCheckResults(results);
      
      if (results.success) {
        toast({
          title: "Config Check Successful",
          description: "No issues found with Supabase configuration"
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Config Issues Found',
          description: `${results.issues.length} issues detected`
        });
      }
    } catch (err) {
      console.error('Admin check failed:', err);
      setAdminCheckResults({ 
        success: false, 
        issues: [err instanceof Error ? err.message : 'Unknown error'],
        config: {}
      });
      
      toast({
        variant: 'destructive',
        title: 'Config Check Failed',
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setCheckingAdmin(false);
    }
  };

  // Add a function to list available buckets  
  const handleListBuckets = async () => {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Error listing buckets:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to List Buckets',
          description: error.message
        });
        return;
      }
      
      if (!buckets || buckets.length === 0) {
        toast({
          title: 'No Buckets Found',
          description: 'No storage buckets exist in this project'
        });
        return;
      }
      
      toast({
        title: 'Buckets Found',
        description: `Found ${buckets.length} buckets: ${buckets.map(b => b.name).join(', ')}`
      });
      
      // Check for profile-images bucket specifically
      const profileBucket = buckets.find(b => b.name === 'profile-images');
      if (profileBucket) {
        // Try to list files in the bucket
        const { data: files, error: listError } = await supabase.storage
          .from('profile-images')
          .list();
          
        if (listError) {
          console.error('Error listing files:', listError);
        } else {
          console.log('Files in profile-images bucket:', files);
          toast({
            title: 'Files in profile-images',
            description: `Found ${files.length} files`
          });
        }
      }
    } catch (err) {
      console.error('Error checking buckets:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to check buckets'
      });
    }
  };

  // Direct test upload function that bypasses the UI components
  const handleDirectTest = async () => {
    if (!selectedContactIds.length) {
      toast({
        variant: 'destructive',
        title: 'No Contact Selected',
        description: 'Please select at least one contact'
      });
      return;
    }
    
    if (!imageFile) {
      toast({
        variant: 'destructive',
        title: 'No File Selected',
        description: 'Please select an image first'
      });
      return;
    }
    
    setDirectTesting(true);
    
    try {
      console.log('=== DIRECT TEST UPLOAD ===');
      console.log('Selected contact IDs:', selectedContactIds);
      console.log('ImageFile:', imageFile.name, imageFile.type, imageFile.size);
      
      // Create a direct upload to storage
      const fileExt = imageFile.name.split('.').pop();
      const randomId = Math.random().toString(36).substring(2, 10);
      const fileName = `direct-test-${selectedContactIds.join('-')}-${Date.now()}-${randomId}.${fileExt}`;
      
      console.log('Uploading to:', fileName);
      
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        throw error;
      }
      
      console.log('Direct upload success:', data);
      
      // Get URL
      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);
      
      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL');
      }
      
      console.log('Direct test URL:', urlData.publicUrl);
      setTestUrl(urlData.publicUrl);
      
      toast({
        title: 'Direct Upload Success',
        description: 'Image uploaded directly to storage'
      });
    } catch (err) {
      console.error('Direct test failed:', err);
      toast({
        variant: 'destructive',
        title: 'Direct Test Failed',
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setDirectTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedContactIds.length === 0 || !joinedDate) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select at least one contact and a joined date'
      })
      return
    }
    
    setSubmitting(true)
    
    try {
      console.log('Starting member creation process');
      console.log('Selected contact IDs:', selectedContactIds);
      console.log('Joined date:', joinedDate?.toISOString());
      
      // Only handle image upload if there's a single contact selected
      if (selectedContactIds.length === 1 && imageFile) {
        console.log('Handling image upload first');
        await handleImageUpload()
        console.log('Image upload complete');
      }
      
      // Create a member for each selected contact
      const results = [];
      let hasErrors = false;
      
      for (const contactId of selectedContactIds) {
        console.log(`Creating member record for contact ${contactId}`);
        const result = await createMember({
          contact_id: contactId,
          joined_at: joinedDate.toISOString(),
          notes: notes || undefined
        });
        
        results.push(result);
        
        if (result.error) {
          console.error(`Error creating member for contact ${contactId}:`, result.error);
          hasErrors = true;
        }
      }
      
      if (hasErrors) {
        // Count successful and failed creations
        const successCount = results.filter(r => !r.error).length;
        const failureCount = results.filter(r => r.error).length;
        
        if (successCount > 0) {
          toast({
            title: 'Partial Success',
            description: `${successCount} member(s) created successfully. ${failureCount} failed.`
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to create members. Please check if they already exist.'
          });
        }
      } else {
        toast({
          title: 'Success',
          description: `${selectedContactIds.length} member(s) created successfully`
        });
      }
      
      router.push('/people/members')
    } catch (err) {
      console.error('Failed to create members:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create members'
      });
   
      setSubmitting(false);
    }
  }
  
  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading contacts...</span>
      </div>
    )
  }
  
  if (contacts.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">New Member</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>No Available Contacts</CardTitle>
            <CardDescription>
              You need to create contacts first before converting them to members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              There are no contacts available to convert to members. 
              Please create some contacts first.
            </p>
            <Button 
              onClick={() => router.push('/people/contacts/new')}
            >
              Create New Contact
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Helper function to get contact name by ID
  const getContactName = (id: string) => {
    const contact = contacts.find(c => c.id === id);
    return contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown Contact';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Member</h1>
      
      {/* Storage Test Section */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="font-semibold mb-2">Storage Diagnostic</h3>
        <p className="text-sm mb-3">
          Having trouble with image uploads? Try these test options:
        </p>
        <div className="flex items-center space-x-2 mb-3">
          <Button 
            variant="secondary" 
            onClick={handleTestStorage}
            disabled={testingStorage}
          >
            {testingStorage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Client-Side Storage'
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleServerStorageTest}
            disabled={testingServerStorage}
          >
            {testingServerStorage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Server...
              </>
            ) : (
              'Test Server-Side Storage'
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleAdminCheck}
            disabled={checkingAdmin}
          >
            {checkingAdmin ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              'Check Supabase Config'
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleListBuckets}
          >
            List Buckets
          </Button>
        </div>
        
        {/* Direct test button */}
        <div className="flex items-center space-x-2 mb-3">
          <Button 
            variant="destructive" 
            onClick={handleDirectTest}
            disabled={directTesting || !imageFile || !selectedContactIds.length}
          >
            {directTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Direct Testing...
              </>
            ) : (
              'Try Direct Upload (After selecting contacts & file)'
            )}
          </Button>
          
          {testUrl && (
            <div className="text-xs overflow-hidden">
              <a 
                href={testUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline"
              >
                Test file uploaded! Click to view
              </a>
            </div>
          )}
        </div>
        
        {serverTestResults && (
          <div className="text-xs p-3 bg-white rounded border max-h-40 overflow-y-auto mb-3">
            <p className="font-medium mb-1">Server Test Results:</p>
            <p className="mb-1">Status: <span className={serverTestResults.success ? "text-green-600" : "text-red-600"}>
              {serverTestResults.success ? "Success" : "Failed"}
            </span></p>
            
            {serverTestResults.error && (
              <p className="text-red-500 mb-1">Error: {serverTestResults.error}</p>
            )}
            
            <p className="font-medium mt-2 mb-1">Steps:</p>
            <ol className="list-decimal list-inside">
              {serverTestResults.steps?.map((step: string, i: number) => (
                <li key={i} className="truncate">{step}</li>
              ))}
            </ol>
            
            {serverTestResults.url && (
              <p className="mt-2">
                <a 
                  href={serverTestResults.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline"
                >
                  View uploaded file
                </a>
              </p>
            )}
          </div>
        )}
        
        {adminCheckResults && (
          <div className="text-xs p-3 bg-white rounded border max-h-40 overflow-y-auto">
            <p className="font-medium mb-1">Supabase Config Check:</p>
            <p className="mb-1">Status: <span className={adminCheckResults.success ? "text-green-600" : "text-red-600"}>
              {adminCheckResults.success ? "OK" : `${adminCheckResults.issues.length} Issues Found`}
            </span></p>
            
            {adminCheckResults.issues && adminCheckResults.issues.length > 0 && (
              <>
                <p className="font-medium mt-2 mb-1">Issues:</p>
                <ul className="list-disc list-inside">
                  {adminCheckResults.issues.map((issue: string, i: number) => (
                    <li key={i} className="text-red-500">{issue}</li>
                  ))}
                </ul>
              </>
            )}
            
            {adminCheckResults.config && (
              <>
                <p className="font-medium mt-2 mb-1">Config:</p>
                <pre className="bg-gray-100 p-1 rounded overflow-x-auto">
                  {JSON.stringify(adminCheckResults.config, null, 2)}
                </pre>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Debug section */}
      {selectedContact?.profile_image && (
        <div className="p-4 bg-gray-100 rounded-md mb-4">
          <h3 className="font-semibold mb-2">Debug Image Display</h3>
          <p className="text-xs mb-2 overflow-auto">URL: {selectedContact.profile_image}</p>
          <div className="flex space-x-4">
            <div>
              <p className="text-xs mb-1">Avatar Component:</p>
              <Avatar 
                src={selectedContact.profile_image} 
                alt={`${selectedContact.first_name} ${selectedContact.last_name}`}
                size="lg"
              />
            </div>
            <div>
              <p className="text-xs mb-1">Regular Img Tag:</p>
              <img 
                src={selectedContact.profile_image} 
                alt="Debug" 
                className="h-16 w-16 object-cover rounded-full"
                onError={(e) => {
                  console.error('Direct img error:', e);
                  (e.target as HTMLImageElement).style.border = '2px solid red';
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Member Details</CardTitle>
          <CardDescription>
            Create new members by selecting contacts and providing joined date.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="contact">Select Contacts</Label>
                {selectedContactIds.length > 0 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedContactIds([]);
                      setSelectedContact(null);
                      setProfileImage(null);
                      setImageFile(null);
                    }}
                  >
                    Clear Selection
                  </Button>
                )}
              </div>
              
              {/* Add search input */}
              <div className="relative mb-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input 
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <button 
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
              
              {/* Contact selection list with better scrolling */}
              <div className="border rounded-md overflow-hidden h-80 flex flex-col bg-white">
                {/* Alphabetical index sidebar for quick navigation */}
                {Object.keys(groupedContacts).length > 5 && !searchQuery && (
                  <div className="flex border-b px-3 py-1 bg-muted/30 gap-1 overflow-x-auto">
                    {Object.keys(groupedContacts).map(letter => (
                      <button
                        key={letter}
                        type="button"
                        className="px-1.5 py-0.5 text-xs rounded hover:bg-muted"
                        onClick={() => {
                          document.getElementById(`contact-group-${letter}`)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Scrollable contact list */}
                <div className="overflow-y-auto flex-1 p-1">
                  {Object.keys(groupedContacts).length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'No contacts found matching your search' : 'No available contacts'}
                    </p>
                  ) : (
                    Object.entries(groupedContacts).map(([letter, letterContacts]) => (
                      <div key={letter} id={`contact-group-${letter}`}>
                        {!searchQuery && (
                          <div className="sticky top-0 bg-muted/30 px-2 py-1 text-xs font-medium rounded-sm my-1">
                            {letter}
                          </div>
                        )}
                        {letterContacts.map((contact) => (
                          <div 
                            key={contact.id} 
                            className={`flex items-center justify-between p-2 hover:bg-muted/50 cursor-pointer rounded-md ${
                              selectedContactIds.includes(contact.id) ? 'bg-muted/70' : ''
                            }`}
                            onClick={() => handleContactSelect(contact.id)}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar 
                                src={contact.profile_image} 
                                alt={`${contact.first_name} ${contact.last_name}`}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{contact.first_name} {contact.last_name}</p>
                                <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-center w-5 h-5 rounded-full border flex-shrink-0 ml-2">
                              {selectedContactIds.includes(contact.id) && <Check className="h-3 w-3" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Selection summary */}
              {selectedContactIds.length > 0 && (
                <div className="mt-2 p-2 bg-muted/30 rounded-md">
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="h-4 w-4" />
                    <span>{selectedContactIds.length} contact{selectedContactIds.length > 1 ? 's' : ''} selected</span>
                  </div>
                  {selectedContactIds.length > 3 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedContactIds.slice(0, 3).map(id => (
                        <div key={id} className="text-xs bg-white px-1.5 py-0.5 rounded-full flex items-center">
                          {getContactName(id)}
                          <button 
                            type="button" 
                            className="ml-1 text-gray-500 hover:text-gray-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContactSelect(id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {selectedContactIds.length > 3 && (
                        <div className="text-xs bg-white px-1.5 py-0.5 rounded-full">
                          +{selectedContactIds.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Profile Image section - only visible when a single contact is selected */}
            {selectedContactIds.length === 1 && (
              <div className="space-y-2">
                <Label htmlFor="profile-image">Profile Image</Label>
                <div className="p-4 border-2 border-dashed rounded-md bg-muted/20">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative group">
                      <Avatar 
                        src={profileImage} 
                        alt={selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name}` : "Profile Image"}
                        size="lg"
                        className="border-2 border-white shadow-sm"
                      />
                      <label 
                        htmlFor="profile-image"
                        className={`absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full 
                          ${!selectedContact ? 'opacity-0 cursor-not-allowed' : 'opacity-0 group-hover:opacity-100 cursor-pointer'} 
                          transition-opacity`}
                      >
                        <Camera className="h-6 w-6" />
                      </label>
                      <input 
                        type="file" 
                        id="profile-image" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={!selectedContact}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium">
                        {selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name}` : 'Select a contact'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedContact?.email}
                      </p>
                    </div>
                  </div>
                  
                  {imageFile && selectedContact && (
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="sm"
                      onClick={handleImageUpload}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-1.5" />
                          Upload Image
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                {/* Debug info display */}
                {selectedContact && (
                  <div className="mt-4 text-xs border-t pt-2 border-gray-200">
                    <p className="font-medium">Debug Info:</p>
                    <p>Contact ID: {selectedContact.id}</p>
                    <p>Profile state: {profileImage ? "Set" : "Not set"}</p>
                    {selectedContact.profile_image && (
                      <div>
                        <p className="truncate">Profile image URL: <span className="text-green-600">{selectedContact.profile_image.substring(0, 40)}...</span></p>
                        <div className="mt-1 flex space-x-2">
                          <a 
                            href={selectedContact.profile_image} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            Test URL
                          </a>
                          <span>|</span>
                          <button
                            type="button"
                            onClick={() => {
                              // Force refresh the profile image
                              setProfileImage(selectedContact.profile_image || null);
                            }}
                            className="text-blue-500 hover:underline"
                          >
                            Refresh Image
                          </button>
                        </div>
                      </div>
                    )}
                    {!selectedContact.profile_image && (
                      <p className="text-orange-500">No saved profile image URL</p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="joined_date">Joined Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !joinedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {joinedDate ? format(joinedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 border-2 rounded-lg shadow-lg bg-white">
                  <Calendar
                    mode="single"
                    selected={joinedDate}
                    onSelectDate={(date) => setJoinedDate(date)}
                    initialFocus
                    disableFutureDates={true}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes {selectedContactIds.length > 1 && "(Applied to all selected members)"}</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about the member(s)"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/people/members')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || selectedContactIds.length === 0 || !joinedDate || (selectedContactIds.length === 1 && uploadingImage)}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                `Create ${selectedContactIds.length > 1 ? selectedContactIds.length + ' Members' : 'Member'}`
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 