import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { supabase, getContactIdForUser } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Event {
  id: string
  name: string
  event_date: string
  location?: string
  event_type?: string
}

interface CheckInScreenProps {
  navigation: any
}

export default function CheckInScreen({ navigation }: CheckInScreenProps) {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [checkingIn, setCheckingIn] = useState<string | null>(null)
  const [checkedInEvents, setCheckedInEvents] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadTodaysEvents()
  }, [])

  const loadTodaysEvents = async () => {
    try {
      // Get today's date range
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

      console.log('🎯 Loading today\'s events for check-in...')
      
      const { data, error } = await supabase
        .from('events')
        .select('id, name, event_date, location, event_type')
        .gte('event_date', startOfDay.toISOString())
        .lt('event_date', endOfDay.toISOString())
        .order('event_date', { ascending: true })

      if (error) {
        console.error('❌ Error loading events:', error)
        return
      }

      setEvents(data || [])
      console.log('✅ Loaded today\'s events:', data?.length)

      // Check which events user has already checked into
      if (user && data) {
        await checkExistingCheckIns(data)
      }
    } catch (error) {
      console.error('Exception loading events:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const checkExistingCheckIns = async (events: Event[]) => {
    if (!user) return

    try {
      // Use the enhanced contact lookup function
      const { contactId, error: contactError } = await getContactIdForUser(user.id, user.email)

      if (contactError || !contactId) {
        console.log('⚠️ No contact_id found for check-in status check:', { userId: user.id, contactError })
        return
      }

      const eventIds = events.map(e => e.id)

      // Check attendance table for existing check-ins
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('event_id')
        .eq('contact_id', contactId)
        .in('event_id', eventIds)

      if (attendanceError) {
        console.error('❌ Error checking existing check-ins:', attendanceError)
        return
      }

      const checkedInEventIds = new Set(attendanceData?.map(a => a.event_id) || [])
      setCheckedInEvents(checkedInEventIds)
      console.log('✅ Found existing check-ins:', Array.from(checkedInEventIds))
    } catch (error) {
      console.error('Exception checking existing check-ins:', error)
    }
  }

  const handleCheckIn = async (event: Event) => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please log in to check in to events.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]
      )
      return
    }

    console.log('🎯 Check-in attempt:', {
      user_id: user.id,
      event_id: event.id,
      event_name: event.name
    })

    setCheckingIn(event.id)

    try {
      // Use the enhanced contact lookup function
      const { contactId, error: contactError } = await getContactIdForUser(user.id, user.email)

      if (contactError || !contactId) {
        console.log('⚠️ No contact_id found for check-in:', { userId: user.id, contactError })
        Alert.alert(
          'Check-in Error',
          'Unable to check in. Please contact support to complete your profile setup.',
          [{ text: 'OK' }]
        )
        return
      }

      console.log('🔗 Using contact_id for check-in:', contactId)

      // Check if already checked in
      const { data: existingCheckIn, error: checkError } = await supabase
        .from('attendance')
        .select('id')
        .eq('event_id', event.id)
        .eq('contact_id', contactId)
        .single()

      if (existingCheckIn) {
        Alert.alert('Already Checked In', 'You have already checked in to this event.')
        setCheckedInEvents(prev => new Set([...prev, event.id]))
        return
      }

      // Create check-in record
      const checkInData = {
        event_id: event.id,
        contact_id: contactId,
        check_in_time: new Date().toISOString(),
        method: 'app', // Mobile app check-in
        campus_id: null // Default to main campus
      }

      console.log('📋 Check-in data:', checkInData)

      const { error, data } = await supabase
        .from('attendance')
        .insert([checkInData])
        .select()

      if (error) {
        console.error('❌ Check-in error:', error)
        Alert.alert('Error', `Failed to check in: ${error.message}`)
      } else {
        console.log('✅ Check-in successful:', data)
        setCheckedInEvents(prev => new Set([...prev, event.id]))
        Alert.alert('Success', `Successfully checked in to ${event.name}!`)
      }
    } catch (error) {
      console.error('💥 Check-in error:', error)
      Alert.alert('Error', 'Something went wrong. Please try again.')
    } finally {
      setCheckingIn(null)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadTodaysEvents()
  }

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getEventTypeIcon = (event_type?: string) => {
    switch (event_type?.toLowerCase()) {
      case 'worship':
      case 'service':
        return 'musical-notes'
      case 'conference':
        return 'people'
      case 'social':
        return 'heart'
      case 'outreach':
        return 'hand-left'
      case 'youth':
        return 'school'
      case 'meeting':
        return 'people-circle'
      default:
        return 'calendar'
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#1f2937', '#111827']}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={styles.loadingText}>Loading today's events...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1f2937', '#111827']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="checkmark-circle" size={32} color="#F59E0B" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Check In</Text>
              <Text style={styles.headerSubtitle}>Today's Events</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {events.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color="#6B7280" />
              <Text style={styles.emptyStateText}>No Events Today</Text>
              <Text style={styles.emptyStateSubtext}>
                There are no events scheduled for today
              </Text>
            </View>
          ) : (
            <View style={styles.eventsContainer}>
              <Text style={styles.sectionTitle}>Available for Check-in</Text>
              
              {events.map((event) => {
                const isCheckedIn = checkedInEvents.has(event.id)
                const isCheckingInThis = checkingIn === event.id
                
                return (
                  <View key={event.id} style={styles.eventCard}>
                    <LinearGradient
                      colors={isCheckedIn ? ['#10B981', '#059669'] : ['#374151', '#4B5563']}
                      style={styles.eventGradient}
                    >
                      <View style={styles.eventContent}>
                        <View style={styles.eventInfo}>
                          <View style={styles.eventHeader}>
                            <Ionicons
                              name={getEventTypeIcon(event.event_type)}
                              size={24}
                              color={isCheckedIn ? 'white' : '#F59E0B'}
                            />
                            <Text style={[
                              styles.eventName,
                              isCheckedIn && styles.checkedInText
                            ]}>
                              {event.name}
                            </Text>
                          </View>
                          
                          <View style={styles.eventDetails}>
                            <View style={styles.eventDetailItem}>
                              <Ionicons
                                name="time"
                                size={16}
                                color={isCheckedIn ? 'rgba(255,255,255,0.8)' : '#9CA3AF'}
                              />
                              <Text style={[
                                styles.eventDetailText,
                                isCheckedIn && styles.checkedInDetailText
                              ]}>
                                {formatEventTime(event.event_date)}
                              </Text>
                            </View>
                            
                            {event.location && (
                              <View style={styles.eventDetailItem}>
                                <Ionicons
                                  name="location"
                                  size={16}
                                  color={isCheckedIn ? 'rgba(255,255,255,0.8)' : '#9CA3AF'}
                                />
                                <Text style={[
                                  styles.eventDetailText,
                                  isCheckedIn && styles.checkedInDetailText
                                ]}>
                                  {event.location}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>

                        <TouchableOpacity
                          style={[
                            styles.checkInButton,
                            isCheckedIn && styles.checkedInButton,
                            isCheckingInThis && styles.checkingInButton
                          ]}
                          onPress={() => handleCheckIn(event)}
                          disabled={isCheckedIn || isCheckingInThis}
                        >
                          {isCheckingInThis ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <>
                              <Ionicons
                                name={isCheckedIn ? "checkmark-circle" : "add-circle"}
                                size={20}
                                color="white"
                              />
                              <Text style={styles.checkInButtonText}>
                                {isCheckedIn ? 'Checked In' : 'Check In'}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>
                  </View>
                )
              })}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2937', // Add background color to prevent white areas
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  eventsContainer: {
    marginBottom: 20,
  },
  eventCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  eventGradient: {
    padding: 20,
  },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventInfo: {
    flex: 1,
    marginRight: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
    flex: 1,
  },
  checkedInText: {
    color: 'white',
  },
  eventDetails: {
    marginLeft: 36,
  },
  eventDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  checkedInDetailText: {
    color: 'rgba(255,255,255,0.8)',
  },
  checkInButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
    justifyContent: 'center',
  },
  checkedInButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  checkingInButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.7)',
  },
  checkInButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
}) 