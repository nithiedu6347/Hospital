import csv
import io
import os
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from app.database import connect
from app.schemas import LoginBody
from app.security import check_password, hash_password, make_token, public_user, require_role

router = APIRouter(prefix="/api/admin", tags=["admin"])


def ensure_admin():
    email = os.getenv("ADMIN_EMAIL", "admin@gmail.com")
    password = os.getenv("ADMIN_PASSWORD", "admin123")
    phone = os.getenv("ADMIN_PHONE", "9000000001")
    try:
        with connect() as conn:
            exists = conn.execute(
                "SELECT id FROM hospital.users WHERE lower(email) = lower(%s)",
                (email,),
            ).fetchone()
            if exists:
                return
            conn.execute(
                """
                INSERT INTO hospital.users
                    (created, full_name, email, phone, password_hash, role, is_active, deleted)
                VALUES (NOW(), 'Admin', %s, %s, %s, 'admin', 1, 0)
                """,
                (email, phone, hash_password(password)),
            )
    except Exception as exc:
        print(f"Admin account was not created: {exc}")


def login_admin(email: str, password: str) -> dict:
    with connect() as conn:
        row = conn.execute(
            """
            SELECT id, full_name, email, password_hash, role, is_active
            FROM hospital.users
            WHERE lower(email) = lower(%s) AND deleted = 0
            """,
            (email.strip(),),
        ).fetchone()
        if row is None or not check_password(password, row["password_hash"]):
            raise HTTPException(status_code=401, detail="Email or password is incorrect.")
        if row["is_active"] != 1:
            raise HTTPException(status_code=403, detail="This account is turned off.")
        if row["role"] != "admin":
            raise HTTPException(status_code=403, detail="This sign in is for authorized staff only.")
        conn.execute(
            "UPDATE hospital.users SET last_login = NOW(), modified = NOW() WHERE id = %s",
            (row["id"],),
        )
    return public_user(row, make_token(row["id"], row["role"]))


@router.post("/login")
def admin_login(body: LoginBody):
    return login_admin(body.email, body.password)


def _ago(when):
    if when is None:
        return ""
    now = datetime.now()
    minutes = int((now - when).total_seconds() // 60)
    if minutes < 1:
        return "just now"
    if minutes < 60:
        return f"{minutes} min ago"
    if when.date() == now.date():
        hours = minutes // 60
        unit = "hr" if hours == 1 else "hrs"
        return f"{hours} {unit} ago"
    clock = when.strftime("%I:%M %p").lstrip("0")
    if (now.date() - when.date()).days == 1:
        return f"Yesterday, {clock}"
    return f"{when.strftime('%d %b').lstrip('0')}, {clock}"


def _initials(full_name):
    parts = [part for part in (full_name or "").split() if part]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[1][0]).upper()


