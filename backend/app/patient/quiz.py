import json

from fastapi import APIRouter, Depends, HTTPException

from app.database import connect
from app.patient.quiz_data import ASSESSMENTS, assessment_by_code
from app.schemas import QuizAnswerBody
from app.security import require_role

router = APIRouter(prefix="/api/patient/quiz", tags=["quiz"])


def ensure_quiz():
    statements = [
        "CREATE SEQUENCE IF NOT EXISTS hospital.assessments_id_seq",
        """
        CREATE TABLE IF NOT EXISTS hospital.assessments (
            id bigint NOT NULL DEFAULT nextval('hospital.assessments_id_seq'::regclass),
            created timestamp without time zone,
            created_by integer,
            modified timestamp without time zone,
            modified_by integer,
            deleted smallint DEFAULT 0,
            code text NOT NULL,
            title text NOT NULL,
            category text NOT NULL,
            description text NOT NULL,
            duration_label text NOT NULL,
            CONSTRAINT assessments_pkey PRIMARY KEY (id),
            CONSTRAINT assessments_code_key UNIQUE (code)
        )
        """,
        "CREATE SEQUENCE IF NOT EXISTS hospital.questions_id_seq",
        """
        CREATE TABLE IF NOT EXISTS hospital.questions (
            id bigint NOT NULL DEFAULT nextval('hospital.questions_id_seq'::regclass),
            created timestamp without time zone,
            created_by integer,
            modified timestamp without time zone,
            modified_by integer,
            deleted smallint DEFAULT 0,
            assessment_id bigint NOT NULL REFERENCES hospital.assessments (id),
            sort_order integer NOT NULL,
            prompt text NOT NULL,
            prompt_ta text NOT NULL,
            options jsonb NOT NULL DEFAULT '[]'::jsonb,
            CONSTRAINT questions_pkey PRIMARY KEY (id),
            CONSTRAINT questions_sort_key UNIQUE (assessment_id, sort_order)
        )
        """,
        "CREATE SEQUENCE IF NOT EXISTS hospital.quiz_attempts_id_seq",
        """
        CREATE TABLE IF NOT EXISTS hospital.quiz_attempts (
            id bigint NOT NULL DEFAULT nextval('hospital.quiz_attempts_id_seq'::regclass),
            created timestamp without time zone,
            created_by integer,
            modified timestamp without time zone,
            modified_by integer,
            deleted smallint DEFAULT 0,
            user_id bigint NOT NULL REFERENCES hospital.users (id),
            assessment_id bigint NOT NULL REFERENCES hospital.assessments (id),
            status text NOT NULL DEFAULT 'in_progress',
            submitted_at timestamp without time zone,
            total_score integer,
            CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id)
        )
        """,
        "CREATE SEQUENCE IF NOT EXISTS hospital.quiz_answers_id_seq",
        """
        CREATE TABLE IF NOT EXISTS hospital.quiz_answers (
            id bigint NOT NULL DEFAULT nextval('hospital.quiz_answers_id_seq'::regclass),
            created timestamp without time zone,
            created_by integer,
            modified timestamp without time zone,
            modified_by integer,
            deleted smallint DEFAULT 0,
            attempt_id bigint NOT NULL REFERENCES hospital.quiz_attempts (id),
            question_id bigint NOT NULL REFERENCES hospital.questions (id),
            option_id integer NOT NULL,
            score integer NOT NULL,
            CONSTRAINT quiz_answers_pkey PRIMARY KEY (id),
            CONSTRAINT quiz_answers_attempt_question_key UNIQUE (attempt_id, question_id)
        )
        """,
    ]
    try:
        with connect() as conn:
            for statement in statements:
                conn.execute(statement)
            _fold_options(conn)
            for item in ASSESSMENTS:
                _seed_assessment(conn, item)
    except Exception as exc:
        print(f"Quiz tables were not ready: {exc}", flush=True)


def _fold_options(conn):
    conn.execute("ALTER TABLE hospital.questions ADD COLUMN IF NOT EXISTS options jsonb")
    has_table = conn.execute(
        """
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'hospital' AND table_name = 'question_options'
        """
    ).fetchone()
    if has_table:
        conn.execute("ALTER TABLE hospital.quiz_answers DROP CONSTRAINT IF EXISTS quiz_answers_option_id_fkey")
        conn.execute(
            """
            UPDATE hospital.questions AS question
            SET options = grouped.options
            FROM (
                SELECT question_id,
                       jsonb_agg(
                           jsonb_build_object(
                               'option_id', id,
                               'order', sort_order,
                               'label', label,
                               'score', score
                           )
                           ORDER BY sort_order
                       ) AS options
                FROM hospital.question_options
                WHERE deleted = 0
                GROUP BY question_id
            ) AS grouped
            WHERE question.id = grouped.question_id
            """
        )
        conn.execute("DROP TABLE hospital.question_options")
        conn.execute("DROP SEQUENCE IF EXISTS hospital.question_options_id_seq")
    conn.execute("UPDATE hospital.questions SET options = '[]'::jsonb WHERE options IS NULL")
    conn.execute(
        """
        UPDATE hospital.questions
        SET options = (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'option_id', COALESCE((elem->>'option_id')::int, (elem->>'order')::int),
                    'order', (elem->>'order')::int,
                    'label', elem->>'label',
                    'score', (elem->>'score')::int
                )
                ORDER BY (elem->>'order')::int
            )
            FROM jsonb_array_elements(options) AS elem
        )
        WHERE jsonb_typeof(options) = 'array'
          AND jsonb_array_length(options) > 0
          AND EXISTS (
              SELECT 1
              FROM jsonb_array_elements(options) AS elem
              WHERE NOT (elem ? 'option_id')
          )
        """
    )
    conn.execute("ALTER TABLE hospital.questions ALTER COLUMN options SET NOT NULL")


def _seed_assessment(conn, item):
    found = conn.execute(
        "SELECT id FROM hospital.assessments WHERE code = %s AND deleted = 0",
        (item["code"],),
    ).fetchone()
    if found:
        return
    assessment = conn.execute(
        """
        INSERT INTO hospital.assessments
            (created, code, title, category, description, duration_label, deleted)
        VALUES (NOW(), %s, %s, %s, %s, %s, 0)
        RETURNING id
        """,
        (item["code"], item["title"], item["category"], item["description"], item["duration_label"]),
    ).fetchone()
    for sort_order, prompt, prompt_ta, options in item["questions"]:
        conn.execute(
            """
            INSERT INTO hospital.questions
                (created, assessment_id, sort_order, prompt, prompt_ta, options, deleted)
            VALUES (NOW(), %s, %s, %s, %s, %s::jsonb, 0)
            """,
            (
                assessment["id"],
                sort_order,
                prompt,
                prompt_ta,
                json.dumps(
                    [
                        {"option_id": order, "order": order, "label": label, "score": score}
                        for order, label, score in options
                    ]
                ),
            ),
        )


def _options(question):
    raw = [] if question is None else question["options"] or []
    if isinstance(raw, str):
        raw = json.loads(raw)
    return sorted(raw, key=lambda item: item.get("order", 0))


def _assessment(conn, code):
    row = conn.execute(
        """
        SELECT id, code, title, category, description, duration_label
        FROM hospital.assessments
        WHERE code = %s AND deleted = 0
        """,
        (code,),
    ).fetchone()
    if row is None or assessment_by_code(code) is None:
        raise HTTPException(status_code=404, detail="This quiz is not available.")
    return row


def _open_attempt(conn, user_id, assessment_id):
    return conn.execute(
        """
        SELECT id, status, total_score
        FROM hospital.quiz_attempts
        WHERE user_id = %s AND assessment_id = %s AND deleted = 0
        ORDER BY id DESC
        LIMIT 1
        """,
        (user_id, assessment_id),
    ).fetchone()


