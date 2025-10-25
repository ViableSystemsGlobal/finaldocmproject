'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail,
  ArrowLeft,
  Loader2,
  Star,
  Building
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { 
  fetchCampuses, 
  deleteCampus,
  type Campus 
} from '@/services/settings'

export default function CampusesPage() {
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    campus: Campus | null
  }>({ open: false, campus: null })
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadCampuses()
  }, [])

  async function loadCampuses() {
    try {
      setIsLoading(true)
      const { success, data, error } = await fetchCampuses()
      
      if (success && data) {
        setCampuses(data)
      } else {
        console.error('Error loading campuses:', error)
        toast({
          title: 'Error',
          description: 'Failed to load campuses. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeleteCampus() {
    if (!deleteDialog.campus) return

    try {
      setIsDeleting(true)
      const { success, error } = await deleteCampus(deleteDialog.campus.id)
      
      if (success) {
        setCampuses(prev => prev.filter(c => c.id !== deleteDialog.campus?.id))
        toast({
          title: 'Campus deleted',
          description: 'The campus has been deleted successfully.',
        })
        setDeleteDialog({ open: false, campus: null })
      } else {
        console.error('Error deleting campus:', error)
        toast({
          title: 'Error',
          description: 'Failed to delete campus. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-lg text-slate-600">Loading campuses...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/90 via-emerald-600/90 to-teal-700/90" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center space-x-4 mb-6">
            <Button 
              asChild 
              variant="ghost" 
              size="sm"
              className="text-white hover:text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <Link href="/settings">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Settings
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">
                  Campus Management
                </h1>
                <p className="text-xl text-green-100 mt-2">
                  Manage your church campus locations
                </p>
              </div>
            </div>
            
            <Button 
              asChild
              className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm shadow-lg"
            >
              <Link href="/settings/campuses/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Campus
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-green-100 mt-4">
            <span>• Multiple Locations</span>
            <span>• Contact Information</span>
            <span>• Main Campus Settings</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {campuses.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-green-100 rounded-full mb-4">
                <Building className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No Campuses Yet</h3>
              <p className="text-slate-600 text-center max-w-md mb-6">
                Start by adding your first campus location. You can add multiple campuses and set contact information for each.
              </p>
              <Button 
                asChild
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
              >
                <Link href="/settings/campuses/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Campus
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <span>Campus Locations</span>
                  </CardTitle>
                  <CardDescription>
                    Manage your church campus locations and contact information
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  {campuses.length} {campuses.length === 1 ? 'Campus' : 'Campuses'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200/50">
                    <TableHead>Campus Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campuses.map((campus) => (
                    <TableRow key={campus.id} className="border-slate-200/50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Building className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">
                              {campus.name}
                              {campus.is_main && (
                                <Star className="w-4 h-4 text-yellow-500 inline ml-2" />
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-600">
                          {campus.address && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{campus.address}</span>
                            </div>
                          )}
                          {campus.city && campus.state && (
                            <div className="text-xs text-slate-500 mt-1">
                              {campus.city}, {campus.state} {campus.zip_code}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {campus.email && (
                            <div className="flex items-center space-x-1 text-sm text-slate-600">
                              <Mail className="w-3 h-3" />
                              <span>{campus.email}</span>
                            </div>
                          )}
                          {campus.phone && (
                            <div className="flex items-center space-x-1 text-sm text-slate-600">
                              <Phone className="w-3 h-3" />
                              <span>{campus.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {campus.is_main ? (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            Main Campus
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">
                            Campus
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            asChild
                            variant="ghost" 
                            size="sm"
                            className="text-slate-600 hover:text-slate-900"
                          >
                            <Link href={`/settings/campuses/${campus.id}`}>
                              <Edit className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setDeleteDialog({ open: true, campus })}
                            className="text-red-600 hover:text-red-900 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, campus: null })}>
        <DialogContent className="bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Delete Campus</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.campus?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ open: false, campus: null })}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteCampus}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Campus
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 