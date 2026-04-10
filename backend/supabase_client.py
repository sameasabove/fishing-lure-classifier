"""
Supabase Client for Flask Backend
Handles database and storage operations
"""

from supabase import create_client, Client
import config
from typing import Dict, List, Optional
import datetime

class SupabaseService:
    def __init__(self):
        """Initialize Supabase client with service role key (backend only)"""
        if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_ROLE_KEY:
            print("[WARNING] Supabase credentials not found in config")
            print("[INFO] To enable Supabase:")
            print("  1. Create a .env file (copy from env_template.txt)")
            print("  2. Add your Supabase URL and keys from https://supabase.com/dashboard")
            self.client = None
            self.enabled = False
        else:
            # Validate credentials format
            if config.SUPABASE_URL == "your-project-url-here" or \
               config.SUPABASE_SERVICE_ROLE_KEY == "your-service-role-key-here":
                print("[WARNING] Supabase credentials are placeholder values")
                print("[INFO] Please update your .env file with actual Supabase credentials")
                self.client = None
                self.enabled = False
            else:
                try:
                    self.client: Client = create_client(
                        config.SUPABASE_URL,
                        config.SUPABASE_SERVICE_ROLE_KEY
                    )
                    self.enabled = True
                    print("[OK] Supabase client initialized successfully")
                except Exception as e:
                    print(f"[ERROR] Failed to initialize Supabase client: {str(e)}")
                    print("[INFO] Check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
                    self.client = None
                    self.enabled = False
    
    def is_enabled(self) -> bool:
        """Check if Supabase is properly configured"""
        return self.enabled and self.client is not None
    
    # ========================================================================
    # LURE ANALYSES
    # ========================================================================
    
    def create_pending_scan(self, user_id: str, image_name: str = None) -> Optional[str]:
        """Create a pending scan record immediately (counts toward quota even if analysis fails)"""
        if not self.is_enabled():
            print("[WARNING] Supabase not enabled, skipping pending scan creation")
            return None
        
        try:
            data_to_insert = {
                'user_id': user_id,
                'lure_type': 'Scanning...',  # Placeholder, will be updated
                'confidence': 0,
                'image_name': image_name or 'pending',
                'analysis_method': 'Pending',
            }
            
            response = self.client.table('lure_analyses').insert(data_to_insert).execute()
            scan_id = response.data[0].get('id') if response.data else None
            if scan_id:
                print(f"[OK] ✓ Created pending scan record for user {user_id} (ID: {scan_id})")
            else:
                print(f"[ERROR] ✗ Pending scan insert returned no ID - response: {response.data if hasattr(response, 'data') else 'no data'}")
            return scan_id
            
        except Exception as e:
            error_msg = str(e)
            print(f"[ERROR] Failed to create pending scan: {error_msg}")
            if "JWT" in error_msg or "authentication" in error_msg.lower():
                print("[INFO] Authentication error - check your SUPABASE_SERVICE_ROLE_KEY")
            elif "relation" in error_msg.lower() or "table" in error_msg.lower():
                print("[INFO] Database schema error - run supabase_schema.sql in Supabase SQL Editor")
            return None
    
    def update_scan_with_results(self, scan_id: str, analysis_data: Dict) -> Optional[Dict]:
        """Update a pending scan record with analysis results"""
        if not self.is_enabled():
            return None
        
        try:
            # Ensure required fields have values (can't be None)
            lure_type = analysis_data.get('lure_type') or 'Unknown'
            confidence = analysis_data.get('confidence')
            if confidence is None:
                confidence = 0
            
            data_to_update = {
                'lure_type': lure_type,
                'confidence': confidence,
                'image_url': analysis_data.get('image_url'),
                'image_name': analysis_data.get('image_name'),
                'image_path': analysis_data.get('image_path'),
                'analysis_method': analysis_data.get('analysis_method', 'ChatGPT Vision API'),
                'chatgpt_analysis': analysis_data.get('chatgpt_analysis', {}),
                'lure_details': analysis_data.get('lure_details', {}),
                'api_cost_usd': analysis_data.get('api_cost_usd'),
                'tokens_used': analysis_data.get('tokens_used'),
            }
            
            # Remove None values to avoid overwriting with null
            data_to_update = {k: v for k, v in data_to_update.items() if v is not None}
            
            response = self.client.table('lure_analyses')\
                .update(data_to_update)\
                .eq('id', scan_id)\
                .execute()
            
            print(f"[OK] Updated scan record {scan_id} with analysis results")
            return response.data[0] if response.data else None
            
        except Exception as e:
            error_msg = str(e)
            print(f"[ERROR] Failed to update scan record: {error_msg}")
            return None
    
    def save_lure_analysis(self, user_id: str, analysis_data: Dict) -> Optional[Dict]:
        """Save lure analysis to Supabase database (legacy - use create_pending_scan + update_scan_with_results)"""
        if not self.is_enabled():
            print("[WARNING] Supabase not enabled, skipping save")
            return None
        
        try:
            # Ensure required fields have values (can't be None)
            lure_type = analysis_data.get('lure_type') or 'Unknown'
            confidence = analysis_data.get('confidence')
            if confidence is None:
                confidence = 0
            
            data_to_insert = {
                'user_id': user_id,
                'lure_type': lure_type,  # Required field, default to 'Unknown'
                'confidence': confidence,
                'image_url': analysis_data.get('image_url'),
                'image_name': analysis_data.get('image_name'),
                'image_path': analysis_data.get('image_path'),
                'analysis_method': analysis_data.get('analysis_method', 'ChatGPT Vision API'),
                'chatgpt_analysis': analysis_data.get('chatgpt_analysis', {}),
                'lure_details': analysis_data.get('lure_details', {}),
                'api_cost_usd': analysis_data.get('api_cost_usd'),
                'tokens_used': analysis_data.get('tokens_used'),
            }
            
            response = self.client.table('lure_analyses').insert(data_to_insert).execute()
            print(f"[OK] Saved lure analysis to Supabase for user {user_id}")
            return response.data[0] if response.data else None
            
        except Exception as e:
            error_msg = str(e)
            print(f"[ERROR] Failed to save to Supabase: {error_msg}")
            if "JWT" in error_msg or "authentication" in error_msg.lower():
                print("[INFO] Authentication error - check your SUPABASE_SERVICE_ROLE_KEY")
            elif "relation" in error_msg.lower() or "table" in error_msg.lower():
                print("[INFO] Database schema error - run supabase_schema.sql in Supabase SQL Editor")
            elif "unique" in error_msg.lower():
                print("[INFO] Duplicate entry error - this record may already exist")
            return None
    
    def get_user_lure_analyses(self, user_id: str) -> List[Dict]:
        """Get all lure analyses for a user (excludes soft-deleted)"""
        if not self.is_enabled():
            print("[WARNING] Supabase not enabled, returning empty list")
            return []
        
        try:
            response = self.client.table('lure_analyses')\
                .select('*')\
                .eq('user_id', user_id)\
                .is_('deleted_at', 'null')\
                .order('created_at', desc=True)\
                .execute()
            
            return response.data if response.data else []
            
        except Exception as e:
            error_msg = str(e)
            print(f"[ERROR] Failed to get analyses from Supabase: {error_msg}")
            if "JWT" in error_msg or "authentication" in error_msg.lower():
                print("[INFO] Authentication error - check your SUPABASE_SERVICE_ROLE_KEY")
            elif "relation" in error_msg.lower() or "table" in error_msg.lower():
                print("[INFO] Database schema error - run supabase_schema.sql in Supabase SQL Editor")
            return []
    
    def get_lure_analysis_by_id(self, analysis_id: str, user_id: str) -> Optional[Dict]:
        """Get single lure analysis by ID"""
        if not self.is_enabled():
            return None
        
        try:
            response = self.client.table('lure_analyses')\
                .select('*')\
                .eq('id', analysis_id)\
                .eq('user_id', user_id)\
                .single()\
                .execute()
            
            return response.data if response.data else None
            
        except Exception as e:
            print(f"[ERROR] Failed to get analysis from Supabase: {str(e)}")
            return None
    
    def delete_lure_analysis(self, analysis_id: str, user_id: str) -> bool:
        """Soft delete a lure analysis (marks as deleted, doesn't remove)"""
        if not self.is_enabled():
            return False
        
        try:
            from datetime import datetime
            
            # Soft delete - set deleted_at instead of actually deleting
            # This ensures deleted lures still count toward quota
            self.client.table('lure_analyses')\
                .update({'deleted_at': datetime.now().isoformat()})\
                .eq('id', analysis_id)\
                .eq('user_id', user_id)\
                .execute()
            
            print(f"[OK] Soft deleted lure analysis {analysis_id}")
            return True
            
        except Exception as e:
            print(f"[ERROR] Failed to delete from Supabase: {str(e)}")
            return False
    
    def bulk_delete_lure_analyses(self, analysis_ids: List[str], user_id: str) -> int:
        """Bulk delete lure analyses"""
        if not self.is_enabled():
            return 0
        
        deleted_count = 0
        for analysis_id in analysis_ids:
            if self.delete_lure_analysis(analysis_id, user_id):
                deleted_count += 1
        
        return deleted_count
    
    # ========================================================================
    # STORAGE
    # ========================================================================
    
    def upload_lure_image(self, user_id: str, file_path: str, file_name: str) -> Optional[str]:
        """Upload lure image to Supabase Storage"""
        if not self.is_enabled():
            print("[WARNING] Supabase not enabled, skipping image upload")
            return None
        
        try:
            # Read file
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            # Upload to storage with user-specific path
            storage_path = f"{user_id}/{file_name}"
            
            self.client.storage.from_('lure-images').upload(
                storage_path,
                file_data,
                file_options={"content-type": "image/jpeg", "upsert": "true"}
            )
            
            # Get public URL
            public_url = self.client.storage.from_('lure-images').get_public_url(storage_path)
            
            print(f"[OK] Uploaded image to Supabase Storage: {storage_path}")
            return public_url
            
        except Exception as e:
            error_msg = str(e)
            print(f"[ERROR] Failed to upload to Supabase Storage: {error_msg}")
            if "bucket" in error_msg.lower():
                print("[INFO] Storage bucket error - create 'lure-images' bucket in Supabase Storage")
                print("[INFO] Run the storage policies from supabase_schema.sql")
            elif "policy" in error_msg.lower() or "permission" in error_msg.lower():
                print("[INFO] Permission error - check storage policies in Supabase")
            elif "JWT" in error_msg or "authentication" in error_msg.lower():
                print("[INFO] Authentication error - check your SUPABASE_SERVICE_ROLE_KEY")
            return None
    
    def delete_lure_image(self, storage_path: str) -> bool:
        """Delete lure image from Supabase Storage"""
        if not self.is_enabled():
            return False
        
        try:
            self.client.storage.from_('lure-images').remove([storage_path])
            print(f"[OK] Deleted image from Supabase Storage: {storage_path}")
            return True
            
        except Exception as e:
            print(f"[ERROR] Failed to delete from Supabase Storage: {str(e)}")
            return False
    
    # ========================================================================
    # USER PROFILE
    # ========================================================================
    
    def get_user_profile(self, user_id: str) -> Optional[Dict]:
        """Get user profile"""
        if not self.is_enabled():
            return None
        
        try:
            response = self.client.table('profiles')\
                .select('*')\
                .eq('id', user_id)\
                .single()\
                .execute()
            
            return response.data if response.data else None
            
        except Exception as e:
            print(f"[ERROR] Failed to get profile from Supabase: {str(e)}")
            return None
    
    def update_user_profile(self, user_id: str, updates: Dict) -> bool:
        """Update user profile"""
        if not self.is_enabled():
            return False
        
        try:
            self.client.table('profiles')\
                .update(updates)\
                .eq('id', user_id)\
                .execute()
            
            print(f"[OK] Updated profile for user {user_id}")
            return True
            
        except Exception as e:
            print(f"[ERROR] Failed to update profile: {str(e)}")
            return False
    
    # ========================================================================
    # SUBSCRIPTION MANAGEMENT
    # ========================================================================
    
    def get_user_subscription(self, user_id: str) -> Optional[Dict]:
        """Get user subscription status"""
        if not self.is_enabled():
            return None
        
        try:
            response = self.client.table('user_subscriptions')\
                .select('*')\
                .eq('user_id', user_id)\
                .single()\
                .execute()
            
            return response.data if response.data else None
            
        except Exception as e:
            # User might not have a subscription record yet
            if "JSON object requested, multiple" not in str(e) and "No rows found" not in str(e):
                print(f"[ERROR] Failed to get subscription: {str(e)}")
            return None
    
    def is_user_pro(self, user_id: str) -> bool:
        """Check if user has active PRO subscription"""
        subscription = self.get_user_subscription(user_id)
        
        if not subscription or not subscription.get('is_pro'):
            return False
        
        # Check expiration for non-lifetime subscriptions
        if subscription.get('expires_at'):
            from datetime import datetime
            expires = datetime.fromisoformat(subscription['expires_at'].replace('Z', '+00:00'))
            if expires < datetime.now(expires.tzinfo):
                return False
        
        return True
    
    def get_monthly_scan_count(self, user_id: str) -> int:
        """Get number of scans this month for user (counts all rows; used for quota)."""
        if not self.is_enabled():
            return 0
        
        try:
            from datetime import datetime, timezone
            # Get start of current month in UTC (Supabase stores timestamps in UTC)
            now = datetime.now(timezone.utc)
            start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
            start_iso = start_of_month.isoformat()

            # Fetch rows for this user this month; count by length so we never get wrong count.
            # (Some Supabase client versions don't set response.count reliably.)
            response = self.client.table('lure_analyses')\
                .select('id')\
                .eq('user_id', user_id)\
                .gte('created_at', start_iso)\
                .limit(1000)\
                .execute()

            count = len(response.data) if response.data else 0
            print(f"[DEBUG] Monthly scan count for user {user_id}: {count} (since {start_iso})")
            return count
            
        except Exception as e:
            print(f"[ERROR] Failed to get scan count: {str(e)}")
            return 0
    
    def can_user_scan(self, user_id: str, free_tier_limit: int = 10) -> Dict:
        """Check if user can perform a scan (PRO or has quota)"""
        # Check if PRO user
        if self.is_user_pro(user_id):
            return {
                'can_scan': True,
                'is_pro': True,
                'reason': 'pro',
                'unlimited': True
            }
        
        # Check free tier quota
        scan_count = self.get_monthly_scan_count(user_id)
        remaining = max(0, free_tier_limit - scan_count)
        
        if remaining > 0:
            return {
                'can_scan': True,
                'is_pro': False,
                'reason': 'free_quota',
                'used': scan_count,
                'remaining': remaining,
                'limit': free_tier_limit
            }
        else:
            from datetime import datetime
            from calendar import monthrange
            
            # Calculate reset date (first day of next month)
            now = datetime.now()
            if now.month == 12:
                reset_date = datetime(now.year + 1, 1, 1)
            else:
                reset_date = datetime(now.year, now.month + 1, 1)
            
            return {
                'can_scan': False,
                'is_pro': False,
                'reason': 'quota_exceeded',
                'used': scan_count,
                'limit': free_tier_limit,
                'reset_date': reset_date.isoformat()
            }

# Global Supabase service instance
supabase_service = SupabaseService()

