import { analyzeLureWithBackend, estimateCostWithBackend } from './backendService';
import { SecurityUtils, API_CONFIG } from '../config/security';

// Create rate limiter instance
const rateLimiter = SecurityUtils.createRateLimiter(API_CONFIG.RATE_LIMIT_MS);

export const analyzeLure = async (imageUri) => {
  try {
    // Validate input using security utils
    SecurityUtils.validateImageUri(imageUri);
    
    // Validate image size
    await SecurityUtils.validateImageSize(imageUri);
    
    // Check rate limiting
    rateLimiter();
    
    // Use the backend server for analysis
    // The API key is securely stored on the backend, never on the client
    const backendResult = await analyzeLureWithBackend(imageUri);
    return backendResult;

  } catch (error) {
    // Use secure logging
    SecurityUtils.secureLog('error', 'Lure analysis error:', error);
    
    // Provide user-friendly error messages
    if (error.message.includes('Cannot connect to server')) {
      throw new Error('Cannot connect to server. Please ensure the backend server is running and accessible from your device.');
    } else if (error.message.includes('Network Error')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else if (error.message.includes('timeout')) {
      throw new Error('Request timed out. The server may be busy. Please try again.');
    } else {
      // Pass through any other errors
      throw error;
    }
  }
};

export const estimateCost = async (imageUri) => {
  try {
    // Validate input
    SecurityUtils.validateImageUri(imageUri);
    
    // Use the backend server for cost estimation
    const costEstimate = await estimateCostWithBackend(imageUri);
    return costEstimate;
    
  } catch (error) {
    SecurityUtils.secureLog('error', 'Cost estimation error:', error);
    throw new Error('Failed to estimate cost. Please ensure the backend server is accessible.');
  }
};
