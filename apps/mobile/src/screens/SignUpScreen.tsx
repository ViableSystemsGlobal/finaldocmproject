import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { signUp, createAdminVerifiedUser } from '../lib/supabase'
import { getBrandingConfig, BrandingConfig } from '../services/branding'
import { ADMIN_API_URL } from '@env'

interface SignUpScreenProps {
  onBack: () => void
  onSwitchToLogin: () => void
}

type SignUpStep = 'details' | 'verification' | 'success'

export default function SignUpScreen({ onBack, onSwitchToLogin }: SignUpScreenProps) {
  const [currentStep, setCurrentStep] = useState<SignUpStep>('details')
  const [branding, setBranding] = useState<BrandingConfig | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [contactId, setContactId] = useState<string | null>(null)

  useEffect(() => {
    loadBranding()
  }, [])

  const loadBranding = async () => {
    try {
      const brandingConfig = await getBrandingConfig()
      setBranding(brandingConfig)
    } catch (error) {
      console.error('Error loading branding:', error)
    }
  }

  const handleSendVerification = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      console.log('📧 Sending verification email to:', email)
      
      // Send verification email using the admin API
      const adminUrl = ADMIN_API_URL || 'http://192.168.0.28:3003'
      const requestBody = {
        email: email.toLowerCase().trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        includeDeepLink: true
      }
      
      console.log('📋 Sending verification request:', requestBody)
      
      const response = await fetch(`${adminUrl}/api/auth/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('📡 Response status:', response.status)
      const result = await response.json()
      console.log('📡 Response body:', result)

      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`)
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to send verification email')
      }

      console.log('✅ Verification email sent successfully')
      setContactId(result.contactId)
      setCurrentStep('verification')
      
    } catch (error) {
      console.error('❌ Error sending verification:', error)
      
      let errorMessage = 'Failed to send verification email'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      Alert.alert('Error', errorMessage + '\n\nPlease try again or contact support.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit verification code')
      return
    }

    setLoading(true)

    try {
      console.log('🔍 Verifying code for:', email)
      
      // Verify the code using the admin API
      const adminUrl = ADMIN_API_URL || 'http://192.168.0.28:3003'
      const response = await fetch(`${adminUrl}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          verificationCode,
          contactId
        }),
      })

      const result = await response.json()
      console.log('📡 Verification result:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Invalid verification code')
      }

      if (!result.success) {
        throw new Error(result.error || 'Verification failed')
      }

      console.log('✅ Email verified successfully')
      
      // Update contactId if returned (in case it was created/updated)
      if (result.contactId) {
        setContactId(result.contactId)
      }
      
      // Now create the Supabase auth account
      await createAuthAccount()
      
    } catch (error) {
      console.error('❌ Error verifying code:', error)
      
      let errorMessage = 'Invalid verification code'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      Alert.alert('Verification Failed', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const createAuthAccount = async () => {
    try {
      console.log('👤 Creating Supabase auth account for:', email)
      console.log('📋 Contact ID:', contactId)
      
      const result = await createAdminVerifiedUser(email.toLowerCase().trim(), password, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        contactId: contactId || undefined
      })
      
      if (result.error) {
        throw new Error(result.error.message)
      }

      console.log('✅ Auth account created successfully')
      console.log('🔍 Result details:', {
        userId: result.user?.id
      })
      
      // Mobile app user record is created automatically by the admin API
      console.log('📱 Mobile app user record created automatically by admin API')
      
      setCurrentStep('success')
      
    } catch (error) {
      console.error('❌ Error creating auth account:', error)
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create account')
    }
  }

  const handleResendCode = async () => {
    setLoading(true)
    try {
      console.log('🔄 Resending verification code to:', email)
      
      const adminUrl = ADMIN_API_URL || 'http://192.168.0.28:3003'
      const response = await fetch(`${adminUrl}/api/auth/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          contactId,
          includeDeepLink: true
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend verification email')
      }

      Alert.alert('Success', 'Verification code resent to your email')
      
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to resend verification code')
    } finally {
      setLoading(false)
    }
  }

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={styles.stepContainer}>
        <View style={[styles.step, currentStep !== 'details' && styles.stepCompleted]}>
          <Text style={[styles.stepText, currentStep !== 'details' && styles.stepTextCompleted]}>1</Text>
        </View>
        <Text style={styles.stepLabel}>Details</Text>
      </View>
      
      <View style={[styles.stepLine, currentStep === 'success' && styles.stepLineCompleted]} />
      
      <View style={styles.stepContainer}>
        <View style={[styles.step, currentStep === 'success' && styles.stepCompleted]}>
          <Text style={[styles.stepText, currentStep === 'success' && styles.stepTextCompleted]}>2</Text>
        </View>
        <Text style={styles.stepLabel}>Verify</Text>
      </View>
      
      <View style={[styles.stepLine, currentStep === 'success' && styles.stepLineCompleted]} />
      
      <View style={styles.stepContainer}>
        <View style={[styles.step, currentStep === 'success' && styles.stepCompleted]}>
          <Ionicons 
            name={currentStep === 'success' ? 'checkmark' : 'person-add'} 
            size={16} 
            color={currentStep === 'success' ? 'white' : '#9CA3AF'} 
          />
        </View>
        <Text style={styles.stepLabel}>Complete</Text>
      </View>
    </View>
  )

  const renderDetailsStep = () => (
    <View style={styles.form}>
      <View style={styles.nameRow}>
        <TextInput
          style={[styles.input, styles.nameInput]}
          placeholder="First Name"
          placeholderTextColor="#9CA3AF"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={[styles.input, styles.nameInput]}
          placeholder="Last Name"
          placeholderTextColor="#9CA3AF"
          value={lastName}
          onChangeText={setLastName}
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email Address"
        placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#9CA3AF"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#9CA3AF"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleSendVerification}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Send Verification Email</Text>
        )}
      </TouchableOpacity>
    </View>
  )

  const renderVerificationStep = () => (
    <View style={styles.form}>
      <View style={styles.emailPreview}>
        <Ionicons name="mail" size={48} color="#F59E0B" />
        <Text style={styles.emailText}>Verification email sent to:</Text>
        <Text style={styles.emailAddress}>{email}</Text>
        <Text style={styles.instructionText}>
          Enter the 6-digit code from your email to verify your account
        </Text>
      </View>

      <TextInput
        style={[styles.input, styles.codeInput]}
        placeholder="Enter 6-digit code"
        placeholderTextColor="#9CA3AF"
        value={verificationCode}
        onChangeText={setVerificationCode}
        keyboardType="number-pad"
        maxLength={6}
        textAlign="center"
      />

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleVerifyCode}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Verify Email</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.resendButton} onPress={handleResendCode} disabled={loading}>
        <Text style={styles.resendText}>Didn't receive the code? Resend</Text>
      </TouchableOpacity>
    </View>
  )

  const renderSuccessStep = () => (
    <View style={styles.successContainer}>
      <Ionicons name="checkmark-circle" size={80} color="#10B981" />
      <Text style={styles.successTitle}>Welcome to the Mobile App!</Text>
      <Text style={styles.successMessage}>
        Your account has been created successfully! You've been verified through our admin system and your email has been automatically confirmed.
        
        {'\n\n'}You can now sign in immediately and access all member features including event registration and exclusive content!
      </Text>
      <TouchableOpacity style={styles.button} onPress={onSwitchToLogin}>
        <Text style={styles.buttonText}>Continue to Sign In</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1f2937', '#111827']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Ionicons name="chevron-back" size={24} color="white" />
              </TouchableOpacity>
              <View style={styles.stepIndicatorContainer}>
                <View style={[styles.stepIndicator, styles.activeStep]} />
                <View style={styles.stepIndicator} />
                <View style={styles.stepIndicator} />
              </View>
            </View>

            <View style={styles.content}>
              <View style={styles.logoContainer}>
                {branding?.logoUrl ? (
                  typeof branding.logoUrl === 'string' ? (
                    <Image source={{ uri: branding.logoUrl }} style={styles.logoImage} />
                  ) : (
                    <Image source={branding.logoUrl} style={styles.logoImage} />
                  )
                ) : (
                  <Image source={require('../../assets/icon.png')} style={styles.logoImage} />
                )}
                <Text style={styles.subtitle}>Create your account</Text>
              </View>

              {renderStepIndicator()}

              {currentStep === 'details' && renderDetailsStep()}
              {currentStep === 'verification' && renderVerificationStep()}
              {currentStep === 'success' && renderSuccessStep()}

              {currentStep === 'details' && (
                <View style={styles.loginPrompt}>
                  <Text style={styles.loginText}>Already have an account? </Text>
                  <TouchableOpacity onPress={onSwitchToLogin}>
                    <Text style={styles.loginLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    marginRight: 15,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#374151',
    marginHorizontal: 4,
  },
  activeStep: {
    backgroundColor: '#F59E0B',
  },
  content: {
    flexGrow: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    height: 80,
    justifyContent: 'center',
  },
  logoImage: {
    width: 120,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 5,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  stepContainer: {
    alignItems: 'center',
  },
  step: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCompleted: {
    backgroundColor: '#F59E0B',
  },
  stepText: {
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
  stepTextCompleted: {
    color: 'white',
  },
  stepLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#374151',
    marginHorizontal: 10,
  },
  stepLineCompleted: {
    backgroundColor: '#F59E0B',
  },
  form: {
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 15,
  },
  nameInput: {
    flex: 1,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 15,
    color: 'white',
    fontSize: 16,
    marginBottom: 15,
  },
  codeInput: {
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emailPreview: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#374151',
    borderRadius: 12,
  },
  emailText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 15,
  },
  emailAddress: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  instructionText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 20,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    color: '#F59E0B',
    fontSize: 14,
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 15,
  },
  successMessage: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  loginLink: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: 'bold',
  },
}) 