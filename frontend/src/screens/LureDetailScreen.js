import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import ViewShot from 'react-native-view-shot';
import { addCatchToLure as addCatchLocal, updateCatchFromLure, deleteCatchFromLure } from '../services/storageService';
import { addCatchToLure as addCatchSupabase, updateCatch, getCatchesForLure, deleteCatch } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import { shareCatchCard } from '../services/shareService';
import { CatchShareCard } from '../components/CatchShareCard';

// Predetermined options for catch data
const FISH_SPECIES = [
  'Select Species...',
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

const WEIGHT_UNITS = ['lbs', 'kg', 'oz'];
const LENGTH_UNITS = ['in', 'cm', 'ft'];

export default function LureDetailScreen({ route, navigation }) {
  const { lure } = route.params;
  const { user } = useAuth();
  const [catches, setCatches] = useState(lure.catches || []);
  const [addCatchModalVisible, setAddCatchModalVisible] = useState(false);
  const [viewCatchModalVisible, setViewCatchModalVisible] = useState(false);
  const [selectedCatch, setSelectedCatch] = useState(null);
  const [editingCatchId, setEditingCatchId] = useState(null); // Track which catch we're editing
  const [catchPhoto, setCatchPhoto] = useState(null);
  const [catchDetails, setCatchDetails] = useState({
    fishSpecies: 'Select Species...',
    weightValue: '',
    weightUnit: 'lbs',
    lengthValue: '',
    lengthUnit: 'in',
    location: '',
    notes: '',
  });
  const [catchLocation, setCatchLocation] = useState(null); // { latitude, longitude }
  const [shareCardVisible, setShareCardVisible] = useState(false);
  const [shareCardCatchData, setShareCardCatchData] = useState(null); // catch data with optional local image URI for share
  const [isSharing, setIsSharing] = useState(false);
  const [isSavingCatch, setIsSavingCatch] = useState(false);
  const shareCardRef = useRef(null);
  const shareTempUriRef = useRef(null);
  const shareCaptureDoneRef = useRef(false);

  // Helper to check if lure is from Supabase (has UUID format)
  const isSupabaseLure = () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return lure.id && uuidRegex.test(lure.id);
  };

  // Load catches from Supabase if it's a Supabase lure
  useEffect(() => {
    const loadCatches = async () => {
      if (user && isSupabaseLure()) {
        try {
          const supabaseCatches = await getCatchesForLure(lure.id);
          // Convert Supabase format to match local format
          const formattedCatches = supabaseCatches.map(c => ({
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
          }));
          setCatches(formattedCatches);
          console.log('[LureDetail] Loaded catches from Supabase:', formattedCatches.length);
        } catch (error) {
          console.error('[LureDetail] Error loading catches:', error);
        }
      }
    };
    loadCatches();
  }, [lure.id, user]);

  // Capture current location
  const captureLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (__DEV__) {
          console.log('[LureDetail] Location permission denied');
        }
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('[LureDetail] Error capturing location:', error);
      return null;
    }
  };

  const pickCatchPhoto = async (useCamera = false) => {
    try {
      let result;
      
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Camera permission is required to take photos');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false, // Don't force crop - let user use full photo
          quality: 0.9,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false, // Don't force crop - let user use full photo
          quality: 0.9,
        });
      }

      if (!result.canceled) {
        setCatchPhoto(result.assets[0]);
        // Auto-capture location when photo is selected
        if (!editingCatchId) {
          if (__DEV__) {
            console.log('[LureDetail] Photo selected, capturing location...');
          }
          const location = await captureLocation();
          if (location) {
            setCatchLocation(location);
            if (__DEV__) {
              console.log('[LureDetail] ✓ Location captured:', location);
            }
          } else {
            if (__DEV__) {
              console.log('[LureDetail] ⚠ Location capture failed or denied');
            }
          }
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick photo');
    }
  };

  // Helper to parse weight/length strings (e.g., "3.5 lbs" -> { value: "3.5", unit: "lbs" })
  const parseWeightOrLength = (str) => {
    if (!str) return { value: '', unit: '' };
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return { value: parts[0], unit: parts[1] };
    }
    return { value: str, unit: '' };
  };

  // Populate form with existing catch data for editing
  const populateCatchForm = (catchToEdit) => {
    const weightParsed = parseWeightOrLength(catchToEdit.weight);
    const lengthParsed = parseWeightOrLength(catchToEdit.length);
    
    setCatchDetails({
      fishSpecies: catchToEdit.fishSpecies || 'Select Species...',
      weightValue: weightParsed.value,
      weightUnit: weightParsed.unit || 'lbs',
      lengthValue: lengthParsed.value,
      lengthUnit: lengthParsed.unit || 'in',
      location: catchToEdit.location || '',
      notes: catchToEdit.notes || '',
    });
    
    // Set photo if it exists
    if (catchToEdit.imageUri) {
      setCatchPhoto({ uri: catchToEdit.imageUri });
    }
    
    // Set location if it exists
    if (catchToEdit.latitude && catchToEdit.longitude) {
      setCatchLocation({
        latitude: catchToEdit.latitude,
        longitude: catchToEdit.longitude,
      });
    } else {
      setCatchLocation(null);
    }
  };

  const handleEditCatch = () => {
    if (!selectedCatch) return;
    
    setEditingCatchId(selectedCatch.id);
    populateCatchForm(selectedCatch);
    setViewCatchModalVisible(false);
    setAddCatchModalVisible(true);
  };

  const saveCatch = async () => {
    // Photo is required for new catches, but optional for edits (can keep existing)
    if (!editingCatchId && !catchPhoto) {
      Alert.alert('No Photo', 'Please add a photo of your catch');
      return;
    }

    if (!catchDetails.fishSpecies || catchDetails.fishSpecies === 'Select Species...') {
      Alert.alert('Missing Information', 'Please select a fish species');
      return;
    }

    setIsSavingCatch(true);
    try {
      // Format weight and length with units
      const weight = catchDetails.weightValue ? `${catchDetails.weightValue} ${catchDetails.weightUnit}` : '';
      const length = catchDetails.lengthValue ? `${catchDetails.lengthValue} ${catchDetails.lengthUnit}` : '';
      
      const catchData = {
        imageUri: catchPhoto?.uri || null, // Can be null if editing and not changing photo
        timestamp: editingCatchId ? selectedCatch?.timestamp : new Date().toISOString(),
        fishSpecies: catchDetails.fishSpecies !== 'Select Species...' ? catchDetails.fishSpecies : '',
        weight: weight,
        length: length,
        location: catchDetails.location,
        notes: catchDetails.notes,
        latitude: catchLocation?.latitude || null,
        longitude: catchLocation?.longitude || null,
      };

      if (__DEV__) {
        console.log('[LureDetail] Saving catch with location:', {
          hasLocation: !!(catchLocation?.latitude && catchLocation?.longitude),
          latitude: catchLocation?.latitude,
          longitude: catchLocation?.longitude,
        });
      }

      let updatedCatch;

      if (editingCatchId) {
        // Update existing catch
        if (user && isSupabaseLure()) {
          console.log('[LureDetail] Updating catch in Supabase:', editingCatchId);
          const result = await updateCatch(editingCatchId, catchData);
          updatedCatch = {
            id: result.catch.id,
            imageUri: result.catch.image_url,
            timestamp: result.catch.catch_date || result.catch.created_at,
            fishSpecies: result.catch.fish_species,
            weight: result.catch.weight,
            length: result.catch.length,
            location: result.catch.location,
            notes: result.catch.notes,
            latitude: result.catch.latitude,
            longitude: result.catch.longitude,
          };
        } else {
          // Local storage
          const lureIdentifier = lure.id || lure.timestamp || Date.now().toString();
          console.log('[LureDetail] Updating catch locally:', editingCatchId);
          const updated = await updateCatchFromLure(lureIdentifier, editingCatchId, catchData);
          updatedCatch = updated;
        }
        
        // Update local state - replace the catch
        setCatches(catches.map(c => c.id === editingCatchId ? updatedCatch : c));
        Alert.alert('Success', 'Catch updated successfully!');
      } else {
        // Create new catch
        if (user && isSupabaseLure()) {
          console.log('[LureDetail] Saving catch to Supabase for lure:', lure.id);
          const result = await addCatchSupabase(lure.id, catchData);
          updatedCatch = {
            id: result.catch.id,
            imageUri: result.catch.image_url,
            timestamp: result.catch.catch_date || result.catch.created_at,
            fishSpecies: result.catch.fish_species,
            weight: result.catch.weight,
            length: result.catch.length,
            location: result.catch.location,
            notes: result.catch.notes,
            latitude: result.catch.latitude,
            longitude: result.catch.longitude,
          };
        } else {
          // Local storage
          const lureIdentifier = lure.id || lure.timestamp || Date.now().toString();
          console.log('[LureDetail] Saving catch locally for lure:', lureIdentifier);
          await addCatchLocal(lureIdentifier, catchData);
          updatedCatch = {
            id: Date.now().toString(),
            ...catchData,
          };
        }
        
        // Update local state - add new catch
        setCatches([...catches, updatedCatch]);
        Alert.alert('Success', 'Catch added successfully!');
      }
      
      // Reset form and close modal
      setAddCatchModalVisible(false);
      setEditingCatchId(null);
      setCatchPhoto(null);
      setCatchLocation(null);
      setCatchDetails({
        fishSpecies: 'Select Species...',
        weightValue: '',
        weightUnit: 'lbs',
        lengthValue: '',
        lengthUnit: 'in',
        location: '',
        notes: '',
      });
    } catch (error) {
      console.error('[LureDetail] Save catch error:', error);
      Alert.alert('Error', `Failed to ${editingCatchId ? 'update' : 'save'} catch: ${error.message}`);
    } finally {
      setIsSavingCatch(false);
    }
  };

  const handleShareCatch = async () => {
    if (!selectedCatch) return;

    try {
      setIsSharing(true);
      setShareCardCatchData(null);
      setShareCardVisible(false);
      shareTempUriRef.current = null;
      shareCaptureDoneRef.current = false;

      let tempUriToDelete = null;
      const imageUri = selectedCatch.imageUri;
      const isRemote = imageUri && !imageUri.startsWith('file://') && !imageUri.startsWith('content://') && !imageUri.startsWith('data:');

      if (isRemote) {
        try {
          tempUriToDelete = FileSystem.cacheDirectory + `share_catch_${Date.now()}.jpg`;
          await FileSystem.downloadAsync(imageUri, tempUriToDelete);
          const displayUri = tempUriToDelete.startsWith('file://') ? tempUriToDelete : 'file://' + tempUriToDelete;
          setShareCardCatchData({ ...selectedCatch, imageUri: displayUri });
          shareTempUriRef.current = tempUriToDelete;
        } catch (downloadError) {
          console.warn('[LureDetail] Download for share failed, using remote URI:', downloadError);
          setShareCardCatchData(selectedCatch);
        }
      } else {
        setShareCardCatchData(selectedCatch);
      }

      setShareCardVisible(true);
      // Fallback: if onImageLoad never fires (e.g. broken image), capture after 2.5s and cleanup
      setTimeout(() => {
        if (shareCaptureDoneRef.current) return;
        shareCaptureDoneRef.current = true;
        (async () => {
          try {
            await shareCatchCard(shareCardRef);
          } catch (e) {
            console.error('[LureDetail] Share fallback error:', e);
            Alert.alert('Error', `Failed to share catch: ${e.message}`);
          } finally {
            if (shareTempUriRef.current) {
              try { await FileSystem.deleteAsync(shareTempUriRef.current, { idempotent: true }); } catch (_) {}
              shareTempUriRef.current = null;
            }
            setShareCardVisible(false);
            setShareCardCatchData(null);
            setIsSharing(false);
          }
        })();
      }, 2500);
    } catch (error) {
      console.error('[LureDetail] Share error:', error);
      Alert.alert('Error', `Failed to share catch: ${error.message}`);
      setIsSharing(false);
      setShareCardVisible(false);
      setShareCardCatchData(null);
    }
  };

  const handleShareCardImageLoad = async () => {
    if (shareCaptureDoneRef.current) return;
    shareCaptureDoneRef.current = true;
    try {
      await shareCatchCard(shareCardRef);
    } catch (error) {
      console.error('[LureDetail] Share error:', error);
      Alert.alert('Error', `Failed to share catch: ${error.message}`);
    } finally {
      const tempUri = shareTempUriRef.current;
      if (tempUri) {
        try {
          await FileSystem.deleteAsync(tempUri, { idempotent: true });
        } catch (_) {}
        shareTempUriRef.current = null;
      }
      setShareCardVisible(false);
      setShareCardCatchData(null);
      setIsSharing(false);
    }
  };

  const handleDeleteCatch = async (catchId) => {
    Alert.alert(
      'Delete Catch',
      'Are you sure you want to delete this catch?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Use Supabase or local storage depending on lure type
              if (user && isSupabaseLure()) {
                await deleteCatch(catchId);
                console.log('[LureDetail] Deleted catch from Supabase:', catchId);
              } else {
                await deleteCatchFromLure(lure.id, catchId);
                console.log('[LureDetail] Deleted catch locally:', catchId);
              }
              
              // Update local state
              setCatches(catches.filter(c => c.id !== catchId));
              
              Alert.alert('Success', 'Catch deleted');
              setViewCatchModalVisible(false);
            } catch (error) {
              console.error('[LureDetail] Delete catch error:', error);
              Alert.alert('Error', `Failed to delete catch: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Lure',
      'Are you sure you want to delete this lure from your tackle box?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // This will be handled by the parent screen
            navigation.goBack();
          },
        },
      ]
    );
  };

  const renderSection = (title, content, icon) => {
    if (!content) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name={icon} size={20} color="#2c3e50" />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Text style={styles.sectionContent}>{content}</Text>
      </View>
    );
  };

  const renderRecommendedColors = (colors) => {
    if (!colors) return null;
    
    let colorText = '';
    if (typeof colors === 'object') {
      // Handle object format like { clear_water: [...], murky_water: [...] }
      const colorEntries = Object.entries(colors);
      colorText = colorEntries.map(([condition, colorList]) => {
        const colors = Array.isArray(colorList) ? colorList.join(', ') : colorList;
        return `${condition.replace(/_/g, ' ').toUpperCase()}: ${colors}`;
      }).join('\n\n');
    } else if (Array.isArray(colors)) {
      // Handle array format
      colorText = colors.join(', ');
    } else {
      // Handle string format
      colorText = colors.toString();
    }
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="color-palette" size={20} color="#2c3e50" />
          <Text style={styles.sectionTitle}>Recommended Colors</Text>
        </View>
        <Text style={styles.sectionContent}>{colorText}</Text>
      </View>
    );
  };

  const renderListSection = (title, items, icon) => {
    if (!items || items.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name={icon} size={20} color="#2c3e50" />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={styles.listContainer}>
          {items.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderConditionsSection = (title, conditions, icon) => {
    if (!conditions) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name={icon} size={20} color="#2c3e50" />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={styles.conditionsGrid}>
          {Object.entries(conditions).map(([key, value]) => (
            <View key={key} style={styles.conditionItem}>
              <Text style={styles.conditionLabel}>{key.replace(/_/g, ' ').toUpperCase()}:</Text>
              <Text style={styles.conditionValue}>{Array.isArray(value) ? value.join(', ') : value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Get lure image URL (supports both local and Supabase formats)
  const lureImageUri = lure.image_url || lure.imageUri || lure.image_path;

  return (
    <ScrollView style={styles.container}>
      {/* Header with Image */}
      <View style={styles.header}>
        {lureImageUri && (
          <Image source={{ uri: lureImageUri }} style={styles.lureImage} />
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.lureType}>{lure.lure_type || 'Unknown Lure'}</Text>
          <Text style={styles.confidence}>
            AI Scan Confidence: {lure.confidence || lure.chatgpt_analysis?.confidence || 'N/A'}%
          </Text>
          <Text style={styles.analysisDate}>
            Analyzed: {new Date(lure.analysis_date || lure.created_at || Date.now()).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Target Species */}
      {renderListSection(
        'Target Species',
        lure.lure_details?.target_species || lure.chatgpt_analysis?.target_species,
        'fish'
      )}

      {/* Description */}
      {renderSection(
        'Description',
        lure.lure_details?.description,
        'document-text'
      )}

      {/* Best Conditions */}
      {renderConditionsSection(
        'Best Fishing Conditions',
        lure.lure_details?.best_conditions,
        'sunny'
      )}

      {/* Retrieve Styles */}
      {renderListSection(
        'Retrieve Styles',
        lure.lure_details?.retrieve_styles,
        'refresh'
      )}

      {/* Recommended Colors */}
      {renderRecommendedColors(lure.lure_details?.recommended_colors)}

      {/* Common Mistakes */}
      {renderListSection(
        'Common Mistakes to Avoid',
        lure.lure_details?.common_mistakes,
        'warning'
      )}

      {/* Notes */}
      {renderSection(
        'Fishing Tips & Notes',
        lure.lure_details?.notes,
        'bulb'
      )}

      {/* Reasoning */}
      {renderSection(
        'AI Analysis Reasoning',
        lure.chatgpt_analysis?.reasoning || lure.lure_details?.reasoning,
        'analytics'
      )}

      {/* Catches Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="fish" size={20} color="#2c3e50" />
          <Text style={styles.sectionTitle}>My Catches ({catches.length})</Text>
        </View>
        
        {catches && catches.length > 0 ? (
          <FlatList
            data={catches}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.catchThumbnail}
                onPress={() => {
                  setSelectedCatch(item);
                  setViewCatchModalVisible(true);
                }}
              >
                <Image source={{ uri: item.imageUri }} style={styles.catchImage} />
                <Text style={styles.catchDate}>
                  {new Date(item.timestamp).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          <Text style={styles.noCatchesText}>No catches recorded yet. Add your first catch!</Text>
        )}
        
        <TouchableOpacity
          style={styles.addCatchButton}
          onPress={() => setAddCatchModalVisible(true)}
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.addCatchButtonText}>Add Catch Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash" size={20} color="white" />
          <Text style={styles.deleteButtonText}>Delete from Tackle Box</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />

      {/* Add Catch Modal */}
      <Modal
        visible={addCatchModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingCatchId ? '✏️ Edit Catch' : '📸 Add Catch'}</Text>
            <TouchableOpacity onPress={() => {
              setAddCatchModalVisible(false);
              setEditingCatchId(null);
              setCatchPhoto(null);
              setCatchLocation(null);
              setCatchDetails({
                fishSpecies: 'Select Species...',
                weightValue: '',
                weightUnit: 'lbs',
                lengthValue: '',
                lengthUnit: 'in',
                location: '',
                notes: '',
              });
            }}>
              <Ionicons name="close" size={24} color="#2c3e50" />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContentWrapper}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <ScrollView 
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
            {/* Photo Picker */}
            <View style={styles.photoSection}>
              {catchPhoto ? (
                <View>
                  <Image source={{ uri: catchPhoto.uri }} style={styles.catchPhotoPreview} />
                  {catchLocation && (
                    <View style={styles.locationIndicator}>
                      <Ionicons name="location" size={16} color="#4A90E2" />
                      <Text style={styles.locationIndicatorText}>Location captured</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera" size={48} color="#95a5a6" />
                  <Text style={styles.photoPlaceholderText}>
                    {editingCatchId ? 'Change catch photo (optional)' : 'Add a photo of your catch'}
                  </Text>
                </View>
              )}
              
              <View style={styles.photoButtons}>
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={() => pickCatchPhoto(true)}
                >
                  <Ionicons name="camera" size={20} color="white" />
                  <Text style={styles.photoButtonText}>Take Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={() => pickCatchPhoto(false)}
                >
                  <Ionicons name="images" size={20} color="white" />
                  <Text style={styles.photoButtonText}>Choose Photo</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Catch Details Form */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Fish Species *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={catchDetails.fishSpecies}
                  onValueChange={(itemValue) => setCatchDetails({...catchDetails, fishSpecies: itemValue})}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                  dropdownIconColor="#2c3e50"
                >
                  {FISH_SPECIES.map((species, index) => (
                    <Picker.Item 
                      key={index} 
                      label={species} 
                      value={species}
                      color={catchDetails.fishSpecies === species ? '#2e7d32' : '#2c3e50'}
                    />
                  ))}
                </Picker>
              </View>

              <Text style={styles.formLabel}>Weight</Text>
              <TextInput
                style={styles.formInput}
                placeholder="3.5"
                keyboardType="decimal-pad"
                value={catchDetails.weightValue}
                onChangeText={(text) => setCatchDetails({...catchDetails, weightValue: text})}
              />
              <View style={styles.unitButtonsContainer}>
                {WEIGHT_UNITS.map((unit, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.unitButton,
                      catchDetails.weightUnit === unit && styles.unitButtonSelected
                    ]}
                    onPress={() => setCatchDetails({...catchDetails, weightUnit: unit})}
                  >
                    <Text
                      style={[
                        styles.unitButtonText,
                        catchDetails.weightUnit === unit && styles.unitButtonTextSelected
                      ]}
                    >
                      {unit === 'lbs' ? 'lbs' : unit === 'kg' ? 'kg' : 'oz'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Length</Text>
              <TextInput
                style={styles.formInput}
                placeholder="18"
                keyboardType="decimal-pad"
                value={catchDetails.lengthValue}
                onChangeText={(text) => setCatchDetails({...catchDetails, lengthValue: text})}
              />
              <View style={styles.unitButtonsContainer}>
                {LENGTH_UNITS.map((unit, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.unitButton,
                      catchDetails.lengthUnit === unit && styles.unitButtonSelected
                    ]}
                    onPress={() => setCatchDetails({...catchDetails, lengthUnit: unit})}
                  >
                    <Text
                      style={[
                        styles.unitButtonText,
                        catchDetails.lengthUnit === unit && styles.unitButtonTextSelected
                      ]}
                    >
                      {unit === 'in' ? 'inches' : unit === 'cm' ? 'cm' : 'ft'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Location</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., Lake Michigan"
                value={catchDetails.location}
                onChangeText={(text) => setCatchDetails({...catchDetails, location: text})}
              />

              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="Add any notes about this catch..."
                value={catchDetails.notes}
                onChangeText={(text) => setCatchDetails({...catchDetails, notes: text})}
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>
          </KeyboardAvoidingView>

          <View style={styles.modalActionsWrapper}>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setAddCatchModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isSavingCatch && styles.saveButtonDisabled]}
                onPress={saveCatch}
                disabled={isSavingCatch}
              >
                {isSavingCatch ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" style={styles.saveButtonSpinner} />
                    <Text style={styles.saveButtonText}>Saving...</Text>
                  </>
                ) : (
                  <Text style={styles.saveButtonText}>{editingCatchId ? 'Update Catch' : 'Save Catch'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* View Catch Modal */}
      <Modal
        visible={viewCatchModalVisible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.catchViewModal}>
          <TouchableOpacity
            style={styles.catchViewBackdrop}
            onPress={() => setViewCatchModalVisible(false)}
          />
          {selectedCatch && (
            <ScrollView 
              style={styles.catchViewScrollContainer}
              contentContainerStyle={styles.catchViewScrollContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
              alwaysBounceVertical={false}
            >
              <View style={styles.catchViewContainer}>
                <Image source={{ uri: selectedCatch.imageUri }} style={styles.catchViewImage} />
                
                <View style={styles.catchViewDetails}>
                  {selectedCatch.fishSpecies && (
                    <Text style={styles.catchViewText}>🐟 {selectedCatch.fishSpecies}</Text>
                  )}
                  {selectedCatch.weight && (
                    <Text style={styles.catchViewText}>⚖️ {selectedCatch.weight}</Text>
                  )}
                  {selectedCatch.length && (
                    <Text style={styles.catchViewText}>📏 {selectedCatch.length}</Text>
                  )}
                  {selectedCatch.location && (
                    <Text style={styles.catchViewText}>📍 {selectedCatch.location}</Text>
                  )}
                  {selectedCatch.notes && (
                    <Text style={styles.catchViewText}>📝 {selectedCatch.notes}</Text>
                  )}
                  <Text style={styles.catchViewDate}>
                    {new Date(selectedCatch.timestamp).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.catchViewActions}>
                  <TouchableOpacity
                    style={styles.catchEditButton}
                    onPress={handleEditCatch}
                  >
                    <Ionicons name="create" size={20} color="white" />
                    <Text style={styles.catchEditButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.catchShareButton}
                    onPress={handleShareCatch}
                    disabled={isSharing}
                  >
                    {isSharing ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="share-social" size={20} color="white" />
                        <Text style={styles.catchShareButtonText}>Share</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.catchDeleteButton}
                    onPress={() => handleDeleteCatch(selectedCatch.id)}
                  >
                    <Ionicons name="trash" size={20} color="white" />
                    <Text style={styles.catchDeleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.catchCloseButtonContainer}>
                  <TouchableOpacity
                    style={styles.catchCloseButton}
                    onPress={() => setViewCatchModalVisible(false)}
                  >
                    <Text style={styles.catchCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Hidden Share Card for Capture */}
      {shareCardVisible && (shareCardCatchData || selectedCatch) && (
        <View style={styles.shareCardContainer} pointerEvents="none">
          <ViewShot 
            ref={shareCardRef} 
            options={{ 
              format: 'jpg', 
              quality: 0.95,
              width: 1080,
              height: 1920,
            }}
          >
            <CatchShareCard
              catchData={shareCardCatchData || selectedCatch}
              lureData={lure}
              onImageLoad={handleShareCardImageLoad}
            />
          </ViewShot>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    flexDirection: 'row',
  },
  lureImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  lureType: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  confidence: {
    fontSize: 16,
    color: '#27ae60',
    marginBottom: 3,
  },
  analysisDate: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 8,
  },
  sectionContent: {
    fontSize: 16,
    color: '#34495e',
    lineHeight: 24,
  },
  listContainer: {
    marginLeft: 5,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  bullet: {
    fontSize: 16,
    color: '#3498db',
    marginRight: 8,
    marginTop: 2,
  },
  listText: {
    fontSize: 16,
    color: '#34495e',
    flex: 1,
    lineHeight: 22,
  },
  conditionsGrid: {
    marginLeft: 5,
  },
  conditionItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  conditionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  conditionValue: {
    fontSize: 16,
    color: '#34495e',
    marginLeft: 10,
  },
  actionButtons: {
    padding: 20,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 50,
  },
  catchThumbnail: {
    marginRight: 15,
    alignItems: 'center',
  },
  catchImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginBottom: 5,
  },
  catchDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  noCatchesText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  addCatchButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
  },
  addCatchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
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
  modalContentWrapper: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 20,
    paddingBottom: 100, // Extra padding to account for fixed action buttons at bottom
  },
  photoSection: {
    marginBottom: 20,
  },
  catchPhotoPreview: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginBottom: 15,
  },
  locationIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
  },
  photoPlaceholder: {
    width: '100%',
    height: 250,
    backgroundColor: '#ecf0f1',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  photoPlaceholderText: {
    fontSize: 16,
    color: '#95a5a6',
    marginTop: 10,
  },
  photoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photoButton: {
    flex: 1,
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  photoButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 15,
  },
  formInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#2c3e50',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 0,
    minHeight: 50,
  },
  picker: {
    height: Platform.OS === 'ios' ? 200 : 50,
    backgroundColor: 'transparent',
    color: '#2c3e50',
  },
  pickerItem: {
    color: '#2c3e50',
    fontSize: 16,
  },
  unitButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 10,
  },
  unitButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1.5,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitButtonSelected: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  unitButtonTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  modalActionsWrapper: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20, // Account for safe area on iOS
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.8,
  },
  saveButtonSpinner: {
    marginRight: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  catchViewModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  catchViewBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  catchViewScrollContainer: {
    width: '90%',
    maxHeight: '90%',
  },
  catchViewScrollContent: {
    paddingTop: 20,
    paddingBottom: 15, // Match the paddingBottom of Close button container
  },
  catchViewContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
  },
  catchViewImage: {
    width: '100%',
    height: 300,
  },
  catchViewDetails: {
    padding: 20,
  },
  catchViewText: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 8,
  },
  catchViewDate: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 10,
  },
  catchViewActions: {
    flexDirection: 'row',
    padding: 15,
    paddingTop: 25,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    flexWrap: 'wrap',
    gap: 10,
  },
  catchCloseButtonContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 15, // Equal spacing above and below
  },
  catchEditButton: {
    flex: 1,
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    minWidth: 80,
  },
  catchEditButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  catchShareButton: {
    flex: 1,
    backgroundColor: '#2e7d32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    minWidth: 80,
  },
  catchShareButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  catchDeleteButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    minWidth: 80,
  },
  catchDeleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  catchCloseButton: {
    width: '100%',
    backgroundColor: '#95a5a6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
  },
  catchCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  shareCardContainer: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    width: 1080,
    height: 1350,
    opacity: 0,
  },
});
