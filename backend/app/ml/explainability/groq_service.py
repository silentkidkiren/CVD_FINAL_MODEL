from app.core.config import settings

SYSTEM_PROMPT = "You are CardioAI, an expert cardiologist AI. Explain CVD predictions clearly and professionally to doctors."

def generate_cvd_explanation(patient_age, patient_gender, cvd_probability, cvd_type, risk_level, shap_summary, features):
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "your-groq-api-key-here":
        return _fallback_explanation(patient_age, patient_gender, cvd_probability, cvd_type, risk_level, shap_summary, features)
    try:
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)
        prompt = f"""
Patient: {patient_age}-year-old {patient_gender}
CVD Probability: {cvd_probability*100:.1f}%
CVD Type: {cvd_type}
Risk Level: {risk_level.upper()}

SHAP Analysis:
{shap_summary}

Vitals: BP={features.get('trestbps')}mmHg, Cholesterol={features.get('chol')}mg/dL, MaxHR={features.get('thalach')}bpm

Provide:
1. Clinical Interpretation
2. Key Risk Drivers
3. Recommended Actions
4. Monitoring Plan
5. Patient-Friendly Summary

Keep under 400 words, professional tone.
"""
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            max_tokens=600,
            temperature=0.3,
        )
        return response.choices[0].message.content
    except Exception as e:
        return _fallback_explanation(patient_age, patient_gender, cvd_probability, cvd_type, risk_level, shap_summary, features)

def _fallback_explanation(age, gender, prob, cvd_type, risk, shap_summary, features):
    action = "Immediate cardiology consultation recommended" if risk in ["high", "critical"] else "Regular monitoring advised"
    followup = "1 week" if risk in ["high", "critical"] else "1 month"
    return f"""**CardioAI Clinical Analysis**

**Summary:** {age}-year-old {gender} with {prob*100:.1f}% CVD probability — {cvd_type} ({risk.upper()} RISK)

**Feature Analysis:**
{shap_summary}

**Recommendations:**
- {action}
- Review medication and lifestyle factors
- BP: {features.get('trestbps')} mmHg | Cholesterol: {features.get('chol')} mg/dL | Max HR: {features.get('thalach')} bpm
- Follow-up in {followup}

*AI-assisted analysis — clinical judgment takes precedence.*"""
