import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface GivingRecord {
  id: string;
  amount: number;
  currency: string;
  category: string;
  payment_method: string;
  transacted_at: string;
  notes: string | null;
  fund_designation: string | null;
  payment_status: string | null;
  is_recurring: boolean;
  tax_deductible: boolean;
}

interface GivingStats {
  totalAmount: number;
  totalRecords: number;
  thisYearAmount: number;
  taxDeductibleAmount: number;
}

export default function MyGivingScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [givingRecords, setGivingRecords] = useState<GivingRecord[]>([]);
  const [givingStats, setGivingStats] = useState<GivingStats>({
    totalAmount: 0,
    totalRecords: 0,
    thisYearAmount: 0,
    taxDeductibleAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadGivingData();
  }, []);

  const loadGivingData = async () => {
    if (!user) return;

    try {
      // Get the contact_id for this user
      const { data: mobileUser, error: mobileUserError } = await supabase
        .from('mobile_app_users')
        .select('contact_id')
        .eq('auth_user_id', user.id)
        .single();

      if (mobileUserError || !mobileUser?.contact_id) {
        console.log('⚠️ No contact_id found for giving records');
        return;
      }

      const contactId = mobileUser.contact_id;
      console.log('👤 Loading giving data for contact:', contactId);

      // Load giving records (transactions)
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          currency,
          category,
          payment_method,
          transacted_at,
          notes,
          fund_designation,
          payment_status,
          is_recurring,
          tax_deductible
        `)
        .eq('contact_id', contactId)
        .in('category', ['donation', 'tithe', 'offering', 'General', 'Missions', 'Building'])
        .order('transacted_at', { ascending: false });

      if (transactionsError) {
        console.error('❌ Error loading transactions:', transactionsError);
        Alert.alert('Error', 'Failed to load giving records');
        return;
      }

      const records = transactions || [];
      console.log('✅ Loaded giving records:', records.length);

      // Calculate stats
      const currentYear = new Date().getFullYear();
      const stats: GivingStats = {
        totalAmount: 0,
        totalRecords: records.length,
        thisYearAmount: 0,
        taxDeductibleAmount: 0,
      };

      records.forEach(record => {
        const amount = record.amount || 0;
        stats.totalAmount += amount;
        
        const recordYear = new Date(record.transacted_at).getFullYear();
        if (recordYear === currentYear) {
          stats.thisYearAmount += amount;
        }
        
        if (record.tax_deductible) {
          stats.taxDeductibleAmount += amount;
        }
      });

      setGivingRecords(records);
      setGivingStats(stats);
      console.log('📊 Giving stats:', stats);

    } catch (error) {
      console.error('❌ Exception loading giving data:', error);
      Alert.alert('Error', 'Failed to load giving records');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadGivingData();
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'cash':
        return 'cash';
      case 'card':
      case 'credit_card':
        return 'card';
      case 'bank_transfer':
        return 'business';
      case 'check':
        return 'document-text';
      case 'online':
        return 'globe';
      default:
        return 'wallet';
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'succeeded':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Loading giving records...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Giving</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#F59E0B']}
            tintColor="#F59E0B"
          />
        }
      >
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {formatCurrency(givingStats.totalAmount)}
            </Text>
            <Text style={styles.statLabel}>Total Giving</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {formatCurrency(givingStats.thisYearAmount)}
            </Text>
            <Text style={styles.statLabel}>This Year</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {givingStats.totalRecords}
            </Text>
            <Text style={styles.statLabel}>Total Records</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {formatCurrency(givingStats.taxDeductibleAmount)}
            </Text>
            <Text style={styles.statLabel}>Tax Deductible</Text>
          </View>
        </View>

        {/* Giving History */}
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Giving History</Text>
          
          {givingRecords.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No giving records found</Text>
              <Text style={styles.emptySubtext}>
                Your giving history will appear here once you make donations
              </Text>
            </View>
          ) : (
            givingRecords.map((record) => (
              <View key={record.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordAmount}>
                      {formatCurrency(record.amount, record.currency)}
                    </Text>
                    <Text style={styles.recordDate}>
                      {formatDate(record.transacted_at)}
                    </Text>
                  </View>
                  <View style={styles.recordStatus}>
                    <Ionicons
                      name={getPaymentMethodIcon(record.payment_method)}
                      size={20}
                      color="#9CA3AF"
                    />
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(record.payment_status) }
                      ]}
                    />
                  </View>
                </View>
                
                <View style={styles.recordDetails}>
                  <Text style={styles.recordFund}>
                    {record.fund_designation || record.category}
                  </Text>
                  <Text style={styles.recordMethod}>
                    {record.payment_method?.replace('_', ' ') || 'Unknown'}
                  </Text>
                  {record.is_recurring && (
                    <View style={styles.recurringBadge}>
                      <Ionicons name="repeat" size={12} color="#F59E0B" />
                      <Text style={styles.recurringText}>Recurring</Text>
                    </View>
                  )}
                  {record.tax_deductible && (
                    <View style={styles.taxBadge}>
                      <Ionicons name="document-text" size={12} color="#10b981" />
                      <Text style={styles.taxText}>Tax Deductible</Text>
                    </View>
                  )}
                </View>
                
                {record.notes && (
                  <Text style={styles.recordNotes}>{record.notes}</Text>
                )}
              </View>
            ))
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
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
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  historyContainer: {
    padding: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  recordCard: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recordInfo: {
    flex: 1,
  },
  recordAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  recordDate: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  recordStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recordDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  recordFund: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  recordMethod: {
    fontSize: 14,
    color: '#9CA3AF',
    textTransform: 'capitalize',
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  recurringText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  taxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  taxText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  recordNotes: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 4,
  },
}); 