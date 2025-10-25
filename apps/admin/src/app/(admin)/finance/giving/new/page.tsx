'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, DollarSign, Plus, Loader2, Save, X, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { createTransaction } from '@/services/transactions'
import { supabase } from '@/lib/supabase'
import { fetchActiveCampaigns, DonationCampaign } from '@/services/giving'
import { fetchGivingCategories, GivingCategory, fetchPaymentCategories, PaymentCategory } from '@/services/settings'
import { createContact } from '@/services/contacts'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

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
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([])
  const [givingCategories, setGivingCategories] = useState<GivingCategory[]>([])
  const [paymentCategories, setPaymentCategories] = useState<PaymentCategory[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState('general')
  const [donorType, setDonorType] = useState<'existing' | 'new' | 'guest' | 'anonymous'>('existing')
  const [formState, setFormState] = useState({
    contact_id: '',
    amount: '',
    currency: 'USD',
    category: 'General',
    payment_method: 'Cash',
    transacted_at: new Date().toISOString().split('T')[0],
    notes: '',
    // Guest/New donor fields
    guest_first_name: '',
    guest_last_name: '',
    guest_email: '',
    guest_phone: '',
    create_contact: false
  })

  // Load contacts, campaigns, and giving categories for the dropdowns
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

    const fetchCampaigns = async () => {
      const { data, error } = await fetchActiveCampaigns()
      
      if (error) {
        console.error('Error loading campaigns:', error)
        return
      }
      
      setCampaigns(data || [])
    }

    const fetchCategories = async () => {
      console.log('🔍 Fetching giving categories...')
      const { success, data, error } = await fetchGivingCategories()
      
      if (error) {
        console.error('❌ Error loading giving categories:', error)
        console.log('💡 Will use fallback categories')
        return
      }
      
      if (!success || !data) {
        console.log('⚠️ No categories returned, using fallback')
        return
      }
      
      const activeCategories = data.filter(cat => cat.is_active)
      console.log(`✅ Loaded ${activeCategories.length} active giving categories:`, activeCategories.map(c => c.name))
      setGivingCategories(activeCategories)
      
      // Set default category to the first active category if available
      if (activeCategories.length > 0 && formState.category === 'General') {
        setFormState(prev => ({ ...prev, category: activeCategories[0].name }))
      }
    }

    const fetchPaymentMethods = async () => {
      console.log('🔍 Fetching payment categories...')
      const { success, data, error } = await fetchPaymentCategories()
      
      if (error) {
        console.error('❌ Error loading payment categories:', error)
        console.log('💡 Will use fallback payment methods')
        return
      }
      
      if (!success || !data) {
        console.log('⚠️ No payment categories returned, using fallback')
        return
      }
      
      console.log(`✅ Loaded ${data.length} active payment categories:`, data.map(c => c.name))
      setPaymentCategories(data)
      
      // Set default payment method to the first active category if available
      if (data.length > 0 && formState.payment_method === 'Cash') {
        setFormState(prev => ({ ...prev, payment_method: data[0].name }))
      }
    }
    
    fetchContacts()
    fetchCampaigns()
    fetchCategories()
    fetchPaymentMethods()
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

      // Validate donor information based on donor type
      if (donorType === 'new' && (!formState.guest_first_name || !formState.guest_last_name)) {
        toast({
          variant: 'destructive',
          title: 'Missing information',
          description: 'First and last name are required for new contacts'
        })
        return
      }

      if (donorType === 'existing' && !formState.contact_id) {
        toast({
          variant: 'destructive',
          title: 'No contact selected',
          description: 'Please select an existing contact'
        })
        return
      }
      
      // Determine final category and fund designation based on campaign selection
      const finalCategory = (selectedCampaign && selectedCampaign !== 'general') ? selectedCampaign : formState.category
      const selectedCampaignData = campaigns.find(c => `campaign_${c.id}` === selectedCampaign)
      const finalFundDesignation = selectedCampaignData?.name || formState.category

      // Determine payment status based on payment method
      // Cash, Check, and Bank Transfer are immediately "succeeded"
      // Credit/Debit cards and online payments might be "pending" until processed
      const immediateSuccessPayments = ['Cash', 'Check', 'Bank Transfer'];
      const payment_status = immediateSuccessPayments.includes(formState.payment_method) ? 'succeeded' : 'pending';

      // Convert date to proper timestamp with current time
      // If user selected a specific date, use that date with current time
      // If no date selected, use current date and time
      let transactionDateTime;
      if (formState.transacted_at) {
        // Create a new date with the selected date but current time
        const selectedDate = new Date(formState.transacted_at);
        const now = new Date();
        const combinedDateTime = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          now.getHours(),
          now.getMinutes(),
          now.getSeconds(),
          now.getMilliseconds()
        );
        transactionDateTime = combinedDateTime.toISOString();
      } else {
        transactionDateTime = new Date().toISOString();
      }

      // Handle contact creation for new donors
      let finalContactId = formState.contact_id;

      if (donorType === 'new' || (donorType === 'guest' && formState.create_contact)) {
        // Create a new contact using the service function
        try {
          const newContactData = {
            first_name: formState.guest_first_name || null,
            last_name: formState.guest_last_name || null,
            email: formState.guest_email || null,
            phone: formState.guest_phone || null,
            lifecycle: 'donor'
          };

          await createContact(newContactData);

          // Fetch the newly created contact to get its ID
          let contactQuery = supabase
            .from('contacts')
            .select('id')
            .eq('first_name', formState.guest_first_name)
            .eq('last_name', formState.guest_last_name);

          // Add email filter only if email is provided
          if (formState.guest_email) {
            contactQuery = contactQuery.eq('email', formState.guest_email);
          } else if (formState.guest_phone) {
            // If no email, try phone
            contactQuery = contactQuery.eq('phone', formState.guest_phone);
          }

          const { data: newContact, error: fetchError } = await contactQuery
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (fetchError || !newContact) {
            throw new Error('Failed to retrieve newly created contact');
          }

          finalContactId = newContact.id;
          toast({
            title: 'Contact created',
            description: `New contact created for ${formState.guest_first_name} ${formState.guest_last_name}`
          });
        } catch (contactError: any) {
          console.error('Error creating contact:', contactError);
          
          // Handle specific constraint violations with user-friendly messages
          let errorMessage = 'Failed to create new contact. Transaction will be recorded as guest.';
          
          if (contactError.message && contactError.message.includes('email address is already in use')) {
            errorMessage = 'This email address is already registered. The transaction will be recorded as guest.';
          } else if (contactError.message && contactError.message.includes('phone number is already in use')) {
            errorMessage = 'This phone number is already registered. The transaction will be recorded as guest.';
          }
          
          toast({
            variant: 'destructive',
            title: 'Error creating contact',
            description: errorMessage
          });
        }
      }

      // Prepare transaction data - only include fields that exist in the schema
      let transactionNotes = formState.notes;
      
      // Add guest donor info to notes if not creating a contact
      if (donorType === 'guest' && !formState.create_contact && formState.guest_first_name) {
        const guestInfo = [
          `Guest Donor: ${formState.guest_first_name} ${formState.guest_last_name}`.trim(),
          formState.guest_email ? `Email: ${formState.guest_email}` : '',
          formState.guest_phone ? `Phone: ${formState.guest_phone}` : ''
        ].filter(Boolean).join(', ');
        
        transactionNotes = transactionNotes 
          ? `${transactionNotes}\n\n${guestInfo}`
          : guestInfo;
      }

      const transactionData = {
        contact_id: finalContactId === 'anonymous' || finalContactId === '' ? undefined : finalContactId,
        amount,
        currency: formState.currency,
        category: finalCategory,
        payment_method: formState.payment_method,
        payment_status,
        transacted_at: transactionDateTime,
        notes: transactionNotes
      };

      // Note: Guest donor info is handled by notes field when no contact is created

      // Note: fund_designation field is not available in the current schema

      const { error } = await createTransaction(transactionData)
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Transaction has been created successfully'
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
                  New Transaction
                </h1>
                <p className="text-lg text-slate-600 mt-1">
                  Record a new donation or contribution
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
                <h2 className="text-2xl font-bold text-white">Transaction Details</h2>
                <p className="text-slate-300">Enter the details for this donation</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Donor Information */}
              <div className="space-y-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-blue-500 p-1.5 rounded-lg">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <Label className="text-base font-semibold text-slate-700">
                    Donor Information
                  </Label>
                </div>

                {/* Donor Type Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-700">How would you like to record the donor?</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: 'existing', label: 'Existing Contact', description: 'Select from contacts' },
                      { value: 'new', label: 'New Contact', description: 'Create new contact' },
                      { value: 'guest', label: 'Guest Donor', description: 'Basic info only' },
                      { value: 'anonymous', label: 'Anonymous', description: 'No personal info' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setDonorType(option.value as any)
                          if (option.value === 'anonymous') {
                            setFormState(prev => ({ ...prev, contact_id: 'anonymous' }))
                          } else {
                            setFormState(prev => ({ ...prev, contact_id: '' }))
                          }
                        }}
                        className={`p-3 rounded-xl border-2 transition-all duration-300 text-left ${
                          donorType === option.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <div className="font-semibold text-sm text-gray-900">{option.label}</div>
                        <div className="text-xs text-gray-600">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional Donor Fields */}
                {donorType === 'existing' && (
                  <div className="space-y-3">
                    <Label htmlFor="contact_id" className="text-sm font-semibold text-slate-700">
                      Select Existing Contact
                    </Label>
                    <Select 
                      name="contact_id" 
                      onValueChange={(value) => handleSelectChange('contact_id', value)}
                      value={formState.contact_id}
                    >
                      <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Choose an existing contact" />
                      </SelectTrigger>
                      <SelectContent>
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
                )}

                {(donorType === 'new' || donorType === 'guest') && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="guest_first_name" className="text-sm font-semibold text-slate-700">
                          First Name
                        </Label>
                        <Input
                          id="guest_first_name"
                          name="guest_first_name"
                          value={formState.guest_first_name}
                          onChange={handleChange}
                          className="h-10 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter first name"
                          required={donorType === 'new'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guest_last_name" className="text-sm font-semibold text-slate-700">
                          Last Name
                        </Label>
                        <Input
                          id="guest_last_name"
                          name="guest_last_name"
                          value={formState.guest_last_name}
                          onChange={handleChange}
                          className="h-10 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter last name"
                          required={donorType === 'new'}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="guest_email" className="text-sm font-semibold text-slate-700">
                          Email (Optional)
                        </Label>
                        <Input
                          id="guest_email"
                          name="guest_email"
                          type="email"
                          value={formState.guest_email}
                          onChange={handleChange}
                          className="h-10 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter email address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guest_phone" className="text-sm font-semibold text-slate-700">
                          Phone (Optional)
                        </Label>
                        <Input
                          id="guest_phone"
                          name="guest_phone"
                          type="tel"
                          value={formState.guest_phone}
                          onChange={handleChange}
                          className="h-10 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                    {donorType === 'guest' && (
                      <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                        <input
                          type="checkbox"
                          id="create_contact"
                          checked={formState.create_contact}
                          onChange={(e) => setFormState(prev => ({ ...prev, create_contact: e.target.checked }))}
                          className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor="create_contact" className="text-sm text-blue-700">
                          Save this as a new contact for future use
                        </Label>
                      </div>
                    )}
                  </div>
                )}

                {donorType === 'anonymous' && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">
                      ℹ️ This donation will be recorded as anonymous. No personal information will be stored.
                    </p>
                  </div>
                )}
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
                  <p className="text-sm text-slate-500">
                    Enter the donation amount
                  </p>
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
              
              {/* Campaign Selection */}
              <div className="space-y-3 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-green-500 p-1.5 rounded-lg">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <Label htmlFor="campaign" className="text-base font-semibold text-slate-700">
                    Campaign (Optional)
                  </Label>
                </div>
                <Select 
                  value={selectedCampaign} 
                  onValueChange={setSelectedCampaign}
                >
                  <SelectTrigger className="h-12 border-2 border-green-200 rounded-xl bg-white/70 focus:border-green-500 focus:ring-green-500">
                    <SelectValue placeholder="Select a campaign or leave blank for general fund" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Fund (No specific campaign)</SelectItem>
                    {campaigns.map(campaign => {
                      const progress = campaign.goal_amount 
                        ? Math.min((campaign.current_amount / campaign.goal_amount) * 100, 100)
                        : 0
                      return (
                        <SelectItem key={campaign.id} value={`campaign_${campaign.id}`}>
                          <div className="flex flex-col">
                            <span className="font-medium">{campaign.name}</span>
                            <span className="text-sm text-slate-500">
                              ${campaign.current_amount.toLocaleString()} of ${campaign.goal_amount?.toLocaleString() || '∞'} ({progress.toFixed(1)}%)
                            </span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-600">
                  🎯 Link this donation to a specific fundraising campaign for automatic progress tracking
                </p>
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
                  <p className="text-sm text-slate-500">
                    {givingCategories.length > 0 ? 'Choose the purpose of this donation' : 'Loading categories... Using fallback options'}
                  </p>
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
                  <p className="text-sm text-slate-500">
                    {paymentCategories.length > 0 ? 'Choose how this donation was received' : 'Loading payment methods... Using fallback options'}
                  </p>
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
                <p className="text-sm text-slate-500">
                  When was this donation received? (Time will be set to current time)
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
                  placeholder="Add any additional notes about this transaction..."
                  value={formState.notes}
                  onChange={handleChange}
                  rows={4}
                  className="border-2 border-slate-200 rounded-xl bg-white/50 focus:border-green-500 focus:ring-green-500 resize-none"
                />
                <p className="text-sm text-slate-500">
                  Any additional information about this donation
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/finance/giving')}
                  disabled={loading}
                  className="rounded-xl px-8 py-3 border-2 border-slate-200 bg-white/50 hover:bg-white/80"
                >
                  <X className="mr-2 h-5 w-5" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white flex-1 sm:flex-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Transaction...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-5 w-5" />
                      Create Transaction
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