'use client'

import { useState, useEffect } from 'react'
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Loader2,
  FormInput,
  GripVertical,
  Eye,
  EyeOff,
  Type,
  AlignLeft,
  Calendar,
  ChevronDown,
  ToggleLeft,
  Hash,
  Mail,
  Phone
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { 
  fetchCustomFields, 
  createCustomField,
  updateCustomField,
  deleteCustomField,
  type CustomField 
} from '@/services/settings'

const fieldSchema = z.object({
  entity: z.string().min(1, 'Entity is required'),
  field_name: z.string().min(1, 'Field name is required').regex(/^[a-z_]+$/, 'Field name must be lowercase with underscores only'),
  field_label: z.string().min(1, 'Field label is required'),
  field_type: z.enum(['text', 'textarea', 'date', 'dropdown', 'toggle', 'number', 'email', 'phone']),
  options: z.array(z.string()).optional(),
  required: z.boolean(),
  visible: z.boolean(),
  order: z.number().min(0),
})

type FieldFormData = z.infer<typeof fieldSchema>

const fieldTypeIcons = {
  text: Type,
  textarea: AlignLeft,
  date: Calendar,
  dropdown: ChevronDown,
  toggle: ToggleLeft,
  number: Hash,
  email: Mail,
  phone: Phone,
}

