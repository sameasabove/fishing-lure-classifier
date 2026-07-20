import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { resendConfirmationEmail } from '../services/supabaseService';
import { formatAuthError } from '../services/authErrors';

/**
 * Shown after signup — tells users to confirm email (inbox + spam) and allows resend.
 */
export default function CheckEmailScreen({ navigation, route }) {
  const email = route?.params?.email || '';
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleResend = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'Missing email. Go back and sign up again.' });
      return;
    }
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await resendConfirmationEmail(email);
      setMessage({
        type: 'success',
        text: 'Confirmation email sent again. Check inbox and spam, then open the link in Safari or Chrome.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: formatAuthError(error, 'Could not resend email. Try again in a minute.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#e8f5e9', '#c8e6c9', '#a5d6a7']} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.subtitle}>
              We sent a confirmation link{email ? ` to ${email}` : ''}. Tap it to activate your account.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.step}>1. Open your inbox (and Spam / Junk)</Text>
            <Text style={styles.step}>2. Find the email from My Tackle Box</Text>
            <Text style={styles.step}>3. Tap “Confirm my account”</Text>
            <Text style={styles.step}>4. Open the link in Safari or Chrome if needed</Text>
            <Text style={styles.hint}>
              The link can land in spam the first time. After you confirm, return here and sign in.
            </Text>

            {message.text ? (
              <View
                style={[
                  styles.messageBox,
                  message.type === 'success' ? styles.messageSuccess : styles.messageError,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.type === 'success' ? styles.messageTextSuccess : styles.messageTextError,
                  ]}
                >
                  {message.text}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleResend}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#bdc3c7', '#95a5a6'] : ['#2e7d32', '#388e3c']}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Resend confirmation email</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>I've confirmed — Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 24 },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: { width: 56, height: 56, borderRadius: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1b5e20', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#4caf50', textAlign: 'center', paddingHorizontal: 12, lineHeight: 22 },
  card: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  step: { fontSize: 15, color: '#333', marginBottom: 10, lineHeight: 22 },
  hint: { fontSize: 13, color: '#666', marginTop: 8, marginBottom: 20, lineHeight: 20 },
  messageBox: { padding: 12, borderRadius: 8, marginBottom: 16, borderLeftWidth: 4 },
  messageSuccess: { backgroundColor: '#e8f5e9', borderLeftColor: '#4caf50' },
  messageError: { backgroundColor: '#ffebee', borderLeftColor: '#f44336' },
  messageText: { fontSize: 14, fontWeight: '500' },
  messageTextSuccess: { color: '#2e7d32' },
  messageTextError: { color: '#c62828' },
  button: { borderRadius: 10, overflow: 'hidden', marginTop: 4 },
  buttonGradient: { padding: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkBtn: { marginTop: 18, alignItems: 'center' },
  linkText: { fontSize: 15, color: '#2e7d32', fontWeight: '700' },
});
