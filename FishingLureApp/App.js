import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import contexts
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import TackleBoxScreen from './src/screens/TackleBoxScreen';
import MapScreen from './src/screens/MapScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LureDetailScreen from './src/screens/LureDetailScreen';
import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import SignupScreen from './src/screens/SignupScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import SubscriptionTestScreen from './src/screens/SubscriptionTestScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();
const HomeStack = createStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name="Paywall" 
        component={PaywallScreen} 
        options={{ 
          title: 'Upgrade to PRO',
          presentation: 'modal'
        }}
      />
    </HomeStack.Navigator>
  );
}

function TackleBoxStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="TackleBoxList" 
        component={TackleBoxScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="LureDetail" 
        component={LureDetailScreen} 
        options={{ title: '🎣 Lure Details' }}
      />
      <Stack.Screen 
        name="Paywall" 
        component={PaywallScreen} 
        options={{ 
          title: 'Upgrade to PRO',
          presentation: 'modal'
        }}
      />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="SettingsMain" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }}
      />
      <Stack.Screen 
        name="Paywall" 
        component={PaywallScreen} 
        options={{ 
          title: 'Upgrade to PRO',
          presentation: 'modal'
        }}
      />
      {__DEV__ && (
        <Stack.Screen 
          name="SubscriptionTest" 
          component={SubscriptionTestScreen} 
          options={{ title: 'Subscription Test (Dev)' }}
        />
      )}
    </Stack.Navigator>
  );
}

// Authentication screens stack
function AuthStackScreen() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

// Main app tabs
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'TackleBox') {
            iconName = focused ? 'fish' : 'fish-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={28} color={color} />;
        },
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: '#95A5A6',
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 4,
        },
        tabBarStyle: {
          height: 80,
          paddingBottom: 8,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          backgroundColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 4,
        },
        headerTintColor: '#1A237E',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackScreen} 
        options={{ 
          title: 'Lure Analyzer',
          headerShown: false,
          tabBarLabel: 'Lure Analyzer',
        }}
      />
      <Tab.Screen 
        name="TackleBox" 
        component={TackleBoxStack} 
        options={{ 
          title: 'My Tackle Box',
          tabBarLabel: 'Tackle Box',
        }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ 
          title: 'Fishing Map',
          tabBarLabel: 'Map',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsStack} 
        options={{ 
          title: 'Settings',
          tabBarLabel: 'Settings',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

// Root navigation with authentication check
function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return user ? <MainTabNavigator /> : <AuthStackScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
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
});