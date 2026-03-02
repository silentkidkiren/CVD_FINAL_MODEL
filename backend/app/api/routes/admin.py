from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_current_admin
from app.models.models import User, Hospital, Patient, Prediction, TrainingRound, GlobalModel, FederatedSession
from app.ml.federated.fl_service import simulate_federated_round

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/stats")
def get_global_stats(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    global_model = db.query(GlobalModel).filter(GlobalModel.is_current == True).first()
    recent_predictions = db.query(Prediction).order_by(Prediction.created_at.desc()).limit(5).all()
    recent_list = []
    for p in recent_predictions:
        patient = db.query(Patient).filter(Patient.id == p.patient_id).first()
        hospital = db.query(Hospital).filter(Hospital.id == p.hospital_id).first()
        recent_list.append({
            "patient": patient.name if patient else "Unknown",
            "hospital": hospital.name if hospital else "Unknown",
            "cvd_type": p.cvd_type, "risk_level": p.risk_level,
            "created_at": p.created_at.isoformat(),
        })
    return {
        "total_hospitals": db.query(Hospital).count(),
        "total_patients": db.query(Patient).count(),
        "total_predictions": db.query(Prediction).count(),
        "global_model_accuracy": global_model.accuracy if global_model else 0.0,
        "global_model_version": global_model.version if global_model else "N/A",
        "federated_rounds": db.query(FederatedSession).filter(FederatedSession.status == "completed").count(),
        "active_hospitals": db.query(Hospital).filter(Hospital.is_active == True).count(),
        "recent_predictions": recent_list,
    }

@router.get("/federated/history")
def get_federated_history(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    sessions = db.query(FederatedSession).order_by(FederatedSession.started_at.desc()).limit(20).all()
    return [{
        "id": s.id, "round_number": s.round_number,
        "participating_hospitals": s.participating_hospitals,
        "global_accuracy": s.global_accuracy, "aggregation_strategy": s.aggregation_strategy,
        "status": s.status, "started_at": s.started_at.isoformat(),
        "completed_at": s.completed_at.isoformat() if s.completed_at else None,
    } for s in sessions]

@router.post("/federated/run")
def run_federated_round(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    hospitals = db.query(Hospital).filter(Hospital.is_active == True).all()
    hospital_ids = [h.id for h in hospitals]
    last_session = db.query(FederatedSession).order_by(FederatedSession.round_number.desc()).first()
    round_number = (last_session.round_number + 1) if last_session else 1
    return simulate_federated_round(hospital_ids, round_number, db)

@router.get("/hospitals/comparison")
def get_hospital_comparison(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    hospitals = db.query(Hospital).all()
    comparison = []
    for h in hospitals:
        rounds = db.query(TrainingRound).filter(TrainingRound.hospital_id == h.id, TrainingRound.is_global == False).order_by(TrainingRound.round_number).all()
        latest = rounds[-1] if rounds else None
        comparison.append({
            "id": h.id, "name": h.name, "city": h.city,
            "accuracy": latest.accuracy if latest else 0,
            "total_rounds": len(rounds),
            "total_patients": db.query(Patient).filter(Patient.hospital_id == h.id).count(),
            "total_predictions": db.query(Prediction).filter(Prediction.hospital_id == h.id).count(),
            "accuracy_history": [{"round": r.round_number, "accuracy": r.accuracy} for r in rounds[-10:]],
        })
    return comparison

@router.get("/models/global")
def get_global_models(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    models = db.query(GlobalModel).order_by(GlobalModel.round_number.desc()).limit(20).all()
    return [{
        "id": m.id, "version": m.version, "round_number": m.round_number,
        "accuracy": m.accuracy, "participating_hospitals": m.participating_hospitals,
        "is_current": m.is_current, "created_at": m.created_at.isoformat(),
    } for m in models]
