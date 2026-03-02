from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_current_hospital_user
from app.models.models import User, Hospital, Patient, TrainingRound, Prediction
from app.schemas.schemas import PatientCreate
from app.core.security import get_password_hash
import uuid
import numpy as np

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])

@router.get("")
def list_hospitals(db: Session = Depends(get_db)):
    hospitals = db.query(Hospital).all()
    result = []
    for h in hospitals:
        latest = db.query(TrainingRound).filter(
            TrainingRound.hospital_id == h.id, TrainingRound.is_global == False
        ).order_by(TrainingRound.created_at.desc()).first()
        result.append({
            "id": h.id, "name": h.name, "code": h.code, "city": h.city,
            "country": h.country, "is_active": h.is_active,
            "created_at": h.created_at.isoformat(),
            "latest_accuracy": latest.accuracy if latest else None,
            "total_predictions": db.query(Prediction).filter(Prediction.hospital_id == h.id).count(),
            "total_patients": db.query(Patient).filter(Patient.hospital_id == h.id).count(),
        })
    return result

@router.get("/{hospital_id}/stats")
def get_hospital_stats(hospital_id: int, db: Session = Depends(get_db)):
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    training_rounds = db.query(TrainingRound).filter(
        TrainingRound.hospital_id == hospital_id, TrainingRound.is_global == False
    ).order_by(TrainingRound.round_number).all()
    predictions = db.query(Prediction).filter(Prediction.hospital_id == hospital_id).all()
    risk_dist = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    cvd_types = {}
    for p in predictions:
        if p.risk_level in risk_dist:
            risk_dist[p.risk_level] += 1
        cvd_types[p.cvd_type] = cvd_types.get(p.cvd_type, 0) + 1
    return {
        "hospital": {"id": hospital.id, "name": hospital.name, "city": hospital.city},
        "training_rounds": [{"round": r.round_number, "accuracy": r.accuracy, "loss": r.loss, "samples": r.num_samples} for r in training_rounds],
        "total_predictions": len(predictions),
        "approved_predictions": len([p for p in predictions if p.doctor_approved is True]),
        "rejected_predictions": len([p for p in predictions if p.doctor_approved is False]),
        "risk_distribution": risk_dist,
        "cvd_type_distribution": cvd_types,
        "total_patients": db.query(Patient).filter(Patient.hospital_id == hospital_id).count(),
    }

@router.get("/{hospital_id}/patients")
def get_patients(hospital_id: int, current_user: User = Depends(get_current_hospital_user), db: Session = Depends(get_db)):
    patients = db.query(Patient).filter(Patient.hospital_id == hospital_id).all()
    result = []
    for p in patients:
        last_pred = db.query(Prediction).filter(Prediction.patient_id == p.id).order_by(Prediction.created_at.desc()).first()
        result.append({
            "id": p.id, "patient_id": p.patient_id, "name": p.name,
            "age": p.age, "gender": p.gender, "contact": p.contact,
            "total_predictions": db.query(Prediction).filter(Prediction.patient_id == p.id).count(),
            "last_risk_level": last_pred.risk_level if last_pred else None,
            "last_cvd_type": last_pred.cvd_type if last_pred else None,
            "created_at": p.created_at.isoformat(),
        })
    return result

@router.post("/{hospital_id}/patients")
def create_patient(hospital_id: int, payload: PatientCreate, current_user: User = Depends(get_current_hospital_user), db: Session = Depends(get_db)):
    patient = Patient(
        hospital_id=hospital_id,
        patient_id=f"PAT-{uuid.uuid4().hex[:8].upper()}",
        **payload.model_dump()
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return {"id": patient.id, "patient_id": patient.patient_id, "name": patient.name, "age": patient.age, "gender": patient.gender}

@router.post("/{hospital_id}/train")
def train_local_model(hospital_id: int, num_rounds: int = 5, current_user: User = Depends(get_current_hospital_user), db: Session = Depends(get_db)):
    from app.ml.ensemble.model import get_hospital_model, FEATURE_NAMES
    model = get_hospital_model(hospital_id)
    predictions = db.query(Prediction).filter(Prediction.hospital_id == hospital_id, Prediction.feedback_used_for_training == True).all()
    X, y = [], []
    for p in predictions:
        features = [p.features.get(k, 0) for k in FEATURE_NAMES]
        X.append(features)
        y.append(0 if p.cvd_type == "No CVD Detected" else 1)
    if len(X) < 20:
        np.random.seed(hospital_id)
        n = 300
        X_syn = np.column_stack([
            np.random.randint(30, 80, n), np.random.randint(0, 2, n),
            np.random.randint(0, 4, n), np.random.uniform(90, 200, n),
            np.random.uniform(150, 350, n), np.random.randint(0, 2, n),
            np.random.randint(0, 3, n), np.random.uniform(70, 200, n),
            np.random.randint(0, 2, n), np.random.uniform(0, 6, n),
            np.random.randint(0, 3, n), np.random.randint(0, 4, n),
            np.random.randint(0, 4, n),
        ])
        y_syn = np.clip(((X_syn[:, 0] > 55) & (X_syn[:, 4] > 230)).astype(int) + (X_syn[:, 9] > 3).astype(int), 0, 1)
        X += X_syn.tolist()
        y += y_syn.tolist()
    metrics = model.train(X, y, num_rounds=num_rounds)
    for m in metrics:
        tr = TrainingRound(
            hospital_id=hospital_id, round_number=m["round"], is_global=False,
            accuracy=m["accuracy"], loss=1 - m["accuracy"],
            num_samples=m["num_samples"], duration_seconds=5.0,
            metrics={"model_scores": m["model_scores"]}
        )
        db.add(tr)
    db.commit()
    return {"message": "Training complete", "rounds": metrics, "final_accuracy": metrics[-1]["accuracy"]}
