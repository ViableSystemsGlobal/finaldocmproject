'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Settings, Loader2, Save, X, Trash2, CreditCard, Banknote, Smartphone, Globe, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

interface PaymentCategory {
  id: string
  name: string
  description: string | null
  category_type: 'card' | 'bank' | 'cash' | 'digital' | 'crypto' | 'other'
  is_active: boolean
  requires_reference: boolean
  order: number
  processing_fee_percentage: number | null
  created_at: string
  updated_at: string
}

const categoryIcons = {
  card: CreditCard,
  bank: Banknote,
  cash: DollarSign,
  digital: Smartphone,
  crypto: Globe,
  other: Settings
}

const categoryColors = {
  card: 'from-blue-500 to-indigo-600',
  bank: 'from-green-500 to-emerald-600',
  cash: 'from-amber-500 to-yellow-600',
  digital: 'from-purple-500 to-violet-600',
  crypto: 'from-orange-500 to-red-600',
  other: 'from-slate-500 to-gray-600'
}

export default function PaymentCategoriesPage() {
  const [categories, setCategories] = useState<PaymentCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<PaymentCategory | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_type: 'card' as const,
    is_active: true,
    requires_reference: false,
    processing_fee_percentage: 0
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/settings/payment-categories')
      if (!response.ok) throw new Error('Failed to fetch payment categories')
      const data = await response.json()
      setCategories(data.sort((a: PaymentCategory, b: PaymentCategory) => a.order - b.order))
    } catch (error) {
      console.error('Error fetching payment categories:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load payment categories'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingCategory 
        ? `/api/settings/payment-categories/${editingCategory.id}`
        : '/api/settings/payment-categories'
      
      const method = editingCategory ? 'PUT' : 'POST'
      const order = editingCategory?.order || categories.length + 1

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, order })
      })

      if (!response.ok) throw new Error('Failed to save payment category')

      toast({
        title: 'Success',
        description: `Payment category ${editingCategory ? 'updated' : 'created'} successfully`
      })

      await fetchCategories()
      resetForm()
    } catch (error) {
      console.error('Error saving payment category:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save payment category'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (category: PaymentCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      category_type: category.category_type,
      is_active: category.is_active,
      requires_reference: category.requires_reference,
      processing_fee_percentage: category.processing_fee_percentage || 0
    })
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/settings/payment-categories/${deleteId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete payment category')

      toast({
        title: 'Success',
        description: 'Payment category deleted successfully'
      })

      await fetchCategories()
      setShowDeleteDialog(false)
      setDeleteId(null)
    } catch (error) {
      console.error('Error deleting payment category:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete payment category'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(categories)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update order in items
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1
    }))

    setCategories(updatedItems)

    try {
      await fetch('/api/settings/payment-categories/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: updatedItems.map((item, index) => ({ id: item.id, order: index + 1 })) })
      })

      toast({
        title: 'Success',
        description: 'Payment categories reordered successfully'
      })
    } catch (error) {
      console.error('Error reordering categories:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reorder payment categories'
      })
      await fetchCategories() // Revert on error
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category_type: 'card',
      is_active: true,
      requires_reference: false,
      processing_fee_percentage: 0
    })
    setEditingCategory(null)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Loading payment categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="hover:bg-white/50 rounded-xl">
              <Link href="/settings">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Settings
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Payment Categories</h1>
              <p className="text-slate-600">Manage payment methods and their settings for transactions</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Payment Category
          </Button>
        </div>

        {/* Payment Categories List */}
        <Card className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Categories ({categories.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {categories.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No payment categories found</h3>
                <p className="text-slate-600 mb-4">Create your first payment category to organize transaction methods</p>
                <Button onClick={() => setShowForm(true)} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Payment Category
                </Button>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="categories">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                      {categories.map((category, index) => {
                        const IconComponent = categoryIcons[category.category_type]
                        return (
                          <Draggable key={category.id} draggableId={category.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-4 rounded-xl border transition-all duration-200 ${
                                  snapshot.isDragging 
                                    ? 'bg-white shadow-lg scale-105' 
                                    : 'bg-gradient-to-r from-white to-slate-50 border-slate-200 hover:shadow-md'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg bg-gradient-to-r ${categoryColors[category.category_type]}`}>
                                      <IconComponent className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-slate-800">{category.name}</h3>
                                        <Badge variant={category.is_active ? 'default' : 'secondary'}>
                                          {category.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <Badge variant="outline" className="capitalize">
                                          {category.category_type}
                                        </Badge>
                                        {category.requires_reference && (
                                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                            Ref Required
                                          </Badge>
                                        )}
                                        {category.processing_fee_percentage && (
                                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            {category.processing_fee_percentage}% fee
                                          </Badge>
                                        )}
                                      </div>
                                      {category.description && (
                                        <p className="text-sm text-slate-600 mt-1">{category.description}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEdit(category)}
                                      className="hover:bg-blue-50 hover:text-blue-600"
                                    >
                                      <Settings className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setDeleteId(category.id)
                                        setShowDeleteDialog(true)
                                      }}
                                      className="hover:bg-red-50 hover:text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">
                {editingCategory ? 'Edit Payment Category' : 'Add Payment Category'}
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Configure a payment method category for organizing transactions
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Credit Card, Bank Transfer"
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_type">Category Type</Label>
                  <Select
                    value={formData.category_type}
                    onValueChange={(value: any) => setFormData({...formData, category_type: value})}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="digital">Digital Payment</SelectItem>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of this payment method..."
                  rows={3}
                  className="rounded-xl resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="processing_fee">Processing Fee (%)</Label>
                  <Input
                    id="processing_fee"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.processing_fee_percentage}
                    onChange={(e) => setFormData({...formData, processing_fee_percentage: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                    className="rounded-xl"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="requires_reference"
                    checked={formData.requires_reference}
                    onCheckedChange={(checked) => setFormData({...formData, requires_reference: checked})}
                  />
                  <Label htmlFor="requires_reference" className="text-sm">Requires Reference</Label>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                  />
                  <Label htmlFor="is_active" className="text-sm">Active</Label>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={resetForm} className="rounded-xl">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {editingCategory ? 'Update' : 'Create'} Category
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">Confirm Deletion</DialogTitle>
              <DialogDescription className="text-slate-600">
                Are you sure you want to delete this payment category? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Category'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}