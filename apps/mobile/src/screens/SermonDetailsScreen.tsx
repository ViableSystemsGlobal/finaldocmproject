import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Linking } from 'react-native';
import { WebView } from 'react-native-webview';

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
  thumbnail_image?: string;
  notes?: string;
  tags?: string[];
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function SermonDetailsScreen({ route, navigation }: any) {
  const { sermon }: { sermon: Sermon } = route.params;
  const [showVideo, setShowVideo] = useState(false);

  const getYouTubeEmbedUrl = (youtubeId: string) => {
    return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&controls=1&rel=0&modestbranding=1&fs=0&disablekb=1&playsinline=1&iv_load_policy=3&showinfo=0`;
  };

  const handlePlayVideo = () => {
    setShowVideo(true);
  };

  const handleOpenInYouTube = async () => {
    if (sermon.youtube_url) {
      try {
        await Linking.openURL(sermon.youtube_url);
      } catch (error) {
        Alert.alert('Error', 'Could not open YouTube');
      }
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this sermon: ${sermon.title} by ${sermon.speaker}`,
        url: sermon.youtube_url || '',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Duration not available';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Video Section */}
        <View style={styles.videoSection}>
          {showVideo && sermon.youtube_id ? (
            <View style={styles.videoContainer}>
              <WebView
                source={{ uri: getYouTubeEmbedUrl(sermon.youtube_id) }}
                style={styles.webView}
                allowsFullscreenVideo={false}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                scrollEnabled={false}
                bounces={false}
                scalesPageToFit={false}
                automaticallyAdjustContentInsets={false}
                onError={(error) => {
                  console.log('WebView error:', error);
                  Alert.alert('Error', 'Could not load video. Try opening in YouTube.');
                }}
              />
            </View>
          ) : (
            <View style={styles.thumbnailContainer}>
              <Image
                source={{
                  uri: sermon.thumbnail_image || `https://i.ytimg.com/vi/${sermon.youtube_id}/hqdefault.jpg`,
                }}
                style={styles.thumbnailImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.thumbnailGradient}
              />
              <View style={styles.playButtonContainer}>
                <TouchableOpacity style={styles.playButton} onPress={handlePlayVideo}>
                  <Ionicons name="play" size={32} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Title and Basic Info */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{sermon.title}</Text>
            <Text style={styles.speaker}>{sermon.speaker}</Text>
            <Text style={styles.date}>{formatDate(sermon.sermon_date)}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {!showVideo && (
              <TouchableOpacity style={styles.actionButton} onPress={handlePlayVideo}>
                <Ionicons name="play-circle" size={24} color="#F59E0B" />
                <Text style={styles.actionButtonText}>Watch Video</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.actionButton} onPress={handleOpenInYouTube}>
              <Ionicons name="logo-youtube" size={24} color="#F59E0B" />
              <Text style={styles.actionButtonText}>Open in YouTube</Text>
            </TouchableOpacity>
          </View>

          {/* Sermon Details */}
          <View style={styles.detailsSection}>
            {sermon.series && (
              <View style={styles.detailRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Series</Text>
                </View>
                <Text style={styles.detailText}>{sermon.series}</Text>
              </View>
            )}
            
            {sermon.scripture_reference && (
              <View style={styles.detailRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Scripture</Text>
                </View>
                <Text style={styles.detailText}>{sermon.scripture_reference}</Text>
              </View>
            )}
            
            {sermon.duration && (
              <View style={styles.detailRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Duration</Text>
                </View>
                <Text style={styles.detailText}>{formatDuration(sermon.duration)}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          {sermon.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>About This Sermon</Text>
              <Text style={styles.description}>{sermon.description}</Text>
            </View>
          )}

          {/* Notes */}
          {sermon.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>Sermon Notes</Text>
              <Text style={styles.notes}>{sermon.notes}</Text>
            </View>
          )}

          {/* Tags */}
          {sermon.tags && sermon.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {sermon.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoSection: {
    width: '100%',
    height: 300,
  },
  videoContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  thumbnailContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  playButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  contentSection: {
    flex: 1,
    backgroundColor: '#1f2937',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 32,
  },
  speaker: {
    fontSize: 18,
    color: '#F59E0B',
    marginBottom: 4,
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsSection: {
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  badge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  descriptionSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
  },
  notesSection: {
    marginBottom: 32,
  },
  notes: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
  },
  tagsSection: {
    marginBottom: 32,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
});
