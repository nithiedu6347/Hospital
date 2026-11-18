import os

import psycopg
from fastapi import HTTPException
from psycopg.rows import dict_row

import app.config  # loads backend/.env


def connect():
    try:
        return psycopg.connect(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=os.getenv("DB_PORT", "5432"),
            dbname=os.getenv("DB_NAME", "postgres"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", ""),
            row_factory=dict_row,
            connect_timeout=5,
        )
    except psycopg.OperationalError as exc:
        raise HTTPException(
            status_code=503,
            detail="Cannot connect to the postgres database. Check backend/.env.",
        ) from exc


def blank(value):
    if value is None:
        return None
    text = str(value).strip()
    return text or None
