'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Trash2, Loader2, InfoIcon } from 'lucide-react';
import { deleteContact } from '@/services/contacts';

interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email?: string | null;
  phone?: string | null;
}

interface SimpleDeleteContactDialogProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function SimpleDeleteContactDialog({
  contact,
  isOpen,
  onClose,
  onDeleted,
}: SimpleDeleteContactDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle deletion with proper error handling
  const handleDelete = async () => {
    if (!contact) return;

    try {
      setIsDeleting(true);
      setErrorMessage(null);
      
      await deleteContact(contact.id);
      onDeleted();
      onClose();
    } catch (error) {
      console.error('Failed to delete contact:', error);
      
      // Parse the error to provide meaningful feedback
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMsg.includes('foreign key') || errorMsg.includes('constraint') || errorMsg.includes('violates')) {
        setErrorMessage('Cannot delete this contact because they are referenced in other parts of the system (groups, memberships, etc.). Please remove them from all groups first, or contact support for assistance.');
      } else {
        setErrorMessage(`Failed to delete contact: ${errorMsg}`);
      }
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
          <Alert className="border-yellow-200 bg-yellow-50">
            <InfoIcon className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Important:</strong> This action cannot be undone. If this contact is a member of any groups, 
              has pending follow-ups, or is referenced elsewhere in the system, the deletion may fail.
              
              <div className="mt-2 text-xs text-yellow-600">
                Contact details: {contact.email && `${contact.email} • `}{contact.phone || 'No phone'}
              </div>
            </AlertDescription>
          </Alert>

          {errorMessage && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Deletion Failed:</strong> {errorMessage}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Contact
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 