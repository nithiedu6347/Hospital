-- Run this in database "postgres", not "eis2".
-- pgAdmin: right-click Databases -> postgres -> Query Tool, then execute.

CREATE SCHEMA IF NOT EXISTS hospital;

CREATE SEQUENCE IF NOT EXISTS hospital.users_id_seq;

CREATE TABLE IF NOT EXISTS hospital.users
(
    id bigint NOT NULL DEFAULT nextval('hospital.users_id_seq'::regclass),
    created timestamp without time zone,
    created_by integer,
    modified timestamp without time zone,
    modified_by integer,
    deleted smallint DEFAULT 0,
    full_name text COLLATE pg_catalog."default" NOT NULL,
    email text COLLATE pg_catalog."default" NOT NULL,
    phone text COLLATE pg_catalog."default" NOT NULL,
    password_hash text COLLATE pg_catalog."default" NOT NULL,
    role text COLLATE pg_catalog."default" NOT NULL DEFAULT 'patient',
    is_active smallint DEFAULT 1,
    last_login timestamp without time zone,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_phone_key UNIQUE (phone)
);

CREATE SEQUENCE IF NOT EXISTS hospital.patients_id_seq;

CREATE TABLE IF NOT EXISTS hospital.patients
(
    id bigint NOT NULL DEFAULT nextval('hospital.patients_id_seq'::regclass),
    created timestamp without time zone,
    created_by integer,
    modified timestamp without time zone,
    modified_by integer,
    deleted smallint DEFAULT 0,
    user_id bigint NOT NULL,
    age integer,
    gender text COLLATE pg_catalog."default",
    full_address text COLLATE pg_catalog."default" NOT NULL,
    city text COLLATE pg_catalog."default" NOT NULL,
    state text COLLATE pg_catalog."default" NOT NULL,
    pincode text COLLATE pg_catalog."default" NOT NULL,
    location text COLLATE pg_catalog."default" NOT NULL,
    marital_status text COLLATE pg_catalog."default",
    education text COLLATE pg_catalog."default",
    occupation text COLLATE pg_catalog."default",
    referred_by text COLLATE pg_catalog."default",
    consent_accepted smallint DEFAULT 0,
    consent_at timestamp without time zone,
    CONSTRAINT patients_pkey PRIMARY KEY (id),
    CONSTRAINT patients_user_id_fkey FOREIGN KEY (user_id) REFERENCES hospital.users (id),
    CONSTRAINT patients_pincode_check CHECK (pincode ~ '^[0-9]{6}$')
);
