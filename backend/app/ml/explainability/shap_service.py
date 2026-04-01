import shap
import numpy as np
from typing import Dict, List
from app.ml.ensemble.model import EnsembleCVDModel, FEATURE_NAMES

FEATURE_DESCRIPTIONS = {
    "age": "Patient Age (years)",
    "sex": "Biological Sex",
    "cp": "Chest Pain Type",
    "trestbps": "Resting Blood Pressure (mmHg)",
    "chol": "Serum Cholesterol (mg/dL)",
    "fbs": "Fasting Blood Sugar",
    "restecg": "Resting ECG Results",
    "thalach": "Maximum Heart Rate (bpm)",
    "exang": "Exercise-Induced Angina",
    "ST Depression": "ST Depression",
    "slope": "ST Segment Slope",
    "Major Vessels Count": "Major Vessels Count",
    "thal": "Thalassemia",
}

def compute_shap_values(model: EnsembleCVDModel, features: List[float]) -> Dict:
    X = np.array(features, dtype=float).reshape(1, -1)
    X_scaled = model.scaler.transform(X)
    shap_dict = {}
    try:
        rf_model = model.models.get("rf")
        if rf_model:
            explainer = shap.TreeExplainer(rf_model)
            shap_vals = explainer.shap_values(X_scaled)
            if isinstance(shap_vals, list):
                vals = shap_vals[1][0]
            else:
                vals = shap_vals[0]
            for i, fname in enumerate(FEATURE_NAMES):
                shap_dict[fname] = round(float(vals[i]), 4)
    except Exception:
        shap_dict = model.get_feature_importances(features)
    return shap_dict

def build_shap_summary(features: List[float], shap_values: Dict, cvd_type: str) -> str:
    sorted_features = sorted(shap_values.items(), key=lambda x: abs(x[1]), reverse=True)
    top_risk = [(k, v) for k, v in sorted_features if v > 0][:3]
    top_protective = [(k, v) for k, v in sorted_features if v < 0][:2]
    feature_vals = dict(zip(FEATURE_NAMES, features))
    lines = [f"Predicted CVD Type: {cvd_type}", ""]
    lines.append("TOP RISK FACTORS:")
    for fname, sval in top_risk:
        desc = FEATURE_DESCRIPTIONS.get(fname, fname)
        val = feature_vals.get(fname, "N/A")
        lines.append(f"  - {desc}: {val} (SHAP={sval:+.3f})")
    if top_protective:
        lines.append("PROTECTIVE FACTORS:")
        for fname, sval in top_protective:
            desc = FEATURE_DESCRIPTIONS.get(fname, fname)
            val = feature_vals.get(fname, "N/A")
            lines.append(f"  - {desc}: {val} (SHAP={sval:+.3f})")
    return "\n".join(lines)
