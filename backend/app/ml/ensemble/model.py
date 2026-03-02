import numpy as np
import joblib
import os
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from catboost import CatBoostClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import warnings
warnings.filterwarnings("ignore")

MODEL_DIR = Path(__file__).parent / "saved_models"
MODEL_DIR.mkdir(exist_ok=True)

CVD_TYPES = {
    0: "No CVD Detected",
    1: "Coronary Artery Disease",
    2: "Heart Failure",
    3: "Arrhythmia",
    4: "Hypertensive Heart Disease",
}

FEATURE_NAMES = [
    "age", "sex", "cp", "trestbps", "chol", "fbs",
    "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"
]

class EnsembleCVDModel:
    def __init__(self, hospital_id: int = 0):
        self.hospital_id = hospital_id
        self.scaler = StandardScaler()
        self.models = self._build_models()
        self.is_trained = False
        self._try_load()

    def _build_models(self):
        return {
            "rf": RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
            "xgb": XGBClassifier(n_estimators=100, random_state=42, eval_metric="logloss", verbosity=0),
            "lgbm": LGBMClassifier(n_estimators=100, random_state=42, verbose=-1),
            "cat": CatBoostClassifier(n_estimators=100, random_state=42, verbose=0),
        }

    def _model_path(self):
        return MODEL_DIR / f"ensemble_hospital_{self.hospital_id}.joblib"

    def _scaler_path(self):
        return MODEL_DIR / f"scaler_hospital_{self.hospital_id}.joblib"

    def _try_load(self):
        if self._model_path().exists() and self._scaler_path().exists():
            data = joblib.load(self._model_path())
            self.models = data["models"]
            self.scaler = joblib.load(self._scaler_path())
            self.is_trained = True

    def save(self):
        joblib.dump({"models": self.models}, self._model_path())
        joblib.dump(self.scaler, self._scaler_path())

    def train(self, X, y, num_rounds: int = 5):
        X = np.array(X, dtype=float)
        y = np.array(y)
        X_scaled = self.scaler.fit_transform(X)
        metrics_per_round = []
        for rnd in range(num_rounds):
            X_tr, X_val, y_tr, y_val = train_test_split(X_scaled, y, test_size=0.2, random_state=rnd)
            round_scores = {}
            for name, model in self.models.items():
                model.fit(X_tr, y_tr)
                acc = accuracy_score(y_val, model.predict(X_val))
                round_scores[name] = round(acc, 4)
            preds = self._ensemble_predict(X_val)
            ensemble_acc = accuracy_score(y_val, preds)
            metrics_per_round.append({
                "round": rnd + 1,
                "accuracy": round(ensemble_acc, 4),
                "model_scores": round_scores,
                "num_samples": len(X_tr)
            })
        self.is_trained = True
        self.save()
        return metrics_per_round

    def _ensemble_predict_proba(self, X_scaled):
        probas = []
        for model in self.models.values():
            p = model.predict_proba(X_scaled)
            if p.shape[1] > 2:
                p = np.column_stack([p[:, 0], p[:, 1:].sum(axis=1)])
            probas.append(p)
        return np.mean(probas, axis=0)

    def _ensemble_predict(self, X_scaled):
        proba = self._ensemble_predict_proba(X_scaled)
        return (proba[:, 1] >= 0.5).astype(int)

    def predict(self, features: list):
        if not self.is_trained:
            self._generate_and_train()
        X = np.array(features, dtype=float).reshape(1, -1)
        X_scaled = self.scaler.transform(X)
        model_scores = {}
        all_probas = []
        for name, model in self.models.items():
            p = model.predict_proba(X_scaled)[0]
            cvd_prob = p[1] if len(p) > 1 else p[0]
            model_scores[name] = round(float(cvd_prob), 4)
            all_probas.append(cvd_prob)
        cvd_probability = float(np.mean(all_probas))
        cvd_type = self._classify_cvd_type(features, cvd_probability)
        if cvd_probability < 0.25:
            risk_level = "low"
        elif cvd_probability < 0.50:
            risk_level = "medium"
        elif cvd_probability < 0.75:
            risk_level = "high"
        else:
            risk_level = "critical"
        return {
            "cvd_probability": round(cvd_probability, 4),
            "cvd_type": cvd_type,
            "risk_level": risk_level,
            "ensemble_scores": model_scores,
        }

    def _classify_cvd_type(self, features, prob):
        if prob < 0.25:
            return CVD_TYPES[0]
        age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal = features
        if oldpeak > 2.0 or ca >= 2:
            return CVD_TYPES[1]
        if thalach < 120 and exang == 1:
            return CVD_TYPES[2]
        if restecg == 2 or thal == 2:
            return CVD_TYPES[3]
        if trestbps > 160:
            return CVD_TYPES[4]
        return CVD_TYPES[1]

    def get_feature_importances(self, features: list) -> dict:
        if not self.is_trained:
            return {name: 0.0 for name in FEATURE_NAMES}
        importances = {}
        count = 0
        for model in self.models.values():
            if hasattr(model, "feature_importances_"):
                for i, fname in enumerate(FEATURE_NAMES):
                    importances[fname] = importances.get(fname, 0) + float(model.feature_importances_[i])
                count += 1
        if count == 0:
            return {name: 0.0 for name in FEATURE_NAMES}
        return {k: round(v / count, 4) for k, v in importances.items()}

    def _generate_and_train(self):
        np.random.seed(self.hospital_id)
        n = 500
        X = np.column_stack([
            np.random.randint(30, 80, n),
            np.random.randint(0, 2, n),
            np.random.randint(0, 4, n),
            np.random.uniform(90, 200, n),
            np.random.uniform(150, 350, n),
            np.random.randint(0, 2, n),
            np.random.randint(0, 3, n),
            np.random.uniform(70, 200, n),
            np.random.randint(0, 2, n),
            np.random.uniform(0, 6, n),
            np.random.randint(0, 3, n),
            np.random.randint(0, 4, n),
            np.random.randint(0, 4, n),
        ])
        y = ((X[:, 0] > 55) & (X[:, 4] > 230)).astype(int)
        y = np.clip(y + (X[:, 9] > 3).astype(int), 0, 1)
        self.train(X, y, num_rounds=3)

_model_cache = {}

def get_hospital_model(hospital_id: int) -> EnsembleCVDModel:
    if hospital_id not in _model_cache:
        _model_cache[hospital_id] = EnsembleCVDModel(hospital_id)
        if not _model_cache[hospital_id].is_trained:
            _model_cache[hospital_id]._generate_and_train()
    return _model_cache[hospital_id]
