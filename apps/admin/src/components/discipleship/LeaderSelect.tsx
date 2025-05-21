import { useState, useEffect, useRef } from 'react';
import { Search, User, X, Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { getContactsForLeaderSelection } from '@/services/contacts';

type Contact = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

interface LeaderSelectProps {
  leaderId?: string;
  onLeaderChange: (leaderId: string | undefined) => void;
  selectedLeader?: Contact;
  onSelectedLeaderChange: (leader: Contact | undefined) => void;
}

export function LeaderSelect({
  leaderId,
  onLeaderChange,
  selectedLeader,
  onSelectedLeaderChange
}: LeaderSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [showResults, setShowResults] = useState(false);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  
  // Handle search
  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    
    try {
      setIsSearching(true);
      const { data, error } = await getContactsForLeaderSelection(searchQuery);
      
      if (error) throw error;
      
      setSearchResults(data || []);
      setShowResults(true);
      
      if ((data || []).length === 0) {
        toast({
          title: 'No results',
          description: 'No matching contacts found'
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
  const handleSelectLeader = (contact: Contact) => {
    onLeaderChange(contact.id);
    onSelectedLeaderChange(contact);
    setSearchQuery(`${contact.first_name || ''} ${contact.last_name || ''}`.trim());
    setShowResults(false);
  };
  
  // Handle clear leader
  const handleClearLeader = () => {
    onLeaderChange(undefined);
    onSelectedLeaderChange(undefined);
    setSearchQuery('');
  };
  
  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsContainerRef.current && !resultsContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Initial load of selected leader if leaderId is provided but no selectedLeader
  useEffect(() => {
    const loadLeader = async () => {
      if (leaderId && !selectedLeader) {
        try {
          const { data, error } = await getContactsForLeaderSelection();
          
          if (error) throw error;
          
          const leader = (data || []).find(c => c.id === leaderId);
          if (leader) {
            onSelectedLeaderChange(leader);
            setSearchQuery(`${leader.first_name || ''} ${leader.last_name || ''}`.trim());
          }
        } catch (err) {
          console.error('Error loading leader details:', err);
        }
      }
    };
    
    loadLeader();
  }, [leaderId, selectedLeader, onSelectedLeaderChange]);
  
  return (
    <div className="space-y-2" ref={resultsContainerRef}>
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for a leader..."
            className="pl-10 pr-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearLeader}
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
      </div>
      
      {/* Leader badge if selected */}
      {selectedLeader && (
        <div className="flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm">
          <User className="mr-2 h-3 w-3" />
          <span>
            {selectedLeader.first_name} {selectedLeader.last_name}
            {selectedLeader.email && (
              <span className="ml-1 text-muted-foreground">({selectedLeader.email})</span>
            )}
          </span>
          <button
            type="button"
            onClick={handleClearLeader}
            className="ml-2 rounded-full p-0.5 hover:bg-primary/20"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      
      {/* Search Results */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-background shadow-lg">
          {searchResults.map((contact) => (
            <button
              key={contact.id}
              type="button"
              onClick={() => handleSelectLeader(contact)}
              className="w-full rounded-sm p-2 text-left text-sm hover:bg-muted flex items-center justify-between"
            >
              <div>
                <div className="font-medium">
                  {contact.first_name} {contact.last_name}
                </div>
                {contact.email && (
                  <div className="text-xs text-muted-foreground">
                    {contact.email}
                  </div>
                )}
              </div>
              {selectedLeader?.id === contact.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 