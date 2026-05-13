import axios from 'axios';
import { supabase } from '../config/supabase';
import { Platform } from 'react-native';
import { CONFIG } from '../core/config';

export const BACKEND_URL = CONFIG.backend.url;

// Helper to get current user ID
const getCurrentUserId = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    return null;
  }
};

// Input validation helper
const validateImageUri = (imageUri) => {
  if (!imageUri || typeof imageUri !== 'string') {
    throw new Error('Invalid image URI provided');
  }
  
  // Basic URI validation
  if (!imageUri.startsWith('file://') && !imageUri.startsWith('content://') && !imageUri.startsWith('data:')) {
    throw new Error('Invalid image URI format');
  }
  
  return true;
};

export const analyzeLureWithBackend = async (imageUri) => {
  try {
    // Validate input
    validateImageUri(imageUri);
    
    // Get current user ID
    const userId = await getCurrentUserId();
    
    if (__DEV__) {
      console.log('[BackendService] Starting analysis, userId:', userId ? 'present' : 'missing');
    }
    
    // Create FormData for file upload
    const formData = new FormData();
    
    // Convert image URI to blob for upload
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Create file object
    const filename = `lure_${Date.now()}.jpg`;
    const file = {
      uri: imageUri,
      type: 'image/jpeg',
      name: filename,
    };
    
    formData.append('file', file);
    
    // Add user_id if available
    if (userId) {
      formData.append('user_id', userId);
    }

    // Make request to Flask backend
    const apiResponse = await axios.post(`${BACKEND_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(userId && { 'X-User-ID': userId }), // Include user ID in headers
      },
      timeout: 120000, // 2 minute timeout (OpenAI can be slow sometimes)
    });

    return apiResponse.data;

  } catch (error) {
    // Enhanced error logging in development mode
    if (__DEV__) {
      console.error('[BackendService] Analysis error:', error);
      if (error.response) {
        console.error('[BackendService] Response status:', error.response.status);
        console.error('[BackendService] Response data:', error.response.data);
      }
      if (error.request) {
        console.error('[BackendService] Request made but no response:', error.request);
      }
    }
    
    // Network errors
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error') || error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to server. Please make sure your Flask server is running at ' + BACKEND_URL);
    }
    
    // Timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('Request timed out. The server may be busy. Please try again.');
    }
    
    // HTTP response errors
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const message = data?.message || data?.error || 'Server error occurred';
      
      // Handle authentication required (401)
      if (status === 401) {
        throw new Error('Please sign in to use the lure analyzer.');
      }
      
      // Handle quota exceeded (403) - this should trigger paywall
      if (status === 403 && (data?.error === 'quota_exceeded' || message.includes('quota'))) {
        const quotaError = new Error(data.message || message);
        quotaError.code = 'QUOTA_EXCEEDED';
        quotaError.quota = data.quota;
        throw quotaError;
      }
      
      // Handle service unavailable (503) - quota check failed or Supabase down
      if (status === 503) {
        throw new Error(message || 'Service temporarily unavailable. Please try again later.');
      }
      
      // Handle server errors (500)
      if (status === 500) {
        throw new Error('Server error occurred. Please try again or contact support.');
      }
      
      // Other HTTP errors
      throw new Error(message || `Server Error (${status}). Please try again.`);
    }
    
    // Generic error fallback
    throw new Error(error.message || 'Failed to analyze lure. Please check your connection and try again.');
  }
};

export const estimateCostWithBackend = async (imageUri) => {
  try {
    const formData = new FormData();
    
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    const filename = `lure_${Date.now()}.jpg`;
    const file = {
      uri: imageUri,
      type: 'image/jpeg',
      name: filename,
    };
    
    formData.append('file', file);

    const apiResponse = await axios.post(`${BACKEND_URL}/estimate-cost`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 second timeout
    });

    return apiResponse.data;

  } catch (error) {
    if (__DEV__) {
      console.error('Cost estimation error:', error);
    }
    throw new Error('Failed to estimate cost. Please try again.');
  }
};

export const getTackleBoxFromBackend = async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/tackle-box`, {
      timeout: 30000, // 30 second timeout
    });
    
    return response.data.results || [];
  } catch (error) {
    if (__DEV__) {
      console.error('Error fetching tackle box:', error);
    }
    throw new Error('Failed to load tackle box from server.');
  }
};

export const getTackleBoxFromSupabase = async () => {
  try {
    // Get current user ID
    const userId = await getCurrentUserId();
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const response = await axios.get(`${BACKEND_URL}/api/supabase/tackle-box`, {
      params: { user_id: userId },
      headers: {
        'X-User-ID': userId,
      },
      timeout: 30000,
    });
    
    return response.data.results || [];
  } catch (error) {
    if (__DEV__) {
      console.error('Error fetching Supabase tackle box:', error);
    }
    throw new Error('Failed to load tackle box from cloud.');
  }
};

export const deleteLureFromBackend = async (lureId) => {
  try {
    const response = await axios.delete(`${BACKEND_URL}/api/delete-lure/${lureId}`, {
      timeout: 30000, // 30 second timeout
    });
    
    return response.data;
  } catch (error) {
    if (__DEV__) {
      console.error('Error deleting lure:', error);
    }
    throw new Error('Failed to delete lure from server.');
  }
};

/**
 * Permanently delete the signed-in user's account (backend + Supabase auth cascade).
 * Caller should clear local storage, RevenueCat, and sign out after success.
 */
export const deleteAccountOnBackend = async () => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    throw new Error('Not signed in.');
  }

  try {
    const response = await axios.delete(`${BACKEND_URL}/api/account`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      timeout: 120000,
    });
    return response.data;
  } catch (error) {
    if (__DEV__) {
      console.error('[BackendService] delete account error:', error?.response?.data || error?.message);
    }
    const status = error.response?.status;
    const data = error.response?.data;
    const message = data?.message || data?.error || error.message || 'Failed to delete account.';
    const err = new Error(message);
    err.code = data?.error;
    err.status = status;
    throw err;
  }
};

// Helper function to test backend connection
export const testBackendConnection = async () => {
  try {
    if (__DEV__) {
    console.log('[BackendService] Testing connection to:', BACKEND_URL);
    }
    const response = await axios.get(`${BACKEND_URL}/health`, {
      timeout: 10000, // 10 seconds should be enough for a simple JSON response
    });
    if (__DEV__) {
    console.log('[BackendService] Connection successful! Response:', response.data);
    }
    return { 
      connected: true, 
      status: response.status,
      message: response.data.message 
    };
  } catch (error) {
    if (__DEV__) {
    console.error('[BackendService] Connection failed:', error.message);
    console.error('[BackendService] Error details:', error);
    }
    return { 
      connected: false, 
      error: error.message,
      suggestion: 'Make sure your Flask server is running on the correct port and accessible from your device.',
      url: BACKEND_URL // Include URL in response for debugging
    };
  }
};
