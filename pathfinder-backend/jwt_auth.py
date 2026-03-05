from fastapi import Request, HTTPException
import jwt 
from jwt.algorithms import RSAAlgorithm, ECAlgorithm
import httpx
import os
import json

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")

_jwks_cache = None

def get_jwks():
    global _jwks_cache
    if _jwks_cache is None:
        url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        response = httpx.get(url)
        response.raise_for_status()
        _jwks_cache = response.json()
    return _jwks_cache

def verify_jwt(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or malformed auth header")

    token = auth_header.split(" ", 1)[1]

    try:
        # Decode header without verifying to get the kid
        unverified_header = jwt.get_unverified_header(token)
        print("Token header:", unverified_header)

        jwks = get_jwks()
        print("JWKS keys found:", [k.get("kid") for k in jwks["keys"]])
        print("JWKS key types:", [k.get("kty") for k in jwks["keys"]])

        # Match kid from token to key in JWKS
        key_data = None
        for key in jwks["keys"]:
            if key["kid"] == unverified_header.get("kid"):
                key_data = key
                break

        if not key_data:
            print("No matching kid found. Token kid:", unverified_header.get("kid"))
            raise HTTPException(status_code=401, detail="No matching key found")

        # Convert JWK to public key based on key type
        key_type = key_data.get("kty")
        if key_type == "RSA":
            public_key = RSAAlgorithm.from_jwk(json.dumps(key_data))
            algorithms = ["RS256"]
        elif key_type == "EC":
            public_key = ECAlgorithm.from_jwk(json.dumps(key_data))
            algorithms = ["ES256"]
        else:
            print(f"Unsupported key type: {key_type}")
            raise HTTPException(status_code=401, detail=f"Unsupported key type: {key_type}")

        # Decode with the appropriate algorithm
        # Note: options={"verify_aud": False} allows tokens without audience claim
        payload = jwt.decode(
            token,
            public_key,
            algorithms=algorithms,
            audience="authenticated"  # Add this back for security
        )
        print("Payload:", payload)
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        print("JWT Error:", str(e))
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")