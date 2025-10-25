import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  Share,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, getContactIdForUser } from '../lib/supabase';
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

interface EventDetailsScreenProps {
  route: {
    params: {
      event: Event;
    };
  };
  navigation: any;
}

export default function EventDetailsScreen({ route, navigation }: EventDetailsScreenProps) {
  const { event } = route.params;
  const { user } = useAuth();
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationCount, setRegistrationCount] = useState(0);

  useEffect(() => {
    console.log('🚀 EventDetailsScreen mounted for event:', event.name);
    console.log('👤 Current user:', user ? { id: user.id, email: user.email } : 'No user');
    checkRegistrationStatus();
    loadRegistrationCount();
  }, []);

  const checkRegistrationStatus = async () => {
    if (!user) {
      console.log('🔍 No user found, skipping registration check');
      return;
    }

    console.log('🔍 Checking registration status for:', {
      user_id: user.id,
      event_id: event.id
    });

    try {
      // Use the enhanced contact lookup function
      const { contactId, error: contactError } = await getContactIdForUser(user.id, user.email)

      if (contactError || !contactId) {
        console.log('🔍 No mobile app user record or contact_id found for registration check:', { userId: user.id, contactError });
        // If user doesn't have a contact_id, they can't be registered (since registrations require valid contact_id)
        setIsRegistered(false);
        return;
      }

      console.log('🔍 Found contact_id:', contactId);

      // Check registration with the proper contact_id
      const { data, error } = await supabase
        .from('registrations')
        .select('id, status, created_at')
        .eq('event_id', event.id)
        .eq('contact_id', contactId)
        .single();

      console.log('🔍 Registration check result:', { data, error });

      if (data && !error) {
        console.log('✅ User is registered for this event');
        setIsRegistered(true);
      } else {
        console.log('❌ User is not registered for this event');
        setIsRegistered(false);
      }
    } catch (error) {
      console.log('🔍 No registration found (expected for unregistered users):', error);
      setIsRegistered(false);
    }
  };

  const loadRegistrationCount = async () => {
    try {
      const { count, error } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id);

      if (!error) {
        setRegistrationCount(count || 0);
      }
    } catch (error) {
      console.error('Error loading registration count:', error);
    }
  };

  const handleRegistration = async () => {
    if (!user) {
      Alert.alert(
        'Login Required', 
        'Please log in to register for events.', 
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    console.log('🎯 Registration attempt:', {
      user_id: user.id,
      event_id: event.id,
      event_name: event.name,
      isRegistered: isRegistered
    });

    setLoading(true);

    try {
      // Use the enhanced contact lookup function
      const { contactId, error: contactError } = await getContactIdForUser(user.id, user.email)

      if (contactError || !contactId) {
        console.log('⚠️ No mobile app user record or contact_id found for registration:', { userId: user.id, contactError });
        Alert.alert(
          'Registration Error', 
          'Unable to register for this event. Please contact support to complete your profile setup.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('🔗 Using contact_id for registration:', contactId);

      if (isRegistered) {
        // Unregister
        console.log('🗑️ Attempting to unregister...');
        const { error } = await supabase
          .from('registrations')
          .delete()
          .eq('event_id', event.id)
          .eq('contact_id', contactId);

        if (error) {
          console.error('❌ Unregister error:', error);
          Alert.alert('Error', `Failed to cancel registration: ${error.message}`);
        } else {
          console.log('✅ Unregistration successful');
          setIsRegistered(false);
          setRegistrationCount(prev => prev - 1);
          Alert.alert('Success', 'Registration cancelled successfully.');
        }
      } else {
        // Register
        console.log('📝 Attempting to register...');
        const registrationData = {
          event_id: event.id,
          contact_id: contactId,
          status: 'confirmed',
        };
        console.log('📋 Registration data:', registrationData);

        const { error, data } = await supabase
          .from('registrations')
          .insert([registrationData])
          .select();

        if (error) {
          console.error('❌ Register error:', error);
          console.error('❌ Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          Alert.alert('Error', `Failed to register for event: ${error.message}`);
        } else {
          console.log('✅ Registration successful:', data);
          setIsRegistered(true);
          setRegistrationCount(prev => prev + 1);
          Alert.alert('Success', 'Successfully registered for the event!');
        }
      }
    } catch (error) {
      console.error('💥 Registration error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'long' }),
      date: date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      }),
    };
  };

  const getEventImage = (event: Event) => {
    if (event.primary_image?.url) {
      return event.primary_image.url;
    }
    if (event.image_url) {
      return event.image_url;
    }
    return 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400&h=300&fit=crop';
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

  const handleShare = async () => {
    try {
      const message = `Join me at ${event.name} on ${formatEventDate(event.event_date).date} at ${formatEventDate(event.event_date).time}${event.location ? ` at ${event.location}` : ''}`;
      
      await Share.share({
        message,
        title: event.name,
      });
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };

  const handleGetDirections = () => {
    if (event.location) {
      const url = `https://maps.google.com/?q=${encodeURIComponent(event.location)}`;
      Linking.openURL(url);
    }
  };

  const { day, date, time } = formatEventDate(event.event_date);
  const spotsLeft = event.capacity ? event.capacity - registrationCount : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Event Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getEventImage(event) }}
            style={styles.eventImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.imageGradient}
          />
          <View style={styles.imageOverlay}>
            <View style={styles.eventTypeContainer}>
              <Ionicons 
                name={getEventTypeIcon(event.type)} 
                size={20} 
                color="#F59E0B" 
              />
              <Text style={styles.eventType}>{event.type || 'Event'}</Text>
            </View>
          </View>
        </View>

        {/* Event Details */}
        <View style={styles.content}>
          <Text style={styles.eventTitle}>{event.name}</Text>
          
          {/* Date and Time */}
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeItem}>
              <Ionicons name="calendar" size={20} color="#F59E0B" />
              <View style={styles.dateTimeText}>
                <Text style={styles.dateTimeLabel}>{day}</Text>
                <Text style={styles.dateTimeValue}>{date}</Text>
              </View>
            </View>
            <View style={styles.dateTimeItem}>
              <Ionicons name="time" size={20} color="#F59E0B" />
              <View style={styles.dateTimeText}>
                <Text style={styles.dateTimeLabel}>Time</Text>
                <Text style={styles.dateTimeValue}>{time}</Text>
              </View>
            </View>
          </View>

          {/* Location */}
          {event.location && (
            <TouchableOpacity 
              style={styles.locationContainer}
              onPress={handleGetDirections}
            >
              <Ionicons name="location" size={20} color="#F59E0B" />
              <View style={styles.locationText}>
                <Text style={styles.locationLabel}>Location</Text>
                <Text style={styles.locationValue}>{event.location}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          {/* Capacity */}
          {event.capacity && (
            <View style={styles.capacityContainer}>
              <Ionicons name="people" size={20} color="#F59E0B" />
              <View style={styles.capacityText}>
                <Text style={styles.capacityLabel}>Capacity</Text>
                <Text style={styles.capacityValue}>
                  {registrationCount}/{event.capacity} registered
                  {spotsLeft !== null && spotsLeft > 0 && (
                    <Text style={styles.spotsLeft}> • {spotsLeft} spots left</Text>
                  )}
                </Text>
              </View>
            </View>
          )}

          {/* Description */}
          {event.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>About this Event</Text>
              <Text style={styles.descriptionText}>{event.description}</Text>
            </View>
          )}

          {/* Registration Button */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              isRegistered && styles.registeredButton,
              loading && styles.disabledButton,
            ]}
            onPress={handleRegistration}
            disabled={loading || !!(event.capacity && registrationCount >= event.capacity && !isRegistered)}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons 
                  name={isRegistered ? "checkmark-circle" : "add-circle"} 
                  size={24} 
                  color="white" 
                />
                <Text style={styles.registerButtonText}>
                  {isRegistered ? 'Registered' : 'Register for Event'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Full indicator */}
          {event.capacity && registrationCount >= event.capacity && !isRegistered && (
            <View style={styles.fullIndicator}>
              <Ionicons name="people" size={20} color="#EF4444" />
              <Text style={styles.fullText}>Event is full</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  shareButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  eventType: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  content: {
    padding: 20,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginRight: 10,
  },
  dateTimeText: {
    marginLeft: 12,
  },
  dateTimeLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 2,
  },
  dateTimeValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  locationText: {
    flex: 1,
    marginLeft: 12,
  },
  locationLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 2,
  },
  locationValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  capacityText: {
    marginLeft: 12,
  },
  capacityLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 2,
  },
  capacityValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  spotsLeft: {
    color: '#10B981',
  },
  descriptionContainer: {
    marginBottom: 30,
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  descriptionText: {
    color: '#D1D5DB',
    fontSize: 16,
    lineHeight: 24,
  },
  registerButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  registeredButton: {
    backgroundColor: '#10B981',
  },
  disabledButton: {
    backgroundColor: '#6B7280',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  fullIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7F1D1D',
    padding: 12,
    borderRadius: 8,
  },
  fullText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
