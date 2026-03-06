/**
 * Paywall Screen
 * Beautiful upgrade screen for PRO subscription
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import {
  getSubscriptionPackages,
  purchaseSubscription,
  restorePurchases,
} from '../services/subscriptionService';

const { width } = Dimensions.get('window');

export default function PaywallScreen({ navigation, route }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  
  // Get message from navigation params (if any)
  const customMessage = route?.params?.message;
  
  useEffect(() => {
    loadPackages();
  }, []);
  
  const loadPackages = async () => {
    setLoading(true);
    const result = await getSubscriptionPackages();
    
    if (result.success && result.packages.length > 0) {
      setPackages(result.packages);
      // Auto-select the annual package (best value)
      const annualPkg = result.packages.find(pkg => 
        pkg.packageType === 'ANNUAL' || pkg.identifier.includes('annual') || pkg.identifier.includes('yearly')
      );
      setSelectedPackage(annualPkg || result.packages[0]);
      
      // Show warning if using fallback packages (RevenueCat not configured)
      if (result.isFallback && __DEV__) {
        console.warn('[Paywall] Using fallback packages - RevenueCat not configured or no offerings available');
      }
    } else {
      Alert.alert(
        'Subscription Packages Unavailable',
        result.error || 'Could not load subscription packages. Please try again later or contact support.',
        [{ text: 'OK' }]
      );
    }
    
    setLoading(false);
  };
  
  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    setPurchasing(true);
    const result = await purchaseSubscription(selectedPackage);
    setPurchasing(false);
    
    if (result.success) {
      Alert.alert(
        '🎣 Welcome to PRO!',
        'You now have unlimited lure scans and all PRO features!',
        [{ text: 'Start Scanning!', onPress: () => navigation.goBack() }]
      );
    } else if (result.cancelled) {
      // User cancelled - don't show error
      return;
    } else if (result.needsConfiguration) {
      Alert.alert(
        'Configuration Required',
        result.error || 'Subscription packages need to be configured. Please contact support or try again later.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Purchase Failed',
        result.error || 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };
  
  const handleRestore = async () => {
    setPurchasing(true);
    const result = await restorePurchases();
    setPurchasing(false);
    
    if (result.success && result.isPro) {
      Alert.alert(
        '✓ Purchases Restored',
        result.message,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else if (result.success) {
      Alert.alert('No Purchases Found', result.message);
    } else {
      Alert.alert('Restore Failed', result.error || 'Could not restore purchases.');
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading subscription options...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🎣</Text>
          <Text style={styles.title}>Upgrade to PRO</Text>
          {customMessage ? (
            <Text style={styles.customMessage}>{customMessage}</Text>
          ) : (
            <Text style={styles.subtitle}>
              Unlimited lure scans & advanced features
            </Text>
          )}
        </View>
        
        {/* Features List */}
        <View style={styles.features}>
          <Feature 
            icon="✓" 
            text="Unlimited lure scans" 
            highlight={true}
          />
          <Feature 
            icon="📸" 
            text="Catches tracking with photos" 
          />
          <Feature 
            icon="🎯" 
            text="Advanced lure recommendations" 
          />
          <Feature 
            icon="🌊" 
            text="Water condition matching" 
          />
          <Feature 
            icon="📅" 
            text="Seasonal fishing suggestions" 
          />
          <Feature 
            icon="💾" 
            text="Export your tackle box data" 
          />
          <Feature 
            icon="⚡" 
            text="Priority support" 
          />
          <Feature 
            icon="🆕" 
            text="Early access to new features" 
          />
        </View>
        
        {/* Subscription Packages */}
        <View style={styles.packagesContainer}>
          <Text style={styles.packagesTitle}>Choose Your Plan</Text>
          <Text style={styles.packagesSubtitle}>Monthly or annual only — prices shown below</Text>
          
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.identifier}
              package={pkg}
              isSelected={selectedPackage?.identifier === pkg.identifier}
              onPress={() => setSelectedPackage(pkg)}
            />
          ))}
        </View>
        
        {/* Purchase Button */}
        <TouchableOpacity
          style={[styles.purchaseButton, purchasing && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={purchasing || !selectedPackage}
        >
          {purchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.purchaseButtonText}>
              Subscribe Now
            </Text>
          )}
        </TouchableOpacity>
        
        {/* Restore & Close Buttons */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity onPress={handleRestore} disabled={purchasing}>
            <Text style={styles.restoreButton}>Restore Purchases</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigation.goBack()} disabled={purchasing}>
            <Text style={styles.closeButton}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
        
        {/* Terms */}
        <Text style={styles.terms}>
          Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period.
          Payment will be charged to your App Store/Google Play account.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

