const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });

    if (!response.ok) {
        let errorMessage = `HTTP error ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
            // fallback to default error message if body isn't JSON
        }
        throw new Error(errorMessage);
    }

    return response.json();
}

// ── PATIENTS ─────────────────────────────────────────────────────────────────
export const getPatients = () =>
    apiRequest('/api/patients/');

export const getPatient = (id) =>
    apiRequest(`/api/patients/${id}`);

export const createPatient = (data) =>
    apiRequest('/api/patients/', { method: 'POST', body: JSON.stringify(data) });

// ── PRE-OP ────────────────────────────────────────────────────────────────────
export const runPreOpAssessment = (data) =>
    apiRequest('/api/preop/assess', { method: 'POST', body: JSON.stringify(data) });

// ── INTRA-OP ──────────────────────────────────────────────────────────────────
export const checkAnomalies = (data) =>
    apiRequest('/api/intraop/anomaly-check', { method: 'POST', body: JSON.stringify(data) });

export const sendVoiceCommand = (data) =>
    apiRequest('/api/intraop/voice-command', { method: 'POST', body: JSON.stringify(data) });

export const advanceProcedureStep = (data) =>
    apiRequest('/api/intraop/procedure-step', { method: 'PATCH', body: JSON.stringify(data) });

// ── POST-OP ───────────────────────────────────────────────────────────────────
export const getComplicationRisk = (data) =>
    apiRequest('/api/postop/complication-risk', { method: 'POST', body: JSON.stringify(data) });

// ── REPORTS ───────────────────────────────────────────────────────────────────
export const generateReport = (data) =>
    apiRequest('/api/reports/generate', { method: 'POST', body: JSON.stringify(data) });

export const sendToEHR = (data) =>
    apiRequest('/api/reports/send-to-ehr', { method: 'POST', body: JSON.stringify(data) });

// ── ALERTS ────────────────────────────────────────────────────────────────────
export const getAlerts = (params = {}) =>
    apiRequest(`/api/alerts/?${new URLSearchParams(params).toString()}`);

export const createAlert = (data) =>
    apiRequest('/api/alerts/', { method: 'POST', body: JSON.stringify(data) });

export const acknowledgeAlert = (id, data) =>
    apiRequest(`/api/alerts/${id}/acknowledge`, { method: 'PATCH', body: JSON.stringify(data) });
