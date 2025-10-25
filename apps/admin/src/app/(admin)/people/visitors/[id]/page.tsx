'use client'

import { useEffect, useState } from 'react'
import { useNextParams } from '@/lib/nextParams'
import { fetchVisitor, deleteVisitor, fetchVisitorFollowUps } from '@/services/visitors'
import { Loader2, User, Mail, Phone, Calendar, ArrowLeft, Edit, Trash2, Check, X, UserPlus, MessageCircle } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { format } from 'date-fns'
import Link from 'next/link'
import { toast } from '@/components/ui/use-toast'
import { ConvertToMemberModal } from '@/components/ConvertToMemberModal'

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

export default function ViewVisitorPage() {
  const router = useRouter()
  const params = useParams();
  const { id } = useNextParams(params);
  const [visitor, setVisitor] = useState<Visitor | null>(null)
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const loadVisitor = async () => {
      try {
        const { data, error } = await fetchVisitor(id as string)
        if (error) throw error
        setVisitor(data as unknown as Visitor)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load visitor')
      } finally {
        setLoading(false)
      }
    }

    loadVisitor()
  }, [id])

  useEffect(() => {
    const loadFollowUps = async () => {
      if (!id) return
      
      try {
        const { data, error } = await fetchVisitorFollowUps(id as string)
        if (error) throw error
        setFollowUps(data as unknown as FollowUp[] || [])
      } catch (err) {
        console.error('Failed to load follow-ups:', err)
      }
    }
    
    loadFollowUps()
  }, [id])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const { error } = await deleteVisitor(id as string)
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Visitor deleted successfully'
      })
      
      router.push('/people/visitors')
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete visitor'
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleConvertSuccess = () => {
    setShowConvertModal(false)
    // Refresh visitor data
    window.location.reload()
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy')
    } catch {
      return 'Invalid date'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-pink-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Visitor</h2>
          <p className="text-slate-600">Retrieving visitor information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8">
            <div className="text-red-500 text-lg font-semibold">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  if (!visitor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8">
            <div className="text-slate-600 text-lg">Visitor not found</div>
          </div>
        </div>
      </div>
    )
  }

  const visitorName = visitor.contacts 
    ? `${visitor.contacts.first_name} ${visitor.contacts.last_name}`
    : 'Unknown Visitor'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/people/visitors')}
              className="hover:bg-white/50 rounded-xl"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Visitors
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-2xl">
                  <User className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {visitorName}
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Visitor Details
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                asChild
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg px-6 py-3 rounded-xl"
              >
                <Link href={`/people/visitors/${visitor.contact_id}/edit`}>
                  <Edit className="mr-2 h-5 w-5" />
                  Edit Visitor
                </Link>
              </Button>
              
              <Button 
                onClick={() => setShowDeleteDialog(true)}
                variant="destructive"
                className="px-6 py-3 rounded-xl"
              >
                <Trash2 className="mr-2 h-5 w-5" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <Avatar 
                  src={visitor.contacts?.profile_image} 
                  alt={visitorName}
                  size="lg"
                  className="border-2 border-slate-200 shadow-md"
                />
                <div>
                  <h4 className="text-lg font-semibold text-slate-800">{visitorName}</h4>
                  <p className="text-slate-600">Church Visitor</p>
                </div>
              </div>
              
              {visitor.contacts?.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <div>
                    <span className="text-sm text-slate-500">Email</span>
                    <p className="text-slate-800 font-medium">{visitor.contacts.email}</p>
                  </div>
                </div>
              )}
              
              {visitor.contacts?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <div>
                    <span className="text-sm text-slate-500">Phone</span>
                    <p className="text-slate-800 font-medium">{visitor.contacts.phone}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-slate-500" />
                <div>
                  <span className="text-sm text-slate-500">First Visit</span>
                  <p className="text-slate-800 font-medium">{formatDate(visitor.first_visit)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <div>
                  <span className="text-sm text-slate-500">Salvation Status</span>
                  <Badge variant={visitor.saved ? "default" : "secondary"} className={`ml-2 ${
                    visitor.saved 
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white" 
                      : "bg-slate-100 text-slate-700"
                  }`}>
                    {visitor.saved ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                    {visitor.saved ? "Saved" : "Not saved"}
                  </Badge>
                </div>
              </div>
            </div>
            
            {!visitor.saved && (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <Button
                  onClick={() => setShowConvertModal(true)}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-lg rounded-xl"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Convert to Member
                </Button>
              </div>
            )}
          </div>

          {/* Notes and Follow-ups */}
          <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Notes & Follow-ups
            </h3>
            
            <div className="space-y-6">
              {/* Notes */}
              <div>
                <h4 className="text-sm font-semibold text-slate-600 mb-2">Notes</h4>
                {visitor.notes ? (
                  <div className="bg-slate-50 p-4 rounded-lg border">
                    <p className="text-slate-800">{visitor.notes}</p>
                  </div>
                ) : (
                  <div className="text-slate-500 text-center py-4">
                    <p>No notes available</p>
                  </div>
                )}
              </div>
              
              {/* Follow-ups */}
              <div>
                <h4 className="text-sm font-semibold text-slate-600 mb-2">Recent Follow-ups</h4>
                {followUps.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {followUps.slice(0, 3).map((followUp) => (
                      <div key={followUp.id} className="bg-slate-50 p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-800">{followUp.type}</span>
                          <Badge variant={followUp.completed ? "default" : "secondary"}>
                            {followUp.completed ? "Completed" : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{followUp.notes}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDate(followUp.scheduled_date)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 text-center py-4">
                    <p>No follow-ups recorded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Confirm Delete</h3>
              <p className="text-sm text-slate-600 mt-2">Are you sure you want to delete this visitor? This action cannot be undone.</p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-xl px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Member Modal */}
      {showConvertModal && (
        <ConvertToMemberModal
          open={showConvertModal}
          onOpenChange={setShowConvertModal}
          contactId={visitor.contact_id}
          contactName={visitorName}
          onSuccess={handleConvertSuccess}
        />
      )}
    </div>
  )
} 