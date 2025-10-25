import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { getBrandingConfig, BrandingConfig } from '../services/branding'

const { width, height } = Dimensions.get('window')

interface WelcomeScreenProps {
  onLogin: () => void
  onSignUp: () => void
}

const onboardingSlides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1544281503-2b3e0f4bc5ab?w=400&h=800&fit=crop&crop=center',
    title: 'Welcome to Our\nChurch Family',
    subtitle: 'Join our church family and grow in faith together'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1519491050282-cf00c82424b4?w=400&h=800&fit=crop&crop=center',
    title: 'Connect & Grow\nin Faith',
    subtitle: 'Build meaningful relationships and strengthen your spiritual journey'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=800&fit=crop&crop=center',
    title: 'Serve Our\nCommunity',
    subtitle: 'Make a difference in your community through faith and action'
  }
]

export default function WelcomeScreen({ onLogin, onSignUp }: WelcomeScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [branding, setBranding] = useState<BrandingConfig | null>(null)
  const scrollViewRef = useRef<ScrollView>(null)
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null)

  const startAutoSlide = () => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current)
    }
    
    autoSlideRef.current = setInterval(() => {
      setCurrentSlide(prevSlide => {
        const nextSlide = (prevSlide + 1) % onboardingSlides.length
        console.log(`Auto-sliding from ${prevSlide} to ${nextSlide}`)
        scrollViewRef.current?.scrollTo({ x: nextSlide * width, animated: true })
        return nextSlide
      })
    }, 5000)
  }

  const stopAutoSlide = () => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current)
      autoSlideRef.current = null
    }
  }

  useEffect(() => {
    startAutoSlide()
    loadBranding()
    
    return () => {
      stopAutoSlide()
    }
  }, [])

  const loadBranding = async () => {
    try {
      const brandingConfig = await getBrandingConfig()
      setBranding(brandingConfig)
    } catch (error) {
      console.error('Error loading branding:', error)
    }
  }

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffsetX
    const currentIndex = Math.round(contentOffset / width)
    // Only update if the index is valid and different
    if (currentIndex >= 0 && currentIndex < onboardingSlides.length && currentIndex !== currentSlide) {
      setCurrentSlide(currentIndex)
    }
  }

  const goToSlide = (index: number) => {
    stopAutoSlide()
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true })
    setCurrentSlide(index)
    // Restart auto-slide after manual interaction
    setTimeout(startAutoSlide, 500)
  }

  return (
    <LinearGradient
      colors={['#1f2937', '#111827', '#0f172a']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          {branding?.logoUrl ? (
            typeof branding.logoUrl === 'string' ? (
              <Image source={{ uri: branding.logoUrl }} style={styles.brandLogo} />
            ) : (
              <Image source={branding.logoUrl} style={styles.brandLogo} />
            )
          ) : (
            <Image source={require('../../assets/icon.png')} style={styles.brandLogo} />
          )}
        </View>
        
        {/* Modern Pagination at top */}
        <View style={styles.topPagination}>
          {onboardingSlides.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.topDot,
                currentSlide === index && styles.activeTopDot
              ]}
              onPress={() => goToSlide(index)}
            />
          ))}
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.loginButton} onPress={onLogin}>
            <Text style={styles.loginButtonText}>Log in</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signUpButton} onPress={onSignUp}>
            <Text style={styles.signUpButtonText}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    justifyContent: 'center',
  },
  brandLogo: {
    width: 100,
    height: 60,
    resizeMode: 'contain',
    marginRight: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  topPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  topDot: {
    width: 24,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 3,
  },
  activeTopDot: {
    backgroundColor: '#F59E0B',
    width: 32,
  },
  buttonContainer: {
    gap: 16,
  },
  loginButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  signUpButton: {
    backgroundColor: 'white',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  signUpButtonText: {
    color: '#1f2937',
    fontSize: 18,
    fontWeight: '600',
  },
}) 