'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { 
  fetchExpense, 
  updateExpense, 
  deleteExpense, 
  Expense 
} from '@/services/expenses'

export default function ExpenseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params
  
  const [expense, setExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
        description: 'Expense has been updated'
      })
      
      // Refresh expense data
      const { data } = await fetchExpense(id)
      setExpense(data as unknown as Expense)
      
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
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return
    }
    
    try {
      setSaving(true)
      
      const { error } = await deleteExpense(id)
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Expense has been deleted'
      })
      
      router.push('/finance/expenses')
    } catch (err) {
      console.error('Failed to delete expense:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete expense'
      })
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading expense...</span>
      </div>
    )
  }

  if (!expense) {
    return (
      <div className="text-center p-4">
        <p className="text-lg font-medium">Expense not found</p>
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={() => router.push('/finance/expenses')}
        >
          Back to Expenses
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push('/finance/expenses')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Expense Details</h1>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash className="mr-2 h-4 w-4" /> Delete
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Edit Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formState.amount}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  name="category" 
                  value={formState.category}
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                    <SelectItem value="Rent">Rent</SelectItem>
                    <SelectItem value="Supplies">Supplies</SelectItem>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Salaries">Salaries</SelectItem>
                    <SelectItem value="Events">Events</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                name="vendor"
                placeholder="Enter vendor name"
                value={formState.vendor}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="spent_at">Date</Label>
              <Input
                id="spent_at"
                name="spent_at"
                type="date"
                value={formState.spent_at}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Any additional information about this expense"
                value={formState.notes}
                onChange={handleChange}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/finance/expenses')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 