const Feature = ({ icon, text, highlight }) => (
  <View style={styles.feature}>
    <Text style={[styles.featureIcon, highlight && styles.featureIconHighlight]}>
      {icon}
    </Text>
    <Text style={[styles.featureText, highlight && styles.featureTextHighlight]}>
      {text}
    </Text>
  </View>
);

const PackageCard = ({ package: pkg, isSelected, onPress }) => {
  // Determine if this is the best value
  const isBestValue = pkg.packageType === 'ANNUAL' || 
                      pkg.identifier.includes('annual') ||
                      pkg.identifier.includes('yearly');
  
  // Get package details
  const product = pkg.product;
  const title = getPackageTitle(pkg);
  const savings = getPackageSavings(pkg);
  
  return (
    <TouchableOpacity
      style={[
        styles.packageCard,
        isSelected && styles.packageCardSelected,
        isBestValue && styles.packageCardBestValue,
      ]}
      onPress={onPress}
    >
      {isBestValue && (
        <View style={styles.bestValueBadge}>
          <Text style={styles.bestValueText}>BEST VALUE</Text>
        </View>
      )}
      
      <View style={styles.packageHeader}>
        <View style={styles.packageTitleContainer}>
          <Text style={[
            styles.packageTitle,
            isSelected && styles.packageTitleSelected
          ]}>
            {title}
          </Text>
          {savings && (
            <Text style={styles.packageSavings}>{savings}</Text>
          )}
        </View>
        
        <Text style={[
          styles.packagePrice,
          isSelected && styles.packagePriceSelected
        ]}>
          {product.priceString}
        </Text>
      </View>
      
      <Text style={styles.packageDescription}>
        {getPackageDescription(pkg)}
      </Text>
      
      {/* Selection indicator */}
      <View style={styles.radioContainer}>
        <View style={[
          styles.radioOuter,
          isSelected && styles.radioOuterSelected
        ]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getPackageTitle = (pkg) => {
  const id = pkg.identifier.toLowerCase();
  if (id.includes('annual') || id.includes('yearly')) return 'Annual';
  if (id.includes('month')) return 'Monthly';
  return pkg.product.title;
};

const getPackageDescription = (pkg) => {
  const id = pkg.identifier.toLowerCase();
  if (id.includes('annual') || id.includes('yearly')) return 'Billed once per year';
  if (id.includes('month')) return 'Billed monthly';
  return pkg.product.description;
};

const getPackageSavings = (pkg) => {
  const id = pkg.identifier.toLowerCase();
  if (id.includes('annual') || id.includes('yearly')) return 'Save 33%';
  return null;
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
  },
  customMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#FF6B6B',
    marginTop: 8,
    fontWeight: '600',
  },
  
  // Features
  features: {
    marginBottom: 30,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  featureIconHighlight: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  featureTextHighlight: {
    fontWeight: '600',
    fontSize: 17,
  },
  
  // Packages
  packagesContainer: {
    marginBottom: 24,
  },
  packagesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  packagesSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  packageCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  packageCardSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  packageCardBestValue: {
    borderColor: '#FFD700',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  packageTitleContainer: {
    flex: 1,
  },
  packageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  packageTitleSelected: {
    color: '#2196F3',
  },
  packageSavings: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
  },
  packagePrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  packagePriceSelected: {
    color: '#2196F3',
  },
  packageDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  radioContainer: {
    alignItems: 'flex-end',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#2196F3',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2196F3',
  },
  
  // Purchase Button
  purchaseButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // Bottom Buttons
  bottomButtons: {
    alignItems: 'center',
    marginBottom: 20,
  },
  restoreButton: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
    marginBottom: 16,
  },
  closeButton: {
    fontSize: 16,
    color: '#999',
  },
  
  // Terms
  terms: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
});

