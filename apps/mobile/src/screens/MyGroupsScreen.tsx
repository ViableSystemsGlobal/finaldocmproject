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
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Group {
  id: string
  name: string
  description?: string
  type: string
  leader_name?: string
  member_count: number
  meeting_schedule?: string
  location?: string
}

interface MyGroupsScreenProps {
  navigation: any
}

export default function MyGroupsScreen({ navigation }: MyGroupsScreenProps) {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [discipleshipGroups, setDiscipleshipGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadUserGroups()
  }, [])

  const loadUserGroups = async () => {
    if (!user) return

    try {
      console.log('🎯 Loading user groups...')

      // Get the contact_id for this user
      const { data: mobileUser, error: mobileUserError } = await supabase
        .from('mobile_app_users')
        .select('contact_id')
        .eq('auth_user_id', user.id)
        .single()

      if (!mobileUser?.contact_id) {
        console.log('⚠️ No contact_id found for groups')
        setLoading(false)
        setRefreshing(false)
        return
      }

      const contactId = mobileUser.contact_id

      // Load regular groups
      await loadRegularGroups(contactId)
      
      // Load discipleship groups
      await loadDiscipleshipGroups(contactId)

    } catch (error) {
      console.error('Exception loading user groups:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadRegularGroups = async (contactId: string) => {
    try {
      // Get user's group memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('group_memberships')
        .select(`
          group_id,
          status,
          groups!inner (
            id,
            name,
            description,
            type,
            leader_id,
            contacts!leader_id (
              first_name,
              last_name
            )
          )
        `)
        .eq('contact_id', contactId)
        .eq('status', 'active')

      if (membershipsError) {
        console.error('❌ Error loading group memberships:', membershipsError)
        return
      }

      if (!memberships || memberships.length === 0) {
        console.log('📋 No group memberships found')
        setGroups([])
        return
      }

      // Get member counts for each group
      const groupIds = memberships.map(m => m.group_id)
      const { data: allMemberships } = await supabase
        .from('group_memberships')
        .select('group_id')
        .in('group_id', groupIds)
        .eq('status', 'active')

      // Create member count map
      const memberCountMap = new Map()
      if (allMemberships) {
        const countsByGroup = allMemberships.reduce((acc: any, membership) => {
          acc[membership.group_id] = (acc[membership.group_id] || 0) + 1
          return acc
        }, {})
        
        Object.keys(countsByGroup).forEach(groupId => {
          memberCountMap.set(groupId, countsByGroup[groupId])
        })
      }

      // Transform groups data
      const transformedGroups = memberships.map(membership => ({
        id: membership.groups.id,
        name: membership.groups.name,
        description: membership.groups.description,
        type: membership.groups.type,
        leader_name: membership.groups.contacts && membership.groups.contacts.length > 0
          ? `${membership.groups.contacts[0].first_name || ''} ${membership.groups.contacts[0].last_name || ''}`.trim()
          : null,
        member_count: memberCountMap.get(membership.group_id) || 0
      }))

      setGroups(transformedGroups)
      console.log('✅ Loaded regular groups:', transformedGroups.length)

    } catch (error) {
      console.error('Exception loading regular groups:', error)
    }
  }

  const loadDiscipleshipGroups = async (contactId: string) => {
    try {
      // Get user's discipleship group memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('discipleship_memberships')
        .select(`
          discipleship_group_id,
          status,
          discipleship_groups!inner (
            id,
            name,
            description,
            age_group,
            curriculum,
            meeting_location,
            meeting_schedule,
            leader_id,
            contacts!leader_id (
              first_name,
              last_name
            )
          )
        `)
        .eq('contact_id', contactId)
        .eq('status', 'active')

      if (membershipsError) {
        console.error('❌ Error loading discipleship memberships:', membershipsError)
        return
      }

      if (!memberships || memberships.length === 0) {
        console.log('📋 No discipleship memberships found')
        setDiscipleshipGroups([])
        return
      }

      // Get member counts for each discipleship group
      const groupIds = memberships.map(m => m.discipleship_group_id)
      const { data: allMemberships } = await supabase
        .from('discipleship_memberships')
        .select('discipleship_group_id')
        .in('discipleship_group_id', groupIds)
        .eq('status', 'active')

      // Create member count map
      const memberCountMap = new Map()
      if (allMemberships) {
        const countsByGroup = allMemberships.reduce((acc: any, membership) => {
          acc[membership.discipleship_group_id] = (acc[membership.discipleship_group_id] || 0) + 1
          return acc
        }, {})
        
        Object.keys(countsByGroup).forEach(groupId => {
          memberCountMap.set(groupId, countsByGroup[groupId])
        })
      }

      // Transform discipleship groups data
      const transformedGroups = memberships.map(membership => ({
        id: membership.discipleship_groups.id,
        name: membership.discipleship_groups.name,
        description: membership.discipleship_groups.description,
        type: 'discipleship',
        leader_name: membership.discipleship_groups.contacts && membership.discipleship_groups.contacts.length > 0
          ? `${membership.discipleship_groups.contacts[0].first_name || ''} ${membership.discipleship_groups.contacts[0].last_name || ''}`.trim()
          : null,
        member_count: memberCountMap.get(membership.discipleship_group_id) || 0,
        meeting_schedule: membership.discipleship_groups.meeting_schedule,
        location: membership.discipleship_groups.meeting_location
      }))

      setDiscipleshipGroups(transformedGroups)
      console.log('✅ Loaded discipleship groups:', transformedGroups.length)

    } catch (error) {
      console.error('Exception loading discipleship groups:', error)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadUserGroups()
  }

  const getGroupTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'discipleship':
        return 'book'
      case 'ministry':
        return 'hand-left'
      case 'social':
        return 'heart'
      case 'study':
        return 'library'
      case 'youth':
        return 'school'
      case 'worship':
        return 'musical-notes'
      default:
        return 'people'
    }
  }

  const getGroupTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'discipleship':
        return '#8B5CF6'
      case 'ministry':
        return '#10B981'
      case 'social':
        return '#F59E0B'
      case 'study':
        return '#3B82F6'
      case 'youth':
        return '#EF4444'
      case 'worship':
        return '#EC4899'
      default:
        return '#6B7280'
    }
  }

  const renderGroupCard = (group: Group) => (
    <TouchableOpacity key={group.id} style={styles.groupCard}>
      <LinearGradient
        colors={['#374151', '#4B5563']}
        style={styles.groupGradient}
      >
        <View style={styles.groupHeader}>
          <View style={[styles.groupIcon, { backgroundColor: getGroupTypeColor(group.type) }]}>
            <Ionicons
              name={getGroupTypeIcon(group.type)}
              size={24}
              color="white"
            />
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupType}>{group.type.charAt(0).toUpperCase() + group.type.slice(1)}</Text>
          </View>
        </View>

        {group.description && (
          <Text style={styles.groupDescription} numberOfLines={2}>
            {group.description}
          </Text>
        )}

        <View style={styles.groupDetails}>
          {group.leader_name && (
            <View style={styles.groupDetailItem}>
              <Ionicons name="person" size={16} color="#9CA3AF" />
              <Text style={styles.groupDetailText}>Leader: {group.leader_name}</Text>
            </View>
          )}
          
          <View style={styles.groupDetailItem}>
            <Ionicons name="people" size={16} color="#9CA3AF" />
            <Text style={styles.groupDetailText}>{group.member_count} members</Text>
          </View>

          {group.meeting_schedule && (
            <View style={styles.groupDetailItem}>
              <Ionicons name="time" size={16} color="#9CA3AF" />
              <Text style={styles.groupDetailText}>{group.meeting_schedule}</Text>
            </View>
          )}

          {group.location && (
            <View style={styles.groupDetailItem}>
              <Ionicons name="location" size={16} color="#9CA3AF" />
              <Text style={styles.groupDetailText}>{group.location}</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )

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
            <Text style={styles.headerTitle}>My Groups</Text>
          </View>
          
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={styles.loadingText}>Loading your groups...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    )
  }

  const totalGroups = groups.length + discipleshipGroups.length

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
          <Text style={styles.headerTitle}>My Groups</Text>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {totalGroups === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#6B7280" />
              <Text style={styles.emptyStateText}>No Groups Joined</Text>
              <Text style={styles.emptyStateSubtext}>
                You haven't joined any groups yet. Check out the Groups section to find groups to join!
              </Text>
            </View>
          ) : (
            <>
              {/* Regular Groups */}
              {groups.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Groups ({groups.length})</Text>
                  {groups.map(renderGroupCard)}
                </View>
              )}

              {/* Discipleship Groups */}
              {discipleshipGroups.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Discipleship Groups ({discipleshipGroups.length})</Text>
                  {discipleshipGroups.map(renderGroupCard)}
                </View>
              )}
            </>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  groupCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  groupGradient: {
    padding: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  groupType: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  groupDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 12,
    lineHeight: 20,
  },
  groupDetails: {
    gap: 8,
  },
  groupDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupDetailText: {
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