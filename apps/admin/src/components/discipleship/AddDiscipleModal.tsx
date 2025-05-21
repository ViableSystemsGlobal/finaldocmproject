import { useState } from 'react';
import { Loader2, Search, X, Check } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { addDisciple, addMultipleDisciples } from '@/services/discipleshipGroups';
import { toast } from '@/components/ui/use-toast';

// For searching contacts
import { getContactsNotInGroup } from '@/services/members';

type Contact = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
};

interface AddDiscipleModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
  onDiscipleAdded: () => void;
}

export function AddDiscipleModal({
  groupId,
  isOpen,
  onClose,
  onDiscipleAdded
}: AddDiscipleModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [selectedRole, setSelectedRole] = useState('Mentee');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle search
  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    
    try {
      setIsSearching(true);
      const { data, error } = await getContactsNotInGroup(groupId, searchQuery);
      
      if (error) throw error;
      
      // Convert data to match our Contact type
      const formattedData = (data || []).map(contact => ({
        id: contact.id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: null // This field may not be available
      }));
      
      setSearchResults(formattedData);
      
      if (formattedData.length === 0) {
        toast({
          title: 'No results',
          description: 'No matching contacts found or all matching contacts are already in this group'
        });
      }
    } catch (err) {
      console.error('Error searching contacts:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to search for contacts'
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle select contact
  const handleSelectContact = (contact: Contact) => {
    setSelectedContacts(prev => {
      // If already selected, do nothing
      if (prev.some(c => c.id === contact.id)) {
        return prev;
      }
      
      // Add to selected contacts
      return [...prev, contact];
    });
  };
  
  // Handle remove contact from selection
  const handleRemoveContact = (contactId: string) => {
    setSelectedContacts(prev => prev.filter(contact => contact.id !== contactId));
  };

  // Check if a contact is selected
  const isContactSelected = (contactId: string) => {
    return selectedContacts.some(contact => contact.id === contactId);
  };

  // Handle add disciples
  const handleAddDisciples = async () => {
    if (selectedContacts.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select at least one contact'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (selectedContacts.length === 1) {
        // Use the single disciple addition for just one contact
        const { error } = await addDisciple(groupId, selectedContacts[0].id, selectedRole);
        if (error) throw error;
      } else {
        // Use batch insert for multiple contacts
        const contactIds = selectedContacts.map(contact => contact.id);
        const { error } = await addMultipleDisciples(groupId, contactIds, selectedRole);
        if (error) throw error;
      }
      
      toast({
        title: 'Success',
        description: `${selectedContacts.length} disciple${selectedContacts.length > 1 ? 's' : ''} added successfully`
      });
      
      // Reset form and close modal
      resetForm();
      onDiscipleAdded();
      onClose();
    } catch (err) {
      console.error('Error adding disciples:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add disciples. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedContacts([]);
    setSelectedRole('Mentee');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Disciples</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Selected Contacts */}
          {selectedContacts.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Selected Contacts ({selectedContacts.length})</label>
              <div className="flex flex-wrap gap-2">
                {selectedContacts.map(contact => (
                  <div key={contact.id} className="flex items-center rounded-full bg-secondary px-3 py-1 text-sm">
                    <span>{contact.first_name} {contact.last_name}</span>
                    <button 
                      type="button"
                      onClick={() => handleRemoveContact(contact.id)}
                      className="ml-2 rounded-full p-0.5 hover:bg-secondary-foreground/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Contact Search */}
          <div className="space-y-2">
            <label htmlFor="contact-search" className="text-sm font-medium">
              Search Contacts
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="contact-search"
                placeholder="Search by name, phone, or email..."
                className="pl-10 pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleSearch} 
              disabled={isSearching || searchQuery.trim().length < 2}
            >
              {isSearching ? (
                <div>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </div>
              ) : (
                'Search'
              )}
            </Button>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-md border bg-background p-1">
                {searchResults.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => handleSelectContact(contact)}
                    className="w-full rounded-sm p-2 text-left text-sm hover:bg-muted flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">
                        {contact.first_name} {contact.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {contact.email || contact.phone || ''}
                      </div>
                    </div>
                    {isContactSelected(contact.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium">
              Role for All Selected
            </label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mentee">Mentee</SelectItem>
                <SelectItem value="Leader">Leader</SelectItem>
                <SelectItem value="Co-Leader">Co-Leader</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAddDisciples}
            disabled={isSubmitting || selectedContacts.length === 0}
          >
            {isSubmitting ? (
              <div>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </div>
            ) : (
              `Add ${selectedContacts.length} Disciple${selectedContacts.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 