const entityOptions = [
  { value: 'members', label: 'Members' },
  { value: 'visitors', label: 'Visitors' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'events', label: 'Events' },
  { value: 'groups', label: 'Groups' },
]

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<CustomField[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    field: CustomField | null
  }>({ open: false, field: null })
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    field: CustomField | null
  }>({ open: false, field: null })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<string>('all')
  const [optionInput, setOptionInput] = useState('')

  const form = useForm<FieldFormData>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      entity: 'members',
      field_name: '',
      field_label: '',
      field_type: 'text',
      options: [],
      required: false,
      visible: true,
      order: 0,
    },
  })

  const watchFieldType = form.watch('field_type')
  const watchOptions = form.watch('options') || []

  useEffect(() => {
    loadFields()
  }, [selectedEntity])

  async function loadFields() {
    try {
      setIsLoading(true)
      const { success, data, error } = await fetchCustomFields(selectedEntity === 'all' ? undefined : selectedEntity)
      
      if (success && data) {
        setFields(data)
      } else {
        console.error('Error loading custom fields:', error)
        toast({
          title: 'Error',
          description: 'Failed to load custom fields. Please try again.',
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

  function openEditDialog(field?: CustomField) {
    if (field) {
      form.reset({
        entity: field.entity,
        field_name: field.field_name,
        field_label: field.field_label,
        field_type: field.field_type,
        options: field.options || [],
        required: field.required,
        visible: field.visible,
        order: field.order,
      })
    } else {
      form.reset({
        entity: selectedEntity === 'all' ? 'members' : selectedEntity,
        field_name: '',
        field_label: '',
        field_type: 'text',
        options: [],
        required: false,
        visible: true,
        order: fields.length,
      })
    }
    setEditDialog({ open: true, field: field || null })
  }

  function addOption() {
    if (optionInput.trim()) {
      const currentOptions = form.getValues('options') || []
      form.setValue('options', [...currentOptions, optionInput.trim()])
      setOptionInput('')
    }
  }

  function removeOption(index: number) {
    const currentOptions = form.getValues('options') || []
    form.setValue('options', currentOptions.filter((_, i) => i !== index))
  }

  async function onSubmit(data: FieldFormData) {
    try {
      setIsSubmitting(true)
      
      let result
      if (editDialog.field) {
        // Update existing field
        result = await updateCustomField(editDialog.field.id, data)
      } else {
        // Create new field
        result = await createCustomField(data)
      }
      
      if (result.success) {
        toast({
          title: editDialog.field ? 'Field updated' : 'Field created',
          description: `Custom field "${data.field_label}" has been ${editDialog.field ? 'updated' : 'created'} successfully.`,
        })
        setEditDialog({ open: false, field: null })
        loadFields()
      } else {
        console.error('Error saving field:', result.error)
        toast({
          title: 'Error',
          description: 'Failed to save field. Please try again.',
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
      setIsSubmitting(false)
    }
  }

  async function handleDeleteField() {
    if (!deleteDialog.field) return

    try {
      setIsDeleting(true)
      const { success, error } = await deleteCustomField(deleteDialog.field.id)
      
      if (success) {
        setFields(prev => prev.filter(f => f.id !== deleteDialog.field?.id))
        toast({
          title: 'Field deleted',
          description: 'The custom field has been deleted successfully.',
        })
        setDeleteDialog({ open: false, field: null })
      } else {
        console.error('Error deleting field:', error)
        toast({
          title: 'Error',
          description: 'Failed to delete field. Please try again.',
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

  const groupedFields = fields.reduce((acc, field) => {
    if (!acc[field.entity]) {
      acc[field.entity] = []
    }
    acc[field.entity].push(field)
    return acc
  }, {} as Record<string, CustomField[]>)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-lg text-slate-600">Loading custom fields...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-700 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/90 via-violet-600/90 to-indigo-700/90" />
        
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
                <FormInput className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">
                  Custom Fields
                </h1>
                <p className="text-xl text-purple-100 mt-2">
                  Create dynamic form fields for your entities
                </p>
              </div>
            </div>
            
            <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, field: null })}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => openEditDialog()}
                  className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white/95 backdrop-blur-sm max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editDialog.field ? 'Edit Field' : 'Add New Field'}
                  </DialogTitle>
                  <DialogDescription>
                    {editDialog.field 
                      ? 'Update the custom field details below.'
                      : 'Create a new custom field for your forms.'
                    }
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="entity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Entity *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select entity" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {entityOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="field_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field Type *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="textarea">Textarea</SelectItem>
                                <SelectItem value="date">Date</SelectItem>
                                <SelectItem value="dropdown">Dropdown</SelectItem>
                                <SelectItem value="toggle">Toggle</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="phone">Phone</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="field_label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Field Label *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Emergency Contact, Dietary Restrictions" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="field_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Field Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., emergency_contact, dietary_restrictions" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Internal field name (lowercase, underscores only)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchFieldType === 'dropdown' && (
                      <div className="space-y-2">
                        <FormLabel>Dropdown Options</FormLabel>
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Add option..."
                            value={optionInput}
                            onChange={(e) => setOptionInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                          />
                          <Button type="button" onClick={addOption} variant="outline">
                            Add
                          </Button>
                        </div>
                        {watchOptions.length > 0 && (
                          <div className="space-y-1">
                            {watchOptions.map((option, index) => (
                              <div key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                                <span>{option}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOption(index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="required"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Required</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="visible"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Visible</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="order"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <DialogFooter>
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => setEditDialog({ open: false, field: null })}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {editDialog.field ? 'Updating...' : 'Creating...'}
                          </>
                        ) : (
                          <>
                            {editDialog.field ? 'Update' : 'Create'} Field
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-purple-100 mt-4">
            <span>• Dynamic Forms</span>
            <span>• Field Types</span>
            <span>• Validation Rules</span>
            <span>• Display Order</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center space-x-4">
          <Select value={selectedEntity} onValueChange={setSelectedEntity}>
            <SelectTrigger className="w-48 bg-white/80 backdrop-blur-sm border-slate-200/50">
              <SelectValue placeholder="All Entities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {entityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {fields.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-purple-100 rounded-full mb-4">
                <FormInput className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No Custom Fields Yet</h3>
              <p className="text-slate-600 text-center max-w-md mb-6">
                Start by creating your first custom field. Add dynamic fields to forms for collecting additional information.
              </p>
              <Button 
                onClick={() => openEditDialog()}
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Field
              </Button>
            </CardContent>
          </Card>
        ) : selectedEntity !== 'all' ? (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2 capitalize">
                    <FormInput className="w-5 h-5 text-purple-600" />
                    <span>{selectedEntity} Fields</span>
                  </CardTitle>
                  <CardDescription>
                    Custom fields for {selectedEntity} forms
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                  {fields.filter(f => f.visible).length} Visible
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200/50">
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Visible</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field) => {
                    const Icon = fieldTypeIcons[field.field_type]
                    return (
                      <TableRow key={field.id} className="border-slate-200/50">
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <GripVertical className="w-4 h-4 text-slate-400" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Icon className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">
                                {field.field_label}
                              </div>
                              <div className="text-sm text-slate-500">
                                {field.field_name}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {field.field_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {field.required ? (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              Required
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">
                              Optional
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {field.visible ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-slate-400" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {field.order}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openEditDialog(field)}
                              className="text-slate-600 hover:text-slate-900"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setDeleteDialog({ open: true, field })}
                              className="text-red-600 hover:text-red-900 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedFields).map(([entity, entityFields]) => (
              <Card key={entity} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-200/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2 capitalize">
                      <FormInput className="w-5 h-5 text-purple-600" />
                      <span>{entity} Fields</span>
                    </CardTitle>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                      {entityFields.length} Fields
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {entityFields.map((field) => {
                      const Icon = fieldTypeIcons[field.field_type]
                      return (
                        <div key={field.id} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg group hover:bg-slate-100 transition-colors">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Icon className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">
                              {field.field_label}
                            </div>
                            <div className="text-sm text-slate-500 capitalize">
                              {field.field_type} {field.required && '• Required'} {!field.visible && '• Hidden'}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openEditDialog(field)}
                              className="text-slate-600 hover:text-slate-900 h-8 w-8 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setDeleteDialog({ open: true, field })}
                              className="text-red-600 hover:text-red-900 hover:bg-red-50 h-8 w-8 p-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, field: null })}>
        <DialogContent className="bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Delete Field</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.field?.field_label}"? This will permanently remove the field and all its data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ open: false, field: null })}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteField}
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
                  Delete Field
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 