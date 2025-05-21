'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { createTransaction } from '@/services/transactions'

import { supabase } from '@/lib/supabase'

// Define contact type
type Contact = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export default function NewTransactionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [formState, setFormState] = useState({
    contact_id: '',
    amount: '',
    currency: 'USD',
    category: 'General',
    payment_method: 'Cash',
    transacted_at: new Date().toISOString().split('T')[0],
    notes: ''
  })

  // Load contacts for the dropdown
  useEffect(() => {
    const fetchContacts = async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email')
        .order('last_name', { ascending: true })
      
      if (error) {
        console.error('Error loading contacts:', error)
        return
      }
      
      setContacts(data || [])
    }
    
    fetchContacts()
  }, [])

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
      
      const { error } = await createTransaction({
        ...formState,
        amount
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Transaction has been created'
      })
      
      router.push('/finance/giving')
    } catch (err) {
      console.error('Failed to create transaction:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create transaction'
      })
    } finally {
      setLoading(false)
    }
  }

  const getContactLabel = (contact: Contact) => {
    return `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">New Transaction</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact_id">Donor</Label>
              <Select 
                name="contact_id" 
                onValueChange={(value) => handleSelectChange('contact_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a donor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anonymous">Anonymous</SelectItem>
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
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/finance/giving')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Transaction'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 