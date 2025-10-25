import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useNotifications } from '../contexts/NotificationsContext'
import { NotificationPreferences } from '../services/pushNotifications'

export default function NotificationSettingsScreen() {
  const navigation = useNavigation<any>()
  const { preferences, updatePreferences, sendTestNotification } = useNotifications()
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences>(preferences)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLocalPreferences(preferences)
  }, [preferences])

  const handleSave = async () => {
    setSaving(true)
    try {
      const success = await updatePreferences(localPreferences)
      if (success) {
        Alert.alert('Success', 'Notification preferences updated successfully!')
        navigation.goBack()
      } else {
        Alert.alert('Error', 'Failed to update notification preferences. Please try again.')
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while updating preferences.')
    } finally {
      setSaving(false)
    }
  }

  const handleTestNotification = async () => {
    try {
      await sendTestNotification()
      Alert.alert('Test Sent', 'A test notification has been sent!')
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification.')
    }
  }

  const updatePreference = (key: keyof NotificationPreferences, value: boolean | string) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const hasChanges = JSON.stringify(localPreferences) !== JSON.stringify(preferences)

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          disabled={!hasChanges || saving}
        >
          <Text style={[styles.saveButtonText, !hasChanges && styles.saveButtonTextDisabled]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Notification Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          <Text style={styles.sectionDescription}>
            Choose which types of notifications you'd like to receive
          </Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="calendar" size={24} color="#F59E0B" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Events</Text>
                <Text style={styles.settingDescription}>New events and event reminders</Text>
              </View>
            </View>
            <Switch
              value={localPreferences.events}
              onValueChange={(value) => updatePreference('events', value)}
              trackColor={{ false: '#374151', true: '#F59E0B' }}
              thumbColor={localPreferences.events ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="play-circle" size={24} color="#F59E0B" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Sermons</Text>
                <Text style={styles.settingDescription}>New sermon releases</Text>
              </View>
            </View>
            <Switch
              value={localPreferences.sermons}
              onValueChange={(value) => updatePreference('sermons', value)}
              trackColor={{ false: '#374151', true: '#F59E0B' }}
              thumbColor={localPreferences.sermons ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="megaphone" size={24} color="#F59E0B" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Announcements</Text>
                <Text style={styles.settingDescription}>Church announcements and updates</Text>
              </View>
            </View>
            <Switch
              value={localPreferences.announcements}
              onValueChange={(value) => updatePreference('announcements', value)}
              trackColor={{ false: '#374151', true: '#F59E0B' }}
              thumbColor={localPreferences.announcements ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="heart" size={24} color="#F59E0B" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Prayer Requests</Text>
                <Text style={styles.settingDescription}>New prayer requests and updates</Text>
              </View>
            </View>
            <Switch
              value={localPreferences.prayers}
              onValueChange={(value) => updatePreference('prayers', value)}
              trackColor={{ false: '#374151', true: '#F59E0B' }}
              thumbColor={localPreferences.prayers ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="people" size={24} color="#F59E0B" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Groups</Text>
                <Text style={styles.settingDescription}>Group activities and updates</Text>
              </View>
            </View>
            <Switch
              value={localPreferences.groups}
              onValueChange={(value) => updatePreference('groups', value)}
              trackColor={{ false: '#374151', true: '#F59E0B' }}
              thumbColor={localPreferences.groups ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={24} color="#F59E0B" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>General</Text>
                <Text style={styles.settingDescription}>General notifications and reminders</Text>
              </View>
            </View>
            <Switch
              value={localPreferences.general}
              onValueChange={(value) => updatePreference('general', value)}
              trackColor={{ false: '#374151', true: '#F59E0B' }}
              thumbColor={localPreferences.general ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Quiet Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>
          <Text style={styles.sectionDescription}>
            Set quiet hours when you don't want to receive notifications
          </Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon" size={24} color="#F59E0B" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Enable Quiet Hours</Text>
                <Text style={styles.settingDescription}>
                  {localPreferences.quietHoursEnabled 
                    ? `${localPreferences.quietHoursStart} - ${localPreferences.quietHoursEnd}`
                    : 'Disabled'
                  }
                </Text>
              </View>
            </View>
            <Switch
              value={localPreferences.quietHoursEnabled}
              onValueChange={(value) => updatePreference('quietHoursEnabled', value)}
              trackColor={{ false: '#374151', true: '#F59E0B' }}
              thumbColor={localPreferences.quietHoursEnabled ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          {localPreferences.quietHoursEnabled && (
            <View style={styles.timeSettings}>
              <TouchableOpacity style={styles.timeButton}>
                <Text style={styles.timeLabel}>Start Time</Text>
                <Text style={styles.timeValue}>{localPreferences.quietHoursStart}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.timeButton}>
                <Text style={styles.timeLabel}>End Time</Text>
                <Text style={styles.timeValue}>{localPreferences.quietHoursEnd}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Test Notification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Notifications</Text>
          <Text style={styles.sectionDescription}>
            Send a test notification to make sure everything is working
          </Text>

          <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
            <Ionicons name="send" size={20} color="white" />
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#374151',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 20,
    lineHeight: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  timeSettings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  timeButton: {
    flex: 1,
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}) 