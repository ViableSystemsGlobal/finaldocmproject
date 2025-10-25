'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CreditCard, Edit, Trash2, Save, X, Eye, Loader2, Calendar, Building, DollarSign, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  fetchExpense, 
  updateExpense, 
  deleteExpense, 
  Expense 
} from '@/services/expenses'
import { format } from 'date-fns'

export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { id } = use(params)
  const isEditMode = searchParams.get('mode') === 'edit'
  
  const [expense, setExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editMode, setEditMode] = useState(isEditMode)
  const [formState, setFormState] = useState({
    amount: '',
    category: 'General',
    vendor: '',
    spent_at: '',
    notes: ''
  })

  // Load expense data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch expense details
        const { data, error } = await fetchExpense(id)
        
        if (error) throw error
        
        if (data) {
          setExpense(data as unknown as Expense)
          
          // Set form state from expense data
          setFormState({
            amount: data.amount.toString(),
            category: data.category || 'General',
            vendor: data.vendor || '',
            spent_at: new Date(data.spent_at).toISOString().split('T')[0],
            notes: data.notes || ''
          })
        }
      } catch (err) {
        console.error('Failed to load expense data:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load expense'
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [id])

  useEffect(() => {
    setEditMode(isEditMode)
  }, [isEditMode])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormState(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      
      // Validate amount
      const amount = parseFloat(formState.amount)
      if (isNaN(amount) || amount <= 0) {
        toast({
          variant: 'destructive',
          title: 'Invalid amount',
          description: 'Please enter a valid positive amount'
        })
        return
      }
      
      const { error } = await updateExpense(id, {
        ...formState,
        amount
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Expense has been updated successfully'
      })
      
      // Refresh expense data
      const { data } = await fetchExpense(id)
      setExpense(data as unknown as Expense)
      setEditMode(false)
      
    } catch (err) {
      console.error('Failed to update expense:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update expense'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const { error } = await deleteExpense(id)
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Expense has been deleted successfully'
      })
      
      router.push('/finance/expenses')
    } catch (err) {
      console.error('Failed to delete expense:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete expense'
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPp')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-orange-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Expense</h2>
          <p className="text-slate-600">Fetching expense details...</p>
        </div>
      </div>
    )
  }

  if (!expense) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
            <CreditCard className="h-8 w-8 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Expense Not Found</h2>
          <p className="text-slate-600 mb-6">The expense you're looking for doesn't exist.</p>
          <Button 
            onClick={() => router.push('/finance/expenses')}
            className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Expenses
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-100">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              asChild
              className="p-2 hover:bg-white/80 rounded-xl"
            >
              <Link href="/finance/expenses">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-red-500 to-orange-500 p-3 rounded-2xl">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {editMode ? 'Edit Expense' : 'Expense Details'}
                </h1>
                <p className="text-lg text-slate-600 mt-1">
                  {editMode ? 'Update expense information' : `Expense to ${expense.vendor || 'Unknown Vendor'}`}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {!editMode && (
              <Button
                onClick={() => setEditMode(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Expense
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {editMode ? (
          /* Edit Form */
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Edit className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Edit Expense</h2>
                  <p className="text-slate-300">Update the expense details</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Amount and Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="amount" className="text-base font-semibold text-slate-700">
                      Amount
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 text-lg font-bold">$</span>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        value={formState.amount}
                        onChange={handleChange}
                        className="pl-8 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-red-500 focus:ring-red-500 text-lg"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="category" className="text-base font-semibold text-slate-700">
                      Category
                    </Label>
                    <Select 
                      name="category" 
                      value={formState.category}
                      onValueChange={(value) => handleSelectChange('category', value)}
                    >
                      <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-red-500 focus:ring-red-500">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Utilities">Utilities</SelectItem>
                        <SelectItem value="Rent">Rent/Mortgage</SelectItem>
                        <SelectItem value="Supplies">Office Supplies</SelectItem>
                        <SelectItem value="Equipment">Equipment</SelectItem>
                        <SelectItem value="Maintenance">Maintenance & Repairs</SelectItem>
                        <SelectItem value="Salaries">Salaries & Benefits</SelectItem>
                        <SelectItem value="Events">Events & Programs</SelectItem>
                        <SelectItem value="Marketing">Marketing & Outreach</SelectItem>
                        <SelectItem value="Insurance">Insurance</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Vendor */}
                <div className="space-y-3">
                  <Label htmlFor="vendor" className="text-base font-semibold text-slate-700">
                    Vendor/Payee
                  </Label>
                  <Input
                    id="vendor"
                    name="vendor"
                    placeholder="Enter vendor or payee name"
                    value={formState.vendor}
                    onChange={handleChange}
                    className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-red-500 focus:ring-red-500"
                  />
                </div>

                {/* Date */}
                <div className="space-y-3">
                  <Label htmlFor="spent_at" className="text-base font-semibold text-slate-700">
                    Expense Date
                  </Label>
                  <Input
                    id="spent_at"
                    name="spent_at"
                    type="date"
                    value={formState.spent_at}
                    onChange={handleChange}
                    className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-red-500 focus:ring-red-500"
                    required
                  />
                </div>
                
                {/* Notes */}
                <div className="space-y-3">
                  <Label htmlFor="notes" className="text-base font-semibold text-slate-700">
                    Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Add any additional notes about this expense..."
                    value={formState.notes}
                    onChange={handleChange}
                    rows={4}
                    className="border-2 border-slate-200 rounded-xl bg-white/50 focus:border-red-500 focus:ring-red-500 resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditMode(false)}
                    disabled={saving}
                    className="rounded-xl px-8 py-3 border-2 border-slate-200 bg-white/50 hover:bg-white/80"
                  >
                    <X className="mr-2 h-5 w-5" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl px-8 py-3 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white flex-1 sm:flex-none"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="space-y-8">
            {/* Expense Overview */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Expense Overview</h2>
                    <p className="text-slate-300">Complete expense details</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Basic Info */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200">
                      <div className="bg-gradient-to-r from-red-500 to-orange-500 p-3 rounded-xl">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-600">Amount</p>
                        <p className="text-2xl font-bold text-red-800">
                          {formatCurrency(expense.amount)}
                        </p>
                        <p className="text-sm text-red-600">Expense Amount</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-xl">
                        <Building className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600">Vendor</p>
                        <p className="text-lg font-semibold text-blue-800">{expense.vendor || 'Unknown Vendor'}</p>
                        <p className="text-sm text-blue-600">ID: {expense.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </div>

                  {/* Expense Details */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-600">Category</p>
                        <p className="text-lg font-semibold text-purple-800">{expense.category}</p>
                        <Badge variant="outline" className="mt-1 bg-purple-50 text-purple-700 border-purple-200">
                          Expense Type
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
                      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-3 rounded-xl">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-orange-600">Expense Date</p>
                        <p className="text-lg font-semibold text-orange-800">{formatDate(expense.spent_at)}</p>
                        <p className="text-sm text-orange-600">
                          Created: {formatDate(expense.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                {expense.notes && (
                  <div className="mt-8 p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200">
                    <div className="flex items-start gap-3">
                      <div className="bg-gradient-to-r from-slate-500 to-gray-500 p-2 rounded-lg">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Notes</h3>
                        <p className="text-slate-700 leading-relaxed">{expense.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-slate-600">
              Are you sure you want to delete this expense? This action cannot be undone and will permanently remove the expense record to {expense.vendor || 'Unknown Vendor'}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
              className="rounded-xl px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Expense'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 