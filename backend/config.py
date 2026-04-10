# Configuration file for Mobile Lure Classifier
# Loads configuration from environment variables for security

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# OpenAI API Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Flask Configuration
FLASK_HOST = os.getenv("FLASK_HOST", "0.0.0.0")  # Changed to 0.0.0.0 to allow network connections
FLASK_PORT = int(os.getenv("FLASK_PORT", "5000"))
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "False").lower() == "true"

# Image Processing Configuration
MAX_IMAGE_SIZE_MB = int(os.getenv("MAX_IMAGE_SIZE_MB", "16"))
TARGET_COMPRESSION_KB = int(os.getenv("TARGET_COMPRESSION_KB", "500"))
MAX_IMAGE_DIMENSION = int(os.getenv("MAX_IMAGE_DIMENSION", "1200"))

# Analysis Configuration
CHATGPT_MODEL = os.getenv("CHATGPT_MODEL", "gpt-4o-mini")
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "500"))

# File Storage Configuration
UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
RESULTS_FOLDER = os.getenv("RESULTS_FOLDER", "analysis_results")

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Validate Supabase configuration on import
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    if SUPABASE_URL == "your-project-url-here" or SUPABASE_SERVICE_ROLE_KEY == "your-service-role-key-here":
        print("[WARNING] Supabase credentials are placeholder values")
        print("[INFO] Update your .env file with actual Supabase credentials")
        print("[INFO] See SUPABASE_TROUBLESHOOTING.md for help")