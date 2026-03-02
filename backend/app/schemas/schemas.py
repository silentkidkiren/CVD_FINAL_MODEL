from pydantic import BaseModel, EmailStr
from typing import Optional, Dict
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    hospital_id: Optional[int] = None
    hospital_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    contact: Optional[str] = None
    medical_history: Optional[Dict] = {}

class PredictionFeatures(BaseModel):
    age: float
    sex: int
    cp: int
    trestbps: float
    chol: float
    fbs: int
    restecg: int
    thalach: float
    exang: int
    oldpeak: float
    slope: int
    ca: int
    thal: int

class PredictionRequest(BaseModel):
    patient_id: str
    features: PredictionFeatures

class FeedbackRequest(BaseModel):
    prediction_id: int
    doctor_feedback: str
    doctor_approved: bool
