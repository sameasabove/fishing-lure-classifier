from flask import Flask, render_template, request, jsonify, send_from_directory
import os
from werkzeug.utils import secure_filename
from mobile_lure_classifier import MobileLureClassifier
from supabase_client import supabase_service
import config
import json
import datetime

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = config.UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = config.MAX_IMAGE_SIZE_MB * 1024 * 1024

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize the mobile-optimized lure classifier
mobile_classifier = None

# Load API key from config file
def load_api_key():
    api_key = config.OPENAI_API_KEY
    if api_key and api_key != 'your_openai_api_key_here':
        global mobile_classifier
        mobile_classifier = MobileLureClassifier(openai_api_key=api_key)
        print("[OK] OpenAI API key loaded successfully from config.py")
        return True
    else:
        print("[WARNING] OpenAI API key not found in config.py. Please edit config.py with your actual API key.")
        return False

# Try to load API key on startup
load_api_key()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/health')
def health():
    """Simple health check endpoint for mobile apps"""
    return jsonify({
        'status': 'ok',
        'message': 'Backend is running',
        'timestamp': datetime.datetime.now().isoformat()
    })

@app.route('/keep-alive')
def keep_alive():
    """Keep Supabase database active by making a simple query"""
    try:
        if supabase_service.is_enabled():
            # Make a simple query to keep database active
            # This prevents Supabase free tier from pausing after 7 days
            response = supabase_service.client.table('lure_analyses').select('id').limit(1).execute()
            return jsonify({
                'status': 'ok',
                'message': 'Supabase database is active',
                'supabase': 'connected',
                'timestamp': datetime.datetime.now().isoformat()
            })
        else:
            return jsonify({
                'status': 'ok',
                'message': 'Backend is running (Supabase not enabled)',
                'supabase': 'disabled',
                'timestamp': datetime.datetime.now().isoformat()
            })
    except Exception as e:
        # Even if query fails, return ok - this endpoint should always succeed
        # to keep the cron job happy
        return jsonify({
            'status': 'ok',
            'message': 'Keep-alive ping received',
            'supabase': 'error',
            'error': str(e),
            'timestamp': datetime.datetime.now().isoformat()
        })

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'})
    
    if file:
        try:
            # Save uploaded file
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            print(f"[INFO] File uploaded: {filename}")
            
            # Check quota BEFORE analyzing (count all attempts, not just successful ones)
            # CRITICAL: This prevents expensive API calls if quota is exceeded
            user_id = request.form.get('user_id') or request.headers.get('X-User-ID')
            pending_scan_id = None  # Track pending scan ID for updating later
            
            if user_id:
                if supabase_service.is_enabled():
                    try:
                        quota_check = supabase_service.can_user_scan(user_id)
                        if not quota_check.get('can_scan'):
                            print(f"[WARNING] User {user_id} exceeded quota")
                            return jsonify({
                                'error': 'quota_exceeded',
                                'message': 'You have used all your free scans this month. Upgrade to PRO for unlimited scans!',
                                'quota': quota_check
                            }), 403
                        
                        # Create pending scan record IMMEDIATELY (counts toward quota even if analysis fails)
                        print(f"[DEBUG] Attempting to create pending scan for user {user_id}, filename: {filename}")
                        pending_scan_id = supabase_service.create_pending_scan(user_id, filename)
                        if pending_scan_id:
                            print(f"[OK] ✓ Created pending scan record (ID: {pending_scan_id}) - counts toward quota")
                        else:
                            print(f"[WARNING] ✗ Failed to create pending scan - will use fallback save method")
                    except Exception as e:
                        # FAIL-SAFE: If quota check fails, DENY the request to prevent unexpected costs
                        print(f"[ERROR] Quota check failed: {e}")
                        return jsonify({
                            'error': 'quota_check_failed',
                            'message': 'Unable to verify quota. Please try again later or upgrade to PRO for guaranteed access.'
                        }), 503
                else:
                    # Supabase disabled - require PRO status or deny
                    # This prevents unlimited free scans if Supabase is down
                    print(f"[WARNING] Supabase disabled - requiring authentication for scan")
                    return jsonify({
                        'error': 'service_unavailable',
                        'message': 'Quota system temporarily unavailable. Please try again later or upgrade to PRO.'
                    }), 503
            else:
                # No user ID - require authentication
                return jsonify({
                    'error': 'authentication_required',
                    'message': 'Please sign in to use the lure analyzer.'
                }), 401
            
            # Check if classifier is available
            if not mobile_classifier:
                return jsonify({'error': 'Lure classifier not initialized. Please set up your API key in config.py first.'})
            
            # Analyze the lure using ChatGPT Vision
            print("[INFO] Starting lure analysis...")
            results = mobile_classifier.analyze_lure(filepath)
            
            # Always add image info to results
            results['image_path'] = filepath
            results['image_name'] = filename
            
            # Handle analysis errors - still save to count toward quota
            if 'error' in results:
                print(f"[ERROR] Analysis failed: {results['error']}")
                # Set defaults for failed analysis so it still counts toward quota
                results['lure_type'] = 'Analysis Failed'
                results['confidence'] = 0
                results['analysis_method'] = 'ChatGPT Vision API (Failed)'
            
            # Save results to JSON file
            json_file = mobile_classifier.save_analysis_to_json(results)
            results['json_file'] = json_file
            
            # Update Supabase record with analysis results
            # The scan was already counted when we created the pending record
            if user_id and supabase_service.is_enabled() and pending_scan_id:
                try:
                    # Verify we have minimum required data before saving
                    if not results.get('lure_type'):
                        print(f"[WARNING] No lure_type in results, setting to 'Unknown'")
                        results['lure_type'] = 'Unknown'
                    
                    # Upload image to Supabase Storage
                    image_url = supabase_service.upload_lure_image(user_id, filepath, filename)
                    if image_url:
                        results['image_url'] = image_url
                    
                    # Update the pending scan record with analysis results
                    supabase_result = supabase_service.update_scan_with_results(pending_scan_id, results)
                    if supabase_result:
                        results['supabase_id'] = supabase_result.get('id')
                        print(f"[OK] Updated scan record {pending_scan_id} with analysis results")
                    else:
                        # Fallback: if update failed, try creating new record (shouldn't happen)
                        print(f"[WARNING] Update failed for scan {pending_scan_id}, scan already counted")
                except Exception as e:
                    print(f"[WARNING] Supabase update failed: {str(e)}")
                    # Continue anyway - scan was already counted when pending record was created
            elif user_id and supabase_service.is_enabled() and not pending_scan_id:
                # Fallback: if pending scan wasn't created, create it now (legacy behavior)
                try:
                    if not results.get('lure_type'):
                        results['lure_type'] = 'Unknown'
                    image_url = supabase_service.upload_lure_image(user_id, filepath, filename)
                    if image_url:
                        results['image_url'] = image_url
                    supabase_result = supabase_service.save_lure_analysis(user_id, results)
                    if supabase_result:
                        results['supabase_id'] = supabase_result.get('id')
                        print(f"[OK] Saved to Supabase for user {user_id} (fallback)")
                    else:
                        # Last resort: ensure scan is counted for quota (cost protection)
                        rid = supabase_service.create_pending_scan(user_id, filename)
                        if rid:
                            supabase_service.update_scan_with_results(rid, results)
                            print(f"[OK] Created scan record for quota (last resort), ID: {rid}")
                except Exception as e:
                    print(f"[WARNING] Supabase save failed: {str(e)}")
                    # Last resort: minimal insert so quota counts (critical for cost protection)
                    try:
                        rid = supabase_service.create_pending_scan(user_id, filename or 'scan')
                        if rid:
                            print(f"[OK] Created minimal scan record for quota (ID: {rid})")
                    except Exception as e2:
                        print(f"[ERROR] Could not record scan for quota: {e2}")
            
            print(f"[OK] Analysis completed successfully")
            print(f"[INFO] Results: {results}")
            
            return jsonify(results)
            
        except Exception as e:
            print(f"[ERROR] Error during analysis: {str(e)}")
            return jsonify({'error': f'Analysis failed: {str(e)}'})
        finally:
            # Don't clean up the uploaded file - we want to keep it for the tackle box
            pass

