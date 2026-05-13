from flask import Flask, render_template, request, jsonify, send_from_directory, g
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
from werkzeug.utils import secure_filename
from mobile_lure_classifier import MobileLureClassifier
from supabase_client import supabase_service
from auth import require_auth, require_admin
import config
import json
import datetime

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = config.UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = config.MAX_IMAGE_SIZE_MB * 1024 * 1024

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# ---------------------------------------------------------------------------
# CORS — mobile apps don't have a browser origin so we allow all origins,
# but restrict to the methods and headers we actually use.
# ---------------------------------------------------------------------------
CORS(app, resources={
    r'/api/*': {'origins': '*', 'methods': ['GET', 'POST', 'DELETE', 'OPTIONS']},
    r'/upload': {'origins': '*', 'methods': ['POST', 'OPTIONS']},
    r'/estimate-cost': {'origins': '*', 'methods': ['POST', 'OPTIONS']},
    r'/health': {'origins': '*', 'methods': ['GET']},
}, supports_credentials=False)

# ---------------------------------------------------------------------------
# Rate limiting — keyed by IP address.
# Limits are intentionally generous for real users but stop abuse.
# ---------------------------------------------------------------------------
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=['500 per day', '100 per hour'],
    storage_uri='memory://',
)

# ---------------------------------------------------------------------------
# AI classifier
# ---------------------------------------------------------------------------
mobile_classifier = None

def load_api_key():
    api_key = config.OPENAI_API_KEY
    if api_key and api_key != 'your_openai_api_key_here':
        global mobile_classifier
        mobile_classifier = MobileLureClassifier(openai_api_key=api_key)
        print('[OK] OpenAI API key loaded')
        return True
    print('[WARNING] OpenAI API key not set — analysis disabled')
    return False

load_api_key()

# ---------------------------------------------------------------------------
# Public endpoints
# ---------------------------------------------------------------------------

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/health')
def health():
    return jsonify({
        'status': 'ok',
        'message': 'Backend is running',
        'timestamp': datetime.datetime.now().isoformat(),
    })


@app.route('/keep-alive')
def keep_alive():
    try:
        if supabase_service.is_enabled():
            supabase_service.client.table('lure_analyses').select('id').limit(1).execute()
            return jsonify({'status': 'ok', 'supabase': 'connected'})
        return jsonify({'status': 'ok', 'supabase': 'disabled'})
    except Exception as e:
        return jsonify({'status': 'ok', 'supabase': 'error', 'error': str(e)})

# ---------------------------------------------------------------------------
# Protected endpoints
# ---------------------------------------------------------------------------

@app.route('/upload', methods=['POST'])
@limiter.limit('20 per hour')
@require_auth
def upload_file():
    user_id = g.user_id

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if not file.filename:
        return jsonify({'error': 'No file selected'}), 400

    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        print(f'[INFO] Upload received for user {user_id}: {filename}')

        if supabase_service.is_enabled():
            try:
                quota_check = supabase_service.can_user_scan(user_id)
                if not quota_check.get('can_scan'):
                    return jsonify({
                        'error': 'quota_exceeded',
                        'message': 'You have used all your free scans this month. Upgrade to PRO for unlimited scans!',
                        'quota': quota_check,
                    }), 403

                pending_scan_id = supabase_service.create_pending_scan(user_id, filename)
                if not pending_scan_id:
                    print('[WARNING] Failed to create pending scan — using fallback')
            except Exception as e:
                print(f'[ERROR] Quota check failed: {e}')
                return jsonify({
                    'error': 'quota_check_failed',
                    'message': 'Unable to verify quota. Please try again later.',
                }), 503
        else:
            return jsonify({
                'error': 'service_unavailable',
                'message': 'Quota system temporarily unavailable. Please try again later.',
            }), 503

        if not mobile_classifier:
            return jsonify({'error': 'Lure classifier not initialised. Check server configuration.'}), 503

        results = mobile_classifier.analyze_lure(filepath)
        results['image_path'] = filepath
        results['image_name'] = filename

        if 'error' in results:
            print(f'[ERROR] Analysis failed: {results["error"]}')
            results['lure_type'] = 'Analysis Failed'
            results['confidence'] = 0
            results['analysis_method'] = 'ChatGPT Vision API (Failed)'

        json_file = mobile_classifier.save_analysis_to_json(results)
        results['json_file'] = json_file

        if supabase_service.is_enabled():
            try:
                if not results.get('lure_type'):
                    results['lure_type'] = 'Unknown'

                image_url = supabase_service.upload_lure_image(user_id, filepath, filename)
                if image_url:
                    results['image_url'] = image_url

                if pending_scan_id:
                    supabase_result = supabase_service.update_scan_with_results(pending_scan_id, results)
                else:
                    supabase_result = supabase_service.save_lure_analysis(user_id, results)

                if supabase_result:
                    results['supabase_id'] = supabase_result.get('id')

            except Exception as e:
                print(f'[WARNING] Supabase save failed: {e}')
                # Scan already counted via pending record — continue

        print(f'[OK] Analysis complete for user {user_id}')
        return jsonify(results)

    except Exception as e:
        print(f'[ERROR] Upload handler: {e}')
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500


@app.route('/estimate-cost', methods=['POST'])
@limiter.limit('30 per hour')
@require_auth
def estimate_cost():
    if not mobile_classifier:
        return jsonify({'error': 'Lure classifier not initialised.'}), 503

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if not file.filename:
        return jsonify({'error': 'No file selected'}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    try:
        cost_estimate = mobile_classifier.estimate_api_cost(filepath)
        return jsonify(cost_estimate)
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)


@app.route('/api/supabase/tackle-box')
@require_auth
def api_supabase_tackle_box():
    user_id = g.user_id

    if not supabase_service.is_enabled():
        return jsonify({'error': 'Supabase not configured'}), 503

    results = supabase_service.get_user_lure_analyses(user_id)
    return jsonify({'results': results})


@app.route('/api/verify-subscription')
@require_auth
def verify_subscription():
    user_id = g.user_id

    if not supabase_service.is_enabled():
        return jsonify({'is_pro': False, 'subscription_type': 'free'})

    is_pro = supabase_service.is_user_pro(user_id)
    subscription = supabase_service.get_user_subscription(user_id)

    if is_pro and subscription:
        return jsonify({
            'is_pro': True,
            'subscription_type': subscription.get('subscription_type'),
            'product_identifier': subscription.get('product_identifier'),
            'expires_at': subscription.get('expires_at'),
            'will_renew': subscription.get('will_renew', False),
        })

    return jsonify({'is_pro': False, 'subscription_type': 'free'})


@app.route('/api/account', methods=['DELETE'])
@limiter.limit('10 per hour')
@require_auth
def delete_account():
    """
    Full account deletion: Supabase storage, then auth user (DB cascades).
    Client must clear local data and sign out after success.
    """
    user_id = g.user_id

    if not supabase_service.is_enabled():
        return jsonify({
            'error': 'service_unavailable',
            'message': 'Account deletion is temporarily unavailable. Please try again later.',
        }), 503

    result = supabase_service.delete_user_account(user_id)
    if not result.get('success'):
        return jsonify({
            'error': 'account_deletion_failed',
            'message': result.get('error') or 'Could not delete account. Please try again or contact support.',
        }), 500

    return jsonify({
        'success': True,
        'message': 'Account deleted.',
        'storage_removed': result.get('storage_removed', 0),
    })


@app.route('/api/check-scan-quota')
@require_auth
def check_scan_quota():
    user_id = g.user_id

    if not supabase_service.is_enabled():
        return jsonify({'can_scan': True, 'reason': 'no_quota_system', 'unlimited': True})

    quota_status = supabase_service.can_user_scan(user_id)
    return jsonify(quota_status)


@app.route('/api/debug/user-scans')
@require_auth
def debug_user_scans():
    """Dev-only endpoint — disabled in production."""
    if os.getenv('FLASK_ENV') == 'production':
        return jsonify({'error': 'Not available in production'}), 404

    user_id = g.user_id

    if not supabase_service.is_enabled():
        return jsonify({'error': 'Supabase not enabled'}), 503

    all_scans = supabase_service.get_user_lure_analyses(user_id)
    monthly_count = supabase_service.get_monthly_scan_count(user_id)

    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    this_month = [s for s in all_scans if s.get('created_at', '') >= start_of_month.isoformat()]

    return jsonify({
        'user_id': user_id,
        'total_scans': len(all_scans),
        'monthly_count': monthly_count,
        'this_month_scans': len(this_month),
        'sample_scans': all_scans[:5],
    })


@app.route('/api/subscription-stats')
@require_admin
def subscription_stats():
    """Admin-only endpoint — requires ADMIN_USER_IDS to be set."""
    if not supabase_service.is_enabled():
        return jsonify({'error': 'Supabase not configured'}), 503

    try:
        response = supabase_service.client.rpc('get_subscription_stats').execute()
        if response.data:
            return jsonify(response.data[0])
        return jsonify({'total_users': 0, 'pro_users': 0, 'free_users': 0})
    except Exception as e:
        print(f'[ERROR] Stats query failed: {e}')
        return jsonify({'error': str(e)}), 500


