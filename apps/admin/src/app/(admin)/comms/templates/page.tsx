'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Loader2, Pencil, Trash2, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { CommsTemplate, fetchTemplates, deleteTemplate } from '@/services/comms/templates'
import { formatDistanceToNow } from 'date-fns'

export default function TemplatesPage() {
  try {
    const [templates, setTemplates] = useState<CommsTemplate[]>([])
    const [filteredTemplates, setFilteredTemplates] = useState<CommsTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [channelFilter, setChannelFilter] = useState<string>('all')
    
    // Delete dialog state
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [templateToDelete, setTemplateToDelete] = useState<CommsTemplate | null>(null)
    const [deleting, setDeleting] = useState(false)
    
    // Load templates
    useEffect(() => {
      async function loadTemplates() {
        setLoading(true)
        try {
          console.log('Fetching templates...')
          const { data, error } = await fetchTemplates()
          
          if (error) {
            console.error('Error fetching templates:', error)
            throw error
          }
          
          console.log('Templates loaded:', data)
          setTemplates(data || [])
          setFilteredTemplates(data || [])
        } catch (error) {
          console.error('Failed to load templates:', error)
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load templates. Please try again.'
          })
        } finally {
          setLoading(false)
        }
      }
      
      loadTemplates()
    }, [])
    
    // Apply filters when search or channel filter changes
    useEffect(() => {
      let filtered = [...templates]
      
      // Apply channel filter
      if (channelFilter !== 'all') {
        filtered = filtered.filter(template => template.channel === channelFilter)
      }
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(template => 
          template.name.toLowerCase().includes(query) ||
          (template.subject || '').toLowerCase().includes(query)
        )
      }
      
      setFilteredTemplates(filtered)
    }, [templates, searchQuery, channelFilter])
    
    // Handle delete template
    const handleDelete = (template: CommsTemplate) => {
      setTemplateToDelete(template)
      setShowDeleteDialog(true)
    }
    
    const confirmDelete = async () => {
      if (!templateToDelete) return
      
      setDeleting(true)
      
      try {
        const { success, error } = await deleteTemplate(templateToDelete.id)
        
        if (!success) throw error
        
        // Remove from local state
        setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id))
        
        toast({
          title: 'Template deleted',
          description: `Template "${templateToDelete.name}" has been deleted.`
        })
        
        setShowDeleteDialog(false)
      } catch (error) {
        console.error('Failed to delete template:', error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete template. Please try again.'
        })
      } finally {
        setDeleting(false)
        setTemplateToDelete(null)
      }
    }
    
    // Get badge color for channel
    const getChannelBadge = (channel: string) => {
      switch (channel) {
        case 'email':
          return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Email</Badge>
        case 'sms':
          return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">SMS</Badge>
        case 'whatsapp':
          return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">WhatsApp</Badge>
        case 'push':
          return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Push</Badge>
        default:
          return <Badge>{channel}</Badge>
      }
    }
    
    // Format relative time
    const formatRelativeTime = (dateString: string) => {
      try {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true })
      } catch (e) {
        return 'Invalid date'
      }
    }
    
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Templates</CardTitle>
              <CardDescription>
                Create and manage communication templates for your campaigns
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/comms/templates/new">
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-full sm:w-auto flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="All Channels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Table */}
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8 border rounded-md">
                  <p className="text-muted-foreground">
                    {templates.length === 0 ? 
                      'No templates found. Create your first template!' :
                      'No templates match your search criteria.'
                    }
                  </p>
                  {templates.length === 0 && (
                    <Button variant="outline" asChild className="mt-4">
                      <Link href="/comms/templates/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Template
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell className="font-medium">
                            {template.name}
                          </TableCell>
                          <TableCell>
                            {getChannelBadge(template.channel)}
                          </TableCell>
                          <TableCell>
                            {template.subject ? template.subject : 
                              <span className="text-muted-foreground text-sm italic">
                                {template.channel === 'email' || template.channel === 'push' ? 'No subject' : 'N/A'}
                              </span>
                            }
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatRelativeTime(template.updated_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  Actions
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/comms/templates/${template.id}`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(template)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Template</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the template "{templateToDelete?.name}"?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  } catch (error) {
    console.error('Critical error rendering TemplatesPage:', error)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <p className="text-red-500 font-semibold mb-2">Error loading templates</p>
        <p className="text-muted-foreground">Please check the console for more details.</p>
      </div>
    )
  }
} 