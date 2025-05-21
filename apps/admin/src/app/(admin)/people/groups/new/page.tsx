'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { createGroup, fetchCampuses } from '@/services/groups'

type Campus = {
  id: string;
  name: string;
};

export default function NewGroupPage() {
  const router = useRouter()
  
  // Form state
  const [name, setName] = useState('')
  const [type, setType] = useState('small_group')
  const [campusId, setCampusId] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [customFields, setCustomFields] = useState<Record<string, any>>({})
  
  // Custom field inputs
  const [customFieldName, setCustomFieldName] = useState('')
  const [customFieldValue, setCustomFieldValue] = useState('')
  
  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [loading, setLoading] = useState(true)
  
  // Load campuses
  useEffect(() => {
    const loadCampuses = async () => {
      try {
        const { data, error } = await fetchCampuses()
        
        if (error) {
          throw new Error(error.message || 'Failed to load campuses')
        }
        
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
          description: err instanceof Error ? err.message : 'Failed to load campuses'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadCampuses()
  }, [])
  
  const handleAddCustomField = () => {
    if (!customFieldName.trim()) return
    
    setCustomFields(prev => ({
      ...prev,
      [customFieldName]: customFieldValue
    }))
    
    // Reset inputs
    setCustomFieldName('')
    setCustomFieldValue('')
  }
  
  const handleRemoveCustomField = (fieldName: string) => {
    const updatedFields = { ...customFields }
    delete updatedFields[fieldName]
    setCustomFields(updatedFields)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !type || !campusId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all required fields'
      })
      return
    }
    
    setSubmitting(true)
    
    try {
      const { error } = await createGroup({
        name,
        type,
        campus_id: campusId,
        status: isActive ? 'active' : 'inactive',
        custom_fields: Object.keys(customFields).length > 0 ? customFields : null,
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Group created successfully'
      })
      
      // Redirect to groups list
      router.push('/people/groups')
    } catch (err) {
      console.error('Failed to create group:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create group'
      })
      setSubmitting(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Group</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Group Information</CardTitle>
          <CardDescription>
            Create a new group or ministry in your church
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Group Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter group name"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">
                  Group Type <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={type} 
                  onValueChange={setType}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select group type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ministry">Ministry</SelectItem>
                    <SelectItem value="small_group">Small Group</SelectItem>
                    <SelectItem value="discipleship">Discipleship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="campus">
                  Campus <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={campusId}
                  onValueChange={setCampusId}
                >
                  <SelectTrigger id="campus">
                    <SelectValue placeholder="Select campus" />
                  </SelectTrigger>
                  <SelectContent>
                    {campuses.length > 0 ? (
                      campuses.map(campus => (
                        <SelectItem key={campus.id} value={campus.id}>
                          {campus.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        No campuses available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter group description"
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="active_status">Active Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="active_status" 
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="active_status" className="text-sm font-medium cursor-pointer">
                    {isActive ? 'Active' : 'Inactive'}
                  </Label>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Inactive groups won't appear in active group lists
              </p>
            </div>
            
            {/* Custom Fields Section */}
            <div className="border rounded-md p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Custom Fields</h3>
                <div className="p-1 bg-primary/10 rounded-full text-primary">
                  <Info className="h-4 w-4" />
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Add any additional fields you need to track for this group
              </p>
              
              {/* Custom fields input */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <Input
                    placeholder="Field name"
                    value={customFieldName}
                    onChange={(e) => setCustomFieldName(e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Field value"
                    value={customFieldValue}
                    onChange={(e) => setCustomFieldValue(e.target.value)}
                  />
                </div>
                <div>
                  <Button 
                    type="button" 
                    onClick={handleAddCustomField}
                    disabled={!customFieldName.trim()}
                    className="w-full"
                  >
                    Add Field
                  </Button>
                </div>
              </div>
              
              {/* Custom fields display */}
              {Object.keys(customFields).length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium">Added Fields:</h4>
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                            Field Name
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                            Value
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {Object.entries(customFields).map(([key, value]) => (
                          <tr key={key}>
                            <td className="px-4 py-2 text-sm">{key}</td>
                            <td className="px-4 py-2 text-sm">{value as string}</td>
                            <td className="px-4 py-2 text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveCustomField(key)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                Remove
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/people/groups')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || !name || !type || !campusId}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Group'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 