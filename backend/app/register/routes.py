from fastapi import APIRouter, HTTPException
from psycopg import errors

from app.database import blank, connect
from app.schemas import RegisterBody
from app.security import hash_password, make_token, public_user

router = APIRouter(prefix="/api/patient", tags=["register"])


@router.post("/register")
def patient_register(body: RegisterBody):
    if not body.phone.strip().isdigit() or len(body.phone.strip()) != 10:
        raise HTTPException(status_code=400, detail="Enter a valid 10-digit mobile number.")
    if body.password != body.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
    if not body.consent_accepted:
        raise HTTPException(status_code=400, detail="Please accept the declaration to continue.")
    if body.age is not None and not 1 <= body.age <= 120:
        raise HTTPException(status_code=400, detail="Age must be between 1 and 120.")
    if not body.pincode.isdigit() or len(body.pincode) != 6:
        raise HTTPException(status_code=400, detail="Enter a 6-digit pincode.")

    try:
        with connect() as conn:
            user = conn.execute(
                """
                INSERT INTO hospital.users
                    (created, full_name, email, phone, password_hash, role, is_active, deleted)
                VALUES (NOW(), %s, %s, %s, %s, 'patient', 1, 0)
                RETURNING id, full_name, email, role
                """,
                (body.full_name.strip(), str(body.email).strip(), body.phone.strip(), hash_password(body.password)),
            ).fetchone()
            conn.execute(
                """
                INSERT INTO hospital.patients
                    (created, user_id, age, gender, full_address, city, state, pincode, location,
                     marital_status, education, occupation, referred_by, consent_accepted, consent_at)
                VALUES
                    (NOW(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CASE WHEN %s = 1 THEN NOW() ELSE NULL END)
                """,
                (
                    user["id"],
                    body.age,
                    blank(body.gender),
                    body.full_address.strip(),
                    body.city.strip(),
                    body.state.strip(),
                    body.pincode.strip(),
                    body.location.strip(),
                    blank(body.marital_status),
                    blank(body.education),
                    blank(body.occupation),
                    blank(body.referred_by),
                    1 if body.consent_accepted else 0,
                    1 if body.consent_accepted else 0,
                ),
            )
    except errors.UniqueViolation as exc:
        constraint = exc.diag.constraint_name or ""
        if "phone" in constraint:
            raise HTTPException(status_code=409, detail="The phone has already been taken.") from exc
        raise HTTPException(status_code=409, detail="This email is already registered.") from exc
    except errors.CheckViolation as exc:
        raise HTTPException(status_code=400, detail="Pincode must be 6 digits.") from exc
    except errors.UndefinedTable as exc:
        raise HTTPException(
            status_code=503,
            detail="Run reference/registration_tables.sql in the postgres database first.",
        ) from exc

    return public_user(user, make_token(user["id"], "patient"))
