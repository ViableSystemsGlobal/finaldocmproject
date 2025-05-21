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
  fetchTransaction, 
  updateTransaction, 
  deleteTransaction, 
  Transaction 
} from '@/services/transactions'

import { supabase } from '@/lib/supabase'

// Define contact type
type Contact = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export default function TransactionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params
  
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formState, setFormState] = useState({
    contact_id: '',
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
            contact_id: transactionData.contact_id || '',
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
      
      const { error } = await updateTransaction(id, {
        ...formState,
        amount
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Transaction has been updated'
      })
      
      // Refresh transaction data
      const { data } = await fetchTransaction(id)
      setTransaction(data as unknown as Transaction)
      
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
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return
    }
    
    try {
      setSaving(true)
      
      const { error } = await deleteTransaction(id)
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Transaction has been deleted'
      })
      
      router.push('/finance/giving')
    } catch (err) {
      console.error('Failed to delete transaction:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete transaction'
      })
      setSaving(false)
    }
  }

  const getContactLabel = (contact: Contact) => {
    return `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading transaction...</span>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="text-center p-4">
        <p className="text-lg font-medium">Transaction not found</p>
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={() => router.push('/finance/giving')}
        >
          Back to Transactions
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push('/finance/giving')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Transaction Details</h1>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash className="mr-2 h-4 w-4" /> Delete
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Edit Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact_id">Donor</Label>
              <Select 
                name="contact_id" 
                value={formState.contact_id}
                onValueChange={(value) => handleSelectChange('contact_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a donor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Anonymous</SelectItem>
                  {contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {getContactLabel(contact)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
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
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  name="currency" 
                  value={formState.currency}
                  onValueChange={(value) => handleSelectChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="Tithe">Tithe</SelectItem>
                    <SelectItem value="Building Fund">Building Fund</SelectItem>
                    <SelectItem value="Missions">Missions</SelectItem>
                    <SelectItem value="Youth">Youth</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select 
                  name="payment_method" 
                  value={formState.payment_method}
                  onValueChange={(value) => handleSelectChange('payment_method', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Check">Check</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Venmo">Venmo</SelectItem>
                    <SelectItem value="PayPal">PayPal</SelectItem>
                    <SelectItem value="Stripe">Stripe</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transacted_at">Date</Label>
              <Input
                id="transacted_at"
                name="transacted_at"
                type="date"
                value={formState.transacted_at}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Any additional information about this transaction"
                value={formState.notes}
                onChange={handleChange}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/finance/giving')}
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