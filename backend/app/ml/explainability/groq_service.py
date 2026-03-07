from app.core.config import settings

SYSTEM_PROMPT = """You are CardioAI, a friendly medical assistant that explains heart disease risk to doctors in simple, clear English.
Your explanations should be easy to understand — avoid heavy medical jargon.
Use plain language as if explaining to a smart person who is not a doctor.
Be warm, clear, and actionable."""

def generate_cvd_explanation(patient_age, patient_gender, cvd_probability, cvd_type, risk_level, shap_summary, features):
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "your-groq-api-key-here":
        return _fallback_explanation(patient_age, patient_gender, cvd_probability, cvd_type, risk_level, shap_summary, features)
    try:
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)
        prompt = f"""
You are reviewing an AI heart disease prediction for a patient. Explain it clearly in plain English.

PATIENT: {patient_age}-year-old {patient_gender}
RESULT: The AI gave this patient a {cvd_probability*100:.1f}% chance of having heart disease.
DIAGNOSIS: {cvd_type}
RISK LEVEL: {risk_level.upper()}

KEY FACTORS THE AI NOTICED:
{shap_summary}

PATIENT VITALS:
- Blood Pressure: {features.get("trestbps")} mmHg (normal is below 120)
- Cholesterol: {features.get("chol")} mg/dL (normal is below 200)
- Maximum Heart Rate: {features.get("thalach")} bpm
- ST Depression on ECG: {features.get("oldpeak")} (normal is 0-1)

Please write a clear explanation with these 5 sections. Use simple everyday language:

1. WHAT DID THE AI FIND?
   Explain the result in 2-3 simple sentences a patient could understand.

2. WHY DID THE AI GIVE THIS RESULT?
   Explain the top 2-3 risk factors in plain English. Example: "Your blood pressure of X is higher than the healthy range of below 120, which puts extra strain on your heart."

3. HOW SERIOUS IS THIS?
   Explain what the risk level means in practical terms.

4. WHAT SHOULD THE DOCTOR DO NEXT?
   Give 3-4 clear, practical next steps.

5. WHAT CAN THE PATIENT DO?
   Give 2-3 simple lifestyle tips relevant to this patient.

Keep the whole response under 350 words. Be warm and reassuring but honest.
"""
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            max_tokens=700,
            temperature=0.4,
        )
        return response.choices[0].message.content
    except Exception as e:
        return _fallback_explanation(patient_age, patient_gender, cvd_probability, cvd_type, risk_level, shap_summary, features)

def _fallback_explanation(age, gender, prob, cvd_type, risk, shap_summary, features):
    action = "We strongly recommend seeing a heart specialist as soon as possible" if risk in ["high", "critical"] else "We recommend scheduling a follow-up with your doctor"
    followup = "within 1 week" if risk in ["high", "critical"] else "within the next month"
    bp = features.get("trestbps", "N/A")
    chol = features.get("chol", "N/A")
    hr = features.get("thalach", "N/A")
    bp_note = "which is higher than the healthy range (below 120)" if isinstance(bp, (int,float)) and bp > 120 else "which is in a healthy range"
    chol_note = "which is above the recommended level (below 200)" if isinstance(chol, (int,float)) and chol > 200 else "which is within normal range"
    return f"""**CardioAI Heart Health Report**

**What Did the AI Find?**
The AI analyzed this {age}-year-old {gender} patient and found a {prob*100:.1f}% chance of heart disease, classified as {cvd_type}. The overall risk is rated as {risk.upper()}.

**Why Did the AI Give This Result?**
{shap_summary}

**Key Vitals in Plain Terms:**
- Blood pressure is {bp} mmHg, {bp_note}
- Cholesterol is {chol} mg/dL, {chol_note}
- Maximum heart rate reached {hr} bpm during testing

**How Serious Is This?**
A {risk} risk rating means {"this patient needs prompt medical attention — the AI sees significant warning signs that should not be ignored." if risk in ["high","critical"] else "the patient should be monitored carefully and lifestyle changes may help reduce the risk."}

**Recommended Next Steps:**
- {action} {followup}
- Run a full lipid panel and ECG if not recently done
- Check and manage blood pressure regularly
- Review current medications with a cardiologist

*This is an AI-assisted analysis to support — not replace — the doctor's clinical judgment.*"""
