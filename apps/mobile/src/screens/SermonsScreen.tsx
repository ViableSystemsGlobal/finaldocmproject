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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getSermons } from '../lib/supabase';

interface Sermon {
  id: string;
  title: string;
  slug: string;
  description?: string;
  speaker?: string;
  series?: string;
  scripture_reference?: string;
  sermon_date: string;
  duration?: number;
  video_type?: string;
  video_url?: string;
  youtube_url?: string;
  youtube_id?: string;
  audio_url?: string;
  thumbnail_image?: string;
  transcript?: string;
  notes?: string;
  tags?: string[];
  status: string;
  published_at?: string;
  view_count?: number;
  seo_meta?: any;
  created_at: string;
  updated_at: string;
}

interface SermonsScreenProps {
  navigation: any;
}

export default function SermonsScreen({ navigation }: SermonsScreenProps) {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSermons = async () => {
    try {
      console.log('🎯 SermonsScreen: Loading sermons...');
      const { data, error } = await getSermons();
      
      if (error) {
        console.error('❌ SermonsScreen: Error loading sermons:', error);
        setError('Failed to load sermons');
      } else {
        console.log('✅ SermonsScreen: Sermons loaded successfully:', data?.length || 0);
        setSermons(data || []);
        setError(null);
      }
    } catch (err) {
      console.error('❌ SermonsScreen: Exception loading sermons:', err);
      setError('Failed to load sermons');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSermons();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadSermons();
  };

  const formatSermonDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    const minutes = Math.floor(duration);
    return `${minutes} min`;
  };

  const handlePlaySermon = async (sermon: Sermon) => {
    try {
      let videoUrl = '';
      
      if (sermon.youtube_url) {
        videoUrl = sermon.youtube_url;
      } else if (sermon.youtube_id) {
        videoUrl = `https://www.youtube.com/watch?v=${sermon.youtube_id}`;
      } else if (sermon.video_url) {
        videoUrl = sermon.video_url;
      }
      
      if (videoUrl) {
        console.log('🎬 Opening sermon video:', videoUrl);
        await Linking.openURL(videoUrl);
      } else {
        console.log('⚠️ No video URL available for sermon:', sermon.title);
      }
    } catch (error) {
      console.error('❌ Error opening sermon video:', error);
    }
  };

  const getSermonThumbnail = (sermon: Sermon) => {
    if (sermon.thumbnail_image) {
      return sermon.thumbnail_image;
    }
    if (sermon.youtube_id) {
      return `https://img.youtube.com/vi/${sermon.youtube_id}/hqdefault.jpg`;
    }
    return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Loading sermons...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const latestSermon = sermons[0];
  const recentSermons = sermons.slice(1);

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
          <Text style={styles.title}>Sermons</Text>
          <TouchableOpacity>
            <Ionicons name="search-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadSermons}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Latest Sermon */}
        {latestSermon && (
          <TouchableOpacity 
            style={styles.latestSermon}
            onPress={() => navigation.navigate('SermonDetails', { sermon: latestSermon })}
          >
            <Image
              source={{ uri: getSermonThumbnail(latestSermon) }}
              style={styles.latestImage}
            />
            <View style={styles.playButton}>
              <Ionicons name="play" size={32} color="white" />
            </View>
            <View style={styles.latestContent}>
              <Text style={styles.latestTitle} numberOfLines={2}>
                {latestSermon.title}
              </Text>
              <Text style={styles.latestSpeaker}>
                {latestSermon.speaker || 'Pastor'}
              </Text>
              <Text style={styles.latestDate}>
                {formatSermonDate(latestSermon.sermon_date)}
              </Text>
              {latestSermon.series && (
                <Text style={styles.latestSeries}>
                  Series: {latestSermon.series}
                </Text>
              )}
              {latestSermon.scripture_reference && (
                <Text style={styles.latestScripture}>
                  {latestSermon.scripture_reference}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}

        {/* Sermon List */}
        {recentSermons.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Messages</Text>

            {recentSermons.map((sermon) => (
              <TouchableOpacity 
                key={sermon.id} 
                style={styles.sermonItem}
                onPress={() => navigation.navigate('SermonDetails', { sermon })}
              >
                <Image
                  source={{ uri: getSermonThumbnail(sermon) }}
                  style={styles.sermonThumbnail}
                />
                <View style={styles.sermonInfo}>
                  <Text style={styles.sermonTitle} numberOfLines={2}>
                    {sermon.title}
                  </Text>
                  <Text style={styles.sermonSpeaker}>
                    {sermon.speaker || 'Pastor'}
                  </Text>
                  <Text style={styles.sermonDate}>
                    {formatSermonDate(sermon.sermon_date)}
                  </Text>
                  <View style={styles.sermonMeta}>
                    <Text style={styles.sermonDuration}>
                      {formatDuration(sermon.duration)}
                    </Text>
                    <Text style={styles.sermonViews}>
                      {sermon.view_count || 0} views
                    </Text>
                  </View>
                  {sermon.series && (
                    <Text style={styles.sermonSeriesSmall}>
                      {sermon.series}
                    </Text>
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.playIcon}
                  onPress={() => navigation.navigate('SermonDetails', { sermon })}
                >
                  <Ionicons name="play-circle" size={32} color="#F59E0B" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {sermons.length === 0 && !loading && !error && (
          <View style={styles.emptyState}>
            <Ionicons name="videocam-outline" size={64} color="#6B7280" />
            <Text style={styles.emptyStateText}>No sermons available</Text>
            <Text style={styles.emptyStateSubtext}>Check back later for new messages</Text>
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
  latestSermon: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 30,
  },
  latestImage: {
    width: '100%',
    height: 200,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  latestContent: {
    padding: 16,
    backgroundColor: '#374151',
  },
  latestTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  latestSpeaker: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  latestDate: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 4,
  },
  latestSeries: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  latestScripture: {
    color: '#8B5CF6',
    fontSize: 14,
    fontStyle: 'italic',
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
  sermonItem: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    alignItems: 'center',
  },
  sermonThumbnail: {
    width: 120,
    height: 90,
  },
  sermonInfo: {
    flex: 1,
    padding: 12,
  },
  sermonTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sermonSpeaker: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  sermonDate: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  sermonMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sermonDuration: {
    color: '#6B7280',
    fontSize: 12,
  },
  sermonViews: {
    color: '#6B7280',
    fontSize: 12,
  },
  sermonSeriesSmall: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '500',
  },
  playIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 16,
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