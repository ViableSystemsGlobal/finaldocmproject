'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, DollarSign, Edit, Trash2, Save, X, Eye, Loader2, Calendar, User, CreditCard, FileText, Settings } from 'lucide-react'
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
  fetchTransaction, 
  updateTransaction, 
  deleteTransaction, 
  Transaction 
} from '@/services/transactions'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { fetchActiveCampaigns, DonationCampaign } from '@/services/giving'
import { fetchGivingCategories, GivingCategory, fetchPaymentCategories, PaymentCategory } from '@/services/settings'

// Define contact type
type Contact = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export default function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { id } = use(params)
  const isEditMode = searchParams.get('mode') === 'edit'
  
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([])
  const [givingCategories, setGivingCategories] = useState<GivingCategory[]>([])
  const [paymentCategories, setPaymentCategories] = useState<PaymentCategory[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editMode, setEditMode] = useState(isEditMode)
  const [formState, setFormState] = useState({
    contact_id: 'anonymous',
    amount: '',
    currency: 'USD',
    category: 'General',
    payment_method: 'Cash',
    transacted_at: '',
    notes: ''
  })

  // Load transaction and contacts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch transaction details
        const { data: transactionData, error: transactionError } = await fetchTransaction(id)
        
        if (transactionError) throw transactionError
        
        if (transactionData) {
          setTransaction(transactionData as unknown as Transaction)
          
          // Set form state from transaction data
          setFormState({
            contact_id: transactionData.contact_id || 'anonymous',
            amount: transactionData.amount.toString(),
            currency: transactionData.currency || 'USD',
            category: transactionData.category || 'General',
            payment_method: transactionData.payment_method || 'Cash',
            transacted_at: new Date(transactionData.transacted_at).toISOString().split('T')[0],
            notes: transactionData.notes || ''
          })
        }
        
        // Fetch contacts for the dropdown
        const { data: contactsData, error: contactsError } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, email')
          .order('last_name', { ascending: true })
        
        if (contactsError) throw contactsError
        
        setContacts(contactsData || [])

        // Fetch campaigns
        const { data: campaignsData, error: campaignsError } = await fetchActiveCampaigns()
        if (!campaignsError) {
          setCampaigns(campaignsData || [])
        }

        // Fetch giving categories
        console.log('🔍 Fetching giving categories for edit form...')
        const { success: categoriesSuccess, data: categoriesData, error: categoriesError } = await fetchGivingCategories()
        if (categoriesError) {
          console.error('❌ Error loading giving categories:', categoriesError)
        } else if (categoriesSuccess && categoriesData) {
          const activeCategories = categoriesData.filter(cat => cat.is_active)
          console.log(`✅ Loaded ${activeCategories.length} active giving categories for edit form:`, activeCategories.map(c => c.name))
          setGivingCategories(activeCategories)
        } else {
          console.log('⚠️ No categories returned for edit form, using fallback')
        }

        // Fetch payment categories
        console.log('🔍 Fetching payment categories for edit form...')
        const { success: paymentSuccess, data: paymentData, error: paymentError } = await fetchPaymentCategories()
        if (paymentError) {
          console.error('❌ Error loading payment categories:', paymentError)
        } else if (paymentSuccess && paymentData) {
          console.log(`✅ Loaded ${paymentData.length} active payment categories for edit form:`, paymentData.map(c => c.name))
          setPaymentCategories(paymentData)
        } else {
          console.log('⚠️ No payment categories returned for edit form, using fallback')
        }
      } catch (err) {
        console.error('Failed to load transaction data:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load transaction'
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
      
      // Convert date to proper timestamp, preserving the original time if available
      let transactionDateTime;
      if (formState.transacted_at) {
        const selectedDate = new Date(formState.transacted_at);
        const originalDate = transaction?.transacted_at ? new Date(transaction.transacted_at) : new Date();
        
        // Use the selected date with the original time (or current time if no original)
        const combinedDateTime = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          originalDate.getHours(),
          originalDate.getMinutes(),
          originalDate.getSeconds(),
          originalDate.getMilliseconds()
        );
        transactionDateTime = combinedDateTime.toISOString();
      } else {
        transactionDateTime = transaction?.transacted_at || new Date().toISOString();
      }

      const { error } = await updateTransaction(id, {
        ...formState,
        contact_id: formState.contact_id === 'anonymous' ? undefined : formState.contact_id,
        amount,
        transacted_at: transactionDateTime
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Transaction has been updated successfully'
      })
      
      // Refresh transaction data
      const { data } = await fetchTransaction(id)
      setTransaction(data as unknown as Transaction)
      setEditMode(false)
      
    } catch (err) {
      console.error('Failed to update transaction:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update transaction'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const { error } = await deleteTransaction(id)
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Transaction has been deleted successfully'
      })
      
      router.push('/finance/giving')
    } catch (err) {
      console.error('Failed to delete transaction:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete transaction'
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const getContactLabel = (contact: Contact) => {
    return `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown'
  }

  const getDonorName = () => {
    if (!transaction) return 'Unknown'
    if (transaction.contacts) {
      const firstName = transaction.contacts.first_name || ''
      const lastName = transaction.contacts.last_name || ''
      return `${firstName} ${lastName}`.trim() || 'Anonymous'
    }
    return 'Anonymous'
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-emerald-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Transaction</h2>
          <p className="text-slate-600">Fetching transaction details...</p>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
            <DollarSign className="h-8 w-8 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Transaction Not Found</h2>
          <p className="text-slate-600 mb-6">The transaction you're looking for doesn't exist.</p>
          <Button 
            onClick={() => router.push('/finance/giving')}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Giving
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              asChild
              className="p-2 hover:bg-white/80 rounded-xl"
            >
              <Link href="/finance/giving">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-2xl">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {editMode ? 'Edit Transaction' : 'Transaction Details'}
                </h1>
                <p className="text-lg text-slate-600 mt-1">
                  {editMode ? 'Update transaction information' : `Transaction from ${getDonorName()}`}
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
                Edit Transaction
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
                  <h2 className="text-2xl font-bold text-white">Edit Transaction</h2>
                  <p className="text-slate-300">Update the transaction details</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Donor Selection */}
                <div className="space-y-3">
                  <Label htmlFor="contact_id" className="text-base font-semibold text-slate-700">
                    Donor
                  </Label>
                  <Select 
                    name="contact_id" 
                    value={formState.contact_id}
                    onValueChange={(value) => handleSelectChange('contact_id', value)}
                  >
                    <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-green-500 focus:ring-green-500">
                      <SelectValue placeholder="Select a donor or choose anonymous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anonymous">Anonymous Donor</SelectItem>
                      {contacts.map(contact => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {getContactLabel(contact)}
                          {contact.email && (
                            <span className="text-slate-500 ml-2">({contact.email})</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Amount and Currency */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-3">
                    <Label htmlFor="amount" className="text-base font-semibold text-slate-700">
                      Amount
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        value={formState.amount}
                        onChange={handleChange}
                        className="pl-12 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-green-500 focus:ring-green-500 text-lg"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="currency" className="text-base font-semibold text-slate-700">
                      Currency
                    </Label>
                    <Select 
                      name="currency" 
                      value={formState.currency}
                      onValueChange={(value) => handleSelectChange('currency', value)}
                    >
                      <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-green-500 focus:ring-green-500">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="CAD">CAD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Category and Payment Method */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="category" className="text-base font-semibold text-slate-700">
                      Category
                    </Label>
                    <Select 
                      name="category" 
                      value={formState.category}
                      onValueChange={(value) => handleSelectChange('category', value)}
                    >
                      <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-green-500 focus:ring-green-500">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {givingCategories.length > 0 ? (
                          givingCategories.map(category => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="General">General Offering</SelectItem>
                            <SelectItem value="Tithe">Tithe</SelectItem>
                            <SelectItem value="Building Fund">Building Fund</SelectItem>
                            <SelectItem value="Missions">Missions</SelectItem>
                            <SelectItem value="Youth">Youth Ministry</SelectItem>
                            <SelectItem value="Benevolence">Benevolence</SelectItem>
                            <SelectItem value="Special Event">Special Event</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="payment_method" className="text-base font-semibold text-slate-700">
                      Payment Method
                    </Label>
                    <Select 
                      name="payment_method" 
                      value={formState.payment_method}
                      onValueChange={(value) => handleSelectChange('payment_method', value)}
                    >
                      <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-green-500 focus:ring-green-500">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentCategories.length > 0 ? (
                          paymentCategories.map(category => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name}
                              {category.processing_fee_percentage && (
                                <span className="text-slate-500 ml-2">({category.processing_fee_percentage}% fee)</span>
                              )}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Check">Check</SelectItem>
                            <SelectItem value="Credit Card">Credit Card</SelectItem>
                            <SelectItem value="Debit Card">Debit Card</SelectItem>
                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            <SelectItem value="Online">Online Payment</SelectItem>
                            <SelectItem value="Mobile App">Mobile App</SelectItem>
                            <SelectItem value="Cryptocurrency">Cryptocurrency</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Transaction Date */}
                <div className="space-y-3">
                  <Label htmlFor="transacted_at" className="text-base font-semibold text-slate-700">
                    Transaction Date
                  </Label>
                  <Input
                    id="transacted_at"
                    name="transacted_at"
                    type="date"
                    value={formState.transacted_at}
                    onChange={handleChange}
                    className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-green-500 focus:ring-green-500"
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
                    placeholder="Add any additional notes about this transaction..."
                    value={formState.notes}
                    onChange={handleChange}
                    rows={4}
                    className="border-2 border-slate-200 rounded-xl bg-white/50 focus:border-green-500 focus:ring-green-500 resize-none"
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
                    className="rounded-xl px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white flex-1 sm:flex-none"
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
            {/* Transaction Overview */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Transaction Overview</h2>
                    <p className="text-slate-300">Complete transaction details</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Basic Info */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-600">Amount</p>
                        <p className="text-2xl font-bold text-green-800">
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-sm text-green-600 uppercase">{transaction.currency}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-xl">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600">Donor</p>
                        <p className="text-lg font-semibold text-blue-800">{getDonorName()}</p>
                        <p className="text-sm text-blue-600">ID: {transaction.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-600">Payment Method</p>
                        <p className="text-lg font-semibold text-purple-800">{transaction.payment_method}</p>
                        <Badge variant="outline" className="mt-1 bg-purple-50 text-purple-700 border-purple-200">
                          {transaction.category}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
                      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-3 rounded-xl">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-orange-600">Transaction Date</p>
                        <p className="text-lg font-semibold text-orange-800">{formatDate(transaction.transacted_at)}</p>
                        <p className="text-sm text-orange-600">
                          Created: {formatDate(transaction.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Transaction IDs Section */}
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200">
                      <div className="bg-gradient-to-r from-slate-500 to-gray-500 p-3 rounded-xl">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600">Transaction IDs</p>
                        <div className="space-y-1 mt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-500">ID:</span>
                            <code className="text-sm font-mono bg-slate-100 px-2 py-1 rounded text-slate-800">
                              {transaction.id}
                            </code>
                          </div>
                          {(transaction as any).stripe_payment_intent_id && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-500">Stripe PI:</span>
                              <code className="text-sm font-mono bg-blue-100 px-2 py-1 rounded text-blue-800">
                                {(transaction as any).stripe_payment_intent_id}
                              </code>
                            </div>
                          )}
                          {(transaction as any).stripe_charge_id && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-500">Stripe Charge:</span>
                              <code className="text-sm font-mono bg-blue-100 px-2 py-1 rounded text-blue-800">
                                {(transaction as any).stripe_charge_id}
                              </code>
                            </div>
                          )}
                          {(transaction as any).payment_status && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-500">Status:</span>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  (transaction as any).payment_status === 'succeeded' 
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : (transaction as any).payment_status === 'pending'
                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                              >
                                {(transaction as any).payment_status}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                {transaction.notes && (
                  <div className="mt-8 p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200">
                    <div className="flex items-start gap-3">
                      <div className="bg-gradient-to-r from-slate-500 to-gray-500 p-2 rounded-lg">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Notes</h3>
                        <p className="text-slate-700 leading-relaxed">{transaction.notes}</p>
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
              Are you sure you want to delete this transaction? This action cannot be undone and will permanently remove the transaction record from {getDonorName()}.
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
                'Delete Transaction'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 