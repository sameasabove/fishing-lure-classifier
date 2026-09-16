import React, { useEffect, useState } from 'react';
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
import * as AppleAuthentication from 'expo-apple-authentication';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { classifyAuthError, formatAuthError } from '../services/authErrors';
import {
  isAppleSignInAvailable,
  isGoogleSignInConfigured,
} from '../services/socialAuthService';

export default function SignupScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [appleAvailable, setAppleAvailable] = useState(false);
  const { signUp, signInWithApple, signInWithGoogle } = useAuth();
  const googleConfigured = isGoogleSignInConfigured();

  useEffect(() => {
    isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  const clearError = () => setErrorMessage('');

  const busy = isLoading || !!socialLoading;

  const handleSignup = async () => {
    setErrorMessage('');

    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email.trim(), password, fullName.trim());
      navigation.navigate('CheckEmail', { email: email.trim() });
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setErrorMessage(formatAuthError(error, 'Signup failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApple = async () => {
    if (busy) return;
    setErrorMessage('');
    setSocialLoading('apple');
    try {
      await signInWithApple();
    } catch (error) {
      if (classifyAuthError(error).code !== 'cancelled') {
        setErrorMessage(formatAuthError(error, 'Apple Sign-In failed. Please try again.'));
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleGoogle = async () => {
    setErrorMessage('');
    setSocialLoading('google');
    try {
      await signInWithGoogle();
    } catch (error) {
      if (classifyAuthError(error).code !== 'cancelled') {
        setErrorMessage(formatAuthError(error, 'Google Sign-In failed. Please try again.'));
      }
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <LinearGradient colors={['#e8f5e9', '#c8e6c9', '#a5d6a7']} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>My Tackle Box</Text>
            <Text style={styles.subtitle}>Continue with Apple or Google — or email</Text>
          </View>

          <View style={styles.form}>
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {(appleAvailable || googleConfigured) && (
              <View style={styles.socialBlock}>
                {appleAvailable ? (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={10}
                    style={[styles.appleButton, busy && styles.buttonDisabled]}
                    onPress={handleApple}
                  />
                ) : null}

                {googleConfigured ? (
                  <TouchableOpacity
                    style={[styles.googleButton, busy && styles.buttonDisabled]}
                    onPress={handleGoogle}
                    disabled={busy}
                  >
                    {socialLoading === 'google' ? (
                      <ActivityIndicator color="#333" />
                    ) : (
                      <>
                        <Ionicons
                          name="logo-google"
                          size={20}
                          color="#4285F4"
                          style={styles.googleIcon}
                        />
                        <Text style={styles.googleText}>Continue with Google</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : null}

                <Text style={styles.socialHint}>
                  New or returning — one tap signs you in. We’ll create your account if you’re new.
                </Text>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or continue with email</Text>
                  <View style={styles.dividerLine} />
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, errorMessage && styles.inputError]}
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  clearError();
                }}
                placeholder="John Doe"
                placeholderTextColor="#9e9e9e"
                autoCapitalize="words"
                textContentType="name"
                autoComplete="name"
                editable={!busy}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errorMessage && styles.inputError]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  clearError();
                }}
                placeholder="your@email.com"
                placeholderTextColor="#9e9e9e"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
                autoComplete="email"
                importantForAutofill="yes"
                editable={!busy}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, errorMessage && styles.inputError]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  clearError();
                }}
                placeholder="Minimum 6 characters"
                placeholderTextColor="#9e9e9e"
                secureTextEntry
                autoCapitalize="none"
                textContentType="newPassword"
                autoComplete="new-password"
                importantForAutofill="yes"
                passwordRules="minlength: 6;"
                editable={!busy}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={[styles.input, errorMessage && styles.inputError]}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  clearError();
                }}
                placeholder="Re-enter password"
                placeholderTextColor="#9e9e9e"
                secureTextEntry
                autoCapitalize="none"
                textContentType="newPassword"
                autoComplete="new-password"
                importantForAutofill="yes"
                editable={!busy}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, busy && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={busy}
            >
              <LinearGradient
                colors={busy ? ['#bdc3c7', '#95a5a6'] : ['#2e7d32', '#388e3c']}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>Sign In</Text>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
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
  logo: {
    width: 90,
    height: 90,
    borderRadius: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1b5e20',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4caf50',
    textAlign: 'center',
    fontWeight: '500',
  },
  form: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  socialBlock: { marginBottom: 8 },
  appleButton: { width: '100%', height: 48, marginBottom: 12 },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#dadce0',
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  googleIcon: { marginRight: 10 },
  googleText: { fontSize: 16, fontWeight: '600', color: '#3c4043' },
  socialHint: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 17,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
  dividerText: { marginHorizontal: 10, fontSize: 13, color: '#888' },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#212121',
  },
  inputError: {
    borderColor: '#f44336',
    backgroundColor: '#ffebee',
  },
  button: {
    borderRadius: 10,
    marginTop: 10,
    overflow: 'hidden',
  },
  buttonGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    fontSize: 14,
    color: '#616161',
  },
  link: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
});
