import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

interface UserStats {
  servicesAttended: number;
  groupsJoined: number;
  prayerRequests: number;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<UserStats>({
    servicesAttended: 0,
    groupsJoined: 0,
    prayerRequests: 0
  });
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    loadUserStats();
    loadProfileImage();
  }, []);

  // Listen for user changes
  useEffect(() => {
    if (user) {
      loadProfileImage();
    }
  }, [user]);

  const loadProfileImage = async () => {
    if (!user) return;
    
    console.log('🔍 Current user metadata:', user.user_metadata);
    const imageUrl = user.user_metadata?.avatar_url;
    console.log('🔍 Avatar URL from metadata:', imageUrl);
    
    if (imageUrl) {
      setProfileImageUrl(imageUrl);
      console.log('✅ Profile image loaded:', imageUrl);
    } else {
      console.log('❌ No avatar URL found - showing default avatar');
      setProfileImageUrl(null);
    }
  };

  const loadUserStats = async () => {
    if (!user) return;

    try {
      // Get the contact_id for this user
      const { data: mobileUser, error: mobileUserError } = await supabase
        .from('mobile_app_users')
        .select('contact_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!mobileUser?.contact_id) {
        console.log('⚠️ No contact_id found for stats');
        return;
      }

      const contactId = mobileUser.contact_id;

      // Load all stats in parallel
      const [attendanceResult, groupsResult, prayerResult] = await Promise.all([
        // Services attended (check-ins)
        supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('contact_id', contactId),
        
        // Groups joined (regular + discipleship)
        Promise.all([
          supabase
            .from('group_memberships')
            .select('id', { count: 'exact', head: true })
            .eq('contact_id', contactId)
            .eq('status', 'active'),
          supabase
            .from('discipleship_memberships')
            .select('id', { count: 'exact', head: true })
            .eq('contact_id', contactId)
            .eq('status', 'active')
        ]),
        
        // Prayer requests
        supabase
          .from('prayer_requests')
          .select('id', { count: 'exact', head: true })
          .eq('contact_id', contactId)
      ]);

      const servicesAttended = attendanceResult.count || 0;
      const regularGroups = groupsResult[0].count || 0;
      const discipleshipGroups = groupsResult[1].count || 0;
      const groupsJoined = regularGroups + discipleshipGroups;
      const prayerRequests = prayerResult.count || 0;

      setStats({
        servicesAttended,
        groupsJoined,
        prayerRequests
      });

      console.log('✅ Loaded user stats:', { servicesAttended, groupsJoined, prayerRequests });

    } catch (error) {
      console.error('Exception loading user stats:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleNotificationsPress = () => {
    console.log('🔔 Notifications pressed - navigating to Notifications')
    try {
      navigation.navigate('Notifications')
    } catch (error) {
      console.error('❌ Error navigating to Notifications:', error)
    }
  }

  const handleRideRequestsPress = () => {
    console.log('🚗 Ride Requests pressed - navigating to MyRideRequests')
    try {
      navigation.navigate('MyRideRequests')
    } catch (error) {
      console.error('❌ Error navigating to MyRideRequests:', error)
    }
  }

  const handleMyGroupsPress = () => {
    console.log('👥 My Groups pressed - navigating to MyGroups')
    try {
      navigation.navigate('MyGroups')
    } catch (error) {
      console.error('❌ Error navigating to MyGroups:', error)
    }
  }

  const handleMyGivingPress = () => {
    console.log('💰 My Giving pressed - navigating to MyGiving')
    try {
      navigation.navigate('MyGiving')
    } catch (error) {
      console.error('❌ Error navigating to MyGiving:', error)
    }
  }

  const handleCheckInHistoryPress = () => {
    console.log('✅ Check-in History pressed - navigating to CheckInHistory')
    try {
      navigation.navigate('CheckInHistory')
    } catch (error) {
      console.error('❌ Error navigating to CheckInHistory:', error)
    }
  }

  const handleMyPrayerRequestsPress = () => {
    console.log('🙏 My Prayer Requests pressed - navigating to MyPrayerRequests')
    try {
      navigation.navigate('MyPrayerRequests')
    } catch (error) {
      console.error('❌ Error navigating to MyPrayerRequests:', error)
    }
  }

  const handleNotificationSettingsPress = () => {
    console.log('⚙️ Notification Settings pressed - navigating to NotificationSettings')
    try {
      navigation.navigate('NotificationSettings')
    } catch (error) {
      console.error('❌ Error navigating to NotificationSettings:', error)
    }
  }

  const handleChangeProfilePicture = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library access to change your profile picture.');
        return;
      }

      // Show action sheet
      Alert.alert(
        'Change Profile Picture',
        'Choose an option',
        [
          { text: 'Camera', onPress: () => pickImageFromCamera() },
          { text: 'Photo Library', onPress: () => pickImageFromLibrary() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to access camera or photo library.');
    }
  };

  const pickImageFromCamera = async () => {
    try {
      console.log('📷 Requesting camera permissions...');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        console.log('❌ Camera permission denied');
        Alert.alert('Permission Required', 'Please grant camera access to take a photo.');
        return;
      }

      console.log('📷 Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('📷 Camera result:', { canceled: result.canceled, assetsCount: result.assets?.length });

      if (!result.canceled && result.assets[0]) {
        console.log('📷 Image selected, starting upload...');
        await uploadProfileImage(result.assets[0].uri);
      } else {
        console.log('📷 Image selection canceled');
      }
    } catch (error) {
      console.error('❌ Error picking image from camera:', error);
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  const pickImageFromLibrary = async () => {
    try {
      console.log('📚 Launching photo library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('📚 Library result:', { canceled: result.canceled, assetsCount: result.assets?.length });

      if (!result.canceled && result.assets[0]) {
        console.log('📚 Image selected, starting upload...');
        await uploadProfileImage(result.assets[0].uri);
      } else {
        console.log('📚 Image selection canceled');
      }
    } catch (error) {
      console.error('❌ Error picking image from library:', error);
      Alert.alert('Error', 'Failed to select image.');
    }
  };

  const uploadProfileImage = async (imageUri: string) => {
    if (!user) return;

    try {
      setIsUploadingImage(true);
      console.log('🔄 Starting profile image upload...');

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }
      console.log('✅ User authenticated');

      // Simple file name
      const fileName = `${user.id}_${Date.now()}.jpg`;
      console.log('📁 File name:', fileName);

      // Try a different approach - use fetch with proper error handling
      console.log('📁 Attempting to read file from URI:', imageUri);
      
      let fileData;
      try {
        // Try the FileSystem approach first
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        console.log('✅ FileSystem read success, length:', base64.length);
        
        if (!base64 || base64.length === 0) {
          throw new Error('FileSystem returned empty data');
        }
        
        // Convert base64 to binary string
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        fileData = bytes;
        console.log('✅ Converted to bytes, length:', fileData.length);
        
      } catch (fsError) {
        console.error('❌ FileSystem approach failed:', fsError);
        console.log('🔄 Trying alternative fetch approach...');
        
        // Fallback to fetch approach
        const response = await fetch(imageUri);
        if (!response.ok) {
          throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        fileData = new Uint8Array(arrayBuffer);
        console.log('✅ Fetch approach success, length:', fileData.length);
      }
      
      if (!fileData || fileData.length === 0) {
        throw new Error('Failed to read image file - no data obtained');
      }

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, fileData, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);
        throw uploadError;
      }
      console.log('✅ Image uploaded successfully:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      console.log('🔗 Public URL:', publicUrl);

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrl
        }
      });

      if (updateError) {
        console.error('❌ Metadata update error:', updateError);
        throw updateError;
      }
      console.log('✅ User metadata updated');

      // Update local state immediately
      setProfileImageUrl(publicUrl);
      console.log('✅ Local state updated');

      // Force refresh user data
      setTimeout(async () => {
        const { data: { user: refreshedUser } } = await supabase.auth.getUser();
        console.log('🔄 Refreshed user data:', refreshedUser?.user_metadata);
        if (refreshedUser?.user_metadata?.avatar_url) {
          setProfileImageUrl(refreshedUser.user_metadata.avatar_url);
          console.log('🔄 Updated with refreshed data');
        }
      }, 1000);

      Alert.alert('Success', 'Profile picture updated!');

    } catch (error) {
      console.error('❌ Upload failed:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error message:', errorMessage);
      
      if (errorMessage === 'User not authenticated') {
        Alert.alert('Error', 'Please log out and log back in, then try again.');
      } else {
        Alert.alert('Error', `Upload failed: ${errorMessage}\n\nCheck console for details.`);
      }
    } finally {
      setIsUploadingImage(false);
    }
  };



  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <TouchableOpacity style={styles.avatarContainer} onPress={handleChangeProfilePicture}>
              <View style={styles.avatar}>
                {profileImageUrl ? (
                  <Image
                    source={{ uri: profileImageUrl }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                    onLoad={() => {
                      console.log('✅ Image loaded successfully:', profileImageUrl);
                    }}
                    onError={(error) => {
                      console.error('❌ Image failed to load:', error);
                      console.error('❌ Failed URL:', profileImageUrl);
                    }}
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                )}
                {isUploadingImage && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color="white" />
                  </View>
                )}
              </View>
              <View style={styles.editIcon}>
                <Ionicons name="camera" size={16} color="white" />
              </View>
            </TouchableOpacity>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {user?.user_metadata?.first_name} {user?.user_metadata?.last_name} 
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.servicesAttended}</Text>
            <Text style={styles.statLabel}>Services Attended</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.groupsJoined}</Text>
            <Text style={styles.statLabel}>Groups Joined</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.prayerRequests}</Text>
            <Text style={styles.statLabel}>Prayer Requests</Text>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={handleMyGroupsPress}>
            <Ionicons name="people" size={24} color="#F59E0B" />
            <Text style={styles.menuText}>My Groups</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleMyGivingPress}>
            <Ionicons name="heart" size={24} color="#F59E0B" />
            <Text style={styles.menuText}>My Giving</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleCheckInHistoryPress}>
            <Ionicons name="checkmark-circle" size={24} color="#F59E0B" />
            <Text style={styles.menuText}>Check-in History</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleMyPrayerRequestsPress}>
            <Ionicons name="heart" size={24} color="#F59E0B" />
            <Text style={styles.menuText}>My Prayer Requests</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleRideRequestsPress}>
            <Ionicons name="car" size={24} color="#F59E0B" />
            <Text style={styles.menuText}>Ride Requests</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleNotificationsPress}>
            <Ionicons name="notifications" size={24} color="#F59E0B" />
            <Text style={styles.menuText}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleNotificationSettingsPress}>
            <Ionicons name="settings" size={24} color="#F59E0B" />
            <Text style={styles.menuText}>Notification Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle" size={24} color="#F59E0B" />
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>



          <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
            <Ionicons name="log-out" size={24} color="#ef4444" />
            <Text style={[styles.menuText, { color: '#ef4444' }]}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  editIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1f2937',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  userEmail: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  menuContainer: {
    padding: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#374151',
    borderRadius: 12,
    marginBottom: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    marginLeft: 16,
  },
  notificationBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 8,
  },
  notificationBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
}); 