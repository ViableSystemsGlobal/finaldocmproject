import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface RideRequest {
  id: string
  pickup_address: string
  pickup_location?: any // JSON object with address, lat, lng
  notes?: string
  status: string
  created_at: string
  requested_at: string
  scheduled_time?: string
  event?: {
    id: string
    name: string
    event_date: string
    location?: string
  } | null
  driver?: {
    first_name: string
    last_name: string
    phone?: string
    email?: string
  } | null
}

interface MyRideRequestsScreenProps {
  navigation: any
}

export default function MyRideRequestsScreen({ navigation }: MyRideRequestsScreenProps) {
  const { user } = useAuth()
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadRideRequests()
  }, [])

  const loadRideRequests = async () => {
    if (!user) return

    try {
      console.log('🎯 Loading ride requests...')

      // Get the contact_id for this user
      const { data: mobileUser, error: mobileUserError } = await supabase
        .from('mobile_app_users')
        .select('contact_id')
        .eq('auth_user_id', user.id)
        .single()

      if (mobileUserError) {
        console.error('❌ Error getting mobile user:', mobileUserError)
        setLoading(false)
        setRefreshing(false)
        return
      }

      if (!mobileUser?.contact_id) {
        console.log('⚠️ No contact_id found for ride requests')
        setLoading(false)
        setRefreshing(false)
        return
      }

      const contactId = mobileUser.contact_id

      // Get user's ride requests with event details
      const { data: requestsData, error: requestsError } = await supabase
        .from('transport_requests')
        .select(`
          id,
          pickup_address,
          pickup_location,
          notes,
          status,
          created_at,
          requested_at,
          scheduled_time,
          event_id,
          assigned_driver
        `)
        .eq('contact_id', contactId)
        .order('requested_at', { ascending: false })

      if (requestsError) {
        console.error('❌ Error loading ride requests:', requestsError)
        Alert.alert('Error', 'Failed to load ride requests. Please try again.')
        setLoading(false)
        setRefreshing(false)
        return
      }

      // Get event details for each request
      const requestsWithDetails = await Promise.all(
        (requestsData || []).map(async (request) => {
          let eventDetails = null
          let driverDetails = null

          // Get event details if event_id exists
          if (request.event_id) {
            const { data: eventData } = await supabase
              .from('events')
              .select('id, name, event_date, location')
              .eq('id', request.event_id)
              .single()
            
            eventDetails = eventData
          }

          // Get driver details if assigned_driver exists
          if (request.assigned_driver) {
            const { data: driverData } = await supabase
              .from('drivers')
              .select('first_name, last_name, phone, email')
              .eq('id', request.assigned_driver)
              .single()
            
            driverDetails = driverData
          }

          return {
            ...request,
            event: eventDetails,
            driver: driverDetails
          }
        })
      )

      setRideRequests(requestsWithDetails)
      console.log('✅ Loaded ride requests:', requestsWithDetails.length)

    } catch (error) {
      console.error('Exception loading ride requests:', error)
      Alert.alert('Error', 'Something went wrong loading ride requests.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadRideRequests()
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#F59E0B'
      case 'assigned':
        return '#3B82F6'
      case 'confirmed':
        return '#10B981'
      case 'completed':
        return '#6B7280'
      case 'cancelled':
        return '#EF4444'
      default:
        return '#6B7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'time'
      case 'assigned':
        return 'person'
      case 'confirmed':
        return 'checkmark-circle'
      case 'completed':
        return 'checkmark-done'
      case 'cancelled':
        return 'close-circle'
      default:
        return 'help-circle'
    }
  }

  const handleCancelRequest = (requestId: string, eventName?: string) => {
    const displayName = eventName || 'this event'
    Alert.alert(
      'Cancel Ride Request',
      `Are you sure you want to cancel your ride request for "${displayName}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => cancelRequest(requestId)
        }
      ]
    )
  }

  const cancelRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('transport_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)

      if (error) {
        console.error('❌ Error cancelling ride request:', error)
        Alert.alert('Error', 'Failed to cancel ride request')
        return
      }

      // Update local state
      setRideRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'cancelled' }
            : req
        )
      )
      console.log('✅ Ride request cancelled successfully')

    } catch (error) {
      console.error('Exception cancelling ride request:', error)
      Alert.alert('Error', 'Something went wrong')
    }
  }

  const handleAddNewRequest = () => {
    console.log('🚗 Add new ride request - navigating to RideRequest')
    try {
      navigation.navigate('RideRequest')
    } catch (error) {
      console.error('❌ Error navigating to RideRequest:', error)
      Alert.alert('Error', 'Unable to open ride request form. Please try again.')
    }
  }

  const getPickupAddress = (request: RideRequest) => {
    if (request.pickup_location && typeof request.pickup_location === 'object') {
      return request.pickup_location.address || request.pickup_address
    }
    return request.pickup_address
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
            <Text style={styles.headerTitle}>My Ride Requests</Text>
          </View>
          
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={styles.loadingText}>Loading your ride requests...</Text>
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
          <Text style={styles.headerTitle}>My Ride Requests</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddNewRequest}
          >
            <Ionicons name="add" size={24} color="#F59E0B" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {rideRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={64} color="#6B7280" />
              <Text style={styles.emptyStateText}>No Ride Requests</Text>
              <Text style={styles.emptyStateSubtext}>
                You haven't requested any rides yet. Tap the + button to request a ride for an upcoming event.
              </Text>
              <TouchableOpacity
                style={styles.addFirstButton}
                onPress={handleAddNewRequest}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.addFirstButtonText}>Request Ride</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.requestsContainer}>
              <Text style={styles.sectionTitle}>
                Your Ride Requests ({rideRequests.length})
              </Text>
              
              {rideRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <LinearGradient
                    colors={['#374151', '#4B5563']}
                    style={styles.requestGradient}
                  >
                    <View style={styles.requestHeader}>
                      <View style={styles.eventIcon}>
                        <Ionicons name="calendar" size={24} color="#F59E0B" />
                      </View>
                      <View style={styles.requestInfo}>
                        <Text style={styles.eventName}>{request.event?.name}</Text>
                        <Text style={styles.eventDate}>
                          {request.event?.event_date ? (
                            `${formatDate(request.event.event_date)} at ${formatTime(request.event.event_date)}`
                          ) : 'Date not specified'}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                        <Ionicons
                          name={getStatusIcon(request.status)}
                          size={16}
                          color="white"
                        />
                        <Text style={styles.statusText}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.requestDetails}>
                      <View style={styles.requestDetailItem}>
                        <Ionicons name="location" size={16} color="#9CA3AF" />
                        <Text style={styles.requestDetailText}>
                          Pickup: {getPickupAddress(request)}
                        </Text>
                      </View>

                      {request.event?.location && (
                        <View style={styles.requestDetailItem}>
                          <Ionicons name="flag" size={16} color="#9CA3AF" />
                          <Text style={styles.requestDetailText}>
                            Event: {request.event?.location}
                          </Text>
                        </View>
                      )}

                      {request.driver && (
                        <View style={styles.requestDetailItem}>
                          <Ionicons name="person" size={16} color="#9CA3AF" />
                          <Text style={styles.requestDetailText}>
                            Driver: {request.driver.first_name} {request.driver.last_name}
                          </Text>
                        </View>
                      )}

                      {request.notes && (
                        <View style={styles.requestDetailItem}>
                          <Ionicons name="document-text" size={16} color="#9CA3AF" />
                          <Text style={styles.requestDetailText}>
                            Notes: {request.notes}
                          </Text>
                        </View>
                      )}

                      <View style={styles.requestDetailItem}>
                        <Ionicons name="time" size={16} color="#9CA3AF" />
                        <Text style={styles.requestDetailText}>
                          Requested: {formatDate(request.requested_at)}
                        </Text>
                      </View>
                    </View>

                    {(request.status === 'pending' || request.status === 'assigned') && (
                      <View style={styles.requestActions}>
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => handleCancelRequest(request.id, request.event?.name)}
                        >
                          <Ionicons name="close" size={16} color="white" />
                          <Text style={styles.cancelButtonText}>Cancel Request</Text>
                        </TouchableOpacity>
                      </View>
                    )}
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
    flex: 1,
  },
  addButton: {
    padding: 8,
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
  requestsContainer: {
    marginBottom: 20,
  },
  requestCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  requestGradient: {
    padding: 20,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  requestInfo: {
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  requestDetails: {
    gap: 8,
    marginBottom: 16,
  },
  requestDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  requestDetailText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
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
    marginBottom: 24,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addFirstButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}) 