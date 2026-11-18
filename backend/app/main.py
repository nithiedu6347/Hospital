import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.admin.routes import ensure_admin, router as admin_router
from app.patient.quiz import ensure_quiz
from app.patient.quiz import router as quiz_router
from app.patient.routes import router as patient_router
from app.register.routes import router as register_router

app = FastAPI(title="Athma Hospital")
origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
origins.extend(item.strip() for item in os.getenv("CORS_ORIGINS", "").split(",") if item.strip())
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(admin_router)
app.include_router(patient_router)
app.include_router(quiz_router)
app.include_router(register_router)


@app.on_event("startup")
def startup():
    ensure_admin()
    ensure_quiz()


@app.get("/api/health")
def health():
    return {"ok": True}