@app.route('/estimate-cost', methods=['POST'])
def estimate_cost():
    """Estimate API cost for lure analysis"""
    if not mobile_classifier:
        return jsonify({'error': 'Lure classifier not initialized. Please set up your API key in config.py first.'})
    
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'})
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'})
        
        if file:
            # Save file temporarily
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            try:
                # Get cost estimate
                cost_estimate = mobile_classifier.estimate_api_cost(filepath)
                
                # Clean up temporary file
                os.remove(filepath)
                
                return jsonify(cost_estimate)
                
            except Exception as e:
                # Clean up on error
                if os.path.exists(filepath):
                    os.remove(filepath)
                raise e
                
    except Exception as e:
        return jsonify({'error': f'Cost estimation failed: {str(e)}'})

@app.route('/reload-config')
def reload_config():
    """Reload configuration from config.py (useful for testing)"""
    try:
        import importlib
        importlib.reload(config)
        success = load_api_key()
        return jsonify({'success': success, 'message': 'Configuration reloaded' if success else 'API key not found in config.py'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to reload config: {str(e)}'})

@app.route('/tackle-box')
def tackle_box():
    """Display all previous lure analysis results"""
    try:
        # Get all analysis result files
        results_dir = config.RESULTS_FOLDER
        if not os.path.exists(results_dir):
            return jsonify({'error': 'No analysis results found'})
        
        all_results = []
        
        # Walk through all subdirectories to find JSON files
        for root, dirs, files in os.walk(results_dir):
            for file in files:
                if file.endswith('_analysis.json'):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            result_data = json.load(f)
                            
                        # Extract key information for display
                        display_data = {
                            'id': file.replace('_analysis.json', ''),
                            'filename': result_data.get('image_name', 'Unknown'),
                            'image_path': result_data.get('image_path', ''), # Add image_path
                            'lure_type': result_data.get('lure_type', 'Unknown'),
                            'confidence': result_data.get('confidence', 0),
                            'analysis_date': result_data.get('analysis_date', 'Unknown'),
                            'target_species': result_data.get('chatgpt_analysis', {}).get('target_species', []),
                            'json_file': file_path
                        }
                        all_results.append(display_data)
                    except Exception as e:
                        print(f"Error reading {file_path}: {e}")
                        continue
        
        # Sort by analysis date (newest first)
        all_results.sort(key=lambda x: x.get('analysis_date', ''), reverse=True)
        
        return render_template('tackle_box.html', results=all_results)
        
    except Exception as e:
        print(f"Error in tackle_box: {e}")
        return jsonify({'error': f'Failed to load tackle box: {str(e)}'})

@app.route('/api/supabase/tackle-box')
def api_supabase_tackle_box():
    """API endpoint to get tackle box data from Supabase"""
    try:
        # Get user_id from request
        user_id = request.args.get('user_id') or request.headers.get('X-User-ID')
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 401
        
        if not supabase_service.is_enabled():
            return jsonify({'error': 'Supabase not configured'}), 503
        
        # Get lure analyses from Supabase
        results = supabase_service.get_user_lure_analyses(user_id)
        
        return jsonify({'results': results})
        
    except Exception as e:
        print(f"Error in api_supabase_tackle_box: {e}")
        return jsonify({'error': f'Failed to load tackle box: {str(e)}'}), 500

@app.route('/api/tackle-box')
def api_tackle_box():
    """API endpoint to get tackle box data (local files - backwards compatibility)"""
    try:
        # Get all analysis result files
        results_dir = config.RESULTS_FOLDER
        if not os.path.exists(results_dir):
            return jsonify({'results': []})
        
        all_results = []
        
        # Walk through all subdirectories to find JSON files
        for root, dirs, files in os.walk(results_dir):
            for file in files:
                if file.endswith('_analysis.json'):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            result_data = json.load(f)
                            
                        # Extract key information for display
                        display_data = {
                            'id': file.replace('_analysis.json', ''),
                            'filename': result_data.get('image_name', 'Unknown'),
                            'image_path': result_data.get('image_path', ''), # Add image_path
                            'lure_type': result_data.get('lure_type', 'Unknown'),
                            'confidence': result_data.get('confidence', 0),
                            'analysis_date': result_data.get('analysis_date', 'Unknown'),
                            'target_species': result_data.get('chatgpt_analysis', {}).get('target_species', []),
                            'json_file': file_path
                        }
                        all_results.append(display_data)
                    except Exception as e:
                        print(f"Error reading {file_path}: {e}")
                        continue
        
        # Sort by analysis date (newest first)
        all_results.sort(key=lambda x: x.get('analysis_date', ''), reverse=True)
        
        return jsonify({'results': all_results})
        
    except Exception as e:
        print(f"Error in api_tackle_box: {e}")
        return jsonify({'error': f'Failed to load tackle box: {str(e)}'})

@app.route('/api/lure-details/<result_id>')
def get_lure_details(result_id):
    """Get detailed lure information for a specific result"""
    try:
        # Find the result file
        results_dir = config.RESULTS_FOLDER
        result_file = None
        
        for root, dirs, files in os.walk(results_dir):
            for file in files:
                if file.startswith(result_id) and file.endswith('_analysis.json'):
                    result_file = os.path.join(root, file)
                    break
            if result_file:
                break
        
        if not result_file:
            return jsonify({'error': 'Result not found'})
        
        with open(result_file, 'r', encoding='utf-8') as f:
            result_data = json.load(f)
        
        return jsonify(result_data)
        
    except Exception as e:
        print(f"Error getting lure details: {e}")
        return jsonify({'error': f'Failed to get lure details: {str(e)}'})

@app.route('/api/delete-lure/<result_id>', methods=['DELETE'])
def delete_lure(result_id):
    """Delete a lure analysis result from the tackle box"""
    try:
        # Find the result file
        results_dir = config.RESULTS_FOLDER
        result_file = None
        
        for root, dirs, files in os.walk(results_dir):
            for file in files:
                if file.startswith(result_id) and file.endswith('_analysis.json'):
                    result_file = os.path.join(root, file)
                    break
            if result_file:
                break
        
        if not result_file:
            return jsonify({'error': 'Result not found'}), 404
        
        # Delete the file
        os.remove(result_file)
        print(f"[INFO] Deleted lure analysis: {result_file}")
        
        return jsonify({'success': True, 'message': 'Lure deleted successfully'})
        
    except Exception as e:
        print(f"Error deleting lure: {e}")
        return jsonify({'error': f'Failed to delete lure: {str(e)}'}), 500

@app.route('/api/bulk-delete-lures', methods=['POST'])
def bulk_delete_lures():
    """Delete multiple lure analysis results from the tackle box"""
    try:
        data = request.get_json()
        lure_ids = data.get('lure_ids', [])
        
        if not lure_ids:
            return jsonify({'error': 'No lure IDs provided'}), 400
        
        deleted_count = 0
        failed_deletions = []
        
        for result_id in lure_ids:
            try:
                # Find the result file
                results_dir = config.RESULTS_FOLDER
                result_file = None
                
                for root, dirs, files in os.walk(results_dir):
                    for file in files:
                        if file.startswith(result_id) and file.endswith('_analysis.json'):
                            result_file = os.path.join(root, file)
                            break
                    if result_file:
                        break
                
                if result_file and os.path.exists(result_file):
                    os.remove(result_file)
                    deleted_count += 1
                    print(f"[INFO] Deleted lure analysis: {result_file}")
                else:
                    failed_deletions.append(result_id)
                    
            except Exception as e:
                print(f"Error deleting lure {result_id}: {e}")
                failed_deletions.append(result_id)
        
        if deleted_count > 0:
            message = f"Successfully deleted {deleted_count} lure(s)"
            if failed_deletions:
                message += f". Failed to delete {len(failed_deletions)} lure(s)"
            
            return jsonify({
                'success': True, 
                'message': message,
                'deleted_count': deleted_count,
                'failed_count': len(failed_deletions)
            })
        else:
            return jsonify({'error': 'No lures were deleted'}), 400
        
    except Exception as e:
        print(f"Error in bulk delete: {e}")
        return jsonify({'error': f'Failed to delete lures: {str(e)}'}), 500

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded images"""
    try:
        return send_from_directory(config.UPLOAD_FOLDER, filename)
    except Exception as e:
        print(f"Error serving image {filename}: {e}")
        return jsonify({'error': 'Image not found'}), 404

@app.route('/api/verify-subscription', methods=['GET'])
def verify_subscription():
    """Verify user subscription status (PRO or Free)"""
    try:
        user_id = request.args.get('user_id') or request.headers.get('X-User-ID')
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 401
        
        if not supabase_service.is_enabled():
            # If Supabase not enabled, treat all as free users
            return jsonify({
                'is_pro': False,
                'subscription_type': 'free',
                'message': 'Supabase not configured'
            })
        
        # Check subscription status
        subscription = supabase_service.get_user_subscription(user_id)
        is_pro = supabase_service.is_user_pro(user_id)
        
        if is_pro and subscription:
            return jsonify({
                'is_pro': True,
                'subscription_type': subscription.get('subscription_type'),
                'product_identifier': subscription.get('product_identifier'),
                'expires_at': subscription.get('expires_at'),
                'will_renew': subscription.get('will_renew', False)
            })
        
        return jsonify({
            'is_pro': False,
            'subscription_type': 'free'
        })
        
    except Exception as e:
        print(f"[ERROR] Subscription verification failed: {e}")
        return jsonify({'error': 'Verification failed'}), 500

@app.route('/api/check-scan-quota', methods=['GET'])
def check_scan_quota():
    """Check if user can scan (respects PRO status and free tier quota)"""
    try:
        user_id = request.args.get('user_id') or request.headers.get('X-User-ID')
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 401
        
        if not supabase_service.is_enabled():
            # If Supabase not enabled, allow unlimited scans
            return jsonify({
                'can_scan': True,
                'reason': 'no_quota_system',
                'unlimited': True
            })
        
        # Check if user can scan
        quota_status = supabase_service.can_user_scan(user_id)
        
        # Add debug info in development
        if __name__ == '__main__' or os.getenv('FLASK_ENV') == 'development':
            print(f"[DEBUG] Quota check for user {user_id}: {quota_status}")
        
        return jsonify(quota_status)
        
    except Exception as e:
        print(f"[ERROR] Quota check failed: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/debug/user-scans', methods=['GET'])
def debug_user_scans():
    """Debug endpoint to see all scans for a user (dev only)"""
    try:
        user_id = request.args.get('user_id') or request.headers.get('X-User-ID')
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 401
        
        if not supabase_service.is_enabled():
            return jsonify({'error': 'Supabase not enabled'}), 503
        
        # Get all scans for user
        all_scans = supabase_service.get_user_lure_analyses(user_id)
        
        # Get monthly count
        monthly_count = supabase_service.get_monthly_scan_count(user_id)
        
        # Get scans from this month
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
        
        this_month_scans = [s for s in all_scans if s.get('created_at') and s['created_at'] >= start_of_month.isoformat()]
        
        return jsonify({
            'user_id': user_id,
            'total_scans': len(all_scans),
            'monthly_count': monthly_count,
            'this_month_scans': len(this_month_scans),
            'start_of_month': start_of_month.isoformat(),
            'sample_scans': all_scans[:5] if all_scans else []
        })
        
    except Exception as e:
        print(f"[ERROR] Debug scan check failed: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/subscription-stats', methods=['GET'])
def subscription_stats():
    """Get subscription statistics (admin endpoint)"""
    try:
        # This should be protected with admin auth in production
        if not supabase_service.is_enabled():
            return jsonify({'error': 'Supabase not configured'}), 503
        
        # Query subscription stats using the function (replaces the view)
        response = supabase_service.client.rpc('get_subscription_stats').execute()
        
        if response.data and len(response.data) > 0:
            return jsonify(response.data[0])
        
        return jsonify({
            'total_users': 0,
            'pro_users': 0,
            'free_users': 0
        })
        
    except Exception as e:
        print(f"[ERROR] Failed to get stats: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("Mobile Lure Classifier Flask App Starting...")
    print("=" * 60)
    
    if mobile_classifier:
        print("[OK] OpenAI API key loaded from config.py - Ready for lure analysis!")
        print("[INFO] Server starting on http://localhost:5000")
    else:
        print("[WARNING] OpenAI API key not loaded - Analysis will not work")
        print("[INFO] Edit config.py with your OpenAI API key to enable analysis")
    
    print("=" * 60)
    app.run(debug=config.FLASK_DEBUG, host=config.FLASK_HOST, port=config.FLASK_PORT)

