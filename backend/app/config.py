import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

TOKEN_HOURS = 12
SECRET = os.getenv("SECRET_KEY", "athma-local-dev-key")
