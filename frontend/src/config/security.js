/**
 * Security Configuration for Fishing Lure Analyzer
 * This file contains security-related constants and utilities
 */

// API Configuration
export const API_CONFIG = {
  // Rate limiting
  RATE_LIMIT_MS: 2000, // 2 seconds between requests
  
  // Request timeouts
  REQUEST_TIMEOUT: 30000, // 30 seconds
  UPLOAD_TIMEOUT: 60000,  // 60 seconds for file uploads
  
  // Max retry attempts
  MAX_RETRIES: 3,
  
  // Image size limits
  MAX_IMAGE_SIZE_MB: 10,
  MAX_IMAGE_DIMENSION: 2048,
  
  // API key validation
  MIN_API_KEY_LENGTH: 20,
  API_KEY_PREFIX: 'sk-',
};

// Input validation patterns
export const VALIDATION_PATTERNS = {
  // Image URI patterns
  IMAGE_URI: /^(file:\/\/|content:\/\/|data:image\/)/,
  
  // API key pattern (basic validation)
  API_KEY: /^sk-[a-zA-Z0-9]{20,}$/,
  
  // Filename pattern
  FILENAME: /^[a-zA-Z0-9._-]+$/,
};

// Security utilities
export const SecurityUtils = {
  /**
   * Validate image URI format and security
   */
  validateImageUri: (imageUri) => {
    if (!imageUri || typeof imageUri !== 'string') {
      throw new Error('Invalid image URI provided');
    }
    
    // Check for valid URI schemes
    if (!VALIDATION_PATTERNS.IMAGE_URI.test(imageUri)) {
      throw new Error('Invalid image URI format. Only file://, content://, and data:image/ URIs are allowed.');
    }
    
    // Check for suspicious patterns
    if (imageUri.includes('..') || imageUri.includes('\\') || 
        imageUri.includes('javascript:') || imageUri.includes('<script')) {
      throw new Error('Potentially malicious URI detected');
    }
    
    return true;
  },

  /**
   * Validate image size (basic check)
   */
  validateImageSize: async (imageUri) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const sizeInMB = blob.size / (1024 * 1024);
      
      if (sizeInMB > API_CONFIG.MAX_IMAGE_SIZE_MB) {
        throw new Error(`Image too large: ${sizeInMB.toFixed(2)}MB. Maximum allowed: ${API_CONFIG.MAX_IMAGE_SIZE_MB}MB`);
      }
      
      return true;
    } catch (error) {
      throw new Error(`Failed to validate image size: ${error.message}`);
    }
  },
  
  /**
   * Validate API key format
   */
  validateApiKey: (apiKey) => {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('API key is required');
    }
    
    const trimmedKey = apiKey.trim();
    
    if (trimmedKey.length < API_CONFIG.MIN_API_KEY_LENGTH) {
      throw new Error('API key is too short');
    }
    
    if (!trimmedKey.startsWith('sk-')) {
      throw new Error('Invalid API key format. Must start with "sk-"');
    }
    
    return trimmedKey;
  },
  
  /**
   * Sanitize filename for security
   */
  sanitizeFilename: (filename) => {
    if (!filename || typeof filename !== 'string') {
      return `lure_${Date.now()}.jpg`;
    }
    
    // Remove path traversal attempts
    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Ensure it has a valid extension
    if (!sanitized.includes('.')) {
      return `${sanitized}.jpg`;
    }
    
    return sanitized;
  },
  
  /**
   * Rate limiting helper
   */
  createRateLimiter: (limitMs = API_CONFIG.RATE_LIMIT_MS) => {
    let lastRequestTime = 0;
    
    return () => {
      const now = Date.now();
      if (now - lastRequestTime < limitMs) {
        const waitTime = Math.ceil((limitMs - (now - lastRequestTime)) / 1000);
        throw new Error(`Please wait ${waitTime} second(s) before making another request`);
      }
      lastRequestTime = now;
    };
  },
  
  /**
   * Secure console logging (only in development)
   */
  secureLog: (level, message, data = null) => {
    if (__DEV__) {
      switch (level) {
        case 'error':
          console.error(message, data);
          break;
        case 'warn':
          console.warn(message, data);
          break;
        case 'info':
          console.info(message, data);
          break;
        default:
          console.log(message, data);
      }
    }
  },
  
  /**
   * Validate and sanitize user input
   */
  sanitizeInput: (input, maxLength = 1000) => {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    // Truncate if too long
    const truncated = input.length > maxLength ? input.substring(0, maxLength) : input;
    
    // Remove potentially dangerous characters
    return truncated.replace(/[<>\"'&]/g, '');
  },
};

// Environment-specific configurations
export const ENV_CONFIG = {
  development: {
    BACKEND_URL: 'https://fishing-lure-backend.onrender.com', // Now using production backend!
    LOG_LEVEL: 'debug',
    ENABLE_DEBUG_LOGS: true,
  },
  production: {
    BACKEND_URL: 'https://fishing-lure-backend.onrender.com',
    LOG_LEVEL: 'error',
    ENABLE_DEBUG_LOGS: false,
  },
};

// Get current environment configuration
export const getCurrentConfig = () => {
  return ENV_CONFIG[__DEV__ ? 'development' : 'production'];
};

// Export default configuration
export default {
  API_CONFIG,
  VALIDATION_PATTERNS,
  SecurityUtils,
  ENV_CONFIG,
  getCurrentConfig,
};

