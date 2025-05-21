'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft,
  Loader2,
  Save
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { Switch } from '@/components/ui/switch'
import { createDiscipleshipGroup, updateLeaderRole } from '@/services/discipleshipGroups'
import { LeaderSelect } from '@/components/discipleship/LeaderSelect'

// Mock function to fetch campuses - in a real implementation, import from campuses service
const fetchCampuses = async () => {
  return {
    data: [
      { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Main Campus' },
      { id: '38c7a6eb-5aff-4e9d-a7f0-15f2578be83a', name: 'North Campus' },
      { id: 'bb2b5b4c-89f1-4b62-9b9e-b06c6b120897', name: 'South Campus' },
    ],
    error: null
  };
};

export default function NewDiscipleshipGroupPage() {
  const router = useRouter()
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [campusId, setCampusId] = useState('')
  const [leaderId, setLeaderId] = useState<string | undefined>(undefined)
  const [selectedLeader, setSelectedLeader] = useState<any>(undefined)
  const [isActive, setIsActive] = useState(true)
  const [customFields, setCustomFields] = useState<Record<string, any>>({
    meeting_day: '',
    meeting_time: '',
    meeting_location: '',
    age_group: '',
    curriculum: ''
  })
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [campuses, setCampuses] = useState<{id: string, name: string}[]>([])
  const [loadingCampuses, setLoadingCampuses] = useState(true)
  
  // Load campuses
  useEffect(() => {
    const loadCampuses = async () => {
      try {
        setLoadingCampuses(true)
        const { data, error } = await fetchCampuses()
        
        if (error) throw error
        setCampuses(data || [])
        
        // Set default campus if available
        if (data && data.length > 0) {
          setCampusId(data[0].id)
        }
      } catch (err) {
        console.error('Failed to load campuses:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load campuses'
        })
      } finally {
        setLoadingCampuses(false)
      }
    }
    
    loadCampuses()
  }, [])
  
  // Handle custom field change
  const handleCustomFieldChange = (field: string, value: string) => {
    setCustomFields(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Group name is required'
      })
      return
    }
    
    try {
      setIsSubmitting(true)
      
      const groupData = {
        name,
        leader_id: leaderId,
        status: isActive ? 'active' : 'inactive',
        custom_fields: {
          ...customFields,
          description
        }
      }
      
      const { data, error } = await createDiscipleshipGroup(groupData)
      
      if (error) throw error
      
      // Set the leader's role if a leader was selected
      if (leaderId && data && data[0]?.id) {
        const { error: leaderError } = await updateLeaderRole(data[0].id, leaderId)
        if (leaderError) {
          console.error('Error setting leader role:', leaderError)
          // Continue anyway since the group was created successfully
        }
      }
      
      toast({
        title: 'Success',
        description: 'Discipleship group created successfully'
      })
      
      // Redirect to the group detail page
      if (data && data[0]?.id) {
        router.push(`/people/discipleship-groups/${data[0].id}`)
      } else {
        router.push('/people/discipleship-groups')
      }
    } catch (err) {
      console.error('Failed to create discipleship group:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create discipleship group'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-4">
          <Link href="/people/discipleship-groups">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">New Discipleship Group</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Group Information</CardTitle>
          <CardDescription>
            Create a new discipleship group for mentoring and spiritual growth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    placeholder="Enter group name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="campus">Campus</Label>
                  <Select value={campusId} onValueChange={setCampusId} disabled={loadingCampuses}>
                    <SelectTrigger id="campus">
                      <SelectValue placeholder="Select campus" />
                    </SelectTrigger>
                    <SelectContent>
                      {campuses.map((campus) => (
                        <SelectItem key={campus.id} value={campus.id}>
                          {campus.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter group description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="leader">Group Leader</Label>
                <LeaderSelect 
                  leaderId={leaderId}
                  onLeaderChange={setLeaderId}
                  selectedLeader={selectedLeader}
                  onSelectedLeaderChange={setSelectedLeader}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
            
            {/* Custom Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Group Details</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="meeting_day">Meeting Day</Label>
                  <Select 
                    value={customFields.meeting_day} 
                    onValueChange={(value) => handleCustomFieldChange('meeting_day', value)}
                  >
                    <SelectTrigger id="meeting_day">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="tuesday">Tuesday</SelectItem>
                      <SelectItem value="wednesday">Wednesday</SelectItem>
                      <SelectItem value="thursday">Thursday</SelectItem>
                      <SelectItem value="friday">Friday</SelectItem>
                      <SelectItem value="saturday">Saturday</SelectItem>
                      <SelectItem value="sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="meeting_time">Meeting Time</Label>
                  <Input
                    id="meeting_time"
                    type="time"
                    value={customFields.meeting_time}
                    onChange={(e) => handleCustomFieldChange('meeting_time', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="meeting_location">Meeting Location</Label>
                <Input
                  id="meeting_location"
                  placeholder="Enter meeting location"
                  value={customFields.meeting_location}
                  onChange={(e) => handleCustomFieldChange('meeting_location', e.target.value)}
                />
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="age_group">Age Group</Label>
                  <Select 
                    value={customFields.age_group} 
                    onValueChange={(value) => handleCustomFieldChange('age_group', value)}
                  >
                    <SelectTrigger id="age_group">
                      <SelectValue placeholder="Select age group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="children">Children (5-12)</SelectItem>
                      <SelectItem value="youth">Youth (13-17)</SelectItem>
                      <SelectItem value="young_adults">Young Adults (18-25)</SelectItem>
                      <SelectItem value="adults">Adults (26-54)</SelectItem>
                      <SelectItem value="seniors">Seniors (55+)</SelectItem>
                      <SelectItem value="all_ages">All Ages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="curriculum">Curriculum</Label>
                  <Input
                    id="curriculum"
                    placeholder="Enter curriculum or study material"
                    value={customFields.curriculum}
                    onChange={(e) => handleCustomFieldChange('curriculum', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/people/discipleship-groups')}
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Group
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 