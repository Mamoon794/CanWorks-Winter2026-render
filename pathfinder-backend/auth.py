"""
FastAPI authentication that verifies Supabase JWT tokens.

Supabase signs JWTs with ES256 (ECC P-256). We fetch the public JWKS
from Supabase's well-known endpoint to verify token signatures.
"""

import os
import requests
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, jwk, JWTError

load_dotenv()

security = HTTPBearer()

SUPABASE_URL = os.getenv("SUPABASE_URL")  # e.g. https://eafxorhxrvblxmsnbkug.supabase.co
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")  # legacy HS256 secret (fallback)

# Cache the JWKS so we don't fetch it on every request
_jwks_cache: dict | None = None

def _get_jwks() -> dict:
    """Fetch and cache the JSON Web Key Set from Supabase."""
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    if not SUPABASE_URL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_URL not configured"
        )

    jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    response = requests.get(jwks_url, timeout=10)
    response.raise_for_status()
    _jwks_cache = response.json()
    return _jwks_cache


def _get_signing_key(token: str) -> str:
    """Match the token's kid to the correct key from JWKS."""
    headers = jwt.get_unverified_header(token)
    kid = headers.get("kid")
    alg = headers.get("alg", "ES256")

    # If the token uses HS256, use the legacy secret
    if alg == "HS256":
        if not SUPABASE_JWT_SECRET:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="SUPABASE_JWT_SECRET not configured for HS256 token"
            )
        return SUPABASE_JWT_SECRET, ["HS256"]

    # For ES256 tokens, look up the key in JWKS
    jwks = _get_jwks()
    for key_data in jwks.get("keys", []):
        if key_data.get("kid") == kid:
            public_key = jwk.construct(key_data, algorithm=alg)
            return public_key.to_pem().decode("utf-8"), [alg]

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=f"No matching key found for kid={kid}"
    )


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials
    try:
        signing_key, algorithms = _get_signing_key(token)

        payload = jwt.decode(
            token,
            signing_key,
            algorithms=algorithms,
            audience="authenticated"
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID"
            )
        return user_id
    except JWTError as e:
        print(f"JWT Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
