import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getTackleBox, deleteLureFromTackleBox, toggleFavorite } from '../services/storageService';
import { getUserLureAnalyses, deleteLureAnalysis } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';

export default function TackleBoxScreen({ navigation }) {
  const [lures, setLures] = useState([]);
  const [filteredLures, setFilteredLures] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    lureType: '',
    targetSpecies: '',
    sortByCatches: false,
    showFavoritesOnly: false,
  });
  const [useSupabase, setUseSupabase] = useState(true); // Use Supabase by default
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const { user } = useAuth();

  const loadTackleBox = async () => {
    try {
      if (__DEV__) {
        console.log('Loading tackle box...');
      }
      
      let tackleBoxData = [];
      
      // Try Supabase first if user is logged in
      if (user && useSupabase) {
        try {
          tackleBoxData = await getUserLureAnalyses();
          if (__DEV__) {
            console.log('[TackleBox] Loaded from Supabase:', tackleBoxData.length, 'lures');
          }
        } catch (supabaseError) {
          if (__DEV__) {
            console.log('[TackleBox] Supabase failed, falling back to local:', supabaseError.message);
          }
          // Fallback to local storage
          tackleBoxData = await getTackleBox();
        }
      } else {
        // Use local storage
        tackleBoxData = await getTackleBox();
        if (__DEV__) {
          console.log('[TackleBox] Loaded from local storage:', tackleBoxData.length, 'lures');
        }
      }
      
      setLures(tackleBoxData);
      setFilteredLures(tackleBoxData);
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading tackle box:', error);
      }
      Alert.alert('Error', 'Failed to load tackle box');
    }
  };

  const applyFilters = () => {
    let filtered = lures;

    // Favorites filter (support both Supabase and local storage field names)
    if (selectedFilters.showFavoritesOnly) {
      filtered = filtered.filter(lure => lure.is_favorite === true || lure.isFavorite === true);
    }

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(lure =>
        lure.lure_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lure.lure_details?.target_species?.some(species => 
          species.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        lure.chatgpt_analysis?.target_species?.some(species => 
          species.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Lure type filter
    if (selectedFilters.lureType) {
      filtered = filtered.filter(lure => 
        lure.lure_type?.toLowerCase().includes(selectedFilters.lureType.toLowerCase())
      );
    }

    // Target species filter
    if (selectedFilters.targetSpecies) {
      filtered = filtered.filter(lure => {
        const targetSpecies = lure.lure_details?.target_species || lure.chatgpt_analysis?.target_species || [];
        return targetSpecies.some(species => 
          species.toLowerCase().includes(selectedFilters.targetSpecies.toLowerCase())
        );
      });
    }

    // Sort by catches if enabled (create new array to avoid mutation issues)
    if (selectedFilters.sortByCatches) {
      filtered = [...filtered].sort((a, b) => {
        const catchesA = a.catchCount || 0;
        const catchesB = b.catchCount || 0;
        return catchesB - catchesA; // Descending order (most catches first)
      });
    }

    setFilteredLures(filtered);
    setFilterModalVisible(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedFilters({
      lureType: '',
      targetSpecies: '',
      sortByCatches: false,
      showFavoritesOnly: false,
    });
    setFilteredLures(lures);
  };

  const handleToggleFavorite = async (lureId) => {
    try {
      // Haptic feedback for instant tactile response
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Find the lure
      const lure = lures.find(l => l.id === lureId);
      if (!lure) {
        throw new Error('Lure not found');
      }
      
      // OPTIMISTIC UPDATE: Update UI immediately for instant feedback
      const newFavoriteStatus = !(lure.is_favorite || lure.isFavorite);
      
      // Update local state instantly
      const updatedLures = lures.map(l => {
        if (l.id === lureId) {
          return {
            ...l,
            is_favorite: newFavoriteStatus,
            isFavorite: newFavoriteStatus, // Support both field names
          };
        }
        return l;
      });
      
      setLures(updatedLures);
      setFilteredLures(updatedLures);
      
      // Update database in background (don't await - let it happen async)
      if (user && useSupabase) {
        // Update in Supabase
        const { updateLureAnalysis } = require('../services/supabaseService');
        updateLureAnalysis(lureId, {
          is_favorite: newFavoriteStatus
        }).catch(error => {
          // If update fails, revert the change and show error
          console.error('Error syncing favorite to Supabase:', error);
          loadTackleBox(); // Reload to get correct state from server
          Alert.alert('Sync Failed', 'Could not save favorite status. Please try again.');
        });
      } else {
        // Update in local storage
        toggleFavorite(lureId).catch(error => {
          // If update fails, revert the change
          console.error('Error saving favorite to local storage:', error);
          loadTackleBox();
          Alert.alert('Error', 'Failed to update favorite status');
        });
      }
      
    } catch (error) {
      if (__DEV__) {
        console.error('Error toggling favorite:', error);
      }
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const getUniqueValues = (key, subKey) => {
    const values = new Set();
    lures.forEach(lure => {
      let value;
      if (subKey) {
        value = lure[key]?.[subKey];
      } else {
        value = lure[key];
      }
      if (Array.isArray(value)) {
        value.forEach(v => {
          if (v != null) {
            values.add(String(v));
          }
        });
      } else if (value != null) {
        values.add(String(value));
      }
    });
    return Array.from(values).sort();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTackleBox();
    setRefreshing(false);
  };

  const deleteLure = async (id) => {
    Alert.alert(
      'Delete Lure',
      'Are you sure you want to delete this lure from your tackle box?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Haptic feedback
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
              // OPTIMISTIC UPDATE: Remove from UI immediately
              const updatedLures = lures.filter(lure => lure.id !== id);
              setLures(updatedLures);
              setFilteredLures(filteredLures.filter(lure => lure.id !== id));
              
              // Delete from correct data source in background
              if (user && useSupabase) {
                // Delete from Supabase
                deleteLureAnalysis(id).catch(error => {
                  // If delete fails, reload to restore
                  console.error('Error deleting from Supabase:', error);
                  loadTackleBox();
                  Alert.alert('Delete Failed', 'Could not delete lure. Please try again.');
                });
              } else {
                // Delete from local storage
                deleteLureFromTackleBox(id).catch(error => {
                  console.error('Error deleting from local storage:', error);
                  loadTackleBox();
                  Alert.alert('Error', 'Failed to delete lure');
                });
              }
            } catch (error) {
              if (__DEV__) {
                console.error('Error deleting lure:', error);
              }
              Alert.alert('Error', 'Failed to delete lure');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadTackleBox();
  }, []);

  // Refresh tackle box when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadTackleBox();
    }, [])
  );

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedFilters, lures]);

  const renderLureItem = ({ item }) => {
    // Get lure image URL (supports both local and Supabase formats)
    const imageUri = item.image_url || item.imageUri || item.image_path;
    
    if (viewMode === 'grid') {
      return (
        <TouchableOpacity 
          style={styles.gridCard}
          onPress={() => navigation.navigate('LureDetail', { lure: item })}
        >
          {imageUri ? (
            <Image source={{ uri: String(imageUri) }} style={styles.gridImage} />
          ) : (
            <View style={styles.gridImagePlaceholder}>
              <Ionicons name="image-outline" size={40} color="#95a5a6" />
            </View>
          )}
          <View style={styles.gridInfo}>
            <Text style={styles.gridLureType} numberOfLines={1}>
              {String(item.lure_type || 'Unknown Lure')}
            </Text>
            <View style={styles.gridFooter}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(item.id);
                }}
                style={styles.gridFavoriteButton}
              >
                <Ionicons 
                  name={(item.is_favorite || item.isFavorite) ? "heart" : "heart-outline"} 
                  size={18} 
                  color={(item.is_favorite || item.isFavorite) ? "#e74c3c" : "#95a5a6"} 
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  deleteLure(item.id);
                }}
                style={styles.gridDeleteButton}
              >
                <Ionicons name="trash" size={16} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
    
    // List view (default)
    return (
      <TouchableOpacity 
        style={styles.lureCard}
        onPress={() => navigation.navigate('LureDetail', { lure: item })}
      >
        {imageUri ? (
          <Image source={{ uri: String(imageUri) }} style={styles.lureImage} />
        ) : null}
      <View style={styles.lureInfo}>
        <View style={styles.lureHeader}>
          <Text style={styles.lureType}>{String(item.lure_type || 'Unknown Lure')}</Text>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleToggleFavorite(item.id);
            }}
            style={styles.favoriteButton}
          >
            <Ionicons 
              name={(item.is_favorite || item.isFavorite) ? "heart" : "heart-outline"} 
              size={24} 
              color={(item.is_favorite || item.isFavorite) ? "#e74c3c" : "#95a5a6"} 
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.confidence}>
          AI Scan Confidence: {String(item.confidence || item.chatgpt_analysis?.confidence || 'N/A')}%
        </Text>
        <Text style={styles.targetSpecies}>
          Target: {(() => {
            const species1 = Array.isArray(item.lure_details?.target_species) 
              ? item.lure_details.target_species.filter(Boolean).map(s => String(s)).join(', ')
              : null;
            const species2 = Array.isArray(item.chatgpt_analysis?.target_species)
              ? item.chatgpt_analysis.target_species.filter(Boolean).map(s => String(s)).join(', ')
              : null;
            return species1 || species2 || 'Various';
          })()}
        </Text>
        {(() => {
          const catchCount = Number(item.catchCount) || 0;
          return catchCount > 0 ? (
            <View style={styles.catchBadge}>
              <Ionicons name="fish" size={16} color="#27ae60" />
              <Text style={styles.catchCount}>{catchCount} catch{catchCount !== 1 ? 'es' : ''}</Text>
            </View>
          ) : null;
        })()}
        <Text style={styles.timestamp}>
          {String(new Date(item.analysis_date || Date.now()).toLocaleDateString())}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={(e) => {
          e.stopPropagation();
          deleteLure(item.id);
        }}
      >
        <Ionicons name="trash" size={20} color="white" />
      </TouchableOpacity>
    </TouchableOpacity>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>🔍 Filter & Search</Text>
          <TouchableOpacity
            onPress={() => setFilterModalVisible(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#2c3e50" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Favorites Filter */}
          <View style={styles.filterSection}>
            <TouchableOpacity
              style={[
                styles.favoritesToggle,
                selectedFilters.showFavoritesOnly && styles.favoritesToggleActive
              ]}
              onPress={() => setSelectedFilters({
                ...selectedFilters,
                showFavoritesOnly: !selectedFilters.showFavoritesOnly
              })}
            >
              <Ionicons 
                name={selectedFilters.showFavoritesOnly ? "heart" : "heart-outline"} 
                size={24} 
                color={selectedFilters.showFavoritesOnly ? "#e74c3c" : "#2c3e50"} 
              />
              <Text style={[
                styles.favoritesToggleText,
                selectedFilters.showFavoritesOnly && styles.favoritesToggleTextActive
              ]}>
                Show Favorites Only
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>🔎 Search</Text>
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search by lure type, fish species..."
              placeholderTextColor="#95a5a6"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Lure Type Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>🎣 Lure Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedFilters.lureType === '' && styles.filterChipActive
                ]}
                onPress={() => setSelectedFilters({...selectedFilters, lureType: ''})}
              >
                <Text style={styles.filterChipText}>All</Text>
              </TouchableOpacity>
              {getUniqueValues('lure_type').map((type, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.filterChip,
                    selectedFilters.lureType === type && styles.filterChipActive
                  ]}
                  onPress={() => setSelectedFilters({...selectedFilters, lureType: type})}
                >
                  <Text style={styles.filterChipText}>{String(type)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Target Species Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>🐟 Target Species</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedFilters.targetSpecies === '' && styles.filterChipActive
                ]}
                onPress={() => setSelectedFilters({...selectedFilters, targetSpecies: ''})}
              >
                <Text style={styles.filterChipText}>All</Text>
              </TouchableOpacity>
              {getUniqueValues('lure_details', 'target_species').concat(
                getUniqueValues('chatgpt_analysis', 'target_species')
              ).filter((value, index, self) => self.indexOf(value) === index).map((species, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.filterChip,
                    selectedFilters.targetSpecies === species && styles.filterChipActive
                  ]}
                  onPress={() => setSelectedFilters({...selectedFilters, targetSpecies: species})}
                >
                  <Text style={styles.filterChipText}>{String(species)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Sort by Catches */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>🐟 Sort</Text>
            <TouchableOpacity
              style={[
                styles.sortToggle,
                selectedFilters.sortByCatches && styles.sortToggleActive
              ]}
              onPress={() => setSelectedFilters({
                ...selectedFilters,
                sortByCatches: !selectedFilters.sortByCatches
              })}
            >
              <Ionicons 
                name={selectedFilters.sortByCatches ? "trophy" : "trophy-outline"} 
                size={24} 
                color={selectedFilters.sortByCatches ? "#f39c12" : "#2c3e50"} 
              />
              <Text style={[
                styles.sortToggleText,
                selectedFilters.sortByCatches && styles.sortToggleTextActive
              ]}>
                Show Most Catches First
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Count and Filter Bar */}
      <View style={styles.countBar}>
        <Text style={styles.countText}>
          {filteredLures.length} of {lures.length} lure{lures.length !== 1 ? 's' : ''}
        </Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.viewToggleButton, viewMode === 'grid' && styles.viewToggleButtonActive]}
            onPress={() => setViewMode('grid')}
          >
            <Ionicons 
              name="grid" 
              size={20} 
              color={viewMode === 'grid' ? '#4A90E2' : '#95A5A6'} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleButton, viewMode === 'list' && styles.viewToggleButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons 
              name="list" 
              size={20} 
              color={viewMode === 'list' ? '#4A90E2' : '#95A5A6'} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="filter" size={24} color="#2c3e50" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your tackle box..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#7f8c8d" />
          </TouchableOpacity>
        )}
      </View>

      {/* Lures List */}
      {filteredLures.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>🎣</Text>
          <Text style={styles.emptyTitle}>
            {lures.length === 0 ? 'No lures yet!' : 'No matching lures'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {lures.length === 0 
              ? 'Start by analyzing your first lure from the Home tab'
              : 'Try adjusting your search or filters'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredLures}
          renderItem={renderLureItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode} // Force re-render when view mode changes
        />
      )}

      {renderFilterModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  countBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  countText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewToggleButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  viewToggleButtonActive: {
    backgroundColor: '#E3F2FD',
  },
  filterButton: {
    padding: 10,
    backgroundColor: '#ecf0f1',
    borderRadius: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  listContainer: {
    padding: 15,
  },
  gridContainer: {
    padding: 15,
  },
  gridCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    margin: 7.5,
    width: '47%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gridImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
  },
  gridImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridInfo: {
    padding: 12,
  },
  gridLureType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridFavoriteButton: {
    padding: 4,
  },
  gridDeleteButton: {
    padding: 4,
  },
  lureCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lureImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  lureInfo: {
    flex: 1,
  },
  lureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lureType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
  catchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d5f4e6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  catchCount: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
    marginLeft: 4,
  },
  confidence: {
    fontSize: 14,
    color: '#27ae60',
    marginBottom: 2,
  },
  targetSpecies: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#95a5a6',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
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
  closeButton: {
    padding: 5,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 25,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  filterChip: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: '#3498db',
  },
  filterChipText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  favoritesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  favoritesToggleActive: {
    backgroundColor: '#ffe5e5',
    borderColor: '#e74c3c',
  },
  favoritesToggleText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 10,
    fontWeight: '600',
  },
  favoritesToggleTextActive: {
    color: '#e74c3c',
  },
  sortToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sortToggleActive: {
    backgroundColor: '#fef5e7',
    borderColor: '#f39c12',
  },
  sortToggleText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 10,
    fontWeight: '600',
  },
  sortToggleTextActive: {
    color: '#f39c12',
  },
  modalSearchInput: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
});