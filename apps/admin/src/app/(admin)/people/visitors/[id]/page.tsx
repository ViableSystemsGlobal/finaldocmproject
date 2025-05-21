'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { 
  Loader2, 
  Calendar, 
  Edit, 
  Trash2,
  Smartphone,
  Mail,
  RefreshCw,
  Check,
  X
} from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { FollowUpModal } from '@/components/FollowUpModal'
import { ConvertToMemberModal } from '@/components/ConvertToMemberModal'
import { fetchVisitor, updateVisitor, deleteVisitor, fetchVisitorFollowUps } from '@/services/visitors'

// Type definitions
type Visitor = {
  contact_id: string;
  first_visit: string;
  saved: boolean;
  notes?: string;
  contacts?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    profile_image?: string;
  };
};

type FollowUp = {
  id: string;
  contact_id: string;
  type: string;
  notes: string;
  scheduled_date: string;
  completed: boolean;
  created_at: string;
  assigned_to?: string;
};

export default function VisitorDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  
  // State variables
  const [visitor, setVisitor] = useState<Visitor | null>(null)
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [editMode, setEditMode] = useState(searchParams.get('mode') === 'edit')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    firstVisit: '',
    saved: false,
    notes: ''
  })
  
  // Load visitor data
  useEffect(() => {
    const loadVisitor = async () => {
      try {
        const { data, error } = await fetchVisitor(id)
        if (error) throw error
        
        const visitorData = data as unknown as Visitor
        setVisitor(visitorData)
        
        // Initialize form data for edit mode
        setFormData({
          firstVisit: visitorData.first_visit.split('T')[0], // YYYY-MM-DD format for date input
          saved: visitorData.saved,
          notes: visitorData.notes || ''
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load visitor')
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load visitor details'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadVisitor()
  }, [id])
  
  // Load follow-ups
  useEffect(() => {
    const loadFollowUps = async () => {
      if (!id) return
      
      try {
        const { data, error } = await fetchVisitorFollowUps(id)
        if (error) throw error
        
        setFollowUps(data as unknown as FollowUp[] || [])
      } catch (err) {
        console.error('Failed to load follow-ups:', err)
        // Don't show a toast for this secondary data
      }
    }
    
    loadFollowUps()
  }, [id])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }
  
  const handleSwitchChange = (checked: boolean) => {
    setFormData({ ...formData, saved: checked })
  }
  
  const handleSaveVisitor = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Update the visitor data
      const { error } = await updateVisitor(id, {
        first_visit: new Date(formData.firstVisit).toISOString(),
        saved: formData.saved,
        notes: formData.notes || undefined
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Visitor updated successfully'
      })
      
      // Exit edit mode
      setEditMode(false)
      
      // Refresh visitor data
      const { data } = await fetchVisitor(id)
      setVisitor(data as unknown as Visitor)
      
    } catch (err) {
      console.error('Failed to update visitor', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update visitor'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDeleteVisitor = async () => {
    setIsSubmitting(true)
    
    try {
      const { error } = await deleteVisitor(id)
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Visitor deleted successfully'
      })
      
      // Redirect to visitors list
      router.push('/people/visitors')
      
    } catch (err) {
      console.error('Failed to delete visitor', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete visitor'
      })
      setShowDeleteDialog(false)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleConvertSuccess = () => {
    // Redirect to members page after successful conversion
    router.push('/people/members')
  }
  
  const handleFollowUpCreated = async () => {
    // Refresh follow-ups list
    try {
      const { data, error } = await fetchVisitorFollowUps(id)
      if (error) throw error
      
      setFollowUps(data as unknown as FollowUp[] || [])
    } catch (err) {
      console.error('Failed to refresh follow-ups:', err)
    }
  }
  
  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading visitor details...</span>
      </div>
    )
  }
  
  if (!visitor) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Visitor Not Found</h1>
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="mb-4">The visitor you're looking for could not be found.</p>
              <Button onClick={() => router.push('/people/visitors')}>
                Back to Visitors
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy')
    } catch (e) {
      return 'Invalid date'
    }
  }
  
  // Get visitor name
  const visitorName = visitor.contacts 
    ? `${visitor.contacts.first_name} ${visitor.contacts.last_name}`
    : 'Unknown Visitor'
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{visitorName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">
              <Calendar className="h-3 w-3 mr-1" />
              First Visit: {formatDate(visitor.first_visit)}
            </Badge>
            <Badge variant={visitor.saved ? "success" : "outline"}>
              {visitor.saved ? 'Saved' : 'Not saved'}
            </Badge>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {visitor.contacts?.phone && (
            <Button variant="outline" size="sm">
              <Smartphone className="h-4 w-4 mr-2" />
              Send SMS
            </Button>
          )}
          
          {visitor.contacts?.email && (
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          )}
          
          <Button
            size="sm"
            variant="default"
            onClick={() => setShowConvertModal(true)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Convert to Member
          </Button>
          
          {!editMode && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditMode(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="followups">Follow-Ups</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Visitor Information</CardTitle>
                  <CardDescription>
                    {editMode ? 'Edit visitor details below' : 'Overview of visitor information'}
                  </CardDescription>
                </CardHeader>
                
                {editMode ? (
                  <form onSubmit={handleSaveVisitor}>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-4 mb-6">
                        <Avatar 
                          src={visitor.contacts?.profile_image} 
                          alt={visitorName}
                          size="lg"
                          className="border-2 border-white shadow-sm"
                        />
                        <div>
                          <h3 className="font-medium">Contact Information</h3>
                          <p className="text-sm text-muted-foreground">
                            {visitor.contacts?.email && (
                              <span className="block">Email: {visitor.contacts.email}</span>
                            )}
                            {visitor.contacts?.phone && (
                              <span className="block">Phone: {visitor.contacts.phone}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="firstVisit">First Visit Date</Label>
                        <Input
                          id="firstVisit"
                          name="firstVisit"
                          type="date"
                          value={formData.firstVisit}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="saved">Saved Status</Label>
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id="saved" 
                              checked={formData.saved}
                              onCheckedChange={handleSwitchChange}
                            />
                            <Label htmlFor="saved" className="text-sm font-medium cursor-pointer">
                              {formData.saved ? 'Saved' : 'Not saved'}
                            </Label>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Mark whether this visitor has accepted Jesus as their savior.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          rows={4}
                          placeholder="Any additional information about this visitor..."
                        />
                      </div>
                    </CardContent>
                    
                    <CardFooter className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setEditMode(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                ) : (
                  <CardContent className="space-y-6">
                    <div className="flex items-start gap-4">
                      <Avatar 
                        src={visitor.contacts?.profile_image} 
                        alt={visitorName}
                        size="lg"
                        className="border-2 border-white shadow-sm"
                      />
                      <div>
                        <h3 className="font-medium text-lg">{visitorName}</h3>
                        {visitor.contacts?.email && (
                          <p className="text-sm">
                            <span className="text-muted-foreground">Email:</span> {visitor.contacts.email}
                          </p>
                        )}
                        {visitor.contacts?.phone && (
                          <p className="text-sm">
                            <span className="text-muted-foreground">Phone:</span> {visitor.contacts.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">First Visit Date</h4>
                        <p>{formatDate(visitor.first_visit)}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Saved Status</h4>
                        <Badge variant={visitor.saved ? "success" : "outline"} className="mt-1">
                          {visitor.saved ? 'Saved' : 'Not saved'}
                        </Badge>
                      </div>
                    </div>
                    
                    {visitor.notes && (
                      <div className="pt-4 border-t">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                        <p className="text-sm whitespace-pre-line">{visitor.notes}</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setShowFollowUpModal(true)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Follow-Up
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setShowConvertModal(true)}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Convert to Member
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="followups" className="pt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle>Follow-Ups</CardTitle>
                  <CardDescription>
                    Scheduled follow-ups with this visitor
                  </CardDescription>
                </div>
                <Button onClick={() => setShowFollowUpModal(true)}>
                  <Calendar className="mr-2 h-4 w-4" />
                  New Follow-Up
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {followUps.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No follow-ups scheduled yet</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowFollowUpModal(true)}
                  >
                    Schedule First Follow-Up
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {followUps.map((followUp) => (
                    <div 
                      key={followUp.id} 
                      className={`p-4 border rounded-lg ${followUp.completed ? 'bg-muted/30' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant={followUp.completed ? "outline" : "default"}>
                              {followUp.type}
                            </Badge>
                            <span className="text-sm font-medium">
                              {formatDate(followUp.scheduled_date)}
                            </span>
                          </div>
                          <p className="mt-2">{followUp.notes}</p>
                          {followUp.assigned_to && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Assigned to: {followUp.assigned_to}
                            </p>
                          )}
                        </div>
                        <Badge variant={followUp.completed ? "success" : "outline"}>
                          {followUp.completed ? (
                            <>
                              <Check className="h-3 w-3 mr-1" /> 
                              Completed
                            </>
                          ) : (
                            <>
                              <Calendar className="h-3 w-3 mr-1" /> 
                              Pending
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {visitorName} from your visitors? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteVisitor}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Visitor'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Follow-Up Modal */}
      <FollowUpModal
        open={showFollowUpModal}
        onOpenChange={setShowFollowUpModal}
        contactId={visitor.contact_id}
        contactName={visitorName}
      />
      
      {/* Convert to Member Modal */}
      <ConvertToMemberModal
        open={showConvertModal}
        onOpenChange={setShowConvertModal}
        contactId={visitor.contact_id}
        contactName={visitorName}
        onSuccess={handleConvertSuccess}
      />
    </div>
  )
} 