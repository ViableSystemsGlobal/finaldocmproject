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
import { supabase, getContactIdForUser } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface PrayerRequest {
  id: string
  // Contact-based fields (preferred)
  contact_id?: string
  title?: string
  description?: string
  category?: string
  is_private?: boolean
  // Email-based fields (fallback)
  name?: string
  email?: string
  phone?: string
  subject?: string
  message?: string
  urgency?: string
  is_confidential?: boolean
  // Common fields
  status: string
  submitted_at?: string
  created_at: string
  updated_at: string
}

interface MyPrayerRequestsScreenProps {
  navigation: any
}

export default function MyPrayerRequestsScreen({ navigation }: MyPrayerRequestsScreenProps) {
  const { user } = useAuth()
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadPrayerRequests()
  }, [])

  const loadPrayerRequests = async () => {
    if (!user) {
      console.log('⚠️ No user found')
      setLoading(false)
      setRefreshing(false)
      return
    }

    try {
      console.log('🎯 Loading prayer requests for user:', user.id)

      // Use the enhanced contact lookup function
      const { contactId, error: contactError } = await getContactIdForUser(user.id, user.email)

      console.log('📱 Contact lookup result:', { contactId, contactError })

      if (contactError) {
        console.error('❌ Error getting contact ID:', contactError)
        // If no mobile_app_users record, show empty state instead of error
        const errorMessage = contactError && typeof contactError === 'object' && 'message' in contactError 
          ? (contactError as any).message 
          : contactError?.toString() || 'Unknown error'
        
        if (errorMessage.includes('No contact record found')) {
          console.log('ℹ️ No contact record found - showing empty state')
          setPrayerRequests([])
          setLoading(false)
          setRefreshing(false)
          return
        }
        Alert.alert('Error', 'Failed to load user information. Please try again.')
        setLoading(false)
        setRefreshing(false)
        return
      }

      if (!contactId) {
        console.log('⚠️ No contact_id found for prayer requests')
        setPrayerRequests([])
        setLoading(false)
        setRefreshing(false)
        return
      }

      console.log('👤 Contact ID:', contactId)

      // Query prayer requests by contact_id
      console.log('🙏 Loading prayer requests by contact_id...')
      const { data: requestsData, error: requestsError } = await supabase
        .from('prayer_requests')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })

      console.log('🙏 Contact ID query result:', { 
        requestsData, 
        requestsError,
        count: requestsData?.length || 0 
      })

      if (requestsError) {
        console.error('❌ Error loading prayer requests:', requestsError)
        Alert.alert('Error', 'Failed to load prayer requests. Please try again.')
        setLoading(false)
        setRefreshing(false)
        return
      }

      // Transform the data to match our interface
      const transformedRequests = (requestsData || []).map(request => ({
        id: request.id,
        title: request.title,
        description: request.description,
        status: request.status,
        created_at: request.created_at || request.submitted_at,
        updated_at: request.updated_at
      }))

      setPrayerRequests(transformedRequests)
      console.log('✅ Loaded prayer requests:', transformedRequests.length)

    } catch (error) {
      console.error('Exception loading prayer requests:', error)
      Alert.alert('Error', 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadPrayerRequests()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCategoryIcon = (category?: string) => {
    if (!category) return 'heart'
    
    switch (category.toLowerCase()) {
      case 'health':
        return 'medical'
      case 'family':
        return 'home'
      case 'work':
        return 'briefcase'
      case 'spiritual':
        return 'book'
      case 'financial':
        return 'card'
      case 'relationships':
        return 'heart'
      case 'guidance':
        return 'compass'
      case 'thanksgiving':
        return 'happy'
      default:
        return 'heart'
    }
  }

  const getCategoryColor = (category?: string) => {
    if (!category) return '#6B7280'
    
    switch (category.toLowerCase()) {
      case 'health':
        return '#EF4444'
      case 'family':
        return '#F59E0B'
      case 'work':
        return '#3B82F6'
      case 'spiritual':
        return '#8B5CF6'
      case 'financial':
        return '#10B981'
      case 'relationships':
        return '#EC4899'
      case 'guidance':
        return '#6B7280'
      case 'thanksgiving':
        return '#F59E0B'
      default:
        return '#6B7280'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return '#3B82F6'
      case 'praying':
        return '#10B981'
      case 'responded':
        return '#F59E0B'
      case 'archived':
        return '#6B7280'
      default:
        return '#3B82F6'
    }
  }

  const handleDeleteRequest = (requestId: string, title: string) => {
    Alert.alert(
      'Delete Prayer Request',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteRequest(requestId)
        }
      ]
    )
  }

  const deleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('prayer_requests')
        .delete()
        .eq('id', requestId)

      if (error) {
        console.error('❌ Error deleting prayer request:', error)
        Alert.alert('Error', 'Failed to delete prayer request')
        return
      }

      // Remove from local state
      setPrayerRequests(prev => prev.filter(req => req.id !== requestId))
      console.log('✅ Prayer request deleted successfully')

    } catch (error) {
      console.error('Exception deleting prayer request:', error)
      Alert.alert('Error', 'Something went wrong')
    }
  }

  const handleAddNewRequest = () => {
    console.log('🙏 Add new prayer request - navigating to PrayerRequest')
    try {
      navigation.navigate('PrayerRequest')
    } catch (error) {
      console.error('❌ Error navigating to PrayerRequest:', error)
      Alert.alert('Error', 'Unable to open prayer request form. Please try again.')
    }
  }

  const getRequestTitle = (request: PrayerRequest) => {
    return request.title || request.subject || 'Prayer Request'
  }

  const getRequestDescription = (request: PrayerRequest) => {
    return request.description || request.message || ''
  }

  const getRequestCategory = (request: PrayerRequest) => {
    return request.category || 'Uncategorized'
  }

  const isRequestPrivate = (request: PrayerRequest) => {
    return request.is_private || request.is_confidential || false
  }

  const getRequestDate = (request: PrayerRequest) => {
    return request.submitted_at || request.created_at
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
            <Text style={styles.headerTitle}>My Prayer Requests</Text>
          </View>
          
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={styles.loadingText}>Loading your prayer requests...</Text>
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
          <Text style={styles.headerTitle}>My Prayer Requests</Text>
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
          {prayerRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={64} color="#6B7280" />
              <Text style={styles.emptyStateText}>No Prayer Requests</Text>
              <Text style={styles.emptyStateSubtext}>
                You haven't submitted any prayer requests yet. Tap the + button to add your first request.
              </Text>
              <TouchableOpacity
                style={styles.addFirstButton}
                onPress={handleAddNewRequest}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.addFirstButtonText}>Add Prayer Request</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.requestsContainer}>
              <Text style={styles.sectionTitle}>
                Your Prayer Requests ({prayerRequests.length})
              </Text>
              
              {prayerRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <LinearGradient
                    colors={['#374151', '#4B5563']}
                    style={styles.requestGradient}
                  >
                    <View style={styles.requestHeader}>
                      <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(request.category) }]}>
                        <Ionicons
                          name={getCategoryIcon(request.category)}
                          size={20}
                          color="white"
                        />
                      </View>
                      <View style={styles.requestInfo}>
                        <Text style={styles.requestTitle}>{getRequestTitle(request)}</Text>
                        <View style={styles.requestMeta}>
                          <Text style={styles.categoryText}>
                            {getRequestCategory(request)}
                          </Text>
                          <View style={styles.metaDivider} />
                          <Text style={styles.dateText}>
                            {formatDate(getRequestDate(request))}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteRequest(request.id, getRequestTitle(request))}
                      >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.requestDescription} numberOfLines={3}>
                      {getRequestDescription(request)}
                    </Text>

                    <View style={styles.requestFooter}>
                      <View style={styles.requestBadges}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                          <Text style={styles.statusText}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Text>
                        </View>
                        
                        {isRequestPrivate(request) && (
                          <View style={styles.privateBadge}>
                            <Ionicons name="lock-closed" size={12} color="white" />
                            <Text style={styles.privateText}>Confidential</Text>
                          </View>
                        )}
                      </View>
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  requestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6B7280',
    marginHorizontal: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  deleteButton: {
    padding: 8,
  },
  requestDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
    marginBottom: 16,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B7280',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  privateText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
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