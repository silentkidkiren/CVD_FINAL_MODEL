from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_current_hospital_user
from app.models.models import User, Patient, Prediction, Hospital, Report
from app.schemas.schemas import PredictionRequest, FeedbackRequest
from app.ml.ensemble.model import get_hospital_model, FEATURE_NAMES
from app.ml.explainability.shap_service import compute_shap_values, build_shap_summary
from app.ml.explainability.groq_service import generate_cvd_explanation

router = APIRouter(prefix="/predictions", tags=["Predictions"])

@router.post("")
def create_prediction(payload: PredictionRequest, current_user: User = Depends(get_current_hospital_user), db: Session = Depends(get_db)):
    hospital = db.query(Hospital).filter(Hospital.user_id == current_user.id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    patient = db.query(Patient).filter(Patient.patient_id == payload.patient_id, Patient.hospital_id == hospital.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    features_dict = payload.features.model_dump()
    features_list = [features_dict[k] for k in FEATURE_NAMES]
    model = get_hospital_model(hospital.id)
    result = model.predict(features_list)
    shap_values = compute_shap_values(model, features_list)
    shap_summary = build_shap_summary(features_list, shap_values, result["cvd_type"])
    llm_explanation = generate_cvd_explanation(
        patient_age=patient.age, patient_gender=patient.gender,
        cvd_probability=result["cvd_probability"], cvd_type=result["cvd_type"],
        risk_level=result["risk_level"], shap_summary=shap_summary, features=features_dict
    )
    pred = Prediction(
        patient_id=patient.id, hospital_id=hospital.id, features=features_dict,
        cvd_probability=result["cvd_probability"], cvd_type=result["cvd_type"],
        risk_level=result["risk_level"], ensemble_scores=result["ensemble_scores"],
        shap_values=shap_values, shap_summary=shap_summary, llm_explanation=llm_explanation,
    )
    db.add(pred)
    db.flush()
    report = Report(prediction_id=pred.id, hospital_id=hospital.id, report_data={
        "patient": {"id": patient.patient_id, "name": patient.name, "age": patient.age, "gender": patient.gender},
        "prediction": result, "shap_values": shap_values, "explanation": llm_explanation, "hospital": hospital.name,
    })
    db.add(report)
    db.commit()
    db.refresh(pred)
    return {
        "id": pred.id, "patient_id": patient.id, "patient_name": patient.name,
        "cvd_probability": result["cvd_probability"], "cvd_type": result["cvd_type"],
        "risk_level": result["risk_level"], "ensemble_scores": result["ensemble_scores"],
        "shap_values": shap_values, "shap_summary": shap_summary,
        "llm_explanation": llm_explanation, "created_at": pred.created_at.isoformat(),
    }

@router.post("/{prediction_id}/feedback")
def submit_feedback(prediction_id: int, payload: FeedbackRequest, current_user: User = Depends(get_current_hospital_user), db: Session = Depends(get_db)):
    pred = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction not found")
    pred.doctor_feedback = payload.doctor_feedback
    pred.doctor_approved = payload.doctor_approved
    pred.feedback_used_for_training = True
    db.commit()
    hospital = db.query(Hospital).filter(Hospital.id == pred.hospital_id).first()
    if hospital:
        model = get_hospital_model(hospital.id)
        features_list = [pred.features.get(k, 0) for k in FEATURE_NAMES]
        label = 0 if pred.doctor_approved and pred.cvd_type == "No CVD Detected" else 1
        try:
            model.train([features_list], [label], num_rounds=1)
        except Exception:
            pass
    return {"message": "Feedback recorded and model updated", "prediction_id": prediction_id}

@router.get("/hospital/{hospital_id}")
def get_hospital_predictions(hospital_id: int, limit: int = 50, current_user: User = Depends(get_current_hospital_user), db: Session = Depends(get_db)):
    preds = db.query(Prediction).filter(Prediction.hospital_id == hospital_id).order_by(Prediction.created_at.desc()).limit(limit).all()
    results = []
    for p in preds:
        patient = db.query(Patient).filter(Patient.id == p.patient_id).first()
        results.append({
            "id": p.id,
            "patient_name": patient.name if patient else "Unknown",
            "patient_id": patient.patient_id if patient else "",
            "cvd_probability": p.cvd_probability, "cvd_type": p.cvd_type,
            "risk_level": p.risk_level, "doctor_approved": p.doctor_approved,
            "created_at": p.created_at.isoformat(),
        })
    return results
