import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
// import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete'
import { useAuth } from '../contexts/AuthContext'
import { supabase, getContactIdForUser } from '../lib/supabase'
import GooglePlacesInput from '../components/GooglePlacesInput'
import { Picker } from '@react-native-picker/picker'

// Google Maps API Key - same as used in admin
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBYXKNsJKNsJKNsJKNsJKNsJKNsJKNsJKN' // Fallback for development

interface Event {
  id: string
  name: string
  event_date: string
  location?: string
}

interface SelectedLocation {
  address: string
  latitude?: number
  longitude?: number
}

export default function RideRequestScreen({ navigation }: any) {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [pickupLocation, setPickupLocation] = useState<SelectedLocation>({ address: '' })
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load upcoming events
  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, event_date, location')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(10)

      if (error) {
        console.error('Error loading events:', error)
        return
      }

      setEvents(data || [])
      console.log('✅ Loaded events for ride requests:', data?.length)
    } catch (error) {
      console.error('Exception loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!selectedEventId) {
      Alert.alert('Error', 'Please select an event')
      return
    }

    if (!pickupLocation.address.trim()) {
      Alert.alert('Error', 'Please enter your pickup address')
      return
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to request a ride')
      return
    }

    try {
      setIsSubmitting(true)

      // Use the enhanced contact lookup function
      const { contactId, error: contactError } = await getContactIdForUser(user.id, user.email)

      if (contactError) {
        console.log('⚠️ Contact lookup error for ride request:', { userId: user.id, contactError })
        // Still allow ride request even without contact_id, but log the issue
      }

      console.log('🔗 Using contact_id for ride request:', contactId || 'none')

      // Prepare location data for database
      const locationData = {
        address: pickupLocation.address,
        ...(pickupLocation.latitude && pickupLocation.longitude && {
          lat: pickupLocation.latitude,
          lng: pickupLocation.longitude
        })
      }

      // Submit ride request to admin database
      const { data, error } = await supabase
        .from('transport_requests')
        .insert([{
          event_id: selectedEventId,
          contact_id: contactId,
          pickup_address: pickupLocation.address.trim(),
          pickup_location: locationData, // Store full location data
          notes: notes.trim() || null,
          status: 'pending',
          requested_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('❌ Error submitting ride request:', error)
        throw error
      }

      console.log('✅ Successfully submitted ride request:', data)

      Alert.alert(
        'Ride Request Submitted',
        'Your ride request has been submitted successfully. Our transport team will contact you with details.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      )

    } catch (error) {
      console.error('Error submitting ride request:', error)
      Alert.alert('Error', 'Failed to submit ride request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const handlePlaceSelect = (address: string, details: any) => {
    console.log('📍 Place selected:', { address, details })
    
    const location: SelectedLocation = {
      address: address,
      latitude: details?.geometry?.location?.lat,
      longitude: details?.geometry?.location?.lng
    }
    
    setPickupLocation(location)
    console.log('✅ Pickup location set:', location)
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Request Ride</Text>
            <Text style={styles.headerSubtitle}>Get transportation to events</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Event Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="calendar" size={16} color="#F59E0B" /> Select Event
            </Text>
            <Text style={styles.sectionSubtitle}>Choose the event you need transportation for</Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading events...</Text>
              </View>
            ) : events.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventScroll}>
                {events.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={[
                      styles.eventButton,
                      selectedEventId === event.id && styles.eventButtonActive
                    ]}
                    onPress={() => setSelectedEventId(event.id)}
                  >
                    <Text style={[
                      styles.eventButtonTitle,
                      selectedEventId === event.id && styles.eventButtonTitleActive
                    ]}>
                      {event.name}
                    </Text>
                    <Text style={[
                      styles.eventButtonDate,
                      selectedEventId === event.id && styles.eventButtonDateActive
                    ]}>
                      {formatEventDate(event.event_date)}
                    </Text>
                    {event.location && (
                      <Text style={[
                        styles.eventButtonLocation,
                        selectedEventId === event.id && styles.eventButtonLocationActive
                      ]}>
                        📍 {event.location}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noEventsContainer}>
                <Text style={styles.noEventsText}>No upcoming events available</Text>
              </View>
            )}
          </View>

          {/* Pickup Address with Google Places Autocomplete */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="location" size={16} color="#F59E0B" /> Pickup Address
            </Text>
            <Text style={styles.sectionSubtitle}>Where should we pick you up?</Text>
            
            <GooglePlacesInput
              value={pickupLocation.address}
              onPlaceSelect={handlePlaceSelect}
              placeholder="Enter your pickup address..."
              style={styles.addressInput}
            />
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="document-text" size={16} color="#F59E0B" /> Additional Notes
            </Text>
            <Text style={styles.sectionSubtitle}>Any special requirements or information</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g., wheelchair accessible, multiple passengers, preferred time..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>{notes.length}/500</Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={isSubmitting ? ['#9CA3AF', '#6B7280'] : ['#F59E0B', '#D97706']}
              style={styles.submitGradient}
            >
              {isSubmitting ? (
                <>
                  <Ionicons name="hourglass" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Submitting...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="car" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Request Ride</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: '#4B5563',
    minHeight: 80,
  },
  textArea: {
    height: 100,
    paddingTop: 16,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  eventScroll: {
    flexDirection: 'row',
  },
  eventButton: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#4B5563',
    minWidth: 200,
  },
  eventButtonActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  eventButtonTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventButtonTitleActive: {
    color: 'white',
  },
  eventButtonDate: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 4,
  },
  eventButtonDateActive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  eventButtonLocation: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  eventButtonLocationActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  noEventsContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  noEventsText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  addressInput: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: '#4B5563',
    minHeight: 80,
  },
}) 