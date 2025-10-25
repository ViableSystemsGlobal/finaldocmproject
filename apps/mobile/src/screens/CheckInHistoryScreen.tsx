import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { supabase, getContactIdForUser } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface CheckInRecord {
  id: string
  check_in_time: string
  method: string
  event: {
    id: string
    name: string
    event_date: string
    location?: string
    event_type?: string
  }
}

interface CheckInHistoryScreenProps {
  navigation: any
}

export default function CheckInHistoryScreen({ navigation }: CheckInHistoryScreenProps) {
  const { user } = useAuth()
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadCheckInHistory()
  }, [])

  const loadCheckInHistory = async () => {
    if (!user) return

    try {
      console.log('🎯 Loading check-in history...')

      // Use the enhanced contact lookup function
      const { contactId, error: contactError } = await getContactIdForUser(user.id, user.email)

      if (contactError || !contactId) {
        console.log('⚠️ No contact_id found for check-in history:', { userId: user.id, contactError })
        setLoading(false)
        setRefreshing(false)
        return
      }

      // Get user's check-in records with event details
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          id,
          check_in_time,
          method,
          events!inner (
            id,
            name,
            event_date,
            location,
            event_type
          )
        `)
        .eq('contact_id', contactId)
        .order('check_in_time', { ascending: false })

      if (attendanceError) {
        console.error('❌ Error loading check-in history:', attendanceError)
        return
      }

      // Transform the data
      const transformedCheckIns = (attendanceData || []).map(record => ({
        id: record.id,
        check_in_time: record.check_in_time,
        method: record.method,
        event: {
          id: record.events.id,
          name: record.events.name,
          event_date: record.events.event_date,
          location: record.events.location,
          event_type: record.events.event_type
        }
      }))

      setCheckIns(transformedCheckIns)
      console.log('✅ Loaded check-in history:', transformedCheckIns.length)

    } catch (error) {
      console.error('Exception loading check-in history:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadCheckInHistory()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
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

  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'app':
        return 'phone-portrait'
      case 'qr':
        return 'qr-code'
      case 'manual':
        return 'person'
      case 'kiosk':
        return 'desktop'
      default:
        return 'checkmark-circle'
    }
  }

  const getMethodLabel = (method: string) => {
    switch (method.toLowerCase()) {
      case 'app':
        return 'Mobile App'
      case 'qr':
        return 'QR Code'
      case 'manual':
        return 'Manual'
      case 'kiosk':
        return 'Kiosk'
      default:
        return method
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#1f2937', '#111827']}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Check-in History</Text>
          </View>
          
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={styles.loadingText}>Loading your check-in history...</Text>
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Check-in History</Text>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {checkIns.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={64} color="#6B7280" />
              <Text style={styles.emptyStateText}>No Check-ins Yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Your check-in history will appear here once you start checking in to events.
              </Text>
            </View>
          ) : (
            <View style={styles.historyContainer}>
              <Text style={styles.sectionTitle}>
                Your Check-ins ({checkIns.length})
              </Text>
              
              {checkIns.map((checkIn) => (
                <View key={checkIn.id} style={styles.checkInCard}>
                  <LinearGradient
                    colors={['#374151', '#4B5563']}
                    style={styles.checkInGradient}
                  >
                    <View style={styles.checkInHeader}>
                      <View style={styles.eventIcon}>
                        <Ionicons
                          name={getEventTypeIcon(checkIn.event.event_type)}
                          size={24}
                          color="#F59E0B"
                        />
                      </View>
                      <View style={styles.checkInInfo}>
                        <Text style={styles.eventName}>{checkIn.event.name}</Text>
                        <Text style={styles.eventDate}>
                          {formatDate(checkIn.event.event_date)}
                        </Text>
                      </View>
                      <View style={styles.methodBadge}>
                        <Ionicons
                          name={getMethodIcon(checkIn.method)}
                          size={16}
                          color="white"
                        />
                        <Text style={styles.methodText}>
                          {getMethodLabel(checkIn.method)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.checkInDetails}>
                      <View style={styles.checkInDetailItem}>
                        <Ionicons name="time" size={16} color="#9CA3AF" />
                        <Text style={styles.checkInDetailText}>
                          Checked in at {formatTime(checkIn.check_in_time)}
                        </Text>
                      </View>

                      {checkIn.event.location && (
                        <View style={styles.checkInDetailItem}>
                          <Ionicons name="location" size={16} color="#9CA3AF" />
                          <Text style={styles.checkInDetailText}>
                            {checkIn.event.location}
                          </Text>
                        </View>
                      )}

                      {checkIn.event.event_type && (
                        <View style={styles.checkInDetailItem}>
                          <Ionicons name="bookmark" size={16} color="#9CA3AF" />
                          <Text style={styles.checkInDetailText}>
                            {checkIn.event.event_type.charAt(0).toUpperCase() + checkIn.event.event_type.slice(1)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </View>
              ))}
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
    backgroundColor: '#1f2937',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
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
  historyContainer: {
    marginBottom: 20,
  },
  checkInCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  checkInGradient: {
    padding: 20,
  },
  checkInHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  checkInInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  eventDate: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  methodText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  checkInDetails: {
    gap: 8,
  },
  checkInDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkInDetailText: {
    fontSize: 14,
    color: '#9CA3AF',
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
    lineHeight: 24,
  },
}) 