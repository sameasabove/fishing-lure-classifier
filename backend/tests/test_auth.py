"""
Tests for backend/auth.py

Covers JWT verification, the require_auth decorator,
and the dev fallback behaviour. Does not require live Supabase keys —
we generate test JWTs with a known secret.
"""

import os
import sys
import time
import jwt
import pytest

# Add backend/ to path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

TEST_SECRET = 'test-jwt-secret-for-unit-tests'
TEST_USER_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'


def make_token(user_id=TEST_USER_ID, secret=TEST_SECRET, expired=False):
    """Generate a signed JWT the same way Supabase does."""
    exp = int(time.time()) + (-10 if expired else 3600)
    payload = {'sub': user_id, 'exp': exp, 'role': 'authenticated'}
    return jwt.encode(payload, secret, algorithm='HS256')


# ---------------------------------------------------------------------------
# _verify_token unit tests
# ---------------------------------------------------------------------------

class TestVerifyToken:
    def setup_method(self):
        import auth
        auth.SUPABASE_JWT_SECRET = TEST_SECRET

    def test_valid_token_returns_payload(self):
        import auth
        token = make_token()
        payload = auth._verify_token(token)
        assert payload['sub'] == TEST_USER_ID

    def test_expired_token_raises(self):
        import auth
        token = make_token(expired=True)
        with pytest.raises(jwt.ExpiredSignatureError):
            auth._verify_token(token)

    def test_wrong_secret_raises(self):
        import auth
        token = make_token(secret='wrong-secret')
        with pytest.raises(jwt.InvalidTokenError):
            auth._verify_token(token)

    def test_garbage_token_raises(self):
        import auth
        with pytest.raises(jwt.InvalidTokenError):
            auth._verify_token('not.a.token')


# ---------------------------------------------------------------------------
# require_auth decorator — Flask integration tests
# ---------------------------------------------------------------------------

@pytest.fixture
def app():
    """Minimal Flask app with a protected test endpoint."""
    from flask import Flask, g, jsonify
    import auth as auth_module

    auth_module.SUPABASE_JWT_SECRET = TEST_SECRET
    auth_module.IS_PRODUCTION = False

    flask_app = Flask(__name__)
    flask_app.config['TESTING'] = True

    @flask_app.route('/protected')
    @auth_module.require_auth
    def protected():
        return jsonify({'user_id': g.user_id})

    return flask_app


@pytest.fixture
def client(app):
    return app.test_client()


class TestRequireAuth:
    def test_valid_bearer_token_grants_access(self, client):
        token = make_token()
        res = client.get('/protected', headers={'Authorization': f'Bearer {token}'})
        assert res.status_code == 200
        assert res.get_json()['user_id'] == TEST_USER_ID

    def test_missing_auth_header_returns_401(self, client):
        res = client.get('/protected')
        assert res.status_code == 401
        assert res.get_json()['error'] == 'authentication_required'

    def test_expired_token_returns_401(self, client):
        token = make_token(expired=True)
        res = client.get('/protected', headers={'Authorization': f'Bearer {token}'})
        assert res.status_code == 401
        assert res.get_json()['error'] == 'token_expired'

    def test_invalid_token_returns_401(self, client):
        res = client.get('/protected', headers={'Authorization': 'Bearer garbage.token.here'})
        assert res.status_code == 401
        assert res.get_json()['error'] == 'invalid_token'

    def test_wrong_secret_returns_401(self, client):
        token = make_token(secret='different-secret')
        res = client.get('/protected', headers={'Authorization': f'Bearer {token}'})
        assert res.status_code == 401

    def test_bearer_prefix_required(self, client):
        token = make_token()
        res = client.get('/protected', headers={'Authorization': token})
        assert res.status_code == 401


class TestDevFallback:
    """Dev fallback: X-User-ID header accepted when JWT secret is absent."""

    @pytest.fixture
    def dev_client(self):
        from flask import Flask, g, jsonify
        import auth as auth_module

        auth_module.SUPABASE_JWT_SECRET = ''  # no secret configured
        auth_module.IS_PRODUCTION = False

        flask_app = Flask(__name__)
        flask_app.config['TESTING'] = True

        @flask_app.route('/protected')
        @auth_module.require_auth
        def protected():
            return jsonify({'user_id': g.user_id})

        return flask_app.test_client()

    def test_x_user_id_header_accepted_in_dev(self, dev_client):
        res = dev_client.get('/protected', headers={'X-User-ID': TEST_USER_ID})
        assert res.status_code == 200
        assert res.get_json()['user_id'] == TEST_USER_ID

    def test_no_header_returns_401_even_in_dev(self, dev_client):
        res = dev_client.get('/protected')
        assert res.status_code == 401


class TestProductionMode:
    """In production, the dev fallback must be disabled."""

    @pytest.fixture
    def prod_client(self):
        from flask import Flask, g, jsonify
        import auth as auth_module

        auth_module.SUPABASE_JWT_SECRET = ''  # secret not yet set
        auth_module.IS_PRODUCTION = True

        flask_app = Flask(__name__)
        flask_app.config['TESTING'] = True

        @flask_app.route('/protected')
        @auth_module.require_auth
        def protected():
            return jsonify({'user_id': g.user_id})

        return flask_app.test_client()

    def test_x_user_id_rejected_in_production(self, prod_client):
        res = prod_client.get('/protected', headers={'X-User-ID': TEST_USER_ID})
        assert res.status_code == 503  # misconfigured server, not 401
        assert res.get_json()['error'] == 'server_misconfigured'
