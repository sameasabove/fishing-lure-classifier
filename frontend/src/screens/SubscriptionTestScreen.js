/**
 * Subscription Test Screen (Dev Only)
 * Force every possible subscription failure scenario for testing.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  setSubscriptionTestOverride,
  clearSubscriptionTestOverrides,
  getSubscriptionTestOverrides,
  diagnoseSubscriptions,
  getSubscriptionPackages,
  restorePurchases,
  getQuotaStatus,
  getSubscriptionInfo,
} from '../services/subscriptionService';

const OVERRIDES = [
  { key: 'FORCE_FREE_TIER', label: 'Force free tier', where: 'Treat as free user (10 scans/month) even if PRO' },
  { key: 'NOT_CONFIGURED', label: 'Not configured', where: 'Paywall loads fallback packages' },
  { key: 'NO_OFFERINGS', label: 'No offerings', where: 'Paywall loads fallback packages' },
  { key: 'PACKAGES_ERROR', label: 'Packages error', where: 'Paywall shows "Could not load packages"' },
  { key: 'PURCHASE_CANCELLED', label: 'Purchase cancelled', where: 'Subscribe → simulated cancel' },
  { key: 'PURCHASE_FAIL', label: 'Purchase fail', where: 'Subscribe → simulated error' },
  { key: 'RESTORE_NO_PURCHASES', label: 'Restore – no purchases', where: 'Restore → "No purchases"' },
  { key: 'RESTORE_FAIL', label: 'Restore fail', where: 'Restore → simulated error' },
  { key: 'QUOTA_EXCEEDED', label: 'Quota exceeded', where: 'Home quota + scan → paywall' },
  { key: 'QUOTA_CHECK_FAIL', label: 'Quota check fail', where: 'Home quota fallback; scan may fail' },
  { key: 'STATUS_FAIL', label: 'Status fail', where: 'Settings subscription + getSubscriptionStatus' },
];

export default function SubscriptionTestScreen() {
  const [overrides, setOverrides] = useState(getSubscriptionTestOverrides());
  const navigation = useNavigation();

  const refreshOverrides = useCallback(() => {
    setOverrides(getSubscriptionTestOverrides());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshOverrides();
    }, [refreshOverrides])
  );

  const toggleOverride = (key, value) => {
    setSubscriptionTestOverride(key, value);
    refreshOverrides();
  };

  const clearAll = () => {
    clearSubscriptionTestOverrides();
    refreshOverrides();
    Alert.alert('Cleared', 'All test overrides have been cleared.');
  };

  const runDiagnostics = async () => {
    const d = await diagnoseSubscriptions();
    Alert.alert(
      'Diagnostics',
      `Configured: ${d.status?.configured ? '✅' : '❌'}\n` +
        `Offerings: ${d.status?.hasOfferings ? '✅' : '❌'} (${d.status?.packageCount ?? 0} packages)\n` +
        `Is PRO: ${d.status?.isPro ? 'Yes' : 'No'}\n` +
        `Issues: ${d.issues?.length ? d.issues.join('; ') : 'None'}`,
      [{ text: 'OK' }]
    );
  };

  const testPackages = async () => {
    const r = await getSubscriptionPackages();
    Alert.alert(
      'getSubscriptionPackages',
      r.success
        ? `Success, ${r.packages?.length ?? 0} packages${r.isFallback ? ' (fallback)' : ''}`
        : `Error: ${r.error}`,
      [{ text: 'OK' }]
    );
  };

  const testRestore = async () => {
    const r = await restorePurchases();
    Alert.alert(
      'restorePurchases',
      r.success
        ? (r.isPro ? 'PRO restored!' : r.message)
        : `Error: ${r.error}`,
      [{ text: 'OK' }]
    );
  };

  const testQuota = async () => {
    try {
      const q = await getQuotaStatus();
      Alert.alert(
        'getQuotaStatus',
        `Remaining: ${q.remaining}/${q.limit}\nMessage: ${q.message}`,
        [{ text: 'OK' }]
      );
    } catch (e) {
      Alert.alert('getQuotaStatus', `Error: ${e.message}`);
    }
  };

  const testSubscriptionInfo = async () => {
    try {
      const i = await getSubscriptionInfo(true);
      Alert.alert(
        'getSubscriptionInfo',
        `isPro: ${i.isPro}\nTitle: ${i.title}\nDescription: ${i.description}`,
        [{ text: 'OK' }]
      );
    } catch (e) {
      Alert.alert('getSubscriptionInfo', `Error: ${e.message}`);
    }
  };

  if (!__DEV__) {
    return (
      <View style={styles.container}>
        <Text style={styles.disabled}>This screen is only available in development.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Subscription Test (Dev Only)</Text>
      <Text style={styles.subtitle}>
        Turn on overrides to force specific failures. Then use the app normally to verify error handling.
      </Text>

      <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
        <Text style={styles.clearButtonText}>Clear all overrides</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Force failure</Text>
      {OVERRIDES.map(({ key, label, where }) => (
        <View key={key} style={styles.row}>
          <View style={styles.rowLeft}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.where}>{where}</Text>
          </View>
          <Switch
            value={!!overrides[key]}
            onValueChange={(v) => toggleOverride(key, v)}
            trackColor={{ false: '#ccc', true: '#2196F3' }}
            thumbColor="#fff"
          />
        </View>
      ))}

      <Text style={styles.sectionTitle}>Quick tests</Text>
      <TouchableOpacity style={styles.quickButton} onPress={runDiagnostics}>
        <Text style={styles.quickButtonText}>Run diagnostics</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickButton} onPress={testPackages}>
        <Text style={styles.quickButtonText}>Test getSubscriptionPackages</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickButton} onPress={testRestore}>
        <Text style={styles.quickButtonText}>Test restorePurchases</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickButton} onPress={testQuota}>
        <Text style={styles.quickButtonText}>Test getQuotaStatus</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickButton} onPress={testSubscriptionInfo}>
        <Text style={styles.quickButtonText}>Test getSubscriptionInfo</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate('Paywall')}
      >
        <Text style={styles.navButtonText}>Open Paywall</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.getParent()?.getParent()?.navigate('Home')}
      >
        <Text style={styles.navButtonText}>Go to Home (scan / quota)</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate('SettingsMain')}
      >
        <Text style={styles.navButtonText}>Go to Settings (subscription)</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Checklist</Text>
      <Text style={styles.checklist}>
        • FORCE_FREE_TIER: Home → shows quota (10 scans); Settings → shows Free Plan{'\n'}
        • NOT_CONFIGURED / NO_OFFERINGS: Open Paywall → see fallback packages{'\n'}
        • PACKAGES_ERROR: Open Paywall → see "Could not load packages" alert{'\n'}
        • PURCHASE_CANCELLED: Paywall → Subscribe → no error (cancelled){'\n'}
        • PURCHASE_FAIL: Paywall → Subscribe → "Purchase Failed" alert{'\n'}
        • RESTORE_*: Paywall → Restore → corresponding message{'\n'}
        • QUOTA_EXCEEDED: Home → quota "0 remaining"; try scan → paywall{'\n'}
        • QUOTA_CHECK_FAIL: Home → quota fallback; scan may error{'\n'}
        • STATUS_FAIL: Settings → subscription load fails / fallback
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16, lineHeight: 20 },
  disabled: { fontSize: 16, color: '#999', textAlign: 'center', margin: 24 },
  clearButton: {
    backgroundColor: '#e74c3c',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  clearButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#333' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  rowLeft: { flex: 1, marginRight: 12 },
  label: { fontSize: 16, fontWeight: '500', color: '#333' },
  where: { fontSize: 12, color: '#666', marginTop: 2 },
  quickButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  quickButtonText: { color: '#fff', fontWeight: '600' },
  navButton: {
    backgroundColor: '#9b59b6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  navButtonText: { color: '#fff', fontWeight: '600' },
  checklist: {
    fontSize: 13,
    color: '#555',
    lineHeight: 22,
  },
});