@router.get("/summary")
def admin_summary(payload: dict = Depends(require_role("admin"))):
    with connect() as conn:
        user = conn.execute(
            "SELECT full_name, email FROM hospital.users WHERE id = %s AND deleted = 0",
            (payload["sub"],),
        ).fetchone()
        patients = conn.execute(
            """
            SELECT COUNT(*) AS total,
                   COUNT(*) FILTER (WHERE created >= date_trunc('month', NOW())) AS this_month
            FROM hospital.patients
            WHERE deleted = 0
            """
        ).fetchone()
        weeks = conn.execute(
            """
            SELECT
                COUNT(*) FILTER (
                    WHERE submitted_at >= date_trunc('week', NOW())
                      AND submitted_at < date_trunc('week', NOW()) + interval '7 days'
                ) AS this_week,
                COUNT(*) FILTER (
                    WHERE submitted_at >= date_trunc('week', NOW()) - interval '7 days'
                      AND submitted_at < date_trunc('week', NOW())
                ) AS last_week
            FROM hospital.quiz_attempts
            WHERE deleted = 0 AND status = 'submitted'
            """
        ).fetchone()
        day_rows = conn.execute(
            """
            SELECT EXTRACT(ISODOW FROM submitted_at)::int AS dow, COUNT(*) AS total
            FROM hospital.quiz_attempts
            WHERE deleted = 0 AND status = 'submitted'
              AND submitted_at >= date_trunc('week', NOW())
              AND submitted_at < date_trunc('week', NOW()) + interval '7 days'
            GROUP BY 1
            """
        ).fetchall()
        risk_rows = conn.execute(
            """
            SELECT DISTINCT ON (attempt.user_id) attempt.total_score
            FROM hospital.quiz_attempts AS attempt
            JOIN hospital.assessments AS assessment ON assessment.id = attempt.assessment_id
            WHERE attempt.deleted = 0
              AND attempt.status = 'submitted'
              AND assessment.code = 'beis-10'
              AND attempt.total_score IS NOT NULL
            ORDER BY attempt.user_id, attempt.submitted_at DESC NULLS LAST, attempt.id DESC
            """
        ).fetchall()
        registered_rows = conn.execute(
            """
            SELECT users.full_name, patient.created
            FROM hospital.patients AS patient
            JOIN hospital.users AS users ON users.id = patient.user_id
            WHERE patient.deleted = 0 AND users.deleted = 0
            ORDER BY patient.created DESC NULLS LAST, patient.id DESC
            LIMIT 10
            """
        ).fetchall()
        activity_rows = conn.execute(
            """
            SELECT users.full_name, assessment.code, assessment.title, attempt.status,
                   attempt.total_score, attempt.submitted_at, attempt.created
            FROM hospital.quiz_attempts AS attempt
            JOIN hospital.users AS users ON users.id = attempt.user_id
            JOIN hospital.assessments AS assessment ON assessment.id = attempt.assessment_id
            WHERE attempt.deleted = 0 AND users.deleted = 0
            ORDER BY COALESCE(attempt.submitted_at, attempt.created) DESC NULLS LAST, attempt.id DESC
            LIMIT 20
            """
        ).fetchall()
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in again.")
    by_day = {row["dow"]: row["total"] for row in day_rows}
    low = moderate = high = 0
    for row in risk_rows:
        score = row["total_score"]
        if score <= 20:
            high += 1
        elif score <= 35:
            moderate += 1
        else:
            low += 1
    return {
        "full_name": user["full_name"],
        "email": user["email"],
        "patients": patients["total"],
        "patients_this_month": patients["this_month"],
        "completed_this_week": weeks["this_week"],
        "completed_last_week": weeks["last_week"],
        "high_risk": high,
        "risk": {"low": low, "moderate": moderate, "high": high},
        "days": [
            {"label": label, "count": by_day.get(index, 0)}
            for index, label in enumerate(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], start=1)
        ],
        "activity": _activity(activity_rows, registered_rows),
    }


def _activity(rows, registered_rows):
    events = []
    for row in rows:
        when = row["submitted_at"] or row["created"]
        if row["status"] == "submitted":
            events.append({
                "at": when,
                "name": row["full_name"],
                "initials": _initials(row["full_name"]),
                "action": f"completed the {row['title']}",
                "tag": "Completed",
                "tone": "ok",
                "dot": "green",
            })
            if row["code"] == "beis-10" and row["total_score"] is not None and row["total_score"] <= 20:
                events.append({
                    "at": when,
                    "name": row["full_name"],
                    "initials": _initials(row["full_name"]),
                    "action": "was flagged as high risk",
                    "tag": "High risk",
                    "tone": "alert",
                    "dot": "red",
                })
        else:
            events.append({
                "at": row["created"],
                "name": row["full_name"],
                "initials": _initials(row["full_name"]),
                "action": f"started the {row['title']}",
                "tag": "In progress",
                "tone": "info",
                "dot": "blue",
            })
    for row in registered_rows:
        events.append({
            "at": row["created"],
            "name": row["full_name"],
            "initials": _initials(row["full_name"]),
            "action": "registered a new account",
            "tag": "Registered",
            "tone": "ok",
            "dot": "green",
        })
    events.sort(key=lambda item: item["at"] or datetime.min, reverse=True)
    for item in events:
        item["when"] = _ago(item.pop("at"))
    return events


def _iso(value):
    if value is None:
        return None
    return value.isoformat()


def _patient_row(row):
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "full_name": row["full_name"],
        "age": row["age"],
        "gender": row["gender"],
        "phone": row["phone"],
        "email": row["email"],
        "city": row["city"],
        "state": row["state"],
        "full_address": row["full_address"],
        "pincode": row["pincode"],
        "location": row["location"],
        "marital_status": row["marital_status"],
        "education": row["education"],
        "occupation": row["occupation"],
        "referred_by": row["referred_by"],
        "consent_accepted": row["consent_accepted"] == 1,
        "is_active": row["is_active"] == 1,
        "created": _iso(row["created"]),
    }


@router.get("/patients")
def admin_patients(_: dict = Depends(require_role("admin"))):
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT p.id, p.user_id, p.age, p.gender, p.city, p.state, p.full_address, p.pincode,
                   p.location, p.marital_status, p.education, p.occupation, p.referred_by,
                   p.consent_accepted, p.created, u.full_name, u.email, u.phone, u.is_active
            FROM hospital.patients p
            JOIN hospital.users u ON u.id = p.user_id
            WHERE p.deleted = 0 AND u.deleted = 0
            ORDER BY p.created DESC NULLS LAST, p.id DESC
            """
        ).fetchall()
        stats = conn.execute(
            """
            SELECT COUNT(*) AS total,
                   COUNT(*) FILTER (WHERE p.consent_accepted = 1) AS signed,
                   COUNT(*) FILTER (WHERE p.created >= NOW() - interval '7 days') AS joined_week
            FROM hospital.patients p
            JOIN hospital.users u ON u.id = p.user_id
            WHERE p.deleted = 0 AND u.deleted = 0
            """
        ).fetchone()
    return {
        "total": stats["total"],
        "signed": stats["signed"],
        "joined_week": stats["joined_week"],
        "patients": [_patient_row(row) for row in rows],
    }


@router.get("/patients/{patient_id}")
def admin_patient(patient_id: int, _: dict = Depends(require_role("admin"))):
    with connect() as conn:
        row = conn.execute(
            """
            SELECT p.id, p.user_id, p.age, p.gender, p.city, p.state, p.full_address, p.pincode,
                   p.location, p.marital_status, p.education, p.occupation, p.referred_by,
                   p.consent_accepted, p.created, u.full_name, u.email, u.phone, u.is_active
            FROM hospital.patients p
            JOIN hospital.users u ON u.id = p.user_id
            WHERE p.id = %s AND p.deleted = 0 AND u.deleted = 0
            """,
            (patient_id,),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Patient not found.")
        answer_rows = conn.execute(
            """
            SELECT attempt.id AS attempt_id, assessment.code, assessment.title, attempt.status,
                   attempt.submitted_at, attempt.created, attempt.total_score,
                   question.sort_order, question.prompt, question.prompt_ta,
                   (
                       SELECT opt->>'label'
                       FROM jsonb_array_elements(question.options) AS opt
                       WHERE (opt->>'option_id')::int = answer.option_id
                       LIMIT 1
                   ) AS chosen,
                   answer.score AS chosen_score
            FROM hospital.quiz_attempts attempt
            JOIN hospital.assessments assessment ON assessment.id = attempt.assessment_id
            JOIN hospital.questions question
              ON question.assessment_id = assessment.id AND question.deleted = 0
            LEFT JOIN hospital.quiz_answers answer
              ON answer.attempt_id = attempt.id
             AND answer.question_id = question.id
             AND answer.deleted = 0
            WHERE attempt.user_id = %s AND attempt.deleted = 0
            ORDER BY attempt.id DESC, question.sort_order
            """,
            (row["user_id"],),
        ).fetchall()
    patient = _patient_row(row)
    grouped = {}
    for item in answer_rows:
        quiz = grouped.get(item["attempt_id"])
        if quiz is None:
            quiz = {
                "code": item["code"],
                "title": item["title"],
                "status": item["status"],
                "submitted_at": _iso(item["submitted_at"]),
                "created": _iso(item["created"]),
                "total_score": item["total_score"],
                "questions": [],
            }
            grouped[item["attempt_id"]] = quiz
        quiz["questions"].append(
            {
                "number": item["sort_order"],
                "prompt": item["prompt"],
                "prompt_ta": item["prompt_ta"],
                "answer": item["chosen"],
                "score": item["chosen_score"],
            }
        )
    patient["assessments"] = []
    for quiz in grouped.values():
        answered = sum(1 for question in quiz["questions"] if question["answer"])
        quiz["answered"] = answered
        quiz["question_count"] = len(quiz["questions"])
        patient["assessments"].append(quiz)
    return patient


@router.get("/quizzes")
def admin_quizzes(_: dict = Depends(require_role("admin"))):
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT assessment.id, assessment.code, assessment.title, assessment.category,
                   assessment.description, assessment.created, assessment.deleted,
                   COUNT(question.id) AS question_count
            FROM hospital.assessments assessment
            LEFT JOIN hospital.questions question
              ON question.assessment_id = assessment.id AND question.deleted = 0
            GROUP BY assessment.id
            ORDER BY assessment.id
            """
        ).fetchall()
    quizzes = [
        {
            "code": row["code"],
            "title": row["title"],
            "category": row["category"],
            "description": row["description"],
            "question_count": row["question_count"],
            "created": _iso(row["created"]),
            "active": row["deleted"] == 0,
        }
        for row in rows
    ]
    active = [quiz for quiz in quizzes if quiz["active"]]
    return {
        "quizzes": active,
        "inactive": [quiz for quiz in quizzes if not quiz["active"]],
        "quiz_count": len(active),
        "active_count": len(active),
        "question_count": sum(quiz["question_count"] for quiz in active),
    }


