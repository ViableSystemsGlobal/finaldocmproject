'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  UserPlus, 
  Filter,
  Search, 
  Loader2, 
  Eye, 
  Pencil, 
  Trash2, 
  UserCheck, 
  Users,
  RefreshCw, 
  UserCog
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MetricCard } from '@/components/MetricCard'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  SoulWinning, 
  fetchSouls,
  deleteSoul,
  getSoulWinningMetrics,
  convertSoulToVisitor,
  convertSoulToMember
} from '@/services/soulWinning'

export default function SoulWinningPage() {
  // State
  const [souls, setSouls] = useState<SoulWinning[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSaved, setFilterSaved] = useState<string>('all')
  const [filterInviter, setFilterInviter] = useState<string>('all')
  
  // Metrics state
  const [metrics, setMetrics] = useState({
    totalSouls: 0,
    totalSaved: 0,
    totalConvertedToVisitor: 0,
    totalConvertedToMember: 0,
    visitorConversionRate: 0,
    memberConversionRate: 0,
    pendingFollowUps: 0,
    byInviterType: {} as Record<string, number>,
    loading: true
  })
  
  // Delete confirmation states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingSoul, setDeletingSoul] = useState<SoulWinning | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Convert confirmation states
  const [showConvertDialog, setShowConvertDialog] = useState(false)
  const [convertingTo, setConvertingTo] = useState<'visitor' | 'member' | null>(null)
  const [convertingSoul, setConvertingSoul] = useState<SoulWinning | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  
  // Load initial data and metrics
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        
        // Load metrics first
        const metricsResponse = await getSoulWinningMetrics()
        if (metricsResponse.error) {
          throw metricsResponse.error
        }
        
        setMetrics({
          ...metricsResponse,
          loading: false
        })
        
        // Fetch souls
        const { data, error } = await fetchSouls()
        
        if (error) throw error
        
        console.log('Loaded souls:', data)
        setSouls((data || []) as unknown as SoulWinning[])
      } catch (err) {
        console.error('Failed to load soul winning data:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load soul winning data'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadInitialData()
  }, [])
  
  // Filter souls based on search query and filters
  const filteredSouls = souls.filter(soul => {
    // Use the renamed field for contacts
    const contactsField = soul.contacts ?? null;
    
    // Check if it matches search query
    const matchesSearch = searchQuery.trim() === '' || 
      (contactsField && 
        (`${contactsField.first_name || ''} ${contactsField.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (contactsField.email || '').toLowerCase().includes(searchQuery.toLowerCase()))
      ) ||
      (soul.inviter_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (soul.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check if it matches saved filter
    const matchesSaved = filterSaved === 'all' || 
      (filterSaved === 'saved' && soul.saved) ||
      (filterSaved === 'unsaved' && !soul.saved);
    
    // Check if it matches inviter filter
    const matchesInviter = filterInviter === 'all' || soul.inviter_type === filterInviter;
    
    return matchesSearch && matchesSaved && matchesInviter;
  });
  
  // Get unique inviter types for filter
  const inviterTypes = Array.from(new Set(souls.map(soul => soul.inviter_type)))
    .filter(Boolean)
    .sort();
  
  // Handle delete
  const openDeleteDialog = (soul: SoulWinning) => {
    setDeletingSoul(soul)
    setShowDeleteDialog(true)
  }
  
  const confirmDelete = async () => {
    if (!deletingSoul) return
    
    try {
      setIsDeleting(true)
      
      const { error } = await deleteSoul(deletingSoul.contact_id)
      
      if (error) throw error
      
      // Remove deleted soul from state
      setSouls(souls.filter(s => s.contact_id !== deletingSoul.contact_id))
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalSouls: Math.max(0, prev.totalSouls - 1),
        totalSaved: deletingSoul.saved 
          ? Math.max(0, prev.totalSaved - 1) 
          : prev.totalSaved
      }))
      
      toast({
        title: 'Success',
        description: 'Soul winning record deleted successfully'
      })
      
      setShowDeleteDialog(false)
    } catch (err) {
      console.error('Failed to delete soul winning record:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete soul winning record'
      })
    } finally {
      setIsDeleting(false)
      setDeletingSoul(null)
    }
  }
  
  // Handle conversion
  const openConvertDialog = (soul: SoulWinning, convertTo: 'visitor' | 'member') => {
    setConvertingSoul(soul)
    setConvertingTo(convertTo)
    setShowConvertDialog(true)
  }
  
  const confirmConvert = async () => {
    if (!convertingSoul || !convertingTo) return
    
    try {
      setIsConverting(true)
      console.log(`Starting conversion of contact ${convertingSoul.contact_id} to ${convertingTo}`)
      
      let result;
      if (convertingTo === 'visitor') {
        result = await convertSoulToVisitor(convertingSoul.contact_id)
      } else {
        result = await convertSoulToMember(convertingSoul.contact_id)
      }
      
      console.log('Conversion result:', result)
      
      if (result.error) {
        console.error('Conversion error:', result.error)
        throw result.error
      }
      
      // Update metrics to include the conversion
      setMetrics(prev => {
        const newMetrics = { ...prev };
        
        if (convertingTo === 'visitor') {
          newMetrics.totalConvertedToVisitor++;
          newMetrics.visitorConversionRate = parseFloat(
            ((newMetrics.totalConvertedToVisitor / newMetrics.totalSouls) * 100).toFixed(1)
          );
        } else {
          newMetrics.totalConvertedToMember++;
          newMetrics.memberConversionRate = parseFloat(
            ((newMetrics.totalConvertedToMember / newMetrics.totalSouls) * 100).toFixed(1)
          );
        }
        
        return newMetrics;
      })
      
      toast({
        title: 'Success',
        description: `Contact successfully converted to ${convertingTo}`
      })
      
      // Reload page data to reflect the changes
      setTimeout(() => {
        window.location.reload()
      }, 1500)
      
      setShowConvertDialog(false)
    } catch (err) {
      console.error(`Failed to convert soul to ${convertingTo}:`, err)
      let errorMessage = err instanceof Error ? err.message : String(err)
      
      // Make error message more user-friendly
      if (errorMessage.includes('foreign key constraint')) {
        errorMessage = 'This record cannot be converted due to database constraints.'
      }
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to convert soul to ${convertingTo}: ${errorMessage}`
      })
    } finally {
      setIsConverting(false)
      setConvertingSoul(null)
      setConvertingTo(null)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading soul winning data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Soul Winning</h1>

      {/* Metrics Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total Souls"
          value={metrics.loading ? 0 : metrics.totalSouls}
          icon={<Users className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="number"
        />
        <MetricCard
          title="Salvations"
          value={metrics.loading ? 0 : metrics.totalSaved}
          icon={<UserCheck className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="number"
        />
        <MetricCard
          title="Pending Follow-Ups"
          value={metrics.loading ? 0 : metrics.pendingFollowUps}
          icon={<RefreshCw className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="number"
        />
      </div>
      
      {/* Conversion Metrics */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="md:col-span-2">
          <MetricCard
            title="Visitor Conversion"
            value={metrics.loading ? 0 : metrics.visitorConversionRate}
            icon={<UserCog className="h-6 w-6" />}
            loading={metrics.loading}
            formatter="percentage"
          />
        </div>
        <div className="md:col-span-2">
          <MetricCard
            title="Member Conversion"
            value={metrics.loading ? 0 : metrics.memberConversionRate}
            icon={<UserCheck className="h-6 w-6" />}
            loading={metrics.loading}
            formatter="percentage"
          />
        </div>
        <div className="md:col-span-1">
          <MetricCard
            title="Overall Conversion"
            value={metrics.loading ? 0 : (metrics.visitorConversionRate + metrics.memberConversionRate)}
            icon={<Users className="h-6 w-6" />}
            loading={metrics.loading}
            formatter="percentage"
          />
        </div>
      </div>

      {/* Souls List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Soul Winning Records</CardTitle>
              <CardDescription>
                {filteredSouls.length} records found
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/people/outreach/soul-winning/new">
                <UserPlus className="mr-2 h-4 w-4" />
                New Soul
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, inviter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={filterSaved}
                  onValueChange={setFilterSaved}
                >
                  <SelectTrigger className="w-[150px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <span>{filterSaved === 'all' ? 'All' : filterSaved === 'saved' ? 'Saved' : 'Unsaved'}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="saved">Saved</SelectItem>
                    <SelectItem value="unsaved">Unsaved</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={filterInviter}
                  onValueChange={setFilterInviter}
                >
                  <SelectTrigger className="w-[180px]">
                    <UserCog className="mr-2 h-4 w-4" />
                    <span>{filterInviter === 'all' ? 'All Inviters' : filterInviter}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Inviters</SelectItem>
                    {inviterTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Souls Table */}
            {filteredSouls.length === 0 ? (
              <div className="rounded-md border border-dashed p-10 text-center">
                <h3 className="text-lg font-medium">No soul winning records found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery.trim() !== '' || filterSaved !== 'all' || filterInviter !== 'all'
                    ? 'Try adjusting your search or filters' 
                    : 'Get started by creating your first soul winning record'}
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/people/outreach/soul-winning/new">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Soul
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date Logged</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Saved</TableHead>
                      <TableHead>Inviter</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSouls.map((soul) => (
                      <TableRow key={soul.contact_id}>
                        <TableCell>
                          {soul.created_at ? formatDate(soul.created_at) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {soul.contacts ? `${soul.contacts.first_name || ''} ${soul.contacts.last_name || ''}` : 'Unknown'}
                          </div>
                          {soul.contacts?.email && (
                            <div className="text-xs text-muted-foreground">
                              {soul.contacts.email}
                            </div>
                          )}
                          {soul.converted_to && (
                            <div className="mt-1">
                              <Badge 
                                variant="outline"
                                className={
                                  soul.converted_to === 'visitor'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100' 
                                    : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                                }
                              >
                                Converted to {soul.converted_to}
                              </Badge>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={soul.saved ? 'default' : 'secondary'}
                            className={
                              soul.saved 
                                ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                            }
                          >
                            {soul.saved ? 'Saved' : 'Not Saved'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm font-medium">{soul.inviter_type || 'Unknown'}</div>
                            {soul.inviter_name && (
                              <div className="text-xs text-muted-foreground">{soul.inviter_name}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate" title={soul.notes || ''}>
                            {soul.notes || ''}
                          </div>
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
                                <Link href={`/people/outreach/soul-winning/${soul.contact_id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/people/outreach/soul-winning/${soul.contact_id}?edit=true`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openConvertDialog(soul, 'visitor')}>
                                <UserCog className="mr-2 h-4 w-4" />
                                Convert to Visitor
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openConvertDialog(soul, 'member')}>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Convert to Member
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(soul)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
            <DialogTitle>Delete Soul Winning Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this soul winning record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </div>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Convert Confirmation Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Convert to {convertingTo === 'visitor' ? 'Visitor' : 'Member'}
            </DialogTitle>
            <DialogDescription>
              {convertingTo === 'visitor' 
                ? 'This will change the contact\'s lifecycle to visitor and create a visitor record.'
                : 'This will change the contact\'s lifecycle to member and create a member record.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConvertDialog(false)}
              disabled={isConverting}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={confirmConvert}
              disabled={isConverting}
            >
              {isConverting ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Converting...
                </div>
              ) : (
                `Convert to ${convertingTo === 'visitor' ? 'Visitor' : 'Member'}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 