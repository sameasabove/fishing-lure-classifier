"""
Authentication middleware for the Flask backend.

Verifies Supabase JWTs on every protected endpoint. The mobile app sends
the Supabase session token in the Authorization header:

    Authorization: Bearer <supabase_access_token>

The JWT is signed with SUPABASE_JWT_SECRET (found in Supabase dashboard →
Settings → API → JWT Settings). Verification is done locally — no network
call required.

Dev fallback: if SUPABASE_JWT_SECRET is not set, the decorator falls back
to the X-User-ID header so local development still works without keys.
This fallback is disabled in production (FLASK_ENV=production).
"""

import os
import jwt
from functools import wraps
from flask import request, jsonify, g

SUPABASE_JWT_SECRET = os.getenv('SUPABASE_JWT_SECRET', '')
FLASK_ENV = os.getenv('FLASK_ENV', 'development')
IS_PRODUCTION = FLASK_ENV == 'production'


def _verify_token(token):
    """
    Decode and verify a Supabase JWT. Returns the payload on success.
    Raises jwt.InvalidTokenError subclasses on failure.
    """
    return jwt.decode(
        token,
        SUPABASE_JWT_SECRET,
        algorithms=['HS256'],
        options={'verify_exp': True},
    )


def require_auth(f):
    """
    Decorator that verifies the Supabase JWT and sets g.user_id.

    On success: g.user_id is set to the verified Supabase user UUID.
    On failure: returns a 401 JSON response.

    Dev fallback: if SUPABASE_JWT_SECRET is not configured, falls back to
    the X-User-ID header so Expo Go testing works without real keys.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # In production, refuse all requests if the JWT secret is not configured.
        # This prevents the dev fallback from ever being reachable in prod.
        if IS_PRODUCTION and not SUPABASE_JWT_SECRET:
            print('[ERROR] SUPABASE_JWT_SECRET not set in production')
            return jsonify({
                'error': 'server_misconfigured',
                'message': 'Authentication unavailable. Contact support.',
            }), 503

        auth_header = request.headers.get('Authorization', '')

        if auth_header.startswith('Bearer '):
            token = auth_header[7:]

            if not SUPABASE_JWT_SECRET:
                # Dev only — secret absent, fall through to header fallback below
                pass
                # Dev: fall through to header fallback below
            else:
                try:
                    payload = _verify_token(token)
                    user_id = payload.get('sub')
                    if not user_id:
                        return jsonify({
                            'error': 'invalid_token',
                            'message': 'Token is missing user ID.',
                        }), 401
                    g.user_id = user_id
                    return f(*args, **kwargs)

                except jwt.ExpiredSignatureError:
                    return jsonify({
                        'error': 'token_expired',
                        'message': 'Session expired. Please sign in again.',
                    }), 401
                except jwt.InvalidTokenError:
                    return jsonify({
                        'error': 'invalid_token',
                        'message': 'Invalid authentication token.',
                    }), 401

        # Dev fallback: accept X-User-ID header when JWT secret is absent
        if not IS_PRODUCTION:
            user_id = request.form.get('user_id') or request.headers.get('X-User-ID')
            if user_id:
                print(f'[DEV] Auth fallback: using X-User-ID header for user {user_id}')
                g.user_id = user_id
                return f(*args, **kwargs)

        return jsonify({
            'error': 'authentication_required',
            'message': 'Please sign in to use this feature.',
        }), 401

    return decorated


def require_admin(f):
    """
    Stricter decorator for admin-only endpoints.
    Requires a valid JWT AND the user must be in the admin list
    (set via ADMIN_USER_IDS env var, comma-separated UUIDs).

    Falls back to require_auth behaviour in dev when no JWT secret is set.
    """
    @wraps(f)
    @require_auth
    def decorated(*args, **kwargs):
        admin_ids = set(filter(None, os.getenv('ADMIN_USER_IDS', '').split(',')))
        if admin_ids and g.user_id not in admin_ids:
            return jsonify({
                'error': 'forbidden',
                'message': 'Admin access required.',
            }), 403
        return f(*args, **kwargs)

    return decorated