@router.get("/quizzes/{code}")
def admin_quiz(code: str, _: dict = Depends(require_role("admin"))):
    with connect() as conn:
        assessment = conn.execute(
            """
            SELECT id, code, title, category, description, created, deleted
            FROM hospital.assessments
            WHERE code = %s
            """,
            (code,),
        ).fetchone()
        if assessment is None:
            raise HTTPException(status_code=404, detail="This quiz is not available.")
        questions = conn.execute(
            """
            SELECT id, sort_order, prompt, prompt_ta, options
            FROM hospital.questions
            WHERE assessment_id = %s AND deleted = 0
            ORDER BY sort_order
            """,
            (assessment["id"],),
        ).fetchall()
    return {
        "code": assessment["code"],
        "title": assessment["title"],
        "category": assessment["category"],
        "description": assessment["description"],
        "created": _iso(assessment["created"]),
        "active": assessment["deleted"] == 0,
        "question_count": len(questions),
        "questions": [
            {
                "id": question["id"],
                "number": question["sort_order"],
                "prompt": question["prompt"],
                "prompt_ta": question["prompt_ta"],
                "options": [
                    {"id": item["option_id"], "number": item["order"], "label": item["label"]}
                    for item in sorted(question["options"] or [], key=lambda item: item.get("order", 0))
                ],
            }
            for question in questions
        ],
    }


@router.get("/quizzes/{code}/answers")
def admin_quiz_answers(
    code: str,
    name: str = "",
    patient_id: int | None = None,
    _: dict = Depends(require_role("admin")),
):
    query = name.strip()
    if not query and patient_id is None:
        raise HTTPException(status_code=400, detail="Enter a patient name.")
    with connect() as conn:
        assessment = conn.execute(
            "SELECT id, title FROM hospital.assessments WHERE code = %s AND deleted = 0",
            (code,),
        ).fetchone()
        if assessment is None:
            raise HTTPException(status_code=404, detail="This quiz is not available.")
        if patient_id is None:
            matches = conn.execute(
                """
                SELECT p.id, u.full_name
                FROM hospital.patients p
                JOIN hospital.users u ON u.id = p.user_id
                WHERE p.deleted = 0 AND u.deleted = 0
                  AND lower(u.full_name) LIKE lower(%s)
                ORDER BY CASE WHEN lower(u.full_name) = lower(%s) THEN 0 ELSE 1 END, u.full_name
                """,
                (f"%{query}%", query),
            ).fetchall()
        else:
            matches = conn.execute(
                """
                SELECT p.id, u.full_name
                FROM hospital.patients p
                JOIN hospital.users u ON u.id = p.user_id
                WHERE p.id = %s AND p.deleted = 0 AND u.deleted = 0
                """,
                (patient_id,),
            ).fetchall()
        if len(matches) != 1:
            return {
                "found": False,
                "matches": [{"id": row["id"], "full_name": row["full_name"]} for row in matches],
                "patient": None,
                "answers": {},
            }
        patient = matches[0]
        attempt = conn.execute(
            """
            SELECT id, status, total_score, submitted_at
            FROM hospital.quiz_attempts
            WHERE user_id = (
                SELECT user_id FROM hospital.patients WHERE id = %s
            )
              AND assessment_id = %s AND deleted = 0
            ORDER BY id DESC
            LIMIT 1
            """,
            (patient["id"], assessment["id"]),
        ).fetchone()
        saved = []
        if attempt is not None:
            saved = conn.execute(
                """
                SELECT question_id, option_id, score
                FROM hospital.quiz_answers
                WHERE attempt_id = %s AND deleted = 0
                """,
                (attempt["id"],),
            ).fetchall()
    return {
        "found": attempt is not None and len(saved) > 0,
        "matches": [{"id": patient["id"], "full_name": patient["full_name"]}],
        "patient": {"id": patient["id"], "full_name": patient["full_name"]},
        "status": None if attempt is None else attempt["status"],
        "total_score": None if attempt is None else attempt["total_score"],
        "submitted_at": None if attempt is None else _iso(attempt["submitted_at"]),
        "answers": {str(row["question_id"]): row["option_id"] for row in saved},
    }


def _csv(headers, rows):
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(headers)
    writer.writerows(rows)
    return buffer.getvalue()


