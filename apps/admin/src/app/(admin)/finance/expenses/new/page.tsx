'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CreditCard, Plus, Loader2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { createExpense } from '@/services/expenses'

export default function NewExpensePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formState, setFormState] = useState({
    amount: '',
    category: 'General',
    vendor: '',
    spent_at: new Date().toISOString().split('T')[0],
    notes: ''
  })

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
      setLoading(true)
      
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
      
      const { error } = await createExpense({
        ...formState,
        amount
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Expense has been created successfully'
      })
      
      router.push('/finance/expenses')
    } catch (err) {
      console.error('Failed to create expense:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create expense'
      })
    } finally {
      setLoading(false)
    }
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
                  New Expense
                </h1>
                <p className="text-lg text-slate-600 mt-1">
                  Record a new expense or purchase
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Expense Details</h2>
                <p className="text-slate-300">Enter the details for this expense</p>
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
                  <p className="text-sm text-slate-500">
                    Enter the expense amount in USD
                  </p>
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
                  <p className="text-sm text-slate-500">
                    Choose the type of expense
                  </p>
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
                <p className="text-sm text-slate-500">
                  Who was this payment made to?
                </p>
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
                <p className="text-sm text-slate-500">
                  When was this expense incurred?
                </p>
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
                <p className="text-sm text-slate-500">
                  Any additional information about this expense
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/finance/expenses')}
                  disabled={loading}
                  className="rounded-xl px-8 py-3 border-2 border-slate-200 bg-white/50 hover:bg-white/80"
                >
                  <X className="mr-2 h-5 w-5" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl px-8 py-3 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white flex-1 sm:flex-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Expense...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-5 w-5" />
                      Create Expense
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 