@router.get("/assessments")
def list_assessments(_payload: dict = Depends(require_role("patient"))):
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT a.code, a.title, a.category, a.description, a.duration_label,
                   COUNT(q.id) AS question_count
            FROM hospital.assessments a
            LEFT JOIN hospital.questions q ON q.assessment_id = a.id AND q.deleted = 0
            WHERE a.deleted = 0 AND a.code = ANY(%s)
            GROUP BY a.id
            ORDER BY a.id
            """,
            ([item["code"] for item in ASSESSMENTS],),
        ).fetchall()
    return [
        {
            "code": row["code"],
            "title": row["title"],
            "category": row["category"],
            "description": row["description"],
            "duration_label": row["duration_label"],
            "question_count": row["question_count"],
        }
        for row in rows
    ]


@router.get("/{code}")
def quiz_detail(code: str, payload: dict = Depends(require_role("patient"))):
    catalog = assessment_by_code(code)
    if catalog is None:
        raise HTTPException(status_code=404, detail="This quiz is not available.")
    with connect() as conn:
        assessment = _assessment(conn, code)
        questions = conn.execute(
            """
            SELECT id, sort_order, prompt, prompt_ta, options
            FROM hospital.questions
            WHERE assessment_id = %s AND deleted = 0
            ORDER BY sort_order
            """,
            (assessment["id"],),
        ).fetchall()
        attempt = _open_attempt(conn, payload["sub"], assessment["id"])
        if attempt is None:
            attempt = conn.execute(
                """
                INSERT INTO hospital.quiz_attempts
                    (created, created_by, user_id, assessment_id, status, deleted)
                VALUES (NOW(), %s, %s, %s, 'in_progress', 0)
                RETURNING id, status, total_score
                """,
                (payload["sub"], payload["sub"], assessment["id"]),
            ).fetchone()
        saved = conn.execute(
            """
            SELECT question_id, option_id
            FROM hospital.quiz_answers
            WHERE attempt_id = %s AND deleted = 0
            """,
            (attempt["id"],),
        ).fetchall()
        max_score = sum(max((item["score"] for item in _options(question)), default=0) for question in questions)

    return {
        "code": assessment["code"],
        "title": assessment["title"],
        "category": assessment["category"],
        "description": assessment["description"],
        "duration_label": assessment["duration_label"],
        "next_code": catalog["next_code"],
        "next_title": catalog["next_title"],
        "answer_kind": catalog.get("answer_kind", "choice"),
        "blocks": [
            {"start": start, "end": end, "label": label, "count": end - start + 1}
            for start, end, label in catalog["blocks"]
        ],
        "status": attempt["status"],
        "total_score": attempt["total_score"],
        "max_score": max_score,
        "questions": [
            {
                "id": question["id"],
                "number": question["sort_order"],
                "prompt": question["prompt"],
                "prompt_ta": question["prompt_ta"],
                "options": [
                    {"id": item["option_id"], "label": item["label"], "score": item["score"]}
                    for item in _options(question)
                ],
            }
            for question in questions
        ],
        "answers": {str(row["question_id"]): row["option_id"] for row in saved},
    }


@router.post("/{code}/answers")
def save_answer(code: str, body: QuizAnswerBody, payload: dict = Depends(require_role("patient"))):
    if assessment_by_code(code) is None:
        raise HTTPException(status_code=404, detail="This quiz is not available.")
    with connect() as conn:
        assessment = _assessment(conn, code)
        attempt = _open_attempt(conn, payload["sub"], assessment["id"])
        if attempt is None:
            raise HTTPException(status_code=409, detail="Open the quiz again, then choose an answer.")
        question = conn.execute(
            """
            SELECT options
            FROM hospital.questions
            WHERE id = %s AND assessment_id = %s AND deleted = 0
            """,
            (body.question_id, assessment["id"]),
        ).fetchone()
        option = next((item for item in _options(question) if item["option_id"] == body.option_id), None) if question else None
        if option is None:
            raise HTTPException(status_code=400, detail="Choose one of the answers for this question.")
        conn.execute(
            """
            INSERT INTO hospital.quiz_answers
                (created, created_by, attempt_id, question_id, option_id, score, deleted)
            VALUES (NOW(), %s, %s, %s, %s, %s, 0)
            ON CONFLICT (attempt_id, question_id)
            DO UPDATE SET option_id = EXCLUDED.option_id,
                          score = EXCLUDED.score,
                          modified = NOW(),
                          modified_by = EXCLUDED.created_by
            """,
            (payload["sub"], attempt["id"], body.question_id, option["option_id"], option["score"]),
        )
        total = None
        if attempt["status"] == "submitted":
            total = conn.execute(
                """
                UPDATE hospital.quiz_attempts
                SET total_score = (
                        SELECT COALESCE(SUM(score), 0)
                        FROM hospital.quiz_answers
                        WHERE attempt_id = %s AND deleted = 0
                    ),
                    modified = NOW(),
                    modified_by = %s
                WHERE id = %s
                RETURNING total_score
                """,
                (attempt["id"], payload["sub"], attempt["id"]),
            ).fetchone()["total_score"]
    return {"saved": True, "total_score": total}


@router.post("/{code}/submit")
def submit_quiz(code: str, payload: dict = Depends(require_role("patient"))):
    catalog = assessment_by_code(code)
    if catalog is None:
        raise HTTPException(status_code=404, detail="This quiz is not available.")
    with connect() as conn:
        assessment = _assessment(conn, code)
        attempt = _open_attempt(conn, payload["sub"], assessment["id"])
        if attempt is None:
            raise HTTPException(status_code=400, detail="Answer the questions before submitting.")
        if attempt["status"] == "submitted":
            return {"status": "submitted", "total_score": attempt["total_score"]}
        summary = conn.execute(
            """
            SELECT COUNT(*) AS answered, COALESCE(SUM(score), 0) AS total
            FROM hospital.quiz_answers
            WHERE attempt_id = %s AND deleted = 0
            """,
            (attempt["id"],),
        ).fetchone()
        if summary["answered"] != len(catalog["questions"]):
            raise HTTPException(
                status_code=400,
                detail=f"Answer all {len(catalog['questions'])} questions before submitting.",
            )
        conn.execute(
            """
            UPDATE hospital.quiz_attempts
            SET status = 'submitted', submitted_at = NOW(), total_score = %s, modified = NOW(), modified_by = %s
            WHERE id = %s
            """,
            (summary["total"], payload["sub"], attempt["id"]),
        )
    return {"status": "submitted", "total_score": summary["total"]}