@router.get("/reports")
def admin_reports(_: dict = Depends(require_role("admin"))):
    with connect() as conn:
        month = conn.execute(
            """
            SELECT COUNT(*) AS total
            FROM hospital.quiz_attempts
            WHERE deleted = 0 AND status = 'submitted'
              AND submitted_at >= date_trunc('month', NOW())
            """
        ).fetchone()
        risk = conn.execute(
            """
            SELECT COUNT(*) AS total
            FROM hospital.quiz_attempts attempt
            JOIN hospital.assessments assessment ON assessment.id = attempt.assessment_id
            WHERE attempt.deleted = 0 AND attempt.status = 'submitted'
              AND assessment.code = 'beis-10' AND attempt.total_score <= 20
              AND attempt.submitted_at >= NOW() - interval '7 days'
            """
        ).fetchone()
        responses = conn.execute(
            "SELECT COUNT(*) AS total FROM hospital.quiz_answers WHERE deleted = 0"
        ).fetchone()
    month_name = datetime.now().strftime("%B %Y")
    return {
        "cards": [
            {
                "id": "monthly",
                "badge": "PDF",
                "title": "Monthly assessment summary",
                "detail": f"{month_name}, {month['total']} completed",
                "ready": True,
            },
            {
                "id": "high-risk",
                "badge": "PDF",
                "title": "High-risk patient follow-ups",
                "detail": f"Last 7 days, {risk['total']} patients",
                "ready": True,
            },
            {
                "id": "responses",
                "badge": "XLSX",
                "title": "Question response analysis",
                "detail": f"{responses['total']} saved answers",
                "ready": True,
            },
            {
                "id": "workload",
                "badge": "XLSX",
                "title": "Counsellor workload",
                "detail": f"{month_name}, Preparing",
                "ready": False,
            },
        ]
    }


@router.get("/reports/{kind}")
def download_report(kind: str, _: dict = Depends(require_role("admin"))):
    with connect() as conn:
        if kind == "monthly":
            rows = conn.execute(
                """
                SELECT users.full_name, assessment.title, attempt.total_score, attempt.submitted_at
                FROM hospital.quiz_attempts attempt
                JOIN hospital.users users ON users.id = attempt.user_id
                JOIN hospital.assessments assessment ON assessment.id = attempt.assessment_id
                WHERE attempt.deleted = 0 AND attempt.status = 'submitted'
                  AND attempt.submitted_at >= date_trunc('month', NOW())
                ORDER BY attempt.submitted_at DESC
                """
            ).fetchall()
            body = _csv(
                ["Patient", "Assessment", "Score", "Submitted"],
                [[row["full_name"], row["title"], row["total_score"], _iso(row["submitted_at"])] for row in rows],
            )
            filename = "monthly-assessment-summary.csv"
        elif kind == "high-risk":
            rows = conn.execute(
                """
                SELECT users.full_name, users.phone, attempt.total_score, attempt.submitted_at
                FROM hospital.quiz_attempts attempt
                JOIN hospital.users users ON users.id = attempt.user_id
                JOIN hospital.assessments assessment ON assessment.id = attempt.assessment_id
                WHERE attempt.deleted = 0 AND attempt.status = 'submitted'
                  AND assessment.code = 'beis-10' AND attempt.total_score <= 20
                  AND attempt.submitted_at >= NOW() - interval '7 days'
                ORDER BY attempt.total_score, attempt.submitted_at DESC
                """
            ).fetchall()
            body = _csv(
                ["Patient", "Phone", "BEIS-10 score", "Submitted"],
                [[row["full_name"], row["phone"], row["total_score"], _iso(row["submitted_at"])] for row in rows],
            )
            filename = "high-risk-follow-ups.csv"
        elif kind == "responses":
            rows = conn.execute(
                """
                SELECT users.full_name, assessment.title, question.sort_order, question.prompt,
                       (
                           SELECT opt->>'label'
                           FROM jsonb_array_elements(question.options) AS opt
                           WHERE (opt->>'option_id')::int = answer.option_id
                           LIMIT 1
                       ) AS label,
                       answer.score
                FROM hospital.quiz_answers answer
                JOIN hospital.quiz_attempts attempt ON attempt.id = answer.attempt_id
                JOIN hospital.users users ON users.id = attempt.user_id
                JOIN hospital.assessments assessment ON assessment.id = attempt.assessment_id
                JOIN hospital.questions question ON question.id = answer.question_id
                WHERE answer.deleted = 0
                ORDER BY users.full_name, assessment.id, question.sort_order
                """
            ).fetchall()
            body = _csv(
                ["Patient", "Assessment", "Question", "Prompt", "Answer", "Score"],
                [
                    [row["full_name"], row["title"], row["sort_order"], row["prompt"], row["label"], row["score"]]
                    for row in rows
                ],
            )
            filename = "question-response-analysis.csv"
        else:
            raise HTTPException(status_code=404, detail="That report is not ready.")
    return Response(
        content=body,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