# ---------------------------------------------------------------------------
# Static / legacy endpoints
# ---------------------------------------------------------------------------

@app.route('/reload-config')
def reload_config():
    try:
        import importlib
        importlib.reload(config)
        success = load_api_key()
        return jsonify({'success': success})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/tackle-box')
def tackle_box():
    try:
        results_dir = config.RESULTS_FOLDER
        if not os.path.exists(results_dir):
            return jsonify({'error': 'No analysis results found'})

        all_results = []
        for root, dirs, files in os.walk(results_dir):
            for file in files:
                if file.endswith('_analysis.json'):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            result_data = json.load(f)
                        all_results.append({
                            'id': file.replace('_analysis.json', ''),
                            'filename': result_data.get('image_name', 'Unknown'),
                            'image_path': result_data.get('image_path', ''),
                            'lure_type': result_data.get('lure_type', 'Unknown'),
                            'confidence': result_data.get('confidence', 0),
                            'analysis_date': result_data.get('analysis_date', 'Unknown'),
                            'target_species': result_data.get('chatgpt_analysis', {}).get('target_species', []),
                            'json_file': file_path,
                        })
                    except Exception:
                        continue

        all_results.sort(key=lambda x: x.get('analysis_date', ''), reverse=True)
        return render_template('tackle_box.html', results=all_results)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/tackle-box')
def api_tackle_box():
    try:
        results_dir = config.RESULTS_FOLDER
        if not os.path.exists(results_dir):
            return jsonify({'results': []})

        all_results = []
        for root, dirs, files in os.walk(results_dir):
            for file in files:
                if file.endswith('_analysis.json'):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            result_data = json.load(f)
                        all_results.append({
                            'id': file.replace('_analysis.json', ''),
                            'filename': result_data.get('image_name', 'Unknown'),
                            'image_path': result_data.get('image_path', ''),
                            'lure_type': result_data.get('lure_type', 'Unknown'),
                            'confidence': result_data.get('confidence', 0),
                            'analysis_date': result_data.get('analysis_date', 'Unknown'),
                            'target_species': result_data.get('chatgpt_analysis', {}).get('target_species', []),
                            'json_file': file_path,
                        })
                    except Exception:
                        continue

        all_results.sort(key=lambda x: x.get('analysis_date', ''), reverse=True)
        return jsonify({'results': all_results})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/lure-details/<result_id>')
def get_lure_details(result_id):
    try:
        results_dir = config.RESULTS_FOLDER
        for root, dirs, files in os.walk(results_dir):
            for file in files:
                if file.startswith(result_id) and file.endswith('_analysis.json'):
                    with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                        return jsonify(json.load(f))
        return jsonify({'error': 'Result not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/delete-lure/<result_id>', methods=['DELETE'])
@require_auth
def delete_lure(result_id):
    try:
        results_dir = config.RESULTS_FOLDER
        for root, dirs, files in os.walk(results_dir):
            for file in files:
                if file.startswith(result_id) and file.endswith('_analysis.json'):
                    os.remove(os.path.join(root, file))
                    return jsonify({'success': True})
        return jsonify({'error': 'Result not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/bulk-delete-lures', methods=['POST'])
@require_auth
def bulk_delete_lures():
    data = request.get_json()
    lure_ids = data.get('lure_ids', []) if data else []

    if not lure_ids:
        return jsonify({'error': 'No lure IDs provided'}), 400

    deleted, failed = 0, []
    results_dir = config.RESULTS_FOLDER

    for result_id in lure_ids:
        found = False
        for root, dirs, files in os.walk(results_dir):
            for file in files:
                if file.startswith(result_id) and file.endswith('_analysis.json'):
                    try:
                        os.remove(os.path.join(root, file))
                        deleted += 1
                        found = True
                    except Exception:
                        failed.append(result_id)
                    break
            if found:
                break
        if not found:
            failed.append(result_id)

    if deleted:
        return jsonify({
            'success': True,
            'deleted_count': deleted,
            'failed_count': len(failed),
        })
    return jsonify({'error': 'No lures were deleted'}), 400


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    try:
        return send_from_directory(config.UPLOAD_FOLDER, filename)
    except Exception:
        return jsonify({'error': 'Image not found'}), 404


if __name__ == '__main__':
    app.run(debug=config.FLASK_DEBUG, host=config.FLASK_HOST, port=config.FLASK_PORT)
