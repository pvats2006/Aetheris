"""
Aetheris — Intra-Operative Service
Handles: Anomaly Detection, Voice Command Processing, Vitals Analysis
"""

import logging
import asyncio
from typing import List, Dict, Optional
from datetime import datetime

from app.core.config import settings
from app.schemas import (
    VitalsReading, AnomalyCheckRequest, AnomalyResult,
    AlertCreate, AlertSeverity, VoiceCommandRequest, VoiceCommandResponse
)

logger = logging.getLogger("aetheris.intraop")


# ── VITAL THRESHOLDS ───────────────────────────────────────────────────────
THRESHOLDS = {
    "heart_rate": {
        "critical_low": 40,  "warning_low": 50,
        "warning_high": 120, "critical_high": 140,
        "unit": "bpm",
    },
    "spo2": {
        "critical_low": 90,  "warning_low": 93,
        "warning_high": 100, "critical_high": 101,   # no high threshold
        "unit": "%",
    },
    "systolic_bp": {
        "critical_low": 80,  "warning_low": 90,
        "warning_high": 160, "critical_high": 180,
        "unit": "mmHg",
    },
    "diastolic_bp": {
        "critical_low": 40,  "warning_low": 50,
        "warning_high": 100, "critical_high": 120,
        "unit": "mmHg",
    },
    "temperature": {
        "critical_low": 35.0,  "warning_low": 35.5,
        "warning_high": 38.5,  "critical_high": 39.5,
        "unit": "°C",
    },
    "etco2": {
        "critical_low": 20,  "warning_low": 25,
        "warning_high": 50,  "critical_high": 60,
        "unit": "mmHg",
    },
    "resp_rate": {
        "critical_low": 8,   "warning_low": 10,
        "warning_high": 25,  "critical_high": 30,
        "unit": "br/min",
    },
}


# ── ANOMALY DETECTION ──────────────────────────────────────────────────────
def check_vital_status(name: str, value: float) -> str:
    """Returns: 'normal', 'warning_low', 'warning_high', 'critical_low', 'critical_high'"""
    t = THRESHOLDS.get(name, {})
    if not t:
        return "normal"
    if value <= t.get("critical_low", -999):    return "critical_low"
    if value >= t.get("critical_high", 99999):  return "critical_high"
    if value <= t.get("warning_low", -999):     return "warning_low"
    if value >= t.get("warning_high", 99999):   return "warning_high"
    return "normal"


def build_alert(
    patient_id: str,
    surgery_id: Optional[str],
    vital_name: str,
    value: float,
    status: str,
) -> Optional[AlertCreate]:
    """Build an alert object from a threshold breach."""
    t = THRESHOLDS.get(vital_name, {})
    unit = t.get("unit", "")
    is_critical = "critical" in status
    is_low      = "low" in status

    severity = AlertSeverity.CRITICAL if is_critical else AlertSeverity.WARNING
    direction = "dropped below" if is_low else "exceeded"
    threshold_val = (
        t.get("critical_low") if is_critical and is_low else
        t.get("critical_high") if is_critical and not is_low else
        t.get("warning_low") if is_low else
        t.get("warning_high")
    )

    vital_display = vital_name.replace("_", " ").title()
    title   = f"{'🚨 CRITICAL' if is_critical else '⚠️ WARNING'}: {vital_display}"
    message = (
        f"{vital_display} has {direction} threshold: "
        f"{value:.1f} {unit} "
        f"({'threshold: ' + str(threshold_val) + ' ' + unit}). "
        f"{'Immediate clinical attention required.' if is_critical else 'Monitor closely.'}"
    )

    return AlertCreate(
        patient_id  = patient_id,
        surgery_id  = surgery_id,
        severity    = severity,
        title       = title,
        message     = message,
        vital_type  = vital_name,
        vital_value = value,
    )


def analyze_anomalies(req: AnomalyCheckRequest) -> AnomalyResult:
    """Check all vitals against thresholds and return fired alerts."""
    v = req.vitals
    vitals_dict = {
        "heart_rate":   v.heart_rate,
        "spo2":         v.spo2,
        "systolic_bp":  v.systolic_bp,
        "diastolic_bp": v.diastolic_bp,
        "temperature":  v.temperature,
        "etco2":        v.etco2,
        "resp_rate":    v.resp_rate,
    }

    alerts_fired: List[AlertCreate] = []
    vitals_status: Dict[str, str] = {}

    for name, value in vitals_dict.items():
        status = check_vital_status(name, value)
        vitals_status[name] = status
        if status != "normal":
            alert = build_alert(req.patient_id, req.surgery_id, name, value, status)
            if alert:
                alerts_fired.append(alert)

    return AnomalyResult(
        has_anomaly   = len(alerts_fired) > 0,
        alerts_fired  = alerts_fired,
        vitals_status = vitals_status,
    )


# ── VOICE COMMAND PROCESSOR ────────────────────────────────────────────────
# Procedure steps for the timeline
PROCEDURE_STEPS = [
    "Pre-Procedure Setup",
    "Anesthesia Induction",
    "Incision & Access",
    "Main Procedure Phase",
    "Hemostasis & Verification",
    "Closure",
    "Recovery Handoff",
]

async def transcribe_audio(audio_b64: str) -> str:
    """Transcribe audio using OpenAI Whisper API."""
    try:
        import base64, tempfile, os
        import httpx

        audio_bytes = base64.b64decode(audio_b64)
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        async with httpx.AsyncClient(timeout=15.0) as client:
            with open(tmp_path, "rb") as audio_file:
                resp = await client.post(
                    "https://api.openai.com/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                    data={"model": "whisper-1"},
                    files={"file": ("audio.webm", audio_file, "audio/webm")},
                )
        os.unlink(tmp_path)

        if resp.status_code == 200:
            return resp.json().get("text", "")
    except Exception as e:
        logger.warning(f"Whisper API error: {e}")
    return ""


async def process_voice_command(
    req: VoiceCommandRequest,
    current_vitals: Optional[Dict] = None,
) -> VoiceCommandResponse:
    """Transcribe voice, interpret command, generate clinical response."""

    # 1. Get transcription
    transcription = req.text_query or ""
    if req.audio_b64 and not transcription:
        transcription = await transcribe_audio(req.audio_b64)
    if not transcription:
        transcription = "Query not recognized"

    text_lower = transcription.lower()

    # 2. Pattern-match against known clinical queries
    vitals_cited = None
    response = ""

    if current_vitals:
        cv = current_vitals

        if any(kw in text_lower for kw in ["blood pressure", "bp", "pressure"]):
            sbp = cv.get("systolic_bp", "N/A")
            dbp = cv.get("diastolic_bp", "N/A")
            response = f"Current blood pressure is {sbp:.0f}/{dbp:.0f} mmHg."
            vitals_cited = {"systolic_bp": sbp, "diastolic_bp": dbp}

        elif any(kw in text_lower for kw in ["oxygen", "spo2", "saturation", "o2"]):
            spo2 = cv.get("spo2", "N/A")
            status = "normal" if spo2 > 95 else ("borderline" if spo2 > 90 else "CRITICAL")
            response = f"SpO2 is {spo2:.1f}% — {status}."
            vitals_cited = {"spo2": spo2}

        elif any(kw in text_lower for kw in ["heart rate", "pulse", "hr"]):
            hr = cv.get("heart_rate", "N/A")
            response = f"Current heart rate is {hr:.0f} bpm."
            vitals_cited = {"heart_rate": hr}

        elif any(kw in text_lower for kw in ["temperature", "temp", "fever"]):
            temp = cv.get("temperature", "N/A")
            response = f"Patient temperature is {temp:.1f}°C."
            vitals_cited = {"temperature": temp}

        elif any(kw in text_lower for kw in ["etco2", "co2", "capnography", "end tidal"]):
            etco2 = cv.get("etco2", "N/A")
            response = f"EtCO2 reading is {etco2:.1f} mmHg."
            vitals_cited = {"etco2": etco2}

        elif any(kw in text_lower for kw in ["all vitals", "status", "overview", "summary"]):
            response = (
                f"Current vitals summary — "
                f"HR: {cv.get('heart_rate',0):.0f} bpm, "
                f"SpO2: {cv.get('spo2',0):.1f}%, "
                f"BP: {cv.get('systolic_bp',0):.0f}/{cv.get('diastolic_bp',0):.0f} mmHg, "
                f"Temp: {cv.get('temperature',0):.1f}°C, "
                f"EtCO2: {cv.get('etco2',0):.1f} mmHg."
            )
            vitals_cited = cv

    # 3. Procedure-related queries
    if not response:
        if any(kw in text_lower for kw in ["next step", "advance", "proceed"]):
            response = "Advancing to next procedure step. Please confirm on the timeline."
        elif any(kw in text_lower for kw in ["drug", "medication", "dose", "dosage"]):
            response = "Please consult the anesthesia record for current medication dosages."
        elif any(kw in text_lower for kw in ["allergies", "allergy"]):
            response = "Patient allergy information is available in the Pre-Op assessment panel."
        elif any(kw in text_lower for kw in ["time", "how long", "duration"]):
            response = "Surgery start time and elapsed duration are shown in the procedure timeline."
        else:
            # Fallback to Claude API
            response = await ask_claude_voice(transcription, current_vitals)

    return VoiceCommandResponse(
        transcription = transcription,
        response      = response,
        vitals_cited  = vitals_cited,
    )


async def ask_claude_voice(query: str, vitals: Optional[Dict]) -> str:
    """Fallback: send unrecognized query to Claude API."""
    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

        vitals_context = ""
        if vitals:
            vitals_context = f"Current vitals: {vitals}"

        message = await client.messages.create(
            model=settings.LLM_MODEL,
            max_tokens=150,
            messages=[{
                "role": "user",
                "content": (
                    f"You are Aetheris, a surgical AI co-pilot. "
                    f"Answer this surgeon's query concisely (1-2 sentences max). "
                    f"Query: '{query}'. {vitals_context}"
                )
            }]
        )
        return message.content[0].text
    except Exception as e:
        logger.warning(f"Claude voice fallback failed: {e}")
        return "Query received. Please refer to the patient record for detailed information."
