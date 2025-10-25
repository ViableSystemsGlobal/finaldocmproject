'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar,
  RefreshCw,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

interface ContactSubmission {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  location: string | null;
  occupation: string | null;
  lifecycle: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_notes: string | null;
}

export default function PendingContactsPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      setSubmissions(data || []);
      console.log(`✅ Loaded ${data?.length || 0} contact submissions`);
    } catch (error) {
      console.error('❌ Error loading submissions:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load contact submissions',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setAdminNotes(submission.admin_notes || '');
    setShowViewDialog(true);
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    
    setProcessing(true);
    try {
      console.log('🔄 Starting approval process...', selectedSubmission);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Current user:', user?.email);
      
      // Get tenant_id
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenant_settings')
        .select('id')
        .single();
      
      if (tenantError) {
        console.error('❌ Error fetching tenant:', tenantError);
      }
      
      const tenantId = tenantData?.id || null;
      console.log('🏢 Tenant ID:', tenantId);
      
      // Create contact from submission (use their selected lifecycle status)
      const contactData = {
        first_name: selectedSubmission.first_name,
        last_name: selectedSubmission.last_name,
        email: selectedSubmission.email,
        phone: selectedSubmission.phone || null,
        date_of_birth: selectedSubmission.date_of_birth || null,
        location: selectedSubmission.location || null,
        occupation: selectedSubmission.occupation || null,
        lifecycle: (selectedSubmission as any).lifecycle || 'visitor',
        tenant_id: tenantId,
      };
      
      console.log('📝 Creating contact with data:', contactData);
      
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert([contactData])
        .select()
        .single();

      if (contactError) {
        console.error('❌ Error creating contact:', {
          message: contactError.message,
          code: contactError.code,
          details: contactError.details,
          hint: contactError.hint
        });
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to create contact: ${contactError.message}`,
        });
        throw contactError;
      }
      
      console.log('✅ Contact created:', newContact);

      // Update submission status
      const { error: updateError } = await supabase
        .from('contact_submissions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          admin_notes: adminNotes || null,
        })
        .eq('id', selectedSubmission.id);

      if (updateError) throw updateError;

      toast({
        title: 'Success!',
        description: `${selectedSubmission.first_name} ${selectedSubmission.last_name} has been added to contacts`,
      });

      setShowApproveDialog(false);
      setShowViewDialog(false);
      setSelectedSubmission(null);
      setAdminNotes('');
      loadSubmissions();

    } catch (error) {
      console.error('❌ Error approving submission:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve submission',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission) return;
    
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('contact_submissions')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          admin_notes: adminNotes || 'Rejected',
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      toast({
        title: 'Submission Rejected',
        description: 'The submission has been marked as rejected',
      });

      setShowRejectDialog(false);
      setShowViewDialog(false);
      setSelectedSubmission(null);
      setAdminNotes('');
      loadSubmissions();

    } catch (error) {
      console.error('❌ Error rejecting submission:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject submission',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pending Contact Submissions</h1>
          <p className="text-gray-600 mt-1">Review and approve member detail submissions from the QR code form</p>
        </div>
        <Button onClick={loadSubmissions} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-3xl font-bold text-yellow-600">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-3xl font-bold text-green-600">{approvedCount}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Rejected</CardDescription>
            <CardTitle className="text-3xl font-bold text-red-600">{rejectedCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
          <CardDescription>Click on any row to view details and take action</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No contact submissions yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow 
                    key={submission.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleView(submission)}
                  >
                    <TableCell className="font-medium">
                      {submission.first_name} {submission.last_name}
                    </TableCell>
                    <TableCell>{submission.email}</TableCell>
                    <TableCell>{submission.phone || '-'}</TableCell>
                    <TableCell>{format(new Date(submission.submitted_at), 'MMM d, yyyy h:mm a')}</TableCell>
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(submission);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Contact Submission Details</DialogTitle>
            <DialogDescription>
              Review the submitted information and approve or reject
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6 py-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                {getStatusBadge(selectedSubmission.status)}
                <span className="text-sm text-gray-500">
                  Submitted {format(new Date(selectedSubmission.submitted_at), 'MMM d, yyyy h:mm a')}
                </span>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">{selectedSubmission.first_name} {selectedSubmission.last_name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold break-all">{selectedSubmission.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <User className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-600 font-semibold">Status</p>
                    <p className="font-bold text-blue-900 capitalize">{selectedSubmission.lifecycle || 'Visitor'}</p>
                  </div>
                </div>

                {selectedSubmission.phone && (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold">{selectedSubmission.phone}</p>
                    </div>
                  </div>
                )}

                {selectedSubmission.date_of_birth && (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Date of Birth</p>
                      <p className="font-semibold">{format(new Date(selectedSubmission.date_of_birth), 'MMMM d, yyyy')}</p>
                    </div>
                  </div>
                )}

                {selectedSubmission.location && (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-semibold">{selectedSubmission.location}</p>
                    </div>
                  </div>
                )}

                {selectedSubmission.occupation && (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <Briefcase className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Occupation</p>
                      <p className="font-semibold">{selectedSubmission.occupation}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes about this submission..."
                  rows={3}
                  disabled={selectedSubmission.status !== 'pending'}
                />
              </div>

              {selectedSubmission.admin_notes && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-1">Previous Notes:</p>
                  <p className="text-sm text-blue-800">{selectedSubmission.admin_notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {selectedSubmission?.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewDialog(false);
                    setShowRejectDialog(true);
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    setShowViewDialog(false);
                    setShowApproveDialog(true);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve & Add to Contacts
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Submission?</DialogTitle>
            <DialogDescription>
              This will add <strong>{selectedSubmission?.first_name} {selectedSubmission?.last_name}</strong> to your contacts list as a member.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={processing} className="bg-green-600 hover:bg-green-700">
              {processing ? 'Approving...' : 'Yes, Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission?</DialogTitle>
            <DialogDescription>
              This will mark the submission as rejected. You can add notes to explain why.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reject-notes">Reason for Rejection (Optional)</Label>
            <Textarea
              id="reject-notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Enter reason for rejection..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={processing}>
              Cancel
            </Button>
            <Button 
              onClick={handleReject} 
              disabled={processing}
              variant="destructive"
            >
              {processing ? 'Rejecting...' : 'Yes, Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

