import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Switch,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../contexts/AuthContext'
import { StripeProvider, usePaymentSheet } from '@stripe/stripe-react-native'
import { ADMIN_API_URL } from '@env'

const { width } = Dimensions.get('window')

// Get Stripe key from admin settings
let STRIPE_PUBLISHABLE_KEY = 'pk_test_51M3A4oL5sFi7cbV9s5n3hemWG43sjUMzZTdfB8D6qwGCooBKUi4BXv3D6tOpfuNv0GNA1s1bZtaezrymznltEQBx000dN4XLHR' // fallback

interface DonationData {
  amount: number
  frequency: 'one-time' | 'monthly' | 'yearly'
  category: string
  campaign: string
  donorName: string
  donorEmail: string
  isAnonymous: boolean
  notes?: string
}

interface PaymentCategory {
  id: string
  name: string
  description: string | null
  category_type: string
  is_active: boolean
}

interface DonationCampaign {
  id: string
  name: string
  description: string | null
  goal_amount: number | null
  current_amount: number
  is_active: boolean
}

interface GivingCategory {
  id: string
  name: string
  description: string | null
  is_active: boolean
  order: number
}

function GiveScreenContent({ navigation }: any) {
  const { user } = useAuth()
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentCategories, setPaymentCategories] = useState<PaymentCategory[]>([])
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([])
  const [givingCategories, setGivingCategories] = useState<GivingCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [stripeKey, setStripeKey] = useState(STRIPE_PUBLISHABLE_KEY)

  const predefinedAmounts = [10, 25, 50, 100, 250, 500]
  const frequencies = [
    { label: 'One-time', value: 'one-time' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
  ]

  // Default giving categories (fallback)
  const defaultCategories = [
    'Tithe',
    'Offering', 
    'General Fund',
    'Building Fund',
    'Missions',
    'Youth Ministry',
    'Children\'s Ministry',
    'Music Ministry',
    'Community Outreach'
  ]

  const [donationData, setDonationData] = useState<DonationData>({
    amount: 25,
    frequency: 'one-time',
    category: 'Tithe',
    campaign: 'general', // 'general' or campaign ID
    donorName: user?.user_metadata?.first_name && user?.user_metadata?.last_name ? 
      `${user.user_metadata.first_name} ${user.user_metadata.last_name}` : '',
    donorEmail: user?.email || '',
    isAnonymous: false,
    notes: '',
  })

  // Fetch payment categories, campaigns, giving categories and Stripe settings from admin API
  useEffect(() => {
    fetchPaymentOptions()
    fetchStripeSettings()
  }, [])

  const fetchPaymentOptions = async () => {
    try {
      const adminUrl = ADMIN_API_URL || 'http://192.168.0.28:3003'
      
      // Fetch payment categories
      const categoriesResponse = await fetch(`${adminUrl}/api/settings/payment-categories`)
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        setPaymentCategories(categoriesData.filter((cat: PaymentCategory) => cat.is_active))
        console.log('✅ Loaded payment categories:', categoriesData.length)
      }

      // Fetch giving categories
      const givingCategoriesResponse = await fetch(`${adminUrl}/api/settings/giving-categories`)
      if (givingCategoriesResponse.ok) {
        const givingCategoriesData = await givingCategoriesResponse.json()
        if (givingCategoriesData.data) {
          setGivingCategories(givingCategoriesData.data.filter((cat: GivingCategory) => cat.is_active))
          console.log('✅ Loaded giving categories:', givingCategoriesData.data.length)
        }
      }

      // Fetch active campaigns
      const campaignsResponse = await fetch(`${adminUrl}/api/admin/campaigns/active`)
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json()
        if (campaignsData.data) {
          setCampaigns(campaignsData.data.filter((camp: DonationCampaign) => camp.is_active))
          console.log('✅ Loaded campaigns:', campaignsData.data.length)
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to load payment options from admin API:', error)
      // Will fall back to default options
    } finally {
      setLoading(false)
    }
  }

  const fetchStripeSettings = async () => {
    try {
      const adminUrl = ADMIN_API_URL || 'http://192.168.0.28:3003'
      const response = await fetch(`${adminUrl}/api/settings/integrations`)
      
      if (response.ok) {
        const integrationsData = await response.json()
        const stripeIntegration = integrationsData?.find((integration: any) => 
          integration.provider === 'stripe' && integration.is_active
        )
        
        if (stripeIntegration?.config?.publishable_key) {
          setStripeKey(stripeIntegration.config.publishable_key)
          console.log('✅ Loaded Stripe key from admin settings')
        } else {
          console.log('⚠️ No Stripe integration found in admin settings, using fallback')
        }
      } else {
        console.log('⚠️ Could not fetch integrations, using fallback Stripe key')
      }
    } catch (error) {
      console.warn('⚠️ Failed to load Stripe settings from admin API:', error)
      // Will fall back to hardcoded key
    }
  }

  // Get available categories (database + defaults)
  const getAvailableCategories = () => {
    if (givingCategories.length > 0) {
      return givingCategories.map(cat => cat.name)
    }
    return defaultCategories
  }

  const createPaymentIntent = async () => {
    console.log('💳 Creating payment intent for donation:', donationData)
    try {
      // Determine the final category for database recording
      let finalCategory = donationData.category
      let fundDesignation = donationData.category
      
      // If a specific campaign is selected
      if (donationData.campaign !== 'general') {
        const selectedCampaign = campaigns.find(c => c.id === donationData.campaign)
        if (selectedCampaign) {
          finalCategory = `campaign_${selectedCampaign.id}`
          fundDesignation = selectedCampaign.name
        }
      }
      
      // Using the admin API endpoint with environment variable
      const adminUrl = ADMIN_API_URL || 'http://192.168.0.28:3003'
      const response = await fetch(`${adminUrl}/api/donations/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: donationData.amount,
          frequency: donationData.frequency,
          fundDesignation: fundDesignation,
          donorName: donationData.donorName,
          donorEmail: donationData.donorEmail,
          isAnonymous: donationData.isAnonymous,
          notes: donationData.notes,
          contactId: user?.id,
          currency: 'usd',
          category: finalCategory, // This ensures proper campaign tracking
        }),
      })

      const data = await response.json()
      console.log('📡 Payment intent response:', data)
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent')
      }

      return data
    } catch (error) {
      console.error('❌ Error creating payment intent:', error)
      throw error
    }
  }

  const handleAmountChange = (amount: number) => {
    setDonationData(prev => ({ ...prev, amount }))
  }

  const handleCustomAmount = (value: string) => {
    const amount = parseFloat(value) || 0
    setDonationData(prev => ({ ...prev, amount }))
  }

  const handleDonation = async () => {
    // Validation
    if (donationData.amount <= 0) {
      Alert.alert('Error', 'Please enter a valid donation amount')
      return
    }

    if (!donationData.donorName.trim()) {
      Alert.alert('Error', 'Please enter your full name')
      return
    }

    if (!donationData.donorEmail.trim()) {
      Alert.alert('Error', 'Please enter your email address')
      return
    }

    try {
      setIsProcessing(true)
      console.log('💰 Processing donation payment...')

      // Initialize and present payment sheet in one step
      console.log('🔧 Initializing payment sheet...')
      
      // Get payment intent from our API
      const paymentIntentData = await createPaymentIntent()
      
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: paymentIntentData.clientSecret,
        merchantDisplayName: 'DOCM Church',
        defaultBillingDetails: {
          name: donationData.donorName,
          email: donationData.donorEmail,
        }
      })

      if (initError) {
        console.error('❌ Error initializing payment sheet:', initError)
        Alert.alert('Error', 'Failed to initialize payment. Please try again.')
        return
      }

      console.log('✅ Payment sheet initialized successfully')

      // Present payment sheet immediately
      const { error: paymentError } = await presentPaymentSheet()

      if (paymentError) {
        if (paymentError.code === 'Canceled') {
          console.log('ℹ️ Payment canceled by user')
          return
        }
        console.error('❌ Payment error:', paymentError)
        Alert.alert('Payment Failed', paymentError.message || 'Something went wrong with your payment')
        return
      }

      console.log('✅ Payment successful!')
      Alert.alert(
        'Donation Successful! 🙏',
        `Thank you for your generous gift of $${donationData.amount}!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      )

    } catch (error) {
      console.error('❌ Error processing donation:', error)
      Alert.alert('Error', 'Failed to process donation. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading donation options...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Enhanced Header with Gradient */}
        <LinearGradient
          colors={['#1f2937', '#374151']}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Give with Purpose</Text>
            <Text style={styles.headerSubtitle}>Make a difference today</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="heart" size={24} color="#F59E0B" />
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Enhanced Amount Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cash" size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Choose Amount</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Select or enter your donation amount</Text>
            
            <View style={styles.amountGrid}>
              {predefinedAmounts.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.amountButton,
                    donationData.amount === amount && styles.amountButtonActive,
                  ]}
                  onPress={() => handleAmountChange(amount)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={donationData.amount === amount 
                      ? ['#10B981', '#059669'] 
                      : ['#374151', '#4B5563']
                    }
                    style={styles.amountButtonGradient}
                  >
                    <Text
                      style={[
                        styles.amountButtonText,
                        donationData.amount === amount && styles.amountButtonTextActive,
                      ]}
                    >
                      ${amount}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.customAmountContainer}>
              <Text style={styles.customAmountLabel}>Custom Amount</Text>
              <View style={styles.customAmountInput}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={styles.customAmountTextInput}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  value={donationData.amount.toString()}
                  onChangeText={handleCustomAmount}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          {/* Enhanced Frequency Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Frequency</Text>
            </View>
            <Text style={styles.sectionSubtitle}>How often would you like to give?</Text>
            
            <View style={styles.frequencyContainer}>
              {frequencies.map((freq) => (
                <TouchableOpacity
                  key={freq.value}
                  style={[
                    styles.frequencyButton,
                    donationData.frequency === freq.value && styles.frequencyButtonActive,
                  ]}
                  onPress={() => setDonationData(prev => ({ ...prev, frequency: freq.value as any }))}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={donationData.frequency === freq.value 
                      ? ['#F59E0B', '#D97706'] 
                      : ['#374151', '#4B5563']
                    }
                    style={styles.frequencyButtonGradient}
                  >
                    <Text
                      style={[
                        styles.frequencyButtonText,
                        donationData.frequency === freq.value && styles.frequencyButtonTextActive,
                      ]}
                    >
                      {freq.label}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Enhanced Campaign Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy" size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Select Campaign</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              {campaigns.length > 0 ? 'Choose a specific campaign or general fund' : 'No active campaigns available'}
            </Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.campaignScroll}>
              {/* Enhanced General Fund Option */}
              <TouchableOpacity
                style={[
                  styles.campaignCard,
                  donationData.campaign === 'general' && styles.campaignCardActive
                ]}
                onPress={() => setDonationData(prev => ({ ...prev, campaign: 'general' }))}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={donationData.campaign === 'general' 
                    ? ['#F59E0B', '#D97706'] 
                    : ['#374151', '#4B5563']
                  }
                  style={styles.campaignCardGradient}
                >
                  <View style={styles.campaignCardHeader}>
                    <View style={styles.campaignIconContainer}>
                      <Ionicons name="wallet" size={24} color="white" />
                    </View>
                    <Text style={styles.campaignCardTitle}>
                      General Fund
                    </Text>
                  </View>
                  <Text style={styles.campaignCardDescription}>
                    Standard donation to the general church fund
                  </Text>
                  <View style={styles.campaignCardFooter}>
                    <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.campaignCardFooterText}>Always Available</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Enhanced Campaign Options */}
              {campaigns.map((campaign) => (
                <TouchableOpacity
                  key={campaign.id}
                  style={[
                    styles.campaignCard,
                    donationData.campaign === campaign.id && styles.campaignCardActive
                  ]}
                  onPress={() => setDonationData(prev => ({ ...prev, campaign: campaign.id }))}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={donationData.campaign === campaign.id 
                      ? ['#F59E0B', '#D97706'] 
                      : ['#374151', '#4B5563']
                    }
                    style={styles.campaignCardGradient}
                  >
                    <View style={styles.campaignCardHeader}>
                      <View style={styles.campaignIconContainer}>
                        <Ionicons name="trophy" size={24} color="white" />
                      </View>
                      <Text style={styles.campaignCardTitle}>
                        {campaign.name}
                      </Text>
                    </View>
                    
                    {campaign.description && (
                      <Text style={styles.campaignCardDescription}>
                        {campaign.description}
                      </Text>
                    )}
                    
                    {campaign.goal_amount && (
                      <View style={styles.campaignCardProgress}>
                        <View style={styles.campaignProgressContainer}>
                          <View style={styles.campaignProgressBar}>
                            <LinearGradient
                              colors={['#10B981', '#059669']}
                              style={[
                                styles.campaignProgressFill, 
                                { width: `${Math.min((campaign.current_amount / campaign.goal_amount) * 100, 100)}%` }
                              ]}
                            />
                          </View>
                          <Text style={styles.campaignProgressPercentage}>
                            {Math.round((campaign.current_amount / campaign.goal_amount) * 100)}%
                          </Text>
                        </View>
                        <Text style={styles.campaignProgressText}>
                          ${campaign.current_amount.toLocaleString()} of ${campaign.goal_amount.toLocaleString()}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Enhanced Donor Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Donor Information</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Your donation details</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                <Ionicons name="person-outline" size={16} color="#9CA3AF" /> Full Name
              </Text>
              <TextInput
                style={styles.textInput}
                value={donationData.donorName}
                onChangeText={(text) => setDonationData(prev => ({ ...prev, donorName: text }))}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                <Ionicons name="mail-outline" size={16} color="#9CA3AF" /> Email Address
              </Text>
              <TextInput
                style={styles.textInput}
                value={donationData.donorEmail}
                onChangeText={(text) => setDonationData(prev => ({ ...prev, donorEmail: text }))}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Enhanced Notes Section */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                <Ionicons name="document-text-outline" size={16} color="#9CA3AF" /> Notes (Optional)
              </Text>
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                multiline
                numberOfLines={4}
                placeholder="Add any additional notes about this donation..."
                placeholderTextColor="#9CA3AF"
                value={donationData.notes}
                onChangeText={(text) => setDonationData(prev => ({ ...prev, notes: text }))}
              />
            </View>

            {/* Enhanced Anonymous Toggle */}
            <View style={styles.anonymousContainer}>
              <View style={styles.anonymousToggleContainer}>
                <View style={styles.anonymousToggleLabel}>
                  <Ionicons name="eye-off" size={20} color="#9CA3AF" />
                  <Text style={styles.anonymousToggleText}>Anonymous Donation</Text>
                </View>
                <Switch
                  value={donationData.isAnonymous}
                  onValueChange={(value) => setDonationData(prev => ({ ...prev, isAnonymous: value }))}
                  trackColor={{ false: '#374151', true: '#F59E0B' }}
                  thumbColor={donationData.isAnonymous ? '#FFF' : '#9CA3AF'}
                />
              </View>
              <Text style={styles.anonymousDescription}>
                When enabled, your donation will be recorded without personal information
              </Text>
            </View>
          </View>

          {/* Enhanced Donation Summary */}
          <View style={styles.summaryContainer}>
            <LinearGradient
              colors={['#374151', '#4B5563']}
              style={styles.summaryGradient}
            >
              <View style={styles.summaryHeader}>
                <Ionicons name="receipt" size={20} color="#F59E0B" />
                <Text style={styles.summaryTitle}>Donation Summary</Text>
              </View>
              
              <View style={styles.summaryContent}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Amount:</Text>
                  <Text style={styles.summaryValue}>${donationData.amount}</Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Frequency:</Text>
                  <Text style={styles.summaryValue}>{frequencies.find(f => f.value === donationData.frequency)?.label}</Text>
                </View>
                
                {donationData.campaign !== 'general' && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Campaign:</Text>
                    <Text style={styles.summaryValue}>
                      {campaigns.find(c => c.id === donationData.campaign)?.name || 'Unknown Campaign'}
                    </Text>
                  </View>
                )}
                
                {donationData.isAnonymous && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Anonymous:</Text>
                    <Text style={styles.summaryValue}>Yes</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </View>

          {/* Enhanced Security Notice */}
          <View style={styles.securityNotice}>
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.1)', 'rgba(5, 150, 105, 0.1)']}
              style={styles.securityGradient}
            >
              <View style={styles.securityIconContainer}>
                <Ionicons name="shield-checkmark" size={24} color="#10B981" />
              </View>
              <View style={styles.securityContent}>
                <Text style={styles.securityTitle}>Secure & Encrypted</Text>
                <Text style={styles.securityText}>
                  Your payment is protected by bank-level security and processed through Stripe.
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Enhanced Donate Button */}
          <TouchableOpacity
            style={[styles.donateButton, isProcessing && styles.donateButtonDisabled]}
            onPress={handleDonation}
            disabled={isProcessing || donationData.amount <= 0}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isProcessing ? ['#9CA3AF', '#6B7280'] : ['#10B981', '#059669']}
              style={styles.donateGradient}
            >
              {isProcessing ? (
                <>
                  <Ionicons name="hourglass" size={20} color="white" />
                  <Text style={styles.donateButtonText}>Processing...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="heart" size={20} color="white" />
                  <Text style={styles.donateButtonText}>
                    Complete Donation
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default function GiveScreen({ navigation }: any) {
  const [stripeKey, setStripeKey] = useState(STRIPE_PUBLISHABLE_KEY)

  // Fetch Stripe settings on component mount
  useEffect(() => {
    const fetchStripeSettings = async () => {
      try {
        const adminUrl = 'http://192.168.0.28:3003'
        const response = await fetch(`${adminUrl}/api/settings/integrations`)
        
        if (response.ok) {
          const integrationsData = await response.json()
          const stripeIntegration = integrationsData?.find((integration: any) => 
            integration.provider === 'stripe' && integration.is_active
          )
          
          if (stripeIntegration?.config?.publishable_key) {
            setStripeKey(stripeIntegration.config.publishable_key)
            console.log('✅ Loaded Stripe key from admin settings')
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to load Stripe settings:', error)
      }
    }

    fetchStripeSettings()
  }, [])

  return (
    <StripeProvider publishableKey={stripeKey}>
      <GiveScreenContent navigation={navigation} />
    </StripeProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  headerIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    marginBottom: 16,
    lineHeight: 22,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  amountButton: {
    width: '30%',
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  amountButtonActive: {
    transform: [{ scale: 1.05 }],
    shadowColor: '#10B981',
    shadowOpacity: 0.4,
  },
  amountButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 16,
  },
  amountButtonText: {
    color: '#9CA3AF',
    fontSize: 20,
    fontWeight: '700',
  },
  amountButtonTextActive: {
    color: 'white',
    fontWeight: '800',
  },
  customAmountContainer: {
    marginTop: 12,
  },
  customAmountLabel: {
    fontSize: 16,
    color: '#D1D5DB',
    marginBottom: 8,
    fontWeight: '500',
  },
  customAmountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#4B5563',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  frequencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  frequencyButtonActive: {
    shadowColor: '#F59E0B',
    shadowOpacity: 0.3,
  },
  frequencyButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 16,
  },
  frequencyButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  frequencyButtonTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  campaignScroll: {
    flexDirection: 'row',
  },
  campaignCard: {
    borderRadius: 20,
    marginRight: 16,
    minWidth: 220,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
  campaignCardActive: {
    shadowColor: '#F59E0B',
    shadowOpacity: 0.5,
    transform: [{ scale: 1.02 }],
  },
  campaignCardGradient: {
    padding: 20,
    borderRadius: 20,
    minHeight: 160,
  },
  campaignCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  campaignCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginLeft: 12,
    flex: 1,
  },
  campaignCardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    lineHeight: 20,
  },
  campaignCardProgress: {
    marginTop: 12,
  },
  campaignProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  campaignProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    flex: 1,
  },
  campaignProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  campaignProgressPercentage: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  campaignProgressText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  campaignCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  campaignCardFooterText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  campaignIconContainer: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#D1D5DB',
    marginBottom: 8,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#374151',
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: 'white',
    borderWidth: 2,
    borderColor: '#4B5563',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  anonymousContainer: {
    marginTop: 20,
    backgroundColor: '#374151',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#4B5563',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  anonymousToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  anonymousToggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  anonymousToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  anonymousDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    lineHeight: 20,
  },
  summaryContainer: {
    marginVertical: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
  summaryGradient: {
    padding: 20,
    borderRadius: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginLeft: 8,
  },
  summaryContent: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  securityNotice: {
    marginVertical: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  securityGradient: {
    flexDirection: 'row',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  securityIconContainer: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  securityContent: {
    flex: 1,
    marginLeft: 12,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  securityText: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  donateButton: {
    marginTop: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
  donateButtonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0.2,
  },
  donateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  donateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  dollarSign: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginRight: 8,
  },
  customAmountTextInput: {
    flex: 1,
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    paddingVertical: 16,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
}) 