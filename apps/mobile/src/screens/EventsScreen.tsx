import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getEvents, isUserRegisteredForEvent } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Event {
  id: string;
  name: string;
  description?: string;
  event_date: string;
  location?: string;
  capacity?: number;
  type?: string;
  image_url?: string;
  primary_image?: {
    url: string;
    alt_text?: string;
  } | null;
}

interface EventsScreenProps {
  navigation: any;
}

export default function EventsScreen({ navigation }: EventsScreenProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRegistrations, setUserRegistrations] = useState<Set<string>>(new Set());

  const loadEvents = async () => {
    try {
      console.log('🎯 EventsScreen: Loading events...');
      const { data, error } = await getEvents();
      
      if (error) {
        console.error('❌ EventsScreen: Error loading events:', error);
        setError('Failed to load events');
      } else {
        console.log('✅ EventsScreen: Events loaded successfully:', data?.length || 0);
        setEvents(data || []);
        setError(null);
        
        // Check user registrations if user is logged in
        if (user && data) {
          await checkUserRegistrations(data);
        }
      }
    } catch (err) {
      console.error('❌ EventsScreen: Exception loading events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const checkUserRegistrations = async (events: Event[]) => {
    if (!user) return;
    
    console.log('🔍 Checking user registrations for all events...');
    const registrationSet = new Set<string>();
    
    try {
      // Check event registrations
      const registrationChecks = events.map(async (event) => {
        const { isRegistered } = await isUserRegisteredForEvent(event.id, user.id);
        if (isRegistered) {
          registrationSet.add(event.id);
        }
        return { eventId: event.id, isRegistered };
      });
      
      // Wait for all checks to complete
      await Promise.all(registrationChecks);
      
      console.log('✅ User registration check complete:', Array.from(registrationSet));
      setUserRegistrations(registrationSet);
      
    } catch (error) {
      console.error('❌ Error checking user registrations:', error);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    return { month, day };
  };

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const getEventTypeIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'worship':
        return 'musical-notes';
      case 'conference':
        return 'people';
      case 'social':
        return 'heart';
      case 'outreach':
        return 'hand-left';
      case 'youth':
        return 'school';
      default:
        return 'calendar';
    }
  };

  const getEventImage = (event: Event) => {
    if (event.primary_image?.url) {
      return event.primary_image.url;
    }
    if (event.image_url) {
      return event.image_url;
    }
    return 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400&h=200&fit=crop';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const featuredEvent = events[0];
  const upcomingEvents = events.slice(1);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Events</Text>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadEvents}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Featured Event */}
        {featuredEvent && (
          <TouchableOpacity 
            style={styles.featuredEvent}
            onPress={() => navigation.navigate('EventDetails', { event: featuredEvent })}
          >
            <Image
              source={{ uri: getEventImage(featuredEvent) }}
              style={styles.featuredImage}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.featuredGradient}
            />
            <View style={styles.featuredContent}>
              <View style={styles.eventBadge}>
                <Text style={styles.badgeText}>
                  {formatEventDate(featuredEvent.event_date).month} {formatEventDate(featuredEvent.event_date).day}
                </Text>
              </View>
              <Text style={styles.featuredTitle}>{featuredEvent.name}</Text>
              <Text style={styles.featuredTime}>{formatEventTime(featuredEvent.event_date)}</Text>
              {featuredEvent.location && (
                <Text style={styles.featuredLocation}>{featuredEvent.location}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}

        {/* Upcoming Events List */}
        {upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            
            {upcomingEvents.map((event) => {
              const { month, day } = formatEventDate(event.event_date);
              return (
                <TouchableOpacity 
                  key={event.id} 
                  style={styles.eventItem}
                  onPress={() => navigation.navigate('EventDetails', { event })}
                >
                  <View style={styles.eventDate}>
                    <Text style={styles.eventMonth}>{month}</Text>
                    <Text style={styles.eventDay}>{day}</Text>
                  </View>
                  <View style={styles.eventDetails}>
                    <Text style={styles.eventName}>{event.name}</Text>
                    <Text style={styles.eventTime}>{formatEventTime(event.event_date)}</Text>
                    {event.location && (
                      <Text style={styles.eventLocation}>{event.location}</Text>
                    )}
                    {event.capacity && (
                      <Text style={styles.eventCapacity}>Capacity: {event.capacity}</Text>
                    )}
                  </View>
                  <View style={styles.eventActions}>
                    <Ionicons 
                      name={getEventTypeIcon(event.type)} 
                      size={20} 
                      color="#F59E0B" 
                      style={styles.eventTypeIcon}
                    />
                    <TouchableOpacity 
                      style={[
                        styles.joinButton,
                        userRegistrations.has(event.id) && styles.registeredButton
                      ]}
                      disabled={userRegistrations.has(event.id)}
                      onPress={() => navigation.navigate('EventDetails', { event })}
                    >
                      {userRegistrations.has(event.id) ? (
                        <>
                          <Ionicons name="checkmark-circle" size={16} color="white" style={{ marginRight: 4 }} />
                          <Text style={styles.joinButtonText}>Registered</Text>
                        </>
                      ) : (
                        <Text style={styles.joinButtonText}>Join</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Empty State */}
        {events.length === 0 && !loading && !error && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#6B7280" />
            <Text style={styles.emptyStateText}>No events scheduled</Text>
            <Text style={styles.emptyStateSubtext}>Check back later for upcoming events</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  errorContainer: {
    backgroundColor: '#EF4444',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  featuredEvent: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
    position: 'relative',
    marginBottom: 30,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  featuredContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  eventBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  featuredTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featuredTime: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 4,
  },
  featuredLocation: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  eventDate: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 50,
  },
  eventMonth: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  eventDay: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  eventDetails: {
    flex: 1,
  },
  eventName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventTime: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 2,
  },
  eventLocation: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 2,
  },
  eventCapacity: {
    color: '#6B7280',
    fontSize: 12,
  },
  eventActions: {
    alignItems: 'center',
  },
  eventTypeIcon: {
    marginBottom: 8,
  },
  joinButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  registeredButton: {
    backgroundColor: '#10B981',
  },
  joinButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
  },
}); 