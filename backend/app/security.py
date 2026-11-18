import base64
import hashlib
import hmac
import json
import time

import bcrypt
from fastapi import Header, HTTPException

from app.config import SECRET, TOKEN_HOURS


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def check_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except ValueError:
        return False


def make_token(user_id: int, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": int(time.time()) + TOKEN_HOURS * 60 * 60,
    }
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    signature = hmac.new(SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
    return f"{body}.{signature}"


def read_token(token: str) -> dict:
    try:
        body, signature = token.split(".", 1)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Sign in again.") from exc
    expected = hmac.new(SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=401, detail="Sign in again.")
    padded = body + "=" * (-len(body) % 4)
    payload = json.loads(base64.urlsafe_b64decode(padded))
    if payload.get("exp", 0) < time.time():
        raise HTTPException(status_code=401, detail="Sign in again.")
    return payload


def require_role(expected: str):
    def checker(authorization: str | None = Header(default=None)):
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Sign in again.")
        payload = read_token(authorization.removeprefix("Bearer ").strip())
        if payload.get("role") != expected:
            raise HTTPException(status_code=403, detail="This account cannot open that page.")
        return payload

    return checker


def public_user(row: dict, token: str) -> dict:
    return {
        "token": token,
        "role": row["role"],
        "full_name": row["full_name"],
        "email": row["email"],
    }
