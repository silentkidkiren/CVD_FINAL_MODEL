
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, hospitals, predictions, admin
from app.db.session import Base, engine
import app.models.models

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CardioAI Pro API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(hospitals.router, prefix="/api/v1")
app.include_router(predictions.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "CardioAI Pro API", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy"}
