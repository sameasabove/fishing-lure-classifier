import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { performAccountDeletion } from '../services/accountDeletionService';

export default function AccountScreen() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const confirmDelete = () => {
    Alert.alert(
      'Delete Account?',
      'This permanently deletes your account, profile, catches, saved spots, preferences, and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: runDeletion,
        },
      ],
      { cancelable: true }
    );
  };

  const runDeletion = async () => {
    setBusy(true);
    try {
      await performAccountDeletion();
    } catch (e) {
      const msg = e?.message || 'Something went wrong. Please try again or contact support.';
      const hint = e?.hint;
      Alert.alert(
        'Could not delete account',
        hint ? `${msg}\n\n${hint}` : msg
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        Manage your sign-in and remove all cloud data tied to this app.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.email}>{user?.email || '—'}</Text>
      </View>

      <View style={styles.reviewBox}>
        <Text style={styles.reviewTitle}>App Review</Text>
        <Text style={styles.reviewBody}>
          Account deletion: open the <Text style={styles.bold}>Profile</Text> tab (bottom navigation) →
          you land on <Text style={styles.bold}>Settings</Text> → tap <Text style={styles.bold}>Account & data</Text> →
          on this <Text style={styles.bold}>Account</Text> screen, tap <Text style={styles.bold}>Delete Account</Text> →
          confirm with <Text style={styles.bold}>Permanently Delete</Text>. Use the demo credentials in{' '}
          <Text style={styles.mono}>APPLE_REVIEW_NOTES.md</Text> supplied with the submission.
        </Text>
      </View>

      <Text style={styles.warning}>
        Deleting your account removes your Supabase auth user, tackle box analyses, catch photos
        stored in the cloud, subscription sync row, and profile. Local data on this device is
        cleared as part of the same flow.
      </Text>

      <TouchableOpacity
        style={[styles.deleteButton, busy && styles.deleteButtonDisabled]}
        onPress={confirmDelete}
        disabled={busy}
        activeOpacity={0.85}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  lead: {
    fontSize: 15,
    color: '#34495e',
    lineHeight: 22,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  label: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
  },
  reviewBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  reviewTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 8,
  },
  reviewBody: {
    fontSize: 13,
    color: '#1A237E',
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  warning: {
    fontSize: 14,
    color: '#c0392b',
    lineHeight: 21,
    marginBottom: 20,
  },
  deleteButton: {
    backgroundColor: '#c0392b',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.7,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
