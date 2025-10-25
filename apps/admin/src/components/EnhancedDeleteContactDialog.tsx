'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, X, UserMinus, Trash2, Loader2 } from 'lucide-react';
import { deleteContact, checkBasicContactDependencies } from '@/services/contacts';
import { supabase } from '@/lib/supabase';

interface Dependency {
  category: string;
  count: number;
  details: any;
}

interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email?: string | null;
  phone?: string | null;
}

interface EnhancedDeleteContactDialogProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function EnhancedDeleteContactDialog({
  contact,
  isOpen,
  onClose,
  onDeleted,
}: EnhancedDeleteContactDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [hasDependencies, setHasDependencies] = useState(false);
  const [showForceDelete, setShowForceDelete] = useState(false);

  // Check dependencies when dialog opens
  const checkDependencies = async () => {
    if (!contact) return;

    try {
      setIsLoading(true);
      console.log('Starting dependency check for contact:', contact.id);
      
      // Primary approach: Use the reliable fallback function
      console.log('Using basic dependency check...');
      const fallbackResult = await checkBasicContactDependencies(contact.id);
      
      const dependencyList: Dependency[] = fallbackResult.dependencies.map(dep => ({
        category: dep.category.toLowerCase().replace(/\s+/g, '_'),
        count: dep.count,
        details: dep.details
      }));

      console.log('Dependency check result:', {
        canDelete: fallbackResult.canDelete,
        dependencies: dependencyList
      });

      setDependencies(dependencyList);
      setHasDependencies(!fallbackResult.canDelete);
      
      // Optional: Try the advanced SQL function as an enhancement (non-blocking)
      try {
        console.log('Attempting advanced SQL function check...');
        const { data: sqlData, error: sqlError } = await supabase.rpc('check_contact_dependencies', {
          p_contact_id: contact.id
        });

        if (!sqlError && sqlData && sqlData.length > 0) {
          console.log('Advanced SQL function worked, using enhanced results');
          const advancedDependencies: Dependency[] = sqlData.map((dep: any) => ({
            category: dep.dependency_category,
            count: Number(dep.dependency_count),
            details: dep.dependency_details
          }));

          setDependencies(advancedDependencies);
          setHasDependencies(advancedDependencies.length > 0);
        } else if (sqlError) {
          console.log('Advanced SQL function failed, using basic results:', sqlError.message);
        }
      } catch (advancedError) {
        console.log('Advanced dependency check failed, using basic results:', advancedError);
      }

    } catch (error) {
      console.error('Failed to check dependencies:', error);
      
      // If even the basic check fails, be conservative and assume dependencies exist
      setDependencies([{
        category: 'error',
        count: 1,
        details: 'Unable to verify dependencies - deletion may be restricted'
      }]);
      setHasDependencies(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle dialog state changes
  useEffect(() => {
    if (isOpen && contact) {
      checkDependencies();
    } else {
      setDependencies([]);
      setHasDependencies(false);
      setShowForceDelete(false);
    }
  }, [isOpen, contact]);

  // Get user-friendly category names
  const getCategoryDisplayName = (category: string): string => {
    const categoryNames: Record<string, string> = {
      group_memberships: 'Group Memberships',
      discipleship_memberships: 'Discipleship Groups',
      groups_led: 'Groups Led',
      discipleship_groups_led: 'Discipleship Groups Led',
      member_record: 'Member Status',
      member_status: 'Member Status',
      pending_follow_ups: 'Pending Follow-ups',
      event_attendance: 'Event Attendance Records',
      soul_winning_records: 'Soul Winning Records',
      prayer_requests: 'Prayer Requests',
      unknown_error: 'Database Check Failed',
      error: 'Verification Error',
    };
    return categoryNames[category] || category;
  };

  // Get category description
  const getCategoryDescription = (dependency: Dependency): string => {
    // Handle simple string details (from fallback function)
    if (typeof dependency.details === 'string') {
      return dependency.details;
    }
    
    // Handle complex object details (from SQL function)
    switch (dependency.category) {
      case 'group_memberships':
        const groups = dependency.details as Array<{group_name: string, role: string}>;
        return groups.map(g => `${g.group_name} (${g.role})`).join(', ');
      
      case 'discipleship_memberships':
        const discipleGroups = dependency.details as Array<{group_name: string, role: string}>;
        return discipleGroups.map(g => `${g.group_name} (${g.role})`).join(', ');
      
      case 'groups_led':
        const ledGroups = dependency.details as Array<{group_name: string, group_type: string}>;
        return ledGroups.map(g => `${g.group_name} (${g.group_type})`).join(', ');
      
      case 'discipleship_groups_led':
        const ledDiscipleGroups = dependency.details as Array<{group_name: string}>;
        return ledDiscipleGroups.map(g => g.group_name).join(', ');
      
      case 'member_record':
        return 'Active member status';
      
      case 'pending_follow_ups':
        return `${dependency.count} pending follow-up${dependency.count > 1 ? 's' : ''}`;
      
      case 'event_attendance':
        return `${dependency.count} event attendance record${dependency.count > 1 ? 's' : ''}`;
      
      case 'soul_winning_records':
        return `${dependency.count} soul winning record${dependency.count > 1 ? 's' : ''}`;
      
      case 'prayer_requests':
        return `${dependency.count} prayer request${dependency.count > 1 ? 's' : ''}`;
      
      case 'unknown_error':
        return 'Unable to verify dependencies - check may be incomplete';
      
      case 'error':
        return typeof dependency.details === 'string' ? dependency.details : 'System error occurred during verification';
      
      default:
        return `${dependency.count} record${dependency.count > 1 ? 's' : ''}`;
    }
  };

  // Handle deletion
  const handleDelete = async () => {
    if (!contact) return;

    try {
      setIsDeleting(true);
      await deleteContact(contact.id);
      onDeleted();
      onClose();
    } catch (error) {
      console.error('Failed to delete contact:', error);
      // The error will show that it failed due to foreign key constraints
      alert('Failed to delete contact. Please remove the contact from all groups first, or contact support for assistance.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!contact) return null;

  const contactName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown Contact';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Contact
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{contactName}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading && (
            <div className="text-center py-4">
              <Loader2 className="animate-spin inline-block w-6 h-6 text-blue-600" />
              <p className="mt-2 text-sm text-gray-600">Checking dependencies...</p>
            </div>
          )}

          {!isLoading && hasDependencies && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Cannot delete this contact</strong> - they are referenced in other parts of the system:
                
                <div className="mt-3 space-y-2">
                  {dependencies.map((dep) => (
                    <div key={dep.category} className="flex items-center justify-between">
                      <div>
                        <Badge variant="outline" className="border-amber-300 text-amber-700">
                          {getCategoryDisplayName(dep.category)}
                        </Badge>
                        <p className="text-xs text-amber-600 mt-1">
                          {getCategoryDescription(dep)}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-amber-700">
                        {dep.count}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                  <p className="text-sm text-amber-700 font-medium">Options:</p>
                  <ul className="text-xs text-amber-600 mt-1 space-y-1">
                    <li>• Remove the contact from all groups first</li>
                    <li>• Complete or cancel pending follow-ups</li>
                    <li>• Transfer group leadership to another person</li>
                    <li>• Contact support for assistance with data cleanup</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!isLoading && !hasDependencies && (
            <Alert className="border-green-200 bg-green-50">
              <div className="flex">
                <UserMinus className="h-4 w-4 text-green-600 mt-0.5 mr-2" />
                <AlertDescription className="text-green-800">
                  This contact has no dependencies and can be safely deleted.
                  <div className="mt-2 text-xs text-green-600">
                    Contact details: {contact.email && `${contact.email} • `}{contact.phone || 'No phone'}
                  </div>
                </AlertDescription>
              </div>
            </Alert>
          )}

          {!isLoading && hasDependencies && (
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForceDelete(!showForceDelete)}
                className="text-red-600 hover:text-red-700"
              >
                {showForceDelete ? 'Hide' : 'Show'} Force Delete Option
              </Button>
              
              {showForceDelete && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600 mb-2">
                    ⚠️ Force deletion may cause data integrity issues and should only be used by administrators.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    {isDeleting ? 'Deleting...' : 'Force Delete Anyway'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          {!hasDependencies && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || isLoading}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete Contact'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 