'use client'

import { useState, useEffect } from 'react'
import { 
  Heart, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Loader2,
  DollarSign,
  GripVertical
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  Form,
  FormControl,
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
  fetchGivingCategories, 
  createGivingCategory,
  updateGivingCategory,
  deleteGivingCategory,
  type GivingCategory 
} from '@/services/settings'

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  is_active: z.boolean(),
  order: z.number().min(0),
})

type CategoryFormData = z.infer<typeof categorySchema>

export default function GivingCategoriesPage() {
  const [categories, setCategories] = useState<GivingCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    category: GivingCategory | null
  }>({ open: false, category: null })
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    category: GivingCategory | null
  }>({ open: false, category: null })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      is_active: true,
      order: 0,
    },
  })

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      setIsLoading(true)
      const { success, data, error } = await fetchGivingCategories()
      
      if (success && data) {
        setCategories(data)
      } else {
        console.error('Error loading giving categories:', error)
        toast({
          title: 'Error',
          description: 'Failed to load giving categories. Please try again.',
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

  function openEditDialog(category?: GivingCategory) {
    if (category) {
      form.reset({
        name: category.name,
        description: category.description || '',
        is_active: category.is_active,
        order: category.order,
      })
    } else {
      form.reset({
        name: '',
        description: '',
        is_active: true,
        order: categories.length,
      })
    }
    setEditDialog({ open: true, category: category || null })
  }

  async function onSubmit(data: CategoryFormData) {
    try {
      setIsSubmitting(true)
      
      let result
      if (editDialog.category) {
        // Update existing category
        result = await updateGivingCategory(editDialog.category.id, data)
      } else {
        // Create new category
        result = await createGivingCategory(data)
      }
      
      if (result.success) {
        toast({
          title: editDialog.category ? 'Category updated' : 'Category created',
          description: `Giving category "${data.name}" has been ${editDialog.category ? 'updated' : 'created'} successfully.`,
        })
        setEditDialog({ open: false, category: null })
        loadCategories()
      } else {
        console.error('Error saving category:', result.error)
        toast({
          title: 'Error',
          description: 'Failed to save category. Please try again.',
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

  async function handleDeleteCategory() {
    if (!deleteDialog.category) return

    try {
      setIsDeleting(true)
      const { success, error } = await deleteGivingCategory(deleteDialog.category.id)
      
      if (success) {
        setCategories(prev => prev.filter(c => c.id !== deleteDialog.category?.id))
        toast({
          title: 'Category deleted',
          description: 'The giving category has been deleted successfully.',
        })
        setDeleteDialog({ open: false, category: null })
      } else {
        console.error('Error deleting category:', error)
        toast({
          title: 'Error',
          description: 'Failed to delete category. Please try again.',
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
          <span className="text-lg text-slate-600">Loading giving categories...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-pink-600 via-rose-600 to-red-700 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600/90 via-rose-600/90 to-red-700/90" />
        
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
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">
                  Giving Categories
                </h1>
                <p className="text-xl text-pink-100 mt-2">
                  Manage donation categories and giving options
                </p>
              </div>
            </div>
            
            <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, category: null })}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => openEditDialog()}
                  className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white/95 backdrop-blur-sm">
                <DialogHeader>
                  <DialogTitle>
                    {editDialog.category ? 'Edit Category' : 'Add New Category'}
                  </DialogTitle>
                  <DialogDescription>
                    {editDialog.category 
                      ? 'Update the giving category details below.'
                      : 'Create a new giving category for donations.'
                    }
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Tithe, Building Fund, Missions" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Brief description of this giving category..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="order"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Order</FormLabel>
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

                    <DialogFooter>
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => setEditDialog({ open: false, category: null })}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {editDialog.category ? 'Updating...' : 'Creating...'}
                          </>
                        ) : (
                          <>
                            {editDialog.category ? 'Update' : 'Create'} Category
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-pink-100 mt-4">
            <span>• Donation Categories</span>
            <span>• Display Order</span>
            <span>• Active Status</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {categories.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-pink-100 rounded-full mb-4">
                <DollarSign className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No Categories Yet</h3>
              <p className="text-slate-600 text-center max-w-md mb-6">
                Start by creating your first giving category. Common categories include Tithe, Building Fund, and Missions.
              </p>
              <Button 
                onClick={() => openEditDialog()}
                className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Category
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="w-5 h-5 text-pink-600" />
                    <span>Giving Categories</span>
                  </CardTitle>
                  <CardDescription>
                    Manage donation categories and their display order
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-pink-100 text-pink-800 border-pink-200">
                  {categories.filter(c => c.is_active).length} Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200/50">
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Category Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id} className="border-slate-200/50">
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <GripVertical className="w-4 h-4 text-slate-400" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-pink-100 rounded-lg">
                            <Heart className="w-4 h-4 text-pink-600" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">
                              {category.name}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-600 max-w-xs truncate">
                          {category.description || 'No description'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {category.order}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {category.is_active ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditDialog(category)}
                            className="text-slate-600 hover:text-slate-900"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setDeleteDialog({ open: true, category })}
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
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, category: null })}>
        <DialogContent className="bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.category?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ open: false, category: null })}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteCategory}
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
                  Delete Category
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 