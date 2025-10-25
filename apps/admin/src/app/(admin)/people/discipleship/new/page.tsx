'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft,
  Loader2,
  Save,
  BookOpen,
  Users,
  MapPin,
  Clock,
  Calendar,
  GraduationCap,
  CheckCircle,
  Sparkles,
  FileText
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
import { GooglePlacesInput } from '@/components/GooglePlacesInput'
import { FileUpload } from '@/components/ui/FileUpload'
import { fetchCampuses } from '@/services/settings'

export default function NewDiscipleshipGroupPage() {
  const router = useRouter()
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [campusId, setCampusId] = useState('')
  const [leaderId, setLeaderId] = useState<string | undefined>(undefined)
  const [selectedLeader, setSelectedLeader] = useState<any>(undefined)
  const [isActive, setIsActive] = useState(true)
  const [curriculumFile, setCurriculumFile] = useState<File | null>(null)
  const [customFields, setCustomFields] = useState<Record<string, any>>({
    meeting_day: '',
    meeting_time: '',
    meeting_location: '',
    meeting_location_details: '',
    age_group: '',
    curriculum_name: ''
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

  // Handle location change from Google Places
  const handleLocationChange = (value: string, placeDetails?: any) => {
    setCustomFields(prev => ({
      ...prev,
      meeting_location: value,
      meeting_location_details: placeDetails ? JSON.stringify(placeDetails) : ''
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
      
      // TODO: Upload curriculum file if selected
      let curriculumUrl = ''
      if (curriculumFile) {
        // For now, we'll just store the filename - implement file upload service later
        curriculumUrl = curriculumFile.name
        console.log('Curriculum file to upload:', curriculumFile)
      }
      
      const groupData = {
        name,
        campus_id: campusId || undefined,
        leader_id: leaderId,
        status: isActive ? 'active' : 'inactive',
        custom_fields: {
          ...customFields,
          description,
          curriculum_file_url: curriculumUrl
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
        router.push(`/people/discipleship/${data[0].id}`)
      } else {
        router.push('/people/discipleship')
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Enhanced Header */}
        <div className="mb-12">
          <div className="flex items-center gap-6">
            <Button 
              variant="outline" 
              size="icon" 
              asChild
              className="bg-white/70 hover:bg-white/90 border-white/20 backdrop-blur-sm shadow-lg rounded-xl"
            >
              <Link href="/people/discipleship">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 rounded-2xl">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Create Discipleship Group
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Set up a new group for spiritual growth and mentoring
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Information Card */}
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Basic Information</h2>
                  <p className="text-slate-300">Group name, description, and settings</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="space-y-6">
                {/* Group Name */}
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-base font-semibold text-slate-700">
                    Group Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter group name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>
                
                {/* Campus */}
                <div className="space-y-3">
                  <Label htmlFor="campus" className="text-base font-semibold text-slate-700">
                    Campus
                  </Label>
                  <Select value={campusId} onValueChange={setCampusId} disabled={loadingCampuses}>
                    <SelectTrigger 
                      id="campus"
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-emerald-500 focus:ring-emerald-500"
                    >
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
                
                {/* Description */}
                <div className="space-y-3">
                  <Label htmlFor="description" className="text-base font-semibold text-slate-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Enter group description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="border-2 border-slate-200 rounded-xl bg-white/50 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                
                {/* Group Leader */}
                <div className="space-y-3">
                  <Label htmlFor="leader" className="text-base font-semibold text-slate-700">
                    Group Leader
                  </Label>
                  <LeaderSelect 
                    leaderId={leaderId}
                    onLeaderChange={setLeaderId}
                    selectedLeader={selectedLeader}
                    onSelectedLeaderChange={setSelectedLeader}
                  />
                </div>
                
                {/* Active Status */}
                <div className="flex items-center space-x-3 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <Switch
                    id="active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="active" className="font-medium text-slate-700">
                    Active Group
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Meeting Details Card */}
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Meeting Details</h2>
                  <p className="text-blue-100">Schedule and location information</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="space-y-6">
                {/* Meeting Day & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="meeting_day" className="text-base font-semibold text-slate-700">
                      <Calendar className="h-4 w-4 inline mr-2" />
                      Meeting Day
                    </Label>
                    <Select 
                      value={customFields.meeting_day} 
                      onValueChange={(value) => handleCustomFieldChange('meeting_day', value)}
                    >
                      <SelectTrigger 
                        id="meeting_day"
                        className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                      >
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
                  
                  <div className="space-y-3">
                    <Label htmlFor="meeting_time" className="text-base font-semibold text-slate-700">
                      <Clock className="h-4 w-4 inline mr-2" />
                      Meeting Time
                    </Label>
                    <Input
                      id="meeting_time"
                      type="time"
                      value={customFields.meeting_time}
                      onChange={(e) => handleCustomFieldChange('meeting_time', e.target.value)}
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {/* Meeting Location with Google Places */}
                <div className="space-y-3">
                  <Label htmlFor="meeting_location" className="text-base font-semibold text-slate-700">
                    <MapPin className="h-4 w-4 inline mr-2" />
                    Meeting Location
                  </Label>
                  <GooglePlacesInput
                    value={customFields.meeting_location}
                    onChange={handleLocationChange}
                    placeholder="Search for location"
                    className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                </div>
                
                {/* Age Group */}
                <div className="space-y-3">
                  <Label htmlFor="age_group" className="text-base font-semibold text-slate-700">
                    <Users className="h-4 w-4 inline mr-2" />
                    Age Group
                  </Label>
                  <Select 
                    value={customFields.age_group} 
                    onValueChange={(value) => handleCustomFieldChange('age_group', value)}
                  >
                    <SelectTrigger 
                      id="age_group"
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                    >
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
              </div>
            </div>
          </div>
        </div>

        {/* Curriculum & Resources Card */}
        <div className="mt-8">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Curriculum & Resources</h2>
                  <p className="text-purple-100">Study materials and resources for the group</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Curriculum Name */}
                <div className="space-y-3">
                  <Label htmlFor="curriculum_name" className="text-base font-semibold text-slate-700">
                    <FileText className="h-4 w-4 inline mr-2" />
                    Curriculum Name
                  </Label>
                  <Input
                    id="curriculum_name"
                    placeholder="Enter curriculum or study material name"
                    value={customFields.curriculum_name}
                    onChange={(e) => handleCustomFieldChange('curriculum_name', e.target.value)}
                    className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-slate-700">
                    <GraduationCap className="h-4 w-4 inline mr-2" />
                    Curriculum File
                  </Label>
                  <FileUpload
                    onFileSelect={setCurriculumFile}
                    selectedFile={curriculumFile}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md"
                    placeholder="Upload curriculum file (PDF, DOC, PPT, etc.)"
                    maxSizeMB={25}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/people/discipleship')}
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl border-2 border-slate-300 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Group...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Create Group
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 