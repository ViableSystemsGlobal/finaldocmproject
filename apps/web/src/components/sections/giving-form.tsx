'use client'

import { useState } from 'react'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe'
import { useDonation, DonationFormData } from '@/hooks/useDonation'
import { useGivingPage } from '@/hooks/useGivingPage'

// Payment Form Component (inside Stripe Elements context)
function PaymentForm({ 
  formData, 
  onSuccess, 
  onError 
}: { 
  formData: DonationFormData
  onSuccess: () => void
  onError: (error: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const { createPaymentIntent, loading } = useDonation()
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      onError('Stripe has not loaded properly')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      onError('Card element not found')
      return
    }

    setProcessing(true)

    try {
      const paymentResult = await createPaymentIntent(formData)

      if (paymentResult.error) {
        onError(paymentResult.error)
        return
      }

      if (!paymentResult.clientSecret) {
        onError('Payment setup failed - no client secret received')
        return
      }

      if (formData.frequency !== 'one-time') {
        // Handle recurring payment
        const { error: stripeError } = await stripe.confirmCardPayment(
          paymentResult.clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: formData.donorName,
                email: formData.donorEmail,
              },
            },
          }
        )

        if (stripeError) {
          onError(stripeError.message || 'Payment failed')
        } else {
          onSuccess()
        }
      } else {
        // Handle one-time payment with payment intent
        const { error: stripeError } = await stripe.confirmCardPayment(
          paymentResult.clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: formData.donorName,
                email: formData.donorEmail,
              },
            },
          }
        )

        if (stripeError) {
          onError(stripeError.message || 'Payment failed')
        } else {
          onSuccess()
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border border-gray-300 rounded-xl">
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      
      <button
        type="submit"
        disabled={!stripe || processing || loading}
        className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
          stripe && !processing && !loading
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {processing || loading 
          ? 'Processing...'
          : `Complete Donation - $${formData.amount.toFixed(2)}`
        }
      </button>
    </form>
  )
}

// Payment Method Selection Component
function PaymentMethodSelector({ 
  selectedMethod, 
  onSelect 
}: { 
  selectedMethod: string
  onSelect: (method: string) => void 
}) {
  const paymentMethods = [
    {
      id: 'venmo',
      name: 'Venmo',
      description: 'Send to @DOCM-Denver',
      icon: '💳',
      color: 'from-blue-500 to-blue-600',
      details: '@DOCM-Denver'
    },
    {
      id: 'cashapp',
      name: 'Cash App',
      description: 'Send to $DOCMDenver',
      icon: '💚',
      color: 'from-green-500 to-green-600',
      details: '$DOCMDenver'
    },
    {
      id: 'zelle',
      name: 'Zelle',
      description: 'Send to 720-323-0135',
      icon: '🏦',
      color: 'from-purple-500 to-purple-600',
      details: '720-323-0135'
    },
    {
      id: 'stripe',
      name: 'Pay with Card',
      description: 'Credit/Debit card via Stripe',
      icon: '💳',
      color: 'from-indigo-500 to-indigo-600',
      details: 'Secure card payment'
    }
  ]

  return (
    <div className="space-y-4">
      <label className="block text-lg font-semibold text-gray-900 mb-4">
        Choose Payment Method
      </label>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => onSelect(method.id)}
            className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
              selectedMethod === method.id
                ? 'border-blue-600 bg-blue-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl">{method.icon}</span>
              <div>
                <div className="font-semibold text-gray-900">{method.name}</div>
                <div className="text-sm text-gray-600">{method.description}</div>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-lg inline-block">
              {method.details}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// Payment Instructions Component
function PaymentInstructions({ method, amount }: { method: string; amount: number }) {
  const instructions = {
    venmo: {
      title: 'Send via Venmo',
      steps: [
        'Open your Venmo app',
        'Search for @DOCM-Denver',
        `Enter the amount: $${amount.toFixed(2)}`,
        'Add a note with your name and fund designation',
        'Send the payment'
      ],
      note: 'Please include your name and fund designation in the payment note so we can properly credit your donation.'
    },
    cashapp: {
      title: 'Send via Cash App',
      steps: [
        'Open your Cash App',
        'Search for $DOCMDenver',
        `Enter the amount: $${amount.toFixed(2)}`,
        'Add a note with your name and fund designation',
        'Send the payment'
      ],
      note: 'Please include your name and fund designation in the payment note so we can properly credit your donation.'
    },
    zelle: {
      title: 'Send via Zelle',
      steps: [
        'Open your banking app',
        'Select Zelle or Send Money',
        'Enter phone number: 720-323-0135',
        `Enter the amount: $${amount.toFixed(2)}`,
        'Add a note with your name and fund designation',
        'Send the payment'
      ],
      note: 'Please include your name and fund designation in the payment note so we can properly credit your donation.'
    }
  }

  const currentInstructions = instructions[method as keyof typeof instructions]
  if (!currentInstructions) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">{currentInstructions.title}</h3>
      <ol className="space-y-2 mb-4">
        {currentInstructions.steps.map((step, index) => (
          <li key={index} className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              {index + 1}
            </span>
            <span className="text-blue-800">{step}</span>
          </li>
        ))}
      </ol>
      <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
        <p className="text-sm text-blue-800 font-medium">{currentInstructions.note}</p>
      </div>
    </div>
  )
}

