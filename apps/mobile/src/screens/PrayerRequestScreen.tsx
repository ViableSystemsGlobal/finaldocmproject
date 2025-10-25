import React, { useState } from 'react'
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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../contexts/AuthContext'
import { submitPrayerRequest } from '../lib/supabase'

export default function PrayerRequestScreen({ navigation }: any) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('General')
  const [isPrivate, setIsPrivate] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const prayerCategories = [
    'Health & Healing',
    'Family & Relationships',
    'Work & Career',
    'Financial',
    'Spiritual Growth',
    'Travel Safety',
    'Grief & Loss',
    'Guidance & Direction',
    'Thanksgiving & Praise',
    'General'
  ]

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your prayer request')
      return
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please describe what you would like prayer for')
      return
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to submit a prayer request')
      return
    }

    try {
      setIsSubmitting(true)

      const { data, error } = await submitPrayerRequest({
        title: title.trim(),
        description: description.trim(),
        category,
        isPrivate
      }, user.id)

      if (error) {
        throw error
      }

      Alert.alert(
        'Prayer Request Submitted',
        'Your prayer request has been submitted successfully. Our pastoral team will be praying for you.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      )

    } catch (error) {
      console.error('Error submitting prayer request:', error)
      Alert.alert('Error', 'Failed to submit prayer request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
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
            <Text style={styles.headerTitle}>Prayer Request</Text>
            <Text style={styles.headerSubtitle}>Share your prayer needs</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="text" size={16} color="#F59E0B" /> Title
            </Text>
            <Text style={styles.sectionSubtitle}>Brief title for your prayer request</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Healing for family member"
              placeholderTextColor="#9CA3AF"
              maxLength={100}
            />
          </View>

          {/* Category Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="albums" size={16} color="#F59E0B" /> Category
            </Text>
            <Text style={styles.sectionSubtitle}>Select the most appropriate category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {prayerCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.categoryButtonActive
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    category === cat && styles.categoryButtonTextActive
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="document-text" size={16} color="#F59E0B" /> Prayer Request
            </Text>
            <Text style={styles.sectionSubtitle}>Share the details of what you need prayer for</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Please share what you would like prayer for..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.characterCount}>{description.length}/1000</Text>
          </View>

          {/* Privacy Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="shield-checkmark" size={16} color="#F59E0B" /> Privacy
            </Text>
            <TouchableOpacity
              style={styles.privacyOption}
              onPress={() => setIsPrivate(!isPrivate)}
            >
              <View style={styles.privacyContent}>
                <View>
                  <Text style={styles.privacyTitle}>Private Request</Text>
                  <Text style={styles.privacySubtitle}>
                    Only pastoral team can see this request
                  </Text>
                </View>
                <View style={[styles.checkbox, isPrivate && styles.checkboxActive]}>
                  {isPrivate && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
              </View>
            </TouchableOpacity>
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
                  <Ionicons name="heart" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Submit Prayer Request</Text>
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
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  categoryButtonActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  categoryButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  privacyOption: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  privacyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  privacySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
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
}) 