import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import MapViewClustered from 'react-native-map-clustering';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getAllCatchesWithLocations } from '../services/supabaseService';
import { getAllCatchesWithLocations as getAllCatchesLocal } from '../services/storageService';
import * as Sharing from 'expo-sharing';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

const FISH_SPECIES = [
  'Largemouth Bass',
  'Smallmouth Bass',
  'Spotted Bass',
  'Striped Bass',
  'White Bass',
  'Northern Pike',
  'Musky',
  'Walleye',
  'Trout',
  'Rainbow Trout',
  'Brown Trout',
  'Brook Trout',
  'Crappie',
  'Bluegill',
  'Sunfish',
  'Catfish',
  'Channel Catfish',
  'Blue Catfish',
  'Flathead Catfish',
  'Perch',
  'Yellow Perch',
  'White Perch',
  'Other',
];

const FAVORITES_KEY = 'favorite_fishing_spots';

export default function MapScreen({ navigation }) {
  const { user } = useAuth();
  const [allCatches, setAllCatches] = useState([]); // All catches (unfiltered)
  const [loading, setLoading] = useState(true);
  const [selectedCatch, setSelectedCatch] = useState(null);
  const [mapType, setMapType] = useState('standard'); // standard, satellite, hybrid
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [filters, setFilters] = useState({
    species: '',
    lureType: '',
    dateRange: 'all', // 'all', 'week', 'month', 'year'
    favoritesOnly: false,
  });
  // Default to a wide US view; will move to device location or catches when loaded
  const [region, setRegion] = useState({
    latitude: 39.5,
    longitude: -98.5,
    latitudeDelta: 25,
    longitudeDelta: 25,
  });

  useEffect(() => {
    loadCatches();
    loadFavorites();
  }, [user]);

  // Reload catches when screen is focused (in case new catches were added)
  useFocusEffect(
    React.useCallback(() => {
      loadCatches();
      loadFavorites();
    }, [user])
  );

  // Load favorite spots from storage
  const loadFavorites = async () => {
    try {
      const favoritesData = await AsyncStorage.getItem(FAVORITES_KEY);
      if (favoritesData) {
        setFavorites(new Set(JSON.parse(favoritesData)));
      }
    } catch (error) {
      console.error('[MapScreen] Error loading favorites:', error);
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (catchId) => {
    try {
      const newFavorites = new Set(favorites);
      if (newFavorites.has(catchId)) {
        newFavorites.delete(catchId);
      } else {
        newFavorites.add(catchId);
      }
      setFavorites(newFavorites);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(newFavorites)));
    } catch (error) {
      console.error('[MapScreen] Error saving favorite:', error);
    }
  };

  const loadCatches = async () => {
    try {
      setLoading(true);
      let allCatches = [];
      
      if (user) {
        // Try Supabase first
        try {
          const supabaseCatches = await getAllCatchesWithLocations();
          // Format Supabase catches to include lure info
          // Handle both array and single object for lure_analyses (Supabase can return either)
          allCatches = supabaseCatches.map(c => {
            const lureData = Array.isArray(c.lure_analyses) ? c.lure_analyses[0] : c.lure_analyses;
            return {
              id: c.id,
              imageUri: c.image_url,
              timestamp: c.catch_date || c.created_at,
              fishSpecies: c.fish_species,
              weight: c.weight,
              length: c.length,
              location: c.location,
              notes: c.notes,
              latitude: c.latitude,
              longitude: c.longitude,
              lureId: lureData?.id,
              lureType: lureData?.lure_type,
              lureImageUri: lureData?.image_url,
            };
          });
          if (__DEV__) {
            console.log('[MapScreen] Loaded catches from Supabase:', allCatches.length);
          }
        } catch (error) {
          if (__DEV__) {
            console.log('[MapScreen] Supabase failed, using local:', error.message);
          }
          // Fallback to local storage
          allCatches = await getAllCatchesLocal();
        }
      } else {
        // Use local storage
        allCatches = await getAllCatchesLocal();
      }
      
      setAllCatches(allCatches);
      
      if (__DEV__) {
        console.log('[MapScreen] Loaded catches:', allCatches.length);
        console.log('[MapScreen] Catches with location:', allCatches.filter(c => c.latitude && c.longitude).length);
        if (allCatches.length > 0) {
          console.log('[MapScreen] Sample catch:', {
            id: allCatches[0].id,
            hasLocation: !!(allCatches[0].latitude && allCatches[0].longitude),
            lat: allCatches[0].latitude,
            lng: allCatches[0].longitude,
          });
        }
      }
      
      // Center map on catches if we have any with location; otherwise center on device location
      const withLocation = allCatches.filter(c => c.latitude != null && c.longitude != null);
      if (withLocation.length > 0) {
        const avgLat = withLocation.reduce((sum, c) => sum + c.latitude, 0) / withLocation.length;
        const avgLng = withLocation.reduce((sum, c) => sum + c.longitude, 0) / withLocation.length;
        const lats = withLocation.map(c => c.latitude);
        const lngs = withLocation.map(c => c.longitude);
        const latDelta = Math.max(...lats) - Math.min(...lats);
        const lngDelta = Math.max(...lngs) - Math.min(...lngs);
        setRegion({
          latitude: avgLat,
          longitude: avgLng,
          latitudeDelta: Math.max(latDelta * 1.5, 0.5),
          longitudeDelta: Math.max(lngDelta * 1.5, 0.5),
        });
      } else {
        // No catches with location: center on device location
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({});
            setRegion({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            });
          }
        } catch (e) {
          if (__DEV__) console.warn('[MapScreen] Could not get device location:', e);
        }
      }
    } catch (error) {
      console.error('[MapScreen] Error loading catches:', error);
      Alert.alert('Error', 'Failed to load catch locations');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (catchData) => {
    setSelectedCatch(catchData);
  };

  const handleShareSpot = async () => {
    if (!selectedCatch) return;
    
    try {
      const locationText = selectedCatch.location || 'Fishing Spot';
      const message = `🎣 Check out this fishing spot!\n\n${locationText}\n\nCaught: ${selectedCatch.fishSpecies || 'Fish'}\nLure: ${selectedCatch.lureType || 'Unknown'}\n\nLocation: https://maps.google.com/?q=${selectedCatch.latitude},${selectedCatch.longitude}`;
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync({
          message: message,
        });
      } else {
        Alert.alert('Share', message);
      }
    } catch (error) {
      console.error('[MapScreen] Share error:', error);
      Alert.alert('Error', 'Failed to share location');
    }
  };

  // Get emoji for marker based on fish species
  const getMarkerEmoji = (catchData) => {
    // Use hook emoji for most catches, fish emoji for certain species
    const fishEmojis = ['Bass', 'Trout', 'Pike', 'Walleye', 'Salmon'];
    const hasFishEmoji = fishEmojis.some(fish => 
      catchData.fishSpecies?.toLowerCase().includes(fish.toLowerCase())
    );
    return hasFishEmoji ? '🐟' : '🎣';
  };

  // Filter catches based on selected filters
  const filteredCatches = useMemo(() => {
    let filtered = [...allCatches];

    // Filter by species
    if (filters.species) {
      filtered = filtered.filter(c => 
        c.fishSpecies?.toLowerCase().includes(filters.species.toLowerCase())
      );
    }

    // Filter by lure type
    if (filters.lureType) {
      filtered = filtered.filter(c => 
        c.lureType?.toLowerCase().includes(filters.lureType.toLowerCase())
      );
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (filters.dateRange) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(c => {
        const catchDate = new Date(c.timestamp);
        return catchDate >= cutoffDate;
      });
    }

    // Filter by favorites only
    if (filters.favoritesOnly) {
      filtered = filtered.filter(c => favorites.has(c.id));
    }

    return filtered;
  }, [allCatches, filters, favorites]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredCatches.length === 0) {
      return {
        totalSpots: 0,
        mostProductiveSpots: [],
        bestLuresByLocation: {},
        totalCatches: 0,
        uniqueSpecies: 0,
      };
    }

    // Group catches by location (rounded to ~100m precision)
    const locationGroups = {};
    filteredCatches.forEach(c => {
      const latKey = Math.round(c.latitude * 1000) / 1000;
      const lngKey = Math.round(c.longitude * 1000) / 1000;
      const key = `${latKey},${lngKey}`;
      
      if (!locationGroups[key]) {
        locationGroups[key] = {
          latitude: c.latitude,
          longitude: c.longitude,
          location: c.location || 'Unknown Location',
          catches: [],
          lureTypes: {},
        };
      }
      locationGroups[key].catches.push(c);
      
      if (c.lureType) {
        locationGroups[key].lureTypes[c.lureType] = 
          (locationGroups[key].lureTypes[c.lureType] || 0) + 1;
      }
    });

    // Find most productive spots
    const mostProductiveSpots = Object.values(locationGroups)
      .sort((a, b) => b.catches.length - a.catches.length)
      .slice(0, 5)
      .map(spot => ({
        location: spot.location,
        catchCount: spot.catches.length,
        latitude: spot.latitude,
        longitude: spot.longitude,
        bestLure: Object.entries(spot.lureTypes)
          .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A',
      }));

    // Get unique species count
    const uniqueSpecies = new Set(filteredCatches.map(c => c.fishSpecies).filter(Boolean)).size;

    return {
      totalSpots: Object.keys(locationGroups).length,
      mostProductiveSpots,
      totalCatches: filteredCatches.length,
      uniqueSpecies,
    };
  }, [filteredCatches]);

  // Get unique values for filter dropdowns
  const uniqueSpecies = useMemo(() => {
    const species = new Set();
    allCatches.forEach(c => {
      if (c.fishSpecies && c.fishSpecies !== 'Other') {
        species.add(c.fishSpecies);
      }
    });
    return Array.from(species).sort();
  }, [allCatches]);

  const uniqueLureTypes = useMemo(() => {
    const lureTypes = new Set();
    allCatches.forEach(c => {
      if (c.lureType) {
        lureTypes.add(c.lureType);
      }
    });
    return Array.from(lureTypes).sort();
  }, [allCatches]);

  // Prepare heatmap circles (simple heatmap visualization)
  const heatmapCircles = filteredCatches.map(catch_ => ({
    id: catch_.id,
    latitude: catch_.latitude,
    longitude: catch_.longitude,
  }));

  // Get directions to a spot
  const getDirections = (catchData) => {
    const url = Platform.select({
      ios: `maps://maps.apple.com/?daddr=${catchData.latitude},${catchData.longitude}`,
      android: `google.navigation:q=${catchData.latitude},${catchData.longitude}`,
    });
    
    Linking.openURL(url).catch(err => {
      // Fallback to web maps
      const webUrl = `https://maps.google.com/?q=${catchData.latitude},${catchData.longitude}`;
      Linking.openURL(webUrl).catch(console.error);
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading fishing spots...</Text>
      </View>
    );
  }

  const MapComponent = showHeatmap ? MapView : MapViewClustered;

  return (
    <View style={styles.container}>
      <MapComponent
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        mapType={mapType}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        {...(!showHeatmap && {
          clusterColor: '#4A90E2',
          clusterTextColor: '#fff',
          radius: 50,
          minZoom: 10,
        })}
      >
        {/* Heatmap circles (simple visualization) */}
        {showHeatmap && heatmapCircles.map((circle, index) => (
          <Circle
            key={`heat-${circle.id || index}`}
            center={{
              latitude: circle.latitude,
              longitude: circle.longitude,
            }}
            radius={1000} // 1km radius
            fillColor="rgba(74, 144, 226, 0.3)"
            strokeColor="rgba(74, 144, 226, 0.5)"
            strokeWidth={2}
          />
        ))}

        {/* Markers for each catch */}
        {filteredCatches.map((catch_, index) => (
          <Marker
            key={catch_.id || index}
            coordinate={{
              latitude: catch_.latitude,
              longitude: catch_.longitude,
            }}
            title={catch_.fishSpecies || 'Catch'}
            description={catch_.location || 'Fishing spot'}
            onPress={() => handleMarkerPress(catch_)}
          >
            <View style={[
              styles.markerContainer,
              favorites.has(catch_.id) && styles.markerContainerFavorite
            ]}>
              <Text style={styles.markerEmoji}>{getMarkerEmoji(catch_)}</Text>
              {favorites.has(catch_.id) && (
                <View style={styles.favoriteBadge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                </View>
              )}
            </View>
          </Marker>
        ))}
      </MapComponent>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setMapType(mapType === 'standard' ? 'satellite' : mapType === 'satellite' ? 'hybrid' : 'standard')}
        >
          <Ionicons name="map" size={24} color="#4A90E2" />
          <Text style={styles.controlButtonText}>
            {mapType === 'standard' ? 'Satellite' : mapType === 'satellite' ? 'Hybrid' : 'Standard'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, showHeatmap && styles.controlButtonActive]}
          onPress={() => setShowHeatmap(!showHeatmap)}
        >
          <Ionicons name="flame" size={24} color={showHeatmap ? "#fff" : "#4A90E2"} />
          <Text style={[styles.controlButtonText, showHeatmap && styles.controlButtonTextActive]}>
            Heatmap
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, showFilters && styles.controlButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={24} color={showFilters ? "#fff" : "#4A90E2"} />
          <Text style={[styles.controlButtonText, showFilters && styles.controlButtonTextActive]}>
            Filters
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, showStats && styles.controlButtonActive]}
          onPress={() => setShowStats(!showStats)}
        >
          <Ionicons name="stats-chart" size={24} color={showStats ? "#fff" : "#4A90E2"} />
          <Text style={[styles.controlButtonText, showStats && styles.controlButtonTextActive]}>
            Stats
          </Text>
        </TouchableOpacity>
      </View>


      {/* Catch detail modal */}
      <Modal
        visible={selectedCatch !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedCatch(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setSelectedCatch(null)}
          />
          {selectedCatch && (
            <View style={styles.modalContent}>
              <ScrollView style={styles.modalScroll}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>🎣 Catch Details</Text>
                  <TouchableOpacity onPress={() => setSelectedCatch(null)}>
                    <Ionicons name="close" size={24} color="#2c3e50" />
                  </TouchableOpacity>
                </View>

                {selectedCatch.imageUri && (
                  <Image source={{ uri: selectedCatch.imageUri }} style={styles.catchImage} />
                )}

                <View style={styles.catchInfo}>
                  {selectedCatch.fishSpecies && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>🐟 Species:</Text>
                      <Text style={styles.infoValue}>{selectedCatch.fishSpecies}</Text>
                    </View>
                  )}

                  {selectedCatch.lureType && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>🎣 Lure:</Text>
                      <Text style={styles.infoValue}>{selectedCatch.lureType}</Text>
                    </View>
                  )}

                  {selectedCatch.weight && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>⚖️ Weight:</Text>
                      <Text style={styles.infoValue}>{selectedCatch.weight}</Text>
                    </View>
                  )}

                  {selectedCatch.length && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>📏 Length:</Text>
                      <Text style={styles.infoValue}>{selectedCatch.length}</Text>
                    </View>
                  )}

                  {selectedCatch.location && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>📍 Location:</Text>
                      <Text style={styles.infoValue}>{selectedCatch.location}</Text>
                    </View>
                  )}

                  {selectedCatch.notes && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>📝 Notes:</Text>
                      <Text style={styles.infoValue}>{selectedCatch.notes}</Text>
                    </View>
                  )}

                  {selectedCatch.timestamp && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>📅 Date:</Text>
                      <Text style={styles.infoValue}>
                        {new Date(selectedCatch.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.catchActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.favoriteButton]}
                    onPress={() => {
                      toggleFavorite(selectedCatch.id);
                      setSelectedCatch({ ...selectedCatch, isFavorite: !favorites.has(selectedCatch.id) });
                    }}
                  >
                    <Ionicons 
                      name={favorites.has(selectedCatch.id) ? "star" : "star-outline"} 
                      size={20} 
                      color={favorites.has(selectedCatch.id) ? "#FFD700" : "white"} 
                    />
                    <Text style={styles.actionButtonText}>
                      {favorites.has(selectedCatch.id) ? 'Unfavorite' : 'Favorite'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.directionsButton]}
                    onPress={() => getDirections(selectedCatch)}
                  >
                    <Ionicons name="navigate" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Directions</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.shareButton]}
                    onPress={handleShareSpot}
                  >
                    <Ionicons name="share-social" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowFilters(false)}
          />
          <View style={styles.filterModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔍 Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="#2c3e50" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterScroll}>
              {/* Species Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>🐟 Fish Species</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[styles.filterChip, filters.species === '' && styles.filterChipActive]}
                    onPress={() => setFilters({ ...filters, species: '' })}
                  >
                    <Text style={[styles.filterChipText, filters.species === '' && styles.filterChipTextActive]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {uniqueSpecies.map((species, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.filterChip, filters.species === species && styles.filterChipActive]}
                      onPress={() => setFilters({ ...filters, species: filters.species === species ? '' : species })}
                    >
                      <Text style={[styles.filterChipText, filters.species === species && styles.filterChipTextActive]}>
                        {species}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Lure Type Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>🎣 Lure Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[styles.filterChip, filters.lureType === '' && styles.filterChipActive]}
                    onPress={() => setFilters({ ...filters, lureType: '' })}
                  >
                    <Text style={[styles.filterChipText, filters.lureType === '' && styles.filterChipTextActive]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {uniqueLureTypes.map((lureType, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.filterChip, filters.lureType === lureType && styles.filterChipActive]}
                      onPress={() => setFilters({ ...filters, lureType: filters.lureType === lureType ? '' : lureType })}
                    >
                      <Text style={[styles.filterChipText, filters.lureType === lureType && styles.filterChipTextActive]}>
                        {lureType}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Date Range Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>📅 Date Range</Text>
                <View style={styles.dateRangeContainer}>
                  {['all', 'week', 'month', 'year'].map((range) => (
                    <TouchableOpacity
                      key={range}
                      style={[styles.dateRangeButton, filters.dateRange === range && styles.dateRangeButtonActive]}
                      onPress={() => setFilters({ ...filters, dateRange: range })}
                    >
                      <Text style={[styles.dateRangeText, filters.dateRange === range && styles.dateRangeTextActive]}>
                        {range === 'all' ? 'All Time' : range === 'week' ? 'Last Week' : range === 'month' ? 'Last Month' : 'Last Year'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Favorites Only Toggle */}
              <View style={styles.filterSection}>
                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={() => setFilters({ ...filters, favoritesOnly: !filters.favoritesOnly })}
                >
                  <Ionicons 
                    name={filters.favoritesOnly ? "star" : "star-outline"} 
                    size={24} 
                    color={filters.favoritesOnly ? "#FFD700" : "#2c3e50"} 
                  />
                  <Text style={styles.toggleLabel}>Show Favorites Only</Text>
                  <View style={[styles.toggleSwitch, filters.favoritesOnly && styles.toggleSwitchActive]}>
                    <View style={[styles.toggleThumb, filters.favoritesOnly && styles.toggleThumbActive]} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Clear Filters */}
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => setFilters({ species: '', lureType: '', dateRange: 'all', favoritesOnly: false })}
              >
                <Text style={styles.clearFiltersText}>Clear All Filters</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Stats Overlay Modal */}
      <Modal
        visible={showStats}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStats(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowStats(false)}
          />
          <View style={styles.statsModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📊 Statistics</Text>
              <TouchableOpacity onPress={() => setShowStats(false)}>
                <Ionicons name="close" size={24} color="#2c3e50" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.statsScroll}>
              {/* Overall Stats */}
              <View style={styles.statsCard}>
                <Text style={styles.statsCardTitle}>Overall</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.totalSpots}</Text>
                    <Text style={styles.statLabel}>Fishing Spots</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.totalCatches}</Text>
                    <Text style={styles.statLabel}>Total Catches</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.uniqueSpecies}</Text>
                    <Text style={styles.statLabel}>Species</Text>
                  </View>
                </View>
              </View>

              {/* Most Productive Spots */}
              <View style={styles.statsCard}>
                <Text style={styles.statsCardTitle}>🏆 Most Productive Spots</Text>
                {stats.mostProductiveSpots.length > 0 ? (
                  stats.mostProductiveSpots.map((spot, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.spotItem}
                      onPress={() => {
                        setRegion({
                          latitude: spot.latitude,
                          longitude: spot.longitude,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        });
                        setShowStats(false);
                      }}
                    >
                      <View style={styles.spotRank}>
                        <Text style={styles.spotRankText}>{index + 1}</Text>
                      </View>
                      <View style={styles.spotInfo}>
                        <Text style={styles.spotName}>{spot.location}</Text>
                        <Text style={styles.spotDetails}>
                          {spot.catchCount} catch{spot.catchCount !== 1 ? 'es' : ''} • Best lure: {spot.bestLure}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#95a5a6" />
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noStatsText}>No spots to display</Text>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 5,
    borderWidth: 2,
    borderColor: '#4A90E2',
    position: 'relative',
  },
  markerContainerFavorite: {
    borderColor: '#FFD700',
    borderWidth: 3,
  },
  markerEmoji: {
    fontSize: 24,
  },
  favoriteBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  controls: {
    position: 'absolute',
    top: 60,
    right: 15,
    gap: 10,
  },
  controlButton: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    gap: 5,
  },
  controlButtonActive: {
    backgroundColor: '#4A90E2',
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
  },
  controlButtonTextActive: {
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalScroll: {
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  catchImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  catchInfo: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    width: 100,
  },
  infoValue: {
    fontSize: 16,
    color: '#34495e',
    flex: 1,
  },
  catchActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 20,
    paddingTop: 0,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 6,
  },
  favoriteButton: {
    backgroundColor: '#FFD700',
  },
  directionsButton: {
    backgroundColor: '#2ecc71',
  },
  shareButton: {
    backgroundColor: '#4A90E2',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Filter Modal Styles
  filterModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  filterScroll: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 25,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ecf0f1',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  filterChipActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  filterChipText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: 'white',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dateRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#ecf0f1',
    borderWidth: 1,
    borderColor: '#bdc3c7',
    minWidth: 100,
  },
  dateRangeButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  dateRangeText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
    textAlign: 'center',
  },
  dateRangeTextActive: {
    color: 'white',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#bdc3c7',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#4A90E2',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  clearFiltersButton: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  clearFiltersText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Stats Modal Styles
  statsModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  statsScroll: {
    padding: 20,
  },
  statsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  statsCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  spotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  spotRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  spotRankText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  spotInfo: {
    flex: 1,
  },
  spotName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  spotDetails: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  noStatsText: {
    textAlign: 'center',
    color: '#95a5a6',
    fontSize: 14,
    padding: 20,
  },
});
