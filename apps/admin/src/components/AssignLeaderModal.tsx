import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Search, User, Crown, Loader2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

type User = {
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  avatar_url?: string
}

type AssignLeaderModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  groupName: string
  onSuccess: () => void
}

export default function AssignLeaderModal({ 
  open, 
  onOpenChange, 
  groupId, 
  groupName, 
  onSuccess 
}: AssignLeaderModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [isPrimaryLeader, setIsPrimaryLeader] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      loadUsers()
    }
  }, [open])

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user => 
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchTerm, users])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      // Load group members with user profiles included
      const response = await fetch(`/api/admin/group-members?group_id=${groupId}&include_user_profiles=true`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch group members')
      }
      
      const data = await response.json()
      
      // Filter to only members who have user accounts and transform the data
      const membersWithAccounts = (data.members || []).filter((member: any) => 
        member.has_user_account && member.user_id
      )
      
      const transformedUsers = membersWithAccounts.map((member: any) => ({
        user_id: member.user_id,
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        email: member.email || '',
        phone: member.phone || '',
        avatar_url: undefined // Group members don't have avatar URLs in this context
      }))
      
      setUsers(transformedUsers)
    } catch (err) {
      console.error('Failed to load group members:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load group members'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedUserId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a user to assign as leader'
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/group-leaders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: groupId,
          userId: selectedUserId,
          role: isPrimaryLeader ? 'leader' : 'co-leader'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to assign leader')
      }

      toast({
        title: 'Success',
        description: 'Leader assigned successfully'
      })

      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (err: any) {
      console.error('Failed to assign leader:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to assign leader'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSearchTerm('')
    setSelectedUserId('')
    setIsPrimaryLeader(false)
  }

  const handleClose = () => {
    onOpenChange(false)
    resetForm()
  }

  const selectedUser = users.find(u => u.user_id === selectedUserId)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Assign Leader to {groupName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Group Members</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search group members by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* User List */}
          <div className="space-y-2">
            <Label>Select Group Member</Label>
            <div className="max-h-60 overflow-y-auto border rounded-md">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No group members found matching your search' : 'No group members with user accounts available. Members need user accounts to be assigned as leaders.'}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.user_id}
                    onClick={() => setSelectedUserId(user.user_id)}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 ${
                      selectedUserId === user.user_id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <img 
                        src={user.avatar_url || '/default-avatar.png'} 
                        alt={`${user.first_name} ${user.last_name}`}
                        className="w-full h-full object-cover"
                      />
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    {selectedUserId === user.user_id && (
                      <div className="text-blue-500">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Primary Leader Option */}
          {selectedUser && (
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-md border">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                <div>
                  <div className="font-medium text-sm">Make Primary Leader</div>
                  <div className="text-xs text-gray-600">
                    Primary leaders have additional privileges
                  </div>
                </div>
              </div>
              <Switch
                checked={isPrimaryLeader}
                onCheckedChange={setIsPrimaryLeader}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedUserId || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign Leader'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 