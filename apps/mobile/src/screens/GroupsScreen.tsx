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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getGroups, joinGroup, getDiscipleshipGroups, joinDiscipleshipGroup, isUserInGroup, isUserInDiscipleshipGroup, getGroupMembershipStatus, getDiscipleshipGroupMembershipStatus } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Group {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  type?: string | null;
  meeting_day?: string | null;
  meeting_time?: string | null;
  location?: string | null;
  capacity?: number | null;
  leader_name?: string | null;
  image_url?: string | null;
  member_count?: number;
  status?: string | null;
  // Discipleship-specific fields
  age_group?: string | null;
  curriculum?: string | null;
  meeting_schedule?: string | null;
}

interface GroupsScreenProps {
  navigation: any;
}

export default function GroupsScreen({ navigation }: GroupsScreenProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ministries' | 'discipleship'>('ministries');
  const [groups, setGroups] = useState<Group[]>([]);
  const [discipleshipGroups, setDiscipleshipGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joiningGroups, setJoiningGroups] = useState<Set<string>>(new Set());
  const [userGroupMemberships, setUserGroupMemberships] = useState<Set<string>>(new Set());
  const [userPendingMemberships, setUserPendingMemberships] = useState<Set<string>>(new Set());

  const loadGroups = async () => {
    try {
      console.log('🎯 GroupsScreen: Loading all groups...');
      const [regularGroupsResult, discipleshipGroupsResult] = await Promise.all([
        getGroups(),
        getDiscipleshipGroups()
      ]);
      
      if (regularGroupsResult.error) {
        console.error('❌ GroupsScreen: Error loading regular groups:', regularGroupsResult.error);
        setError('Failed to load groups');
      } else {
        console.log('✅ GroupsScreen: Regular groups loaded successfully:', regularGroupsResult.data?.length || 0);
        setGroups(regularGroupsResult.data || []);
      }
      
      if (discipleshipGroupsResult.error) {
        console.error('❌ GroupsScreen: Error loading discipleship groups:', discipleshipGroupsResult.error);
        // Don't set error if regular groups loaded successfully
        if (!regularGroupsResult.error) {
          setError('Failed to load discipleship groups');
        }
      } else {
        console.log('✅ GroupsScreen: Discipleship groups loaded successfully:', discipleshipGroupsResult.data?.length || 0);
        setDiscipleshipGroups(discipleshipGroupsResult.data || []);
      }
      
      // Only set error to null if both loaded successfully
      if (!regularGroupsResult.error && !discipleshipGroupsResult.error) {
        setError(null);
      }
      
      // Check user memberships if user is logged in
      if (user) {
        await checkUserMemberships(regularGroupsResult.data || [], discipleshipGroupsResult.data || []);
      }
    } catch (err) {
      console.error('❌ GroupsScreen: Exception loading groups:', err);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const checkUserMemberships = async (regularGroups: Group[], discipleshipGroups: Group[]) => {
    if (!user) return;
    
    console.log('🔍 Checking user memberships for all groups...');
    const membershipSet = new Set<string>();
    const pendingSet = new Set<string>();
    
    try {
      // Check regular group memberships
      const regularMembershipChecks = regularGroups.map(async (group) => {
        const { status } = await getGroupMembershipStatus(group.id, user.id)
        if (status === 'active') {
          membershipSet.add(group.id)
        } else if (status === 'pending') {
          pendingSet.add(group.id)
        }
        return { groupId: group.id, status }
      })
      
      // Check discipleship group memberships
      const discipleshipMembershipChecks = discipleshipGroups.map(async (group) => {
        const { status } = await getDiscipleshipGroupMembershipStatus(group.id, user.id)
        if (status === 'active') {
          membershipSet.add(group.id)
        } else if (status === 'pending') {
          pendingSet.add(group.id)
        }
        return { groupId: group.id, status }
      })
      
      // Wait for all checks to complete
      await Promise.all([...regularMembershipChecks, ...discipleshipMembershipChecks]);
      
      console.log('✅ User membership check complete:', { 
        active: Array.from(membershipSet), 
        pending: Array.from(pendingSet) 
      });
      setUserGroupMemberships(membershipSet);
      setUserPendingMemberships(pendingSet);
      
    } catch (error) {
      console.error('❌ Error checking user memberships:', error);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadGroups();
  };

  const handleJoinGroup = async (group: Group) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to join a group.');
      return;
    }

    if (joiningGroups.has(group.id)) {
      return;
    }

    const isDiscipleshipGroup = group.type === 'discipleship';
    const groupType = isDiscipleshipGroup ? 'discipleship group' : 'ministry';

    Alert.alert(
      `Join ${isDiscipleshipGroup ? 'Discipleship Group' : 'Ministry'}`,
      `Are you sure you want to join "${group.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Join',
          onPress: async () => {
            setJoiningGroups(prev => new Set(prev).add(group.id));
            
            try {
              const { error } = isDiscipleshipGroup 
                ? await joinDiscipleshipGroup(group.id, user.id)
                : await joinGroup(group.id, user.id);
              
              if (error) {
                if (error.message?.includes('pending approval')) {
                  Alert.alert(
                    'Request Submitted!', 
                    `Your request to join "${group.name}" has been submitted and is pending approval from the group leader.`
                  )
                  // Update pending status immediately
                  setUserPendingMemberships(prev => new Set(prev).add(group.id))
                } else {
                  Alert.alert('Join Failed', (error as any).message || `Unable to join the ${groupType}. Please try again.`)
                }
              } else {
                Alert.alert('Request Submitted!', `Your request to join "${group.name}" has been submitted and is pending approval from the group leader.`)
                // Update pending status immediately
                setUserPendingMemberships(prev => new Set(prev).add(group.id))
                loadGroups()
              }
            } catch (err) {
              console.error('❌ Error joining group:', err);
              Alert.alert('Join Failed', `An error occurred while joining the ${groupType}.`);
            } finally {
              setJoiningGroups(prev => {
                const newSet = new Set(prev);
                newSet.delete(group.id);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const getJoinButtonState = (groupId: string) => {
    if (joiningGroups.has(groupId)) {
      return 'joining';
    } else if (userGroupMemberships.has(groupId)) {
      return 'joined';
    } else if (userPendingMemberships.has(groupId)) {
      return 'pending';
    } else {
      return 'join';
    }
  }

  const renderJoinButton = (group: Group) => {
    const buttonState = getJoinButtonState(group.id)
    
    let buttonStyle = styles.joinButton
    let buttonIcon = 'add'
    let buttonText = 'Join Group'
    let buttonColor = '#F59E0B'
    let disabled = false
    
    switch (buttonState) {
      case 'joining':
        buttonStyle = [styles.joinButton, styles.joiningButton]
        buttonText = 'Joining...'
        disabled = true
        break
      case 'joined':
        buttonStyle = [styles.joinButton, styles.joinedButton]
        buttonIcon = 'checkmark-circle'
        buttonText = 'Joined'
        buttonColor = '#10B981'
        disabled = true
        break
      case 'pending':
        buttonStyle = [styles.joinButton, styles.pendingButton]
        buttonIcon = 'time'
        buttonText = 'Pending Approval'
        buttonColor = '#F59E0B'
        disabled = true
        break
    }
    
    return (
      <TouchableOpacity
        style={buttonStyle}
        onPress={() => handleJoinGroup(group)}
        disabled={disabled}
      >
        {buttonState === 'joining' ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Ionicons name={buttonIcon as any} size={20} color="white" />
            <Text style={styles.joinButtonText}>{buttonText}</Text>
          </>
        )}
      </TouchableOpacity>
    )
  }

  const getGroupCategoryIcon = (category?: string | null) => {
    switch (category?.toLowerCase()) {
      case 'bible_study':
        return 'book';
      case 'youth':
        return 'school';
      case 'worship':
        return 'musical-notes';
      case 'prayer':
        return 'heart';
      case 'fellowship':
        return 'people';
      case 'service':
        return 'hand-left';
      default:
        return 'people';
    }
  };

  const formatMeetingTime = (day?: string | null, time?: string | null) => {
    if (!day && !time) return 'Meeting times TBD';
    if (day && time) return `${day}s at ${time}`;
    if (day) return `${day}s`;
    if (time) return `At ${time}`;
    return 'Meeting times TBD';
  };

  const getCategoryColor = (category?: string | null) => {
    switch (category?.toLowerCase()) {
      case 'bible_study':
        return '#3B82F6';
      case 'youth':
        return '#10B981';
      case 'worship':
        return '#8B5CF6';
      case 'prayer':
        return '#F59E0B';
      case 'fellowship':
        return '#EF4444';
      case 'service':
        return '#06B6D4';
      default:
        return '#6B7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Groups</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Groups</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={80} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadGroups}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Join a Group</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            Connect with others through our groups. Find community, grow in faith, and build lasting friendships.
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ministries' && styles.activeTab]}
            onPress={() => setActiveTab('ministries')}
          >
            <Text style={[styles.tabText, activeTab === 'ministries' && styles.activeTabText]}>
              Ministries
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'discipleship' && styles.activeTab]}
            onPress={() => setActiveTab('discipleship')}
          >
            <Text style={[styles.tabText, activeTab === 'discipleship' && styles.activeTabText]}>
              Discipleship
            </Text>
          </TouchableOpacity>
        </View>

        {/* Groups List */}
        {activeTab === 'ministries' ? (
          groups.length > 0 ? (
            <View style={styles.groupsList}>
              {groups.map((group) => (
                <View key={group.id} style={styles.groupCard}>
                  <View style={styles.groupHeader}>
                    <View style={styles.groupInfo}>
                      <View style={styles.groupTitleRow}>
                        <Ionicons 
                          name={getGroupCategoryIcon(group.category)} 
                          size={20} 
                          color={getCategoryColor(group.category)} 
                        />
                        <Text style={styles.groupName}>{group.name}</Text>
                      </View>
                      {group.category && (
                        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(group.category) }]}>
                          <Text style={styles.categoryText}>
                            {group.category.replace('_', ' ').toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {group.description && (
                    <Text style={styles.groupDescription}>{group.description}</Text>
                  )}

                  <View style={styles.groupDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="time" size={16} color="#9CA3AF" />
                      <Text style={styles.detailText}>
                        {formatMeetingTime(group.meeting_day, group.meeting_time)}
                      </Text>
                    </View>

                    {group.location && (
                      <View style={styles.detailRow}>
                        <Ionicons name="location" size={16} color="#9CA3AF" />
                        <Text style={styles.detailText}>{group.location}</Text>
                      </View>
                    )}

                    {group.leader_name && (
                      <View style={styles.detailRow}>
                        <Ionicons name="person" size={16} color="#9CA3AF" />
                        <Text style={styles.detailText}>Led by {group.leader_name}</Text>
                      </View>
                    )}

                    <View style={styles.detailRow}>
                      <Ionicons name="people" size={16} color="#9CA3AF" />
                      <Text style={styles.detailText}>
                        {group.member_count || 0} members
                        {group.capacity && ` (${group.capacity} max)`}
                      </Text>
                    </View>
                  </View>

                  {renderJoinButton(group)}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people" size={80} color="#6B7280" />
              <Text style={styles.emptyTitle}>No Ministries Available</Text>
              <Text style={styles.emptyText}>
                Check back later for new ministries to join, or contact the church office for more information.
              </Text>
            </View>
          )
        ) : (
          discipleshipGroups.length > 0 ? (
            <View style={styles.groupsList}>
              {discipleshipGroups.map((group) => (
                <View key={group.id} style={styles.groupCard}>
                  <View style={styles.groupHeader}>
                    <View style={styles.groupInfo}>
                      <View style={styles.groupTitleRow}>
                        <Ionicons 
                          name={getGroupCategoryIcon(group.category)} 
                          size={20} 
                          color={getCategoryColor(group.category)} 
                        />
                        <Text style={styles.groupName}>{group.name}</Text>
                      </View>
                      {group.age_group && (
                        <View style={[styles.categoryBadge, { backgroundColor: '#10B981' }]}>
                          <Text style={styles.categoryText}>
                            {group.age_group.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {group.description && (
                    <Text style={styles.groupDescription}>{group.description}</Text>
                  )}

                  <View style={styles.groupDetails}>
                    {group.meeting_schedule && (
                      <View style={styles.detailRow}>
                        <Ionicons name="calendar" size={16} color="#9CA3AF" />
                        <Text style={styles.detailText}>{group.meeting_schedule}</Text>
                      </View>
                    )}

                    {group.location && (
                      <View style={styles.detailRow}>
                        <Ionicons name="location" size={16} color="#9CA3AF" />
                        <Text style={styles.detailText}>{group.location}</Text>
                      </View>
                    )}

                    {group.curriculum && (
                      <View style={styles.detailRow}>
                        <Ionicons name="book" size={16} color="#9CA3AF" />
                        <Text style={styles.detailText}>Curriculum: {group.curriculum}</Text>
                      </View>
                    )}

                    {group.leader_name && (
                      <View style={styles.detailRow}>
                        <Ionicons name="person" size={16} color="#9CA3AF" />
                        <Text style={styles.detailText}>Led by {group.leader_name}</Text>
                      </View>
                    )}

                    <View style={styles.detailRow}>
                      <Ionicons name="people" size={16} color="#9CA3AF" />
                      <Text style={styles.detailText}>
                        {group.member_count || 0} members
                        {group.capacity && ` (${group.capacity} max)`}
                      </Text>
                    </View>
                  </View>

                  {renderJoinButton(group)}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="school" size={80} color="#6B7280" />
              <Text style={styles.emptyTitle}>No Discipleship Groups Available</Text>
              <Text style={styles.emptyText}>
                Check back later for new discipleship groups to join, or contact the church office for more information.
              </Text>
            </View>
          )
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  descriptionText: {
    color: '#9CA3AF',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#F59E0B',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: 'white',
  },
  groupsList: {
    paddingHorizontal: 20,
  },
  groupCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  groupDescription: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  groupDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 8,
  },
  joinButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  joiningButton: {
    backgroundColor: '#D97706',
  },
  joinedButton: {
    backgroundColor: '#10B981',
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pendingButton: {
    backgroundColor: '#F59E0B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 100,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
}); 