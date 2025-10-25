'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft,
  Loader2, 
  Users, 
  Plus,
  Minus,
  Save,
  X,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { fetchGroups, addMembership, removeMembership } from '@/services/groups'
import { fetchMemberGroupMemberships } from '@/services/memberDetails'
import { fetchContact } from '@/services/contacts'

type Group = {
  id: string
  name: string
  type: string
  campus?: { name: string }
  status: string
  member_count?: number
}

type MembershipChange = {
  groupId: string
  action: 'add' | 'remove'
  role: string
}

function AssignGroupsPageContent() {
  const searchParams = useSearchParams()
  const memberId = searchParams.get('member')
  
  // State
  const [member, setMember] = useState<any>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [memberGroups, setMemberGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  
  // Track changes
  const [changes, setChanges] = useState<MembershipChange[]>([])
  
  // Load data
  useEffect(() => {
    if (!memberId) {
      setError('No member ID provided')
      setLoading(false)
      return
    }
    
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load member details
        const { data: memberData, error: memberError } = await fetchContact(memberId)
        if (memberError) throw memberError
        setMember(memberData)
        
        // Load all groups
        const { data: groupsData, error: groupsError } = await fetchGroups()
        if (groupsError) throw groupsError
        setGroups(groupsData || [])
        
        // Load member's current groups
        const { data: memberGroupsData, error: memberGroupsError } = await fetchMemberGroupMemberships(memberId)
        if (memberGroupsError) throw memberGroupsError
        setMemberGroups(memberGroupsData || [])
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [memberId])
  
  // Filter groups
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          group.campus?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || group.type === typeFilter
    return matchesSearch && matchesType
  })
  
  // Check if member is in a group (considering changes)
  const isMemberInGroup = (groupId: string): boolean => {
    const currentlyInGroup = memberGroups.some(mg => mg.group_id === groupId)
    const hasAddChange = changes.some(c => c.groupId === groupId && c.action === 'add')
    const hasRemoveChange = changes.some(c => c.groupId === groupId && c.action === 'remove')
    
    if (hasAddChange) return true
    if (hasRemoveChange) return false
    return currentlyInGroup
  }
  
  // Get member's role in group
  const getMemberRole = (groupId: string): string => {
    const currentMembership = memberGroups.find(mg => mg.group_id === groupId)
    const addChange = changes.find(c => c.groupId === groupId && c.action === 'add')
    
    if (addChange) return addChange.role
    return currentMembership?.role || 'Member'
  }
  
  // Toggle membership
  const toggleMembership = (groupId: string, currentlyIn: boolean) => {
    if (currentlyIn) {
      // Remove from group
      setChanges(prev => {
        const filtered = prev.filter(c => c.groupId !== groupId)
        const wasOriginallyIn = memberGroups.some(mg => mg.group_id === groupId)
        
        if (wasOriginallyIn) {
          return [...filtered, { groupId, action: 'remove', role: '' }]
        }
        return filtered
      })
    } else {
      // Add to group with default role
      setChanges(prev => {
        const filtered = prev.filter(c => c.groupId !== groupId)
        return [...filtered, { groupId, action: 'add', role: 'Member' }]
      })
    }
  }
  
  // Update role for a pending addition
  const updateRole = (groupId: string, role: string) => {
    setChanges(prev => prev.map(c => 
      c.groupId === groupId && c.action === 'add' 
        ? { ...c, role } 
        : c
    ))
  }
  
  // Save changes
  const saveChanges = async () => {
    if (!memberId || changes.length === 0) return
    
    setSaving(true)
    let successCount = 0
    let errorCount = 0
    
    try {
      for (const change of changes) {
        try {
          if (change.action === 'add') {
            const { error } = await addMembership(change.groupId, memberId, change.role, undefined, false)
            if (error) throw error
          } else {
            const { error } = await removeMembership(change.groupId, memberId)
            if (error) throw error
          }
          successCount++
        } catch (error) {
          console.error(`Failed to ${change.action} membership:`, error)
          errorCount++
        }
      }
      
      if (successCount > 0) {
        toast({
          title: 'Success',
          description: `${successCount} group membership(s) updated successfully.`
        })
        
        // Reload member groups
        const { data: memberGroupsData } = await fetchMemberGroupMemberships(memberId)
        setMemberGroups(memberGroupsData || [])
        setChanges([])
      }
      
      if (errorCount > 0) {
        toast({
          variant: 'destructive',
          title: 'Partial Success',
          description: `${successCount} succeeded, ${errorCount} failed. Please check the console for details.`
        })
      }
      
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save group assignments. Please try again.'
      })
    } finally {
      setSaving(false)
    }
  }
  
  // Get unique group types for filter
  const uniqueTypes = Array.from(new Set(groups.map(g => g.type)))
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading group assignments...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 text-red-600 p-4 rounded-lg mb-4">
            <p className="font-medium">{error}</p>
          </div>
          <Link href="/people">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to People
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <Link href="/people">
              <Button variant="ghost" size="icon" className="mr-4 hover:bg-white/50 rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Assign Groups
              </h1>
              <p className="text-gray-600 mt-1">
                Manage group memberships for {member?.first_name} {member?.last_name}
              </p>
            </div>
          </div>
          
          {changes.length > 0 && (
            <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500 text-white p-2 rounded-lg">
                    <Save className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-800">Unsaved Changes</h3>
                    <p className="text-amber-700">{changes.length} pending group assignment change(s)</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setChanges([])}
                    disabled={saving}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={saveChanges}
                    disabled={saving}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Search and Filter */}
        <Card className="mb-8 bg-white/70 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter Groups
            </CardTitle>
            <CardDescription>
              Find groups to assign or remove from this member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by group name or campus..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 border-2 border-slate-200 rounded-xl"
                  style={{ color: 'rgb(15, 23, 42)' }}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48 h-12 border-2 border-slate-200 rounded-xl">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {/* Groups Table */}
        <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle>Available Groups</CardTitle>
            <CardDescription>
              Click the + or - buttons to assign or remove group memberships
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Campus</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Member Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center">
                          <Users className="h-8 w-8 text-slate-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800 mb-2">No groups found</h3>
                          <p className="text-slate-600">Try adjusting your search or filters.</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGroups.map((group) => {
                    const isIn = isMemberInGroup(group.id)
                    const role = getMemberRole(group.id)
                    const hasChange = changes.some(c => c.groupId === group.id)
                    
                    return (
                      <TableRow key={group.id} className={hasChange ? "bg-amber-50/50" : ""}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-slate-50 text-slate-700">
                            {group.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{group.campus?.name || 'No Campus'}</TableCell>
                        <TableCell>
                          <Badge variant={group.status === 'active' ? "default" : "secondary"}>
                            {group.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{group.member_count || 0}</TableCell>
                        <TableCell>
                          {isIn ? (
                            changes.some(c => c.groupId === group.id && c.action === 'add') ? (
                              <Select 
                                value={role} 
                                onValueChange={(newRole) => updateRole(group.id, newRole)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Member">Member</SelectItem>
                                  <SelectItem value="Leader">Leader</SelectItem>
                                  <SelectItem value="Co-Leader">Co-Leader</SelectItem>
                                  <SelectItem value="Helper">Helper</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant="secondary">{role}</Badge>
                            )
                          ) : (
                            <span className="text-slate-400">Not a member</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isIn ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => toggleMembership(group.id, true)}
                              className="rounded-lg"
                            >
                              <Minus className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => toggleMembership(group.id, false)}
                              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AssignGroupsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading...</p>
        </div>
      </div>
    }>
      <AssignGroupsPageContent />
    </Suspense>
  )
} 