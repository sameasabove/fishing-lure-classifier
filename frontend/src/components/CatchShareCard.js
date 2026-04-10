import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Strava-style share card dimensions
// Portrait format for stories (9:16 aspect ratio)
const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920; // 9:16 aspect ratio for Instagram/Facebook stories

/**
 * Strava-style catch share card component
 * Photo-dominant design with overlayed metadata
 * @param {Function} onImageLoad - Called when the background image has loaded (for share capture timing)
 */
export const CatchShareCard = ({ catchData, lureData, onImageLoad }) => {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <View style={[styles.container, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
      {/* Fish Photo - Full background */}
      <Image 
        source={{ uri: catchData.imageUri }} 
        style={styles.backgroundImage}
        resizeMode="cover"
        onLoad={() => onImageLoad?.()}
      />
      
      {/* Gradient overlay for text readability - bottom to top */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
        locations={[0.5, 0.75, 1]}
        style={styles.gradientOverlay}
      />
      
      {/* Top Header - Branding */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Image 
            source={require('../../assets/icon.png')}
            style={styles.logo}
          />
          <Text style={styles.brandText}>My Tackle Box</Text>
        </View>
      </View>

      {/* Bottom Section - Metadata Overlay */}
      <View style={styles.metadataContainer}>
        {/* Main Species/Headline */}
        {catchData.fishSpecies && (
          <View style={styles.headlineContainer}>
            <Text style={styles.headline}>{catchData.fishSpecies}</Text>
            {catchData.length && !catchData.weight && (
              <Text style={styles.subheadline}>{catchData.length}</Text>
            )}
          </View>
        )}

        {/* Stats Row - Strava Style */}
        <View style={styles.statsRow}>
          {catchData.weight && (
            <View style={styles.statBox}>
              <View style={styles.statContent}>
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  {catchData.weight}
                </Text>
                <Text style={styles.statLabel}>Weight</Text>
              </View>
            </View>
          )}
          
          {catchData.length && (
            <View style={styles.statBox}>
              <View style={styles.statContent}>
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  {catchData.length}
                </Text>
                <Text style={styles.statLabel}>Length</Text>
              </View>
            </View>
          )}
          
          {lureData && lureData.lure_type && (
            <View style={styles.statBox}>
              <View style={styles.statContent}>
                <Text style={styles.statValue} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.6}>
                  {lureData.lure_type}
                </Text>
                <Text style={styles.statLabel}>Lure</Text>
              </View>
            </View>
          )}
        </View>

        {/* Location and Date - Bottom */}
        <View style={styles.footerMeta}>
          {catchData.location && (
            <View style={styles.metaItem}>
              <Text style={styles.metaText} numberOfLines={1}>{catchData.location}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Text style={styles.metaText}>{formatDate(catchData.timestamp)} • {formatTime(catchData.timestamp)}</Text>
          </View>
        </View>
      </View>

      {/* Watermark - Bottom Right Corner */}
      <View style={styles.watermark}>
        <Text style={styles.watermarkText}>My Tackle Box</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT * 0.55, // Covers bottom half for readability
  },
  header: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 35,
  },
  logo: {
    width: 120,
    height: 120,
    marginRight: 20,
  },
  brandText: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  metadataContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingBottom: 50,
    paddingTop: 50,
    zIndex: 5,
  },
  headlineContainer: {
    marginBottom: 30,
  },
  headline: {
    fontSize: 76,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 8,
  },
  subheadline: {
    fontSize: 38,
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(46, 125, 50, 0.9)', // Green with transparency
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 140, // Ensure consistent height
  },
  statContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  statValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 18,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
  },
  footerMeta: {
    gap: 12,
  },
  metaItem: {
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  watermark: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    zIndex: 10,
  },
  watermarkText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
