// Configuration file for Fishing Lure Analyzer
// Copy this file to config.js and update the values

export const CONFIG = {
  // Backend Server Configuration
  BACKEND_URL: 'http://localhost:5000',
  
  // OpenAI Configuration (if using direct API)
  OPENAI_API_KEY: 'your_openai_api_key_here',
  
  // App Configuration
  APP_NAME: 'Fishing Lure Analyzer',
  APP_VERSION: '1.0.0',
  
  // Development Configuration
  DEBUG_MODE: true,
  LOG_LEVEL: 'info',
  
  // API Configuration
  API_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  
  // Image Configuration
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  IMAGE_QUALITY: 0.8,
  IMAGE_ASPECT_RATIO: [4, 3],
  
  // Storage Configuration
  STORAGE_KEYS: {
    OPENAI_API_KEY: 'openai_api_key',
    TACKLE_BOX: 'tackle_box_lures',
    SETTINGS: 'app_settings',
  }
};

export default CONFIG;
