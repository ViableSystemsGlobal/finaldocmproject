import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationsContext'
import { getSermons, getEvents } from '../lib/supabase'
import { useNavigation } from '@react-navigation/native'
import { getBrandingConfig, BrandingConfig } from '../services/branding'

const { width } = Dimensions.get('window')

export default function HomeScreen() {
  const { user, signOut } = useAuth()
  const { unreadCount, markAllAsRead } = useNotifications()
  const navigation = useNavigation<any>()
  const [sermons, setSermons] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [branding, setBranding] = useState<BrandingConfig | null>(null)

  useEffect(() => {
    loadContent()
    loadBranding()
    // Debug navigation object
    console.log('🔍 Navigation object available:', !!navigation)
    console.log('🔍 Navigation methods:', Object.keys(navigation || {}))
  }, [])



  const loadContent = async () => {
    console.log('🔍 Loading data from database...')
    try {
      const [sermonsData, eventsData] = await Promise.all([
        getSermons(3),
        getEvents(3)
      ])

      console.log('📊 Events data:', eventsData)
      console.log('🎬 Sermons data:', sermonsData)

      if (sermonsData.data) {
        console.log('✅ Sermons loaded:', sermonsData.data.length)
        setSermons(sermonsData.data)
      }
      if (eventsData.data) {
        console.log('✅ Events loaded:', eventsData.data.length)
        setEvents(eventsData.data)
      } else {
        console.log('❌ No events data found')
      }
    } catch (error) {
      console.error('❌ Error loading data:', error)
    } finally {
      setLoading(false)
      console.log('🏁 Data loading complete')
    }
  }

  const loadBranding = async () => {
    try {
      const brandingConfig = await getBrandingConfig()
      setBranding(brandingConfig)
    } catch (error) {
      console.error('Error loading branding:', error)
    }
  }

  const getFirstName = () => {
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'Friend'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const formatSermonDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleNotificationPress = () => {
    console.log('🔔 Notification button pressed - navigating to Notifications')
    try {
      navigation.navigate('Notifications')
    } catch (error) {
      console.error('❌ Error navigating to Notifications:', error)
    }
  }

  const handleProfilePress = () => {
    console.log('👤 Profile image pressed - navigating to Profile tab')
    try {
      // Since we're in the TabNavigator, we can navigate directly to the Profile tab
      navigation.navigate('Profile')
    } catch (error) {
      console.error('❌ Error navigating to Profile:', error)
    }
  }

  const handleJoinGroupPress = () => {
    console.log('👥 Join Group button pressed - navigating to Groups')
    try {
      navigation.navigate('Groups')
    } catch (error) {
      console.error('❌ Error navigating to Groups:', error)
    }
  }

  const handlePrayerRequestPress = () => {
    console.log('🙏 Request Prayer button pressed - navigating to PrayerRequest')
    try {
      navigation.navigate('PrayerRequest')
    } catch (error) {
      console.error('❌ Error navigating to PrayerRequest:', error)
    }
  }

  const handleGivePress = () => {
    console.log('💰 Give button pressed - navigating to Give')
    try {
      navigation.navigate('Give')
    } catch (error) {
      console.error('❌ Error navigating to Give:', error)
    }
  }

  const handleRideRequestPress = () => {
    console.log('🚗 Request Ride button pressed - navigating to RideRequest')
    try {
      navigation.navigate('RideRequest')
    } catch (error) {
      console.error('❌ Error navigating to RideRequest:', error)
    }
  }

  const getUserProfileImage = () => {
    if (user?.user_metadata?.avatar_url) {
      return { uri: user.user_metadata.avatar_url }
    }
    // Create initials-based avatar fallback
    const firstInitial = user?.user_metadata?.first_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'
    return { uri: `https://ui-avatars.com/api/?name=${firstInitial}&background=F59E0B&color=ffffff&size=80` }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
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
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
              <Ionicons name="notifications-outline" size={24} color="white" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleProfilePress}>
              <Image
                source={getUserProfileImage()}
                style={styles.profileImage}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome, {getFirstName()}!</Text>
          <Text style={styles.welcomeSubtext}>Great to see you today</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleJoinGroupPress}>
            <View style={styles.actionIcon}>
              <Ionicons name="people" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.actionText}>Join a Group</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handlePrayerRequestPress}>
            <View style={styles.actionIcon}>
              <Ionicons name="heart" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.actionText}>Request Prayer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleGivePress}>
            <View style={styles.actionIcon}>
              <Ionicons name="card" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.actionText}>Give</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleRideRequestPress}>
            <View style={styles.actionIcon}>
              <Ionicons name="car" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.actionText}>Request Ride</Text>
          </TouchableOpacity>
        </View>

        {/* Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading events...</Text>
              </View>
            ) : events.length > 0 ? (
              events.map((event, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.eventCard, { marginRight: 16 }]}
                  onPress={() => navigation.navigate('EventDetails', { event })}
                >
                  <Image
                    source={{ 
                      uri: event.image_url || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=200&fit=crop'
                    }}
                    style={styles.eventImage}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.eventGradient}
                  />
                  <View style={styles.eventContent}>
                    <View style={styles.eventDate}>
                      <Text style={styles.eventDateText}>
                        {formatDate(event.event_date)}
                      </Text>
                    </View>
                    <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
                    <Text style={styles.eventLocation} numberOfLines={1}>{event.location}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No upcoming events</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Sermons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Sermons</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading sermons...</Text>
              </View>
            ) : sermons.length > 0 ? (
              sermons.map((sermon, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.sermonCard, { marginRight: 16 }]}
                  onPress={() => navigation.navigate('SermonDetails', { sermon })}
                >
                  <Image
                    source={{ 
                      uri: sermon.thumbnail_image || `https://img.youtube.com/vi/${sermon.youtube_id}/hqdefault.jpg`
                    }}
                    style={styles.sermonImage}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.sermonGradient}
                  />
                  <View style={styles.sermonContent}>
                    <View style={styles.playBadge}>
                      <Ionicons name="play" size={16} color="white" />
                    </View>
                    <Text style={styles.sermonTitle} numberOfLines={2}>{sermon.title}</Text>
                    <Text style={styles.sermonSpeaker} numberOfLines={1}>{sermon.speaker}</Text>
                    <Text style={styles.sermonDate} numberOfLines={1}>{formatSermonDate(sermon.sermon_date)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No sermons available</Text>
              </View>
            )}
          </ScrollView>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  logoContainer: {
    alignItems: 'center',
    height: 60,
    justifyContent: 'center',
  },
  logoImage: {
    width: 120,
    height: 60,
    resizeMode: 'contain',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    marginRight: 12,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  carousel: {
    paddingLeft: 20,
  },
  eventCard: {
    width: width * 0.7,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  eventContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  eventDate: {
    backgroundColor: '#F59E0B',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  eventDateText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  eventTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventLocation: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  sermonCard: {
    width: width * 0.7,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  sermonImage: {
    width: '100%',
    height: '100%',
  },
  sermonGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  sermonContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  playBadge: {
    backgroundColor: '#F59E0B',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  sermonTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sermonSpeaker: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  sermonDate: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  loadingContainer: {
    width: width * 0.7,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  noDataContainer: {
    width: width * 0.7,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  noDataText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.7,
  },
}); 