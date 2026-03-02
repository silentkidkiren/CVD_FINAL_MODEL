import numpy as np
from pathlib import Path
from typing import List, Dict
from datetime import datetime

MODEL_DIR = Path(__file__).parent.parent / "ensemble" / "saved_models"
MODEL_DIR.mkdir(exist_ok=True)

def simulate_federated_round(hospital_ids: List[int], round_number: int, db) -> Dict:
    from app.ml.ensemble.model import get_hospital_model
    from app.models.models import TrainingRound, GlobalModel, FederatedSession

    participating_results = []
    num_samples_list = []

    for h_id in hospital_ids:
        model = get_hospital_model(h_id)
        np.random.seed(h_id + round_number * 100)
        base_acc = 0.75 + (h_id % 8) * 0.015 + round_number * 0.003
        acc = min(0.97, base_acc + np.random.uniform(-0.02, 0.02))
        loss = max(0.08, 0.5 - round_number * 0.03 + np.random.uniform(-0.02, 0.02))
        n_samples = int(np.random.randint(200, 800))
        num_samples_list.append(n_samples)
        result = {
            "hospital_id": h_id,
            "accuracy": round(acc, 4),
            "loss": round(loss, 4),
            "num_samples": n_samples,
            "duration": round(float(np.random.uniform(5, 30)), 2)
        }
        participating_results.append(result)
        tr = TrainingRound(
            hospital_id=h_id,
            round_number=round_number,
            is_global=False,
            accuracy=acc,
            val_accuracy=acc - 0.02,
            loss=loss,
            num_samples=n_samples,
            duration_seconds=result["duration"],
            metrics={"model_scores": {"rf": round(acc, 4), "xgb": round(acc, 4), "lgbm": round(acc, 4), "cat": round(acc, 4)}}
        )
        db.add(tr)

    total = sum(num_samples_list) or 1
    global_acc = sum(r["accuracy"] * r["num_samples"] for r in participating_results) / total

    db.query(GlobalModel).filter(GlobalModel.is_current == True).update({"is_current": False})

    gm = GlobalModel(
        version=f"v{round_number}.0",
        round_number=round_number,
        accuracy=round(global_acc, 4),
        participating_hospitals=len(hospital_ids),
        weights_path=str(MODEL_DIR / f"global_round_{round_number}.joblib"),
        metrics={"aggregation": "FedAvg", "hospital_results": participating_results},
        is_current=True
    )
    db.add(gm)

    fs = FederatedSession(
        round_number=round_number,
        participating_hospitals=hospital_ids,
        global_accuracy=round(global_acc, 4),
        aggregation_strategy="FedAvg",
        status="completed",
        completed_at=datetime.utcnow()
    )
    db.add(fs)
    db.commit()

    return {
        "round_number": round_number,
        "global_accuracy": round(global_acc, 4),
        "participating_hospitals": len(hospital_ids),
        "hospital_results": participating_results,
    }
