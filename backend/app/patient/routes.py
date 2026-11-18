from fastapi import APIRouter, Depends, HTTPException

from app.database import connect
from app.schemas import LoginBody
from app.security import check_password, make_token, public_user, require_role

router = APIRouter(prefix="/api/patient", tags=["patient"])


@router.post("/login")
def patient_login(body: LoginBody):
    with connect() as conn:
        row = conn.execute(
            """
            SELECT id, full_name, email, password_hash, role, is_active
            FROM hospital.users
            WHERE lower(email) = lower(%s) AND deleted = 0
            """,
            (body.email.strip(),),
        ).fetchone()
        if row is None or not check_password(body.password, row["password_hash"]):
            raise HTTPException(status_code=401, detail="Email or password is incorrect.")
        if row["is_active"] != 1:
            raise HTTPException(status_code=403, detail="This account is turned off.")
        if row["role"] != "patient":
            raise HTTPException(status_code=403, detail="Use the admin sign in for staff accounts.")
        conn.execute(
            "UPDATE hospital.users SET last_login = NOW(), modified = NOW() WHERE id = %s",
            (row["id"],),
        )
    return public_user(row, make_token(row["id"], row["role"]))


@router.get("/me")
def patient_me(payload: dict = Depends(require_role("patient"))):
    with connect() as conn:
        user = conn.execute(
            "SELECT full_name, email FROM hospital.users WHERE id = %s AND role = 'patient' AND deleted = 0",
            (payload["sub"],),
        ).fetchone()
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in again.")
    return user
