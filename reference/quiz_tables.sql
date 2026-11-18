-- Run this in database "postgres", not "eis2".
-- Brief Emotional Intelligence Scale (BEIS-10) only.

-- Schema hospital already exists in database postgres.

CREATE SEQUENCE IF NOT EXISTS hospital.assessments_id_seq;

CREATE TABLE IF NOT EXISTS hospital.assessments
(
    id bigint NOT NULL DEFAULT nextval('hospital.assessments_id_seq'::regclass),
    created timestamp without time zone,
    created_by integer,
    modified timestamp without time zone,
    modified_by integer,
    deleted smallint DEFAULT 0,
    code text COLLATE pg_catalog."default" NOT NULL,
    title text COLLATE pg_catalog."default" NOT NULL,
    category text COLLATE pg_catalog."default" NOT NULL,
    description text COLLATE pg_catalog."default" NOT NULL,
    duration_label text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT assessments_pkey PRIMARY KEY (id),
    CONSTRAINT assessments_code_key UNIQUE (code)
);

CREATE SEQUENCE IF NOT EXISTS hospital.questions_id_seq;

CREATE TABLE IF NOT EXISTS hospital.questions
(
    id bigint NOT NULL DEFAULT nextval('hospital.questions_id_seq'::regclass),
    created timestamp without time zone,
    created_by integer,
    modified timestamp without time zone,
    modified_by integer,
    deleted smallint DEFAULT 0,
    assessment_id bigint NOT NULL,
    sort_order integer NOT NULL,
    prompt text COLLATE pg_catalog."default" NOT NULL,
    prompt_ta text COLLATE pg_catalog."default" NOT NULL,
    options jsonb NOT NULL DEFAULT '[]'::jsonb,
    CONSTRAINT questions_pkey PRIMARY KEY (id),
    CONSTRAINT questions_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES hospital.assessments (id),
    CONSTRAINT questions_sort_key UNIQUE (assessment_id, sort_order)
);

CREATE SEQUENCE IF NOT EXISTS hospital.quiz_attempts_id_seq;

CREATE TABLE IF NOT EXISTS hospital.quiz_attempts
(
    id bigint NOT NULL DEFAULT nextval('hospital.quiz_attempts_id_seq'::regclass),
    created timestamp without time zone,
    created_by integer,
    modified timestamp without time zone,
    modified_by integer,
    deleted smallint DEFAULT 0,
    user_id bigint NOT NULL,
    assessment_id bigint NOT NULL,
    status text COLLATE pg_catalog."default" NOT NULL DEFAULT 'in_progress',
    submitted_at timestamp without time zone,
    total_score integer,
    CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id),
    CONSTRAINT quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES hospital.users (id),
    CONSTRAINT quiz_attempts_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES hospital.assessments (id)
);

CREATE SEQUENCE IF NOT EXISTS hospital.quiz_answers_id_seq;

CREATE TABLE IF NOT EXISTS hospital.quiz_answers
(
    id bigint NOT NULL DEFAULT nextval('hospital.quiz_answers_id_seq'::regclass),
    created timestamp without time zone,
    created_by integer,
    modified timestamp without time zone,
    modified_by integer,
    deleted smallint DEFAULT 0,
    attempt_id bigint NOT NULL,
    question_id bigint NOT NULL,
    option_id bigint NOT NULL,
    score integer NOT NULL,
    CONSTRAINT quiz_answers_pkey PRIMARY KEY (id),
    CONSTRAINT quiz_answers_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES hospital.quiz_attempts (id),
    CONSTRAINT quiz_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES hospital.questions (id),
    CONSTRAINT quiz_answers_attempt_question_key UNIQUE (attempt_id, question_id)
);