// Main Giving Form Component
export function GivingForm() {
  const { data: givingData, loading: givingLoading } = useGivingPage()
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [frequency, setFrequency] = useState<'one-time' | 'weekly' | 'monthly'>('one-time')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [fundDesignation, setFundDesignation] = useState('General Fund')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [notes, setNotes] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const predefinedAmounts = [25, 50, 100, 250, 500, 1000]

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setSelectedAmount(null)
  }

  const getCurrentAmount = () => {
    return selectedAmount || parseFloat(customAmount) || 0
  }

  const handleContinueToPayment = async () => {
    // Validate required fields
    if (getCurrentAmount() <= 0) {
      setPaymentError('Please enter a valid amount')
      return
    }

    if (!paymentMethod) {
      setPaymentError('Please select a payment method')
      return
    }

    // For Stripe payments, require donor information if not anonymous
    if (paymentMethod === 'stripe' && !isAnonymous && (!donorName || !donorEmail)) {
      setPaymentError('Please fill in all required donor information for card payments')
      return
    }

    setPaymentError(null)

    // Handle offline payment methods (Venmo, Cash App, Zelle)
    if (paymentMethod !== 'stripe') {
      try {
        const response = await fetch('/api/donations/record-offline-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: getCurrentAmount(),
            fundDesignation,
            isAnonymous: true, // Always anonymous for offline payments
            notes,
            donorName: undefined, // Not required for offline payments
            donorEmail: undefined, // Not required for offline payments
            paymentMethod
          })
        })

        const result = await response.json()

        if (response.ok) {
          setPaymentSuccess(true)
          setShowPayment(true)
        } else {
          setPaymentError(result.error || 'Failed to record donation')
        }
      } catch (error) {
        console.error('Error recording offline donation:', error)
        setPaymentError('Network error. Please try again.')
      }
      return
    }

    // For Stripe payments, show the payment form
    setShowPayment(true)
  }

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true)
    setShowPayment(false)
  }

  const handlePaymentError = (error: string) => {
    setPaymentError(error)
    setShowPayment(false)
  }

  const formData: DonationFormData = {
    amount: getCurrentAmount(),
    frequency,
    fundDesignation,
    donorName,
    donorEmail,
    isAnonymous,
    notes
  }

  // Success screen
  if (paymentSuccess) {
    return (
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-8">
              <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Thank You for Your Generosity!
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Your ${getCurrentAmount().toFixed(2)} {frequency !== 'one-time' ? frequency : ''} donation to {fundDesignation} has been recorded successfully. 
              {paymentMethod === 'stripe' ? ' You should receive a confirmation email shortly.' : ' Please complete your payment using the instructions above. Your donation will be processed once payment is received.'}
            </p>
            <div className="space-x-4">
              <button
                onClick={() => {
                  setPaymentSuccess(false)
                  setSelectedAmount(null)
                  setCustomAmount('')
                  setDonorName('')
                  setDonorEmail('')
                  setNotes('')
                  setPaymentMethod('')
                  setPaymentError(null)
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Make Another Donation
              </button>
              <a
                href="/"
                className="bg-gray-100 text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Return Home
              </a>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="donation-form" className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Make a Donation
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your generosity helps us continue our mission and serve our community. Thank you for your heart to give.
          </p>
        </div>

        <div className="bg-gray-50 rounded-3xl p-8 md:p-12">
          {/* Show error message */}
          {paymentError && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{paymentError}</p>
                </div>
              </div>
            </div>
          )}

          {!showPayment ? (
            <>
              {/* Payment Method Selection - FIRST */}
              <div className="mb-8">
                <PaymentMethodSelector 
                  selectedMethod={paymentMethod} 
                  onSelect={setPaymentMethod} 
                />
              </div>

              {/* Show different content based on payment method */}
              {paymentMethod && (
                <>
                  {/* For Stripe (card) payments - show full form */}
                  {paymentMethod === 'stripe' ? (
                    <>
                      {/* Amount Selection */}
                      <div className="mb-8">
                        <label className="block text-lg font-semibold text-gray-900 mb-6">
                          Select Amount
                        </label>
                        
                        {/* Predefined Amounts */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                          {predefinedAmounts.map((amount) => (
                            <button
                              key={amount}
                              onClick={() => handleAmountSelect(amount)}
                              className={`p-4 rounded-xl border-2 transition-all duration-300 font-semibold ${
                                selectedAmount === amount
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-gray-200 bg-white text-gray-900 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                            >
                              ${amount}
                            </button>
                          ))}
                        </div>

                        {/* Custom Amount */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Or enter custom amount
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                              $
                            </span>
                            <input
                              type="number"
                              value={customAmount}
                              onChange={(e) => handleCustomAmountChange(e.target.value)}
                              placeholder="0.00"
                              min="1"
                              step="1"
                              className="w-full pl-8 pr-4 py-4 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Frequency Selection */}
                      <div className="mb-8">
                        <label className="block text-lg font-semibold text-gray-900 mb-6">
                          Giving Frequency
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {[
                            { value: 'one-time' as const, label: 'One Time', description: 'Single donation' },
                            { value: 'monthly' as const, label: 'Monthly', description: 'Recurring monthly' },
                            { value: 'weekly' as const, label: 'Weekly', description: 'Recurring weekly' }
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setFrequency(option.value)}
                              className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                                frequency === option.value
                                  ? 'border-blue-600 bg-blue-50'
                                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                              }`}
                            >
                              <div className="font-semibold text-gray-900">{option.label}</div>
                              <div className="text-sm text-gray-600">{option.description}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Fund Designation */}
                      <div className="mb-8">
                        <label className="block text-lg font-semibold text-gray-900 mb-6">
                          Fund Designation
                        </label>
                        <select
                          value={fundDesignation}
                          onChange={(e) => setFundDesignation(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={givingLoading}
                        >
                          {givingData?.fund_designations.map((fund) => (
                            <option key={fund.id} value={fund.name}>
                              {fund.name}
                            </option>
                          )) || (
                            <>
                              <option value="General Fund">General Fund</option>
                              <option value="Building Fund">Building Fund</option>
                              <option value="Missions">Missions</option>
                              <option value="Youth Ministry">Youth Ministry</option>
                              <option value="Children's Ministry">Children's Ministry</option>
                              <option value="Community Outreach">Community Outreach</option>
                            </>
                          )}
                        </select>
                        {givingData && (
                          <p className="mt-2 text-sm text-gray-600">
                            {givingData.fund_designations.find(f => f.name === fundDesignation)?.description}
                          </p>
                        )}
                      </div>

                      {/* Notes */}
                      <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Special Notes (Optional)
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Any special instructions or dedication..."
                        />
                      </div>

                      {/* Anonymous Option for Stripe - MOVED HERE */}
                      <div className="mb-8">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                          />
                          <span className="ml-3 text-lg font-semibold text-gray-900">
                            Make this donation anonymous
                          </span>
                        </label>
                      </div>

                      {/* Donor Information - MOVED HERE, only show if not anonymous */}
                      {!isAnonymous && (
                        <div className="mb-8">
                          <label className="block text-lg font-semibold text-gray-900 mb-6">
                            Donor Information
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name *
                              </label>
                              <input
                                type="text"
                                value={donorName}
                                onChange={(e) => setDonorName(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter your full name"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address *
                              </label>
                              <input
                                type="email"
                                value={donorEmail}
                                onChange={(e) => setDonorEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter your email address"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Summary and Continue for Stripe */}
                      <div className="border-t border-gray-200 pt-8">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <div className="text-lg font-semibold text-gray-900">
                              {frequency === 'one-time' ? 'Total Amount' : `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Amount`}
                            </div>
                            <div className="text-sm text-gray-600">
                              {fundDesignation}
                            </div>
                          </div>
                          <div className="text-3xl font-bold text-blue-600">
                            ${getCurrentAmount().toFixed(2)}
                          </div>
                        </div>

                        <button
                          onClick={handleContinueToPayment}
                          disabled={getCurrentAmount() === 0}
                          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                            getCurrentAmount() > 0
                              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {getCurrentAmount() > 0
                            ? `Continue to Payment Details - $${getCurrentAmount().toFixed(2)}`
                            : 'Enter Amount to Continue'
                          }
                        </button>

                        <div className="mt-4 text-center">
                          <p className="text-sm text-gray-500">
                            🔒 Secure payment processing • Your information is protected
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* For offline payments - show payment instructions immediately */
                    <div>
                      <PaymentInstructions method={paymentMethod} amount={0} />
                      
                      <div className="mt-6 text-center">
                        <button
                          onClick={() => setPaymentMethod('')}
                          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                        >
                          ← Choose a different payment method
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            // Payment Section
            <div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {paymentMethod === 'stripe' ? 'Complete Your Donation' : 'Payment Instructions'}
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-lg font-semibold text-blue-900">
                        ${getCurrentAmount().toFixed(2)} {frequency !== 'one-time' && `(${frequency})`}
                      </div>
                      <div className="text-sm text-blue-700">
                        {fundDesignation} • {isAnonymous ? 'Anonymous' : donorName || 'Donor'}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPayment(false)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              {paymentMethod === 'stripe' ? (
                <>
                  {/* Payment Form */}
                  <Elements stripe={getStripe()}>
                    <PaymentForm
                      formData={formData}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  </Elements>
                </>
              ) : (
                <PaymentInstructions method={paymentMethod} amount={getCurrentAmount()} />
              )}

              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowPayment(false)}
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  ← Back to donation details
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
} 