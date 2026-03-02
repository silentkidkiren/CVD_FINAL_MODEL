import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal, Base, engine
from app.models.models import User, Hospital, Patient, TrainingRound, GlobalModel, FederatedSession, Prediction, Report
from app.core.security import get_password_hash
import uuid
import random
from datetime import datetime, timedelta

Base.metadata.create_all(bind=engine)
db = SessionLocal()

def seed():
    print("Seeding database...")
    for model in [Report, Prediction, FederatedSession, GlobalModel, TrainingRound, Patient, Hospital, User]:
        db.query(model).delete()
    db.commit()

    admin = User(email="admin@cardioai.pro", hashed_password=get_password_hash("Admin@123"), role="admin", is_active=True)
    db.add(admin)
    db.flush()
    print("  Admin created")

    hospitals_data = [
        {"name": "Apollo Heart Institute", "code": "APOLLO", "city": "Boston", "email": "apollo@hospital.com"},
        {"name": "Mayo Cardiac Center", "code": "MAYO", "city": "Rochester", "email": "mayo@hospital.com"},
        {"name": "Johns Hopkins Cardiology", "code": "JHOP", "city": "Baltimore", "email": "johns@hospital.com"},
        {"name": "Cleveland Clinic", "code": "CLEV", "city": "Cleveland", "email": "cleveland@hospital.com"},
        {"name": "Stanford Heart Center", "code": "STAN", "city": "Stanford", "email": "stanford@hospital.com"},
        {"name": "Mass General Hospital", "code": "MGH", "city": "Boston", "email": "mass@hospital.com"},
        {"name": "UCSF Medical Center", "code": "UCSF", "city": "San Francisco", "email": "ucsf@hospital.com"},
        {"name": "NYU Langone Health", "code": "NYU", "city": "New York", "email": "nyu@hospital.com"},
    ]

    hospital_objects = []
    for hd in hospitals_data:
        user = User(email=hd["email"], hashed_password=get_password_hash("Hospital@123"), role="hospital", is_active=True)
        db.add(user)
        db.flush()
        h = Hospital(user_id=user.id, name=hd["name"], code=hd["code"], city=hd["city"], country="USA", is_active=True)
        db.add(h)
        db.flush()
        hospital_objects.append(h)
        print(f"  Hospital: {hd['name']}")

    names_m = ["James Wilson", "Robert Chen", "Michael Davis", "William Garcia", "David Martinez", "Richard Thompson", "Joseph Anderson", "Charles Taylor", "Thomas Moore", "John Jackson"]
    names_f = ["Sarah Johnson", "Emily Williams", "Jessica Brown", "Ashley Miller", "Amanda Jones", "Megan White", "Stephanie Harris", "Jennifer Clark", "Nicole Lewis", "Elizabeth Lee"]

    all_patients = []
    for h in hospital_objects:
        for i in range(15):
            gender = random.choice(["Male", "Female"])
            name = random.choice(names_m if gender == "Male" else names_f)
            patient = Patient(
                hospital_id=h.id,
                patient_id=f"PAT-{uuid.uuid4().hex[:8].upper()}",
                name=name, age=random.randint(35, 78), gender=gender,
                contact=f"+1-555-{random.randint(1000,9999)}",
                medical_history={"hypertension": random.choice([True, False]), "diabetes": random.choice([True, False])}
            )
            db.add(patient)
            all_patients.append((patient, h))
    db.flush()
    print(f"  {len(all_patients)} patients created")

    for h_idx, h in enumerate(hospital_objects):
        base_acc = 0.72 + h_idx * 0.018
        for rnd in range(1, 11):
            acc = min(0.97, base_acc + rnd * 0.008 + random.uniform(-0.01, 0.01))
            loss = max(0.05, 0.55 - rnd * 0.04 + random.uniform(-0.01, 0.01))
            tr = TrainingRound(
                hospital_id=h.id, round_number=rnd, is_global=False,
                accuracy=round(acc, 4), val_accuracy=round(acc - 0.02, 4),
                loss=round(loss, 4), num_samples=random.randint(200, 600),
                duration_seconds=random.uniform(5, 25),
                metrics={"model_scores": {"rf": round(acc, 4), "xgb": round(acc, 4), "lgbm": round(acc, 4), "cat": round(acc, 4)}},
                created_at=datetime.utcnow() - timedelta(days=30 - rnd * 3)
            )
            db.add(tr)

    for rnd in range(1, 8):
        global_acc = min(0.95, 0.78 + rnd * 0.02 + random.uniform(-0.005, 0.005))
        gm = GlobalModel(
            version=f"v{rnd}.0", round_number=rnd, accuracy=round(global_acc, 4),
            participating_hospitals=8, weights_path=f"/models/global_round_{rnd}.joblib",
            metrics={"aggregation": "FedAvg"}, is_current=(rnd == 7),
            created_at=datetime.utcnow() - timedelta(days=35 - rnd * 5)
        )
        db.add(gm)
        fs = FederatedSession(
            round_number=rnd, participating_hospitals=list(range(1, 9)),
            global_accuracy=round(global_acc, 4), aggregation_strategy="FedAvg",
            status="completed", started_at=datetime.utcnow() - timedelta(days=35 - rnd * 5),
            completed_at=datetime.utcnow() - timedelta(days=35 - rnd * 5)
        )
        db.add(fs)

    cvd_types = ["No CVD Detected", "Coronary Artery Disease", "Heart Failure", "Arrhythmia", "Hypertensive Heart Disease"]
    feature_names = ["age","sex","cp","trestbps","chol","fbs","restecg","thalach","exang","oldpeak","slope","ca","thal"]

    for patient, h in all_patients[:40]:
        prob = random.uniform(0.1, 0.95)
        cvd_type = random.choice(cvd_types)
        risk = "low" if prob < 0.25 else "medium" if prob < 0.5 else "high" if prob < 0.75 else "critical"
        features = {
            "age": patient.age, "sex": 1 if patient.gender == "Male" else 0,
            "cp": random.randint(0, 3), "trestbps": random.randint(90, 200),
            "chol": random.randint(150, 350), "fbs": random.randint(0, 1),
            "restecg": random.randint(0, 2), "thalach": random.randint(70, 200),
            "exang": random.randint(0, 1), "oldpeak": round(random.uniform(0, 6), 1),
            "slope": random.randint(0, 2), "ca": random.randint(0, 3), "thal": random.randint(0, 3),
        }
        pred = Prediction(
            patient_id=patient.id, hospital_id=h.id, features=features,
            cvd_probability=round(prob, 4), cvd_type=cvd_type, risk_level=risk,
            ensemble_scores={"rf": round(prob, 4), "xgb": round(prob, 4), "lgbm": round(prob, 4), "cat": round(prob, 4)},
            shap_values={"age": 0.12, "chol": 0.08, "thalach": -0.06, "cp": 0.05, "oldpeak": 0.09},
            shap_summary=f"Key factors: Age ({patient.age}), Cholesterol, Heart Rate",
            llm_explanation=f"Patient shows {prob*100:.1f}% CVD probability. Classified as {cvd_type}.",
            doctor_approved=random.choice([True, False, None]),
            doctor_feedback=random.choice(["Agreed with diagnosis", "Needs further testing", None]),
            feedback_used_for_training=True,
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 30))
        )
        db.add(pred)
        db.flush()
        report = Report(prediction_id=pred.id, hospital_id=h.id, report_data={"patient": patient.name, "cvd_type": cvd_type})
        db.add(report)

    db.commit()
    print("Database seeded successfully!")
    print("Admin:    admin@cardioai.pro / Admin@123")
    print("Hospital: apollo@hospital.com / Hospital@123")

if __name__ == "__main__":
    seed()
    db.close()
