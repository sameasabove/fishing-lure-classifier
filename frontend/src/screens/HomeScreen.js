import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { analyzeLure } from '../services/lureAnalysisService';
import { saveLureToTackleBox } from '../services/storageService';
import { saveLureAnalysis } from '../services/supabaseService';
import { getQuotaStatus } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';

// Lure of the Day data - rotates daily
const LURE_OF_THE_DAY = [
  {
    name: 'Silver Spoon',
    tip: 'Perfect for trolling in clear water. The reflective surface mimics baitfish scales.',
  },
  {
    name: 'Jig Head',
    tip: 'Versatile lure that works in all conditions. Try different colors based on water clarity.',
  },
  {
    name: 'Crankbait',
    tip: 'Excellent for covering large areas. Use a steady retrieve to create a wobbling action.',
  },
  {
    name: 'Soft Plastic Worm',
    tip: 'Deadly for bass fishing. Use a slow, dragging retrieve along the bottom.',
  },
  {
    name: 'Topwater Popper',
    tip: 'Best used during early morning or evening. Create a "pop" sound to attract fish.',
  },
];

// Get today's lure based on day of year
const getLureOfTheDay = () => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return LURE_OF_THE_DAY[dayOfYear % LURE_OF_THE_DAY.length];
};

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [selectedImage, setSelectedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [quotaStatus, setQuotaStatus] = useState(null);
  
  const lureOfTheDay = useMemo(() => getLureOfTheDay(), []);

  // Load quota status when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadQuotaStatus();
    }, [user])
  );
  
  const loadQuotaStatus = async () => {
    if (user) {
      try {
        const status = await getQuotaStatus();
        setQuotaStatus(status);
      } catch (error) {
        // Silently fail - don't show errors to user
        // Quota status will just show default values
        if (__DEV__) {
          console.warn('[HomeScreen] Failed to load quota (silent):', error.message);
        }
        // Set a safe default quota status
        setQuotaStatus({
          isPro: false,
          unlimited: false,
          used: 0,
          remaining: 10,
          limit: 10,
          message: '10 scans remaining',
          emoji: '✅'
        });
      }
    }
  };
  
  const compressImage = async (imageUri) => {
    try {
      if (__DEV__) {
      console.log('[HomeScreen] Compressing image...');
      }
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 1200 } },
        ],
        { 
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG 
        }
      );
      if (__DEV__) {
      console.log('[HomeScreen] ✓ Image compressed');
      }
      return manipResult.uri;
    } catch (error) {
      if (__DEV__) {
      console.warn('[HomeScreen] Compression failed, using original:', error);
      }
      return imageUri;
    }
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const compressedUri = await compressImage(result.assets[0].uri);
      setSelectedImage({ ...result.assets[0], uri: compressedUri });
      setAnalysisResult(null);
    }
  };

  const takePicture = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const compressedUri = await compressImage(result.assets[0].uri);
      setSelectedImage({ ...result.assets[0], uri: compressedUri });
      setAnalysisResult(null);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select an image first');
      return;
    }

    // Check if user is signed in (required for scanning)
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to use the lure analyzer. This helps us manage costs and provide better service.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Sign In', 
            onPress: () => navigation.navigate('Settings')
          }
        ]
      );
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeLure(selectedImage.uri);
      setAnalysisResult(result);
      
      await saveLureToTackleBox({
        imageUri: selectedImage.uri,
        analysis: result,
        timestamp: new Date().toISOString(),
      });
      
      if (user) {
        loadQuotaStatus();
      }
      
      if (user && result.supabase_id) {
        if (__DEV__) {
        console.log('[HomeScreen] Analysis already saved to Supabase by backend');
        }
        Alert.alert('Success', 'Lure analyzed and saved to your cloud tackle box! ☁️');
      } else if (user) {
        try {
          await saveLureAnalysis(result);
          if (__DEV__) {
          console.log('[HomeScreen] Saved to Supabase from mobile app');
          }
          Alert.alert('Success', 'Lure analyzed and saved to your cloud tackle box! ☁️');
        } catch (supabaseError) {
          if (__DEV__) {
          console.log('[HomeScreen] Supabase save failed, using local only');
          }
          Alert.alert('Success', 'Lure analyzed and saved locally!');
        }
      } else {
        Alert.alert('Success', 'Lure analyzed and saved to tackle box!');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Analysis error:', error);
      }
      
      if (error.code === 'QUOTA_EXCEEDED') {
        if (user) {
          setQuotaStatus({
            isPro: false,
            unlimited: false,
            used: 10,
            remaining: 0,
            limit: 10,
            message: '🚫 0 scans remaining',
            subtitle: 'Upgrade to PRO for unlimited scans',
            emoji: '🚫'
          });
        }
        
        Alert.alert(
          '🎣 Free Scans Used Up!',
          "You've used all 10 free scans this month. Upgrade to PRO for unlimited scans!",
          [
            { text: 'Maybe Later', style: 'cancel' },
            { 
              text: 'Upgrade to PRO', 
              onPress: () => navigation.navigate('Paywall', {
                message: "You've used all 10 free scans this month!"
              })
            }
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to analyze lure. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetSelection = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
  };

  const isPro = quotaStatus?.isPro || quotaStatus?.unlimited;

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#E3F2FD', '#FFFFFF']}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Image 
              source={require('../../assets/icon.png')} 
              style={styles.appIcon}
              resizeMode="contain"
            />
            <Text style={styles.heroTitle}>My Tackle Box</Text>
            <Text style={styles.heroSubtitle}>Identify Any Lure Instantly</Text>
          </View>

          {/* PRO Upgrade Card */}
          {!isPro && (
              <TouchableOpacity
              style={styles.proCard}
                onPress={() => navigation.navigate('Paywall')}
              activeOpacity={0.8}
            >
              <Ionicons name="star" size={24} color="#FFB800" style={styles.proStarIcon} />
              <View style={styles.proCardContent}>
                <Text style={styles.proCardTitle}>PRO Upgrade</Text>
                <Text style={styles.proCardSubtitle}>Unlock Unlimited Scans & Premium Database</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#666" />
              </TouchableOpacity>
            )}

          {/* Lure of the Day Card */}
          <View style={styles.lureOfDayCard}>
            <Text style={styles.lureOfDayTitle}>Lure of the Day</Text>
            <Text style={styles.lureOfDayName}>{lureOfTheDay.name}</Text>
            <Text style={styles.lureOfDayTip}>{lureOfTheDay.tip}</Text>
      </View>

          {/* Action Buttons */}
        {!selectedImage ? (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4A90E2', '#357ABD']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="images" size={24} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Choose from Gallery</Text>
                </LinearGradient>
            </TouchableOpacity>

              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={takePicture}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4A90E2', '#357ABD']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="camera" size={24} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Take Photo</Text>
                </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage.uri }} style={styles.image} />
            <View style={styles.imageActions}>
                <TouchableOpacity 
                  style={styles.secondaryButton} 
                  onPress={resetSelection}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={20} color="#4A90E2" />
                  <Text style={styles.secondaryButtonText}>Change Image</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                  style={styles.analyzeButton} 
                onPress={analyzeImage}
                disabled={isAnalyzing}
                  activeOpacity={0.8}
              >
                {isAnalyzing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                    <>
                      <Ionicons name="search" size={20} color="#FFFFFF" />
                      <Text style={styles.analyzeButtonText}>Analyze Lure</Text>
                    </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

          {/* Analysis Results */}
      {analysisResult && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>Analysis Results</Text>
          
          <View style={styles.resultCard}>
            <Text style={styles.lureType}>{analysisResult.lure_type}</Text>
            <Text style={styles.confidence}>Confidence: {analysisResult.confidence}%</Text>
          </View>

          {analysisResult.chatgpt_analysis && (
            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>🧠 AI Analysis</Text>
              <Text style={styles.detailsText}>
                <Text style={styles.bold}>Target Species:</Text> {analysisResult.chatgpt_analysis.target_species?.join(', ') || 'Unknown'}
              </Text>
              <Text style={styles.detailsText}>
                <Text style={styles.bold}>Reasoning:</Text> {analysisResult.chatgpt_analysis.reasoning || 'No reasoning provided'}
              </Text>
            </View>
          )}

          {analysisResult.lure_details && (
            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>🎣 Fishing Tips</Text>
              <Text style={styles.detailsText}>
                <Text style={styles.bold}>Description:</Text> {analysisResult.lure_details.description || 'No description available'}
              </Text>
              <Text style={styles.detailsText}>
                <Text style={styles.bold}>Best Conditions:</Text> {analysisResult.lure_details.best_conditions?.water_clarity?.join(', ') || 'Any'}
              </Text>
              <Text style={styles.detailsText}>
                <Text style={styles.bold}>Retrieve Styles:</Text> {analysisResult.lure_details.retrieve_styles?.join(', ') || 'Standard retrieve'}
              </Text>
            </View>
          )}

          <TouchableOpacity 
            style={styles.scanNextButton} 
            onPress={resetSelection}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4A90E2', '#357ABD']}
                  style={styles.scanNextGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
          >
                  <Ionicons name="camera" size={24} color="#FFFFFF" />
                  <Text style={styles.scanNextButtonText}>Scan Next Lure</Text>
                </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
      </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E3F2FD',
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  appIcon: {
    width: 80,
    height: 80,
    marginBottom: 16,
    borderRadius: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#5C6BC0',
    textAlign: 'center',
    fontWeight: '500',
  },
  proCard: {
    backgroundColor: '#FFF7E6',
    borderRadius: 22,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  proStarIcon: {
    marginRight: 12,
  },
  proCardContent: {
    flex: 1,
  },
  proCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 4,
  },
  proCardSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  lureOfDayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lureOfDayTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C6BC0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  lureOfDayName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 8,
  },
  lureOfDayTip: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  actionButtonsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  primaryButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  imageContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  image: {
    width: width - 40,
    height: width - 40,
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: '#F5F5F5',
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderRadius: 18,
    paddingVertical: 16,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
  analyzeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27AE60',
    borderRadius: 18,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lureType: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 8,
  },
  confidence: {
    fontSize: 16,
    color: '#27AE60',
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 12,
  },
  detailsText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 10,
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold',
    color: '#1A237E',
  },
  scanNextButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  scanNextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  scanNextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
