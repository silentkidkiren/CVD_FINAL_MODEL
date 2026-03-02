from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.session import Base

class UserRole(str, enum.Enum):
    admin = "admin"
    hospital = "hospital"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.hospital)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    hospital = relationship("Hospital", back_populates="user", uselist=False)

class Hospital(Base):
    __tablename__ = "hospitals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    city = Column(String)
    country = Column(String, default="USA")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="hospital")
    patients = relationship("Patient", back_populates="hospital")
    model_weights = relationship("ModelWeight", back_populates="hospital")
    training_rounds = relationship("TrainingRound", back_populates="hospital")

class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    patient_id = Column(String, unique=True, index=True)
    name = Column(String)
    age = Column(Integer)
    gender = Column(String)
    contact = Column(String, nullable=True)
    medical_history = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    hospital = relationship("Hospital", back_populates="patients")
    predictions = relationship("Prediction", back_populates="patient")

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    features = Column(JSON, nullable=False)
    cvd_probability = Column(Float)
    cvd_type = Column(String)
    risk_level = Column(String)
    ensemble_scores = Column(JSON)
    shap_values = Column(JSON)
    shap_summary = Column(Text)
    llm_explanation = Column(Text)
    doctor_feedback = Column(Text, nullable=True)
    doctor_approved = Column(Boolean, nullable=True)
    feedback_used_for_training = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    patient = relationship("Patient", back_populates="predictions")
    report = relationship("Report", back_populates="prediction", uselist=False)

class ModelWeight(Base):
    __tablename__ = "model_weights"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    round_number = Column(Integer)
    weights_path = Column(String)
    accuracy = Column(Float)
    loss = Column(Float)
    num_samples = Column(Integer)
    shared_with_global = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    hospital = relationship("Hospital", back_populates="model_weights")

class TrainingRound(Base):
    __tablename__ = "training_rounds"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)
    round_number = Column(Integer)
    is_global = Column(Boolean, default=False)
    accuracy = Column(Float)
    val_accuracy = Column(Float, nullable=True)
    loss = Column(Float)
    num_samples = Column(Integer)
    duration_seconds = Column(Float)
    metrics = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    hospital = relationship("Hospital", back_populates="training_rounds")

class GlobalModel(Base):
    __tablename__ = "global_models"
    id = Column(Integer, primary_key=True, index=True)
    version = Column(String)
    round_number = Column(Integer)
    accuracy = Column(Float)
    participating_hospitals = Column(Integer)
    weights_path = Column(String)
    metrics = Column(JSON, default={})
    is_current = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), unique=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    report_path = Column(String, nullable=True)
    report_data = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    prediction = relationship("Prediction", back_populates="report")

class FederatedSession(Base):
    __tablename__ = "federated_sessions"
    id = Column(Integer, primary_key=True, index=True)
    round_number = Column(Integer)
    participating_hospitals = Column(JSON)
    global_accuracy = Column(Float)
    aggregation_strategy = Column(String, default="FedAvg")
    status = Column(String, default="pending")
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
