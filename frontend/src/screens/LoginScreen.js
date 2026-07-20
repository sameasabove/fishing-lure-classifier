import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { classifyAuthError } from '../services/authErrors';
import { resendConfirmationEmail } from '../services/supabaseService';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [resendInfo, setResendInfo] = useState('');
  const { signIn } = useAuth();

  const showError = (error) => {
    const { code, message } = classifyAuthError(error);
    setErrorCode(code);
    setErrorMessage(message);
    setResendInfo('');
  };

  const handleLogin = async () => {
    setErrorMessage('');
    setErrorCode('');
    setResendInfo('');

    if (!email || !password) {
      setErrorMessage('Please enter both email and password');
      setErrorCode('validation');
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email.trim(), password);
      setPassword('');
    } catch (error) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      setResendInfo('Enter your email above, then tap Resend.');
      return;
    }
    setIsLoading(true);
    setResendInfo('');
    try {
      await resendConfirmationEmail(email.trim());
      setResendInfo('Confirmation email sent. Check inbox and spam, then open the link in Safari or Chrome.');
    } catch (error) {
      showError(error);
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
            <Text style={styles.title}>My Tackle Box</Text>
            <Text style={styles.subtitle}>Sign in to access your tackle box</Text>
          </View>

          <View style={styles.form}>
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
                {errorCode === 'invalid_credentials' ? (
                  <View style={styles.errorActions}>
                    <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                      <Text style={styles.errorAction}>Create account</Text>
                    </TouchableOpacity>
                    <Text style={styles.errorDot}>·</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                      <Text style={styles.errorAction}>Forgot password</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
                {errorCode === 'email_not_confirmed' ? (
                  <TouchableOpacity onPress={handleResendConfirmation} style={styles.resendBtn}>
                    <Text style={styles.errorAction}>Resend confirmation email</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            {resendInfo ? (
              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>{resendInfo}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errorMessage && styles.inputError]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrorMessage('');
                  setErrorCode('');
                }}
                placeholder="your@email.com"
                placeholderTextColor="#9e9e9e"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, errorMessage && styles.inputError]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrorMessage('');
                  setErrorCode('');
                }}
                placeholder="Enter your password"
                placeholderTextColor="#9e9e9e"
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#bdc3c7', '#95a5a6'] : ['#2e7d32', '#388e3c']}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotLink}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotLinkText}>Forgot password?</Text>
            </TouchableOpacity>

            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.link}>Sign Up</Text>
              </TouchableOpacity>
            </View>
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
  header: { alignItems: 'center', marginBottom: 28 },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logo: { width: 90, height: 90, borderRadius: 20 },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1b5e20',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: { fontSize: 16, color: '#4caf50', textAlign: 'center', fontWeight: '500' },
  form: {
    backgroundColor: '#fff',
    padding: 28,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: { color: '#c62828', fontSize: 14, fontWeight: '500' },
  errorActions: { flexDirection: 'row', alignItems: 'center', marginTop: 10, flexWrap: 'wrap' },
  errorAction: { color: '#2e7d32', fontSize: 14, fontWeight: '700' },
  errorDot: { marginHorizontal: 8, color: '#999' },
  resendBtn: { marginTop: 10 },
  infoContainer: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  infoText: { color: '#2e7d32', fontSize: 14, fontWeight: '500' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#2e7d32', marginBottom: 8 },
  input: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#212121',
  },
  inputError: { borderColor: '#f44336', backgroundColor: '#ffebee' },
  button: { borderRadius: 10, marginTop: 10, overflow: 'hidden' },
  buttonGradient: { padding: 16, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  forgotLink: { alignSelf: 'center', marginTop: 12 },
  forgotLinkText: { fontSize: 14, color: '#2e7d32', fontWeight: '600' },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: { fontSize: 14, color: '#616161' },
  link: { fontSize: 14, color: '#2e7d32', fontWeight: 'bold' },
});
