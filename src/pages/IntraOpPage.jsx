import { useState, useEffect, useRef, useCallback } from 'react'
import {
    Heart, Wind, Activity, Thermometer, Zap,
    TrendingUp, TrendingDown, Minus,
    AlertCircle, ShieldCheck, Mic, MicOff, Clock,
    ChevronRight,
} from 'lucide-react'
import SectionHeader from '../components/SectionHeader'
import VitalsChart from '../components/charts/VitalsChart'
import ApiErrorBanner from '../components/ui/ApiErrorBanner'
import { VitalsWebSocket } from '../api/websocket'
import { sendVoiceCommand, advanceProcedureStep, createAlert } from '../api/client'
import { useAetheris } from '../context/AetherisContext'

/* ═══ CONSTANTS ══════════════════════════════════════════════ */

const PROCEDURE_STEPS = [
    { id: 'induction', label: 'Anesthesia Induction', time: '07:02' },
    { id: 'incision', label: 'Incision', time: '07:18' },
    { id: 'phase1', label: 'Procedure Phase 1', time: '07:45' },
    { id: 'phase2', label: 'Procedure Phase 2', time: '09:10' },
    { id: 'closure', label: 'Closure', time: '10:40' },
    { id: 'handoff', label: 'Recovery Handoff', time: '11:00' },
]

/* ═══ VITAL CARD ═════════════════════════════════════════════ */
function VitalCard({ label, value, unit, prev, icon: Icon, iconColor, iconBg, getStyle }) {
    const [flash, setFlash] = useState(false)
    const prevRef = useRef(value)

    useEffect(() => {
        if (prevRef.current !== value) {
            setFlash(true)
            const t = setTimeout(() => setFlash(false), 500)
            prevRef.current = value
            return () => clearTimeout(t)
        }
    }, [value])

    const trend = prev == null ? 0 : value > prev ? 1 : value < prev ? -1 : 0
    const style = getStyle ? getStyle(value) : {}

    return (
        <div className={`bg-gray-900 rounded-xl p-4 border transition-colors duration-500
      ${flash ? 'border-teal-700/80 bg-gray-800' : 'border-gray-800'}`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBg}`}>
                    <Icon size={14} className={iconColor} />
                </div>
            </div>
            <div className="flex items-end gap-1.5">
                <span className={`text-2xl font-bold leading-none transition-colors duration-500 ${style.value ?? 'text-white'}`}>
                    {typeof value === 'number' ? value.toFixed(1).replace('.0', '') : value}
                </span>
                <span className="text-xs text-gray-500 mb-0.5">{unit}</span>
                {trend !== 0 && (
                    trend === 1
                        ? <TrendingUp size={13} className="text-green-400 mb-0.5" />
                        : <TrendingDown size={13} className="text-red-400 mb-0.5" />
                )}
                {trend === 0 && <Minus size={13} className="text-gray-600 mb-0.5" />}
            </div>
            {style.badge && (
                <span className={`mt-2 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
                    {style.badgeLabel}
                </span>
            )}
        </div>
    )
}

/* ═══ ANOMALY ALERT PANEL ════════════════════════════════════ */
function AlertPanel({ alerts, onAcknowledge }) {
    const BORDER = { critical: 'border-red-500', warning: 'border-amber-500', info: 'border-blue-500' }
    const BADGE = {
        critical: 'bg-red-900/40 text-red-400 border border-red-800/40',
        warning: 'bg-amber-900/40 text-amber-400 border border-amber-800/40',
        info: 'bg-blue-900/40 text-blue-400 border border-blue-800/40',
    }

    return (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                <AlertCircle size={16} className="text-red-400" />
                <h3 className="text-white font-semibold text-sm flex-1">Real-Time Alerts</h3>
                {alerts.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-900/40 text-red-400 border border-red-800/40">
                        {alerts.length} active
                    </span>
                )}
            </div>

            {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-green-900/30 border border-green-800/30 flex items-center justify-center mb-3">
                        <ShieldCheck size={22} className="text-green-400" />
                    </div>
                    <p className="text-green-400 text-sm font-semibold">All vitals normal</p>
                    <p className="text-gray-500 text-xs mt-1">Monitoring active</p>
                </div>
            ) : (
                <div className="space-y-2.5 overflow-y-auto flex-1 pr-0.5">
                    {alerts.map(a => (
                        <div key={a.id} className={`border-l-4 ${BORDER[a.type] ?? 'border-gray-600'} bg-gray-800 rounded-r-xl p-3`}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${BADGE[a.type] ?? BADGE.info}`}>
                                            {(a.type ?? 'info').toUpperCase()}
                                        </span>
                                        <p className="text-xs font-semibold text-white">{a.title}</p>
                                    </div>
                                    <p className="text-xs text-gray-400 leading-snug">{a.message}</p>
                                    <p className="text-[10px] text-gray-600 mt-1">{a.time}</p>
                                </div>
                                <button
                                    onClick={() => onAcknowledge(a.id)}
                                    className="text-[10px] font-semibold text-teal-400 hover:text-teal-300 whitespace-nowrap mt-0.5 transition-colors flex-shrink-0"
                                >
                                    Ack ✓
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

/* ═══ VOICE PANEL ════════════════════════════════════════════ */
function VoicePanel({ currentPatient, addAlert }) {
    const [listening, setListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [response, setResponse] = useState('')
    const [history, setHistory] = useState([])
    const [voiceProcessing, setVoiceProcessing] = useState(false)

    const addCommandToHistory = useCallback((cmd) => {
        setHistory(prev => [cmd, ...prev].slice(0, 5))
    }, [])

    // Use browser SpeechRecognition when available, else fall straight to typed query
    const startListening = useCallback(() => {
        if (listening || voiceProcessing) return
        setListening(true)
        setTranscript('Listening…')
        setResponse('')

        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition

        if (SpeechRecognition) {
            const recognition = new SpeechRecognition()
            recognition.lang = 'en-US'
            recognition.interimResults = false
            recognition.maxAlternatives = 1

            recognition.onresult = async (event) => {
                const spoken = event.results[0][0].transcript
                setListening(false)
                await handleVoiceQuery(spoken)
            }
            recognition.onerror = () => {
                setListening(false)
                setTranscript('Speech recognition failed — try again.')
            }
            recognition.onend = () => setListening(false)
            recognition.start()
        } else {
            // Fallback: send a typed demo query after 2 s
            setTimeout(() => {
                setListening(false)
                handleVoiceQuery('What is the current heart rate trend?')
            }, 2000)
        }
    }, [listening, voiceProcessing]) // eslint-disable-line react-hooks/exhaustive-deps

    async function handleVoiceQuery(textQuery) {
        setVoiceProcessing(true)
        try {
            const result = await sendVoiceCommand({
                patient_id: currentPatient?.id || 'p001',
                text_query: textQuery,
            })
            setTranscript(`> ${result.transcription ?? textQuery}`)
            setResponse(result.response ?? '')
            addCommandToHistory(result.transcription ?? textQuery)
        } catch {
            setTranscript(`> ${textQuery}`)
            setResponse('Voice command failed — check backend connection.')
        } finally {
            setVoiceProcessing(false)
        }
    }

    const busy = listening || voiceProcessing

    return (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-5">
                <Mic size={16} className="text-teal-400" />
                <h3 className="text-white font-semibold text-sm">Voice Command Interface</h3>
            </div>

            {/* Mic button */}
            <div className="flex justify-center mb-5">
                <div className="relative">
                    {busy && (
                        <span className="absolute inset-0 rounded-full ring-4 ring-teal-500/50 animate-ping" />
                    )}
                    <button
                        onClick={startListening}
                        disabled={busy}
                        className={`relative z-10 rounded-full p-6 flex items-center justify-center transition-all shadow-lg
              ${busy
                                ? 'bg-red-600 shadow-red-900/40 scale-110 cursor-not-allowed'
                                : 'bg-teal-600 hover:bg-teal-500 shadow-teal-900/40 hover:scale-105 active:scale-95'}`}
                    >
                        {busy
                            ? <MicOff size={28} className="text-white" />
                            : <Mic size={28} className="text-white" />}
                    </button>
                </div>
            </div>

            <p className="text-center text-xs text-gray-500 mb-4">
                {listening ? 'Listening — speak your command'
                    : voiceProcessing ? 'Processing…'
                        : 'Tap mic to issue a voice command'}
            </p>

            {/* Transcription box */}
            <div className="bg-gray-800 rounded-xl p-3 min-h-16 font-mono text-sm text-green-400 mb-4 border border-gray-700">
                {transcript || <span className="text-gray-600">Awaiting input…</span>}
                {response && <p className="text-teal-400 mt-1 text-xs">← {response}</p>}
            </div>

            {/* History chips */}
            {history.length > 0 && (
                <div>
                    <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Recent Commands</p>
                    <div className="flex flex-col gap-1.5">
                        {history.map((cmd, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/60 border border-gray-700/40">
                                <ChevronRight size={11} className="text-teal-500 flex-shrink-0" />
                                <span className="text-xs text-gray-300 font-mono truncate">{cmd}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ═══ PROCEDURE TIMELINE ════════════════════════════════════ */
function ProcedureTimeline({ procedureStep, currentSurgery, advanceStep }) {
    const handleAdvanceStep = useCallback(async () => {
        if (procedureStep >= PROCEDURE_STEPS.length - 1) return
        try {
            await advanceProcedureStep({
                surgery_id: currentSurgery?.id || 'demo-surgery',
                current_step: procedureStep + 1,
            })
            advanceStep()  // dispatch to context
        } catch {
            // Silent fail — UI remains consistent
        }
    }, [procedureStep, currentSurgery, advanceStep])

    return (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <Clock size={16} className="text-teal-400" />
                    <h3 className="text-white font-semibold text-sm">Procedure Timeline</h3>
                </div>
                <span className="text-xs text-gray-500 font-medium">OR-3 · Dr. Okafor</span>
            </div>

            <div className="relative">
                {PROCEDURE_STEPS.map((step, i) => {
                    const done = i < procedureStep
                    const current = i === procedureStep
                    const pending = i > procedureStep

                    return (
                        <div key={step.id} className="flex gap-4 items-start mb-0">
                            {/* Indicator column */}
                            <div className="flex flex-col items-center flex-shrink-0">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold z-10 transition-all
                    ${done ? 'bg-teal-600 shadow-lg shadow-teal-900/50' : ''}
                    ${current ? 'bg-amber-500 animate-pulse shadow-lg shadow-amber-900/50' : ''}
                    ${pending ? 'bg-gray-700 text-gray-500' : ''}`}
                                >
                                    {done ? (
                                        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                                            <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    ) : (
                                        i + 1
                                    )}
                                </div>
                                {i < PROCEDURE_STEPS.length - 1 && (
                                    <div className={`w-0.5 h-8 mt-1 mb-1 rounded-full transition-colors
                    ${done ? 'bg-teal-600/60' : 'bg-gray-700'}`}
                                    />
                                )}
                            </div>

                            {/* Label */}
                            <div className="pb-8 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className={`text-sm font-semibold leading-tight
                    ${done ? 'text-gray-400' : ''}
                    ${current ? 'text-amber-400' : ''}
                    ${pending ? 'text-gray-600' : ''}`}>
                                        {step.label}
                                    </p>
                                    {current && (
                                        <span className="text-[10px] text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-900/30 border border-amber-800/30">
                                            IN PROGRESS
                                        </span>
                                    )}
                                </div>
                                <p className={`text-xs mt-0.5 font-mono
                  ${done ? 'text-teal-500' : current ? 'text-amber-500/70' : 'text-gray-600'}`}>
                                    {done || current ? step.time : '—'}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Advance step button */}
            <button
                onClick={handleAdvanceStep}
                disabled={procedureStep >= PROCEDURE_STEPS.length - 1}
                className="mt-1 w-full py-2 rounded-xl border border-teal-800/50 text-teal-400 text-xs font-semibold
          hover:bg-teal-900/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
                Advance Step →
            </button>
        </div>
    )
}

/* ═══ MAIN PAGE ══════════════════════════════════════════════ */
const VITALS_INIT = {
    heart_rate: 0, spo2: 0, systolic_bp: 0,
    diastolic_bp: 0, temperature: 0, etco2: 0, resp_rate: 0,
}

export default function IntraOpPage() {
    const {
        currentPatient, currentSurgery,
        alerts, procedureStep,
        addAlert, acknowledgeAlert, advanceStep, setConnected,
    } = useAetheris()

    const [vitals, setVitals] = useState(VITALS_INIT)
    const [prevVitals, setPrevVitals] = useState(null)
    const [vitalsHistory, setVitalsHistory] = useState([])
    const [wsConnected, setWsConnected] = useState(false)
    const [wsError, setWsError] = useState(null)
    const wsRef = useRef(null)

    /* ── WebSocket vitals stream ──────────────────────────── */
    useEffect(() => {
        const patientId = currentPatient?.id || 'p001'

        wsRef.current = new VitalsWebSocket(
            patientId,
            // onVitals
            (newVitals) => {
                setPrevVitals(prev => prev)
                setVitals(curr => { setPrevVitals(curr); return newVitals })
                setVitalsHistory(prev => {
                    const point = {
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        hr: Math.round(newVitals.heart_rate ?? 0),
                        spo2: parseFloat((newVitals.spo2 ?? 0).toFixed(1)),
                        bp: Math.round(newVitals.systolic_bp ?? 0),
                        etco2: Math.round(newVitals.etco2 ?? 0),
                    }
                    return [...prev, point].slice(-20)
                })
                setWsConnected(true)
            },
            // onAlert
            (incomingAlerts) => {
                incomingAlerts.forEach(async (alert) => {
                    const normalised = {
                        id: alert.id || `ws-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                        type: alert.severity?.toLowerCase() === 'critical' ? 'critical'
                            : alert.severity?.toLowerCase() === 'warning' ? 'warning' : 'info',
                        title: alert.title || 'Anomaly Detected',
                        message: alert.message || '',
                        time: 'just now',
                    }
                    // Persist to backend (best-effort)
                    try {
                        await createAlert({
                            patient_id: alert.patient_id || currentPatient?.id || 'p001',
                            severity: alert.severity || 'warning',
                            title: alert.title || 'Anomaly Detected',
                            message: alert.message || '',
                            vital_type: alert.vital_type || null,
                            vital_value: alert.vital_value || null,
                        })
                    } catch {
                        // Backend unavailable — still surface in UI
                    }
                    addAlert(normalised)
                })
            },
            // onError
            () => {
                setWsConnected(false)
                setWsError('WebSocket disconnected — vitals stream unavailable. Check that the backend is running.')
            }
        )

        wsRef.current.connect()
        setConnected(true)
        setWsError(null)

        return () => {
            wsRef.current?.disconnect()
            setConnected(false)
        }
    }, [currentPatient?.id]) // eslint-disable-line react-hooks/exhaustive-deps

    /* SpO₂ color logic */
    const spo2Style = val =>
        val > 95
            ? { value: 'text-green-400' }
            : val >= 90
                ? { value: 'text-amber-400', badge: 'bg-amber-900/40 text-amber-400 border border-amber-800/40', badgeLabel: 'Caution' }
                : { value: 'text-red-400', badge: 'bg-red-900/40 text-red-400 border border-red-800/40', badgeLabel: 'Critical' }

    /* BP status badge */
    const bpStyle = val => {
        if (val > 140) return { value: 'text-red-400', badge: 'bg-red-900/40 text-red-400 border border-red-800/40', badgeLabel: 'Hypertensive' }
        if (val < 90) return { value: 'text-amber-400', badge: 'bg-amber-900/40 text-amber-400 border border-amber-800/40', badgeLabel: 'Hypotensive' }
        return { value: 'text-white', badge: 'bg-green-900/40 text-green-400 border border-green-800/40', badgeLabel: 'Normal' }
    }

    /* Local-only unacknowledged alerts for the panel */
    const localAlerts = alerts.filter(a => !a.acknowledged)

    return (
        <div className="animate-fadeIn space-y-4">
            <SectionHeader
                title="Intra-Op Monitor"
                subtitle="Real-time operative vitals and anaesthesia tracking"
                icon={Activity}
            />

            {/* WebSocket error banner */}
            {wsError && (
                <ApiErrorBanner
                    error={wsError}
                    onRetry={() => {
                        setWsError(null)
                        wsRef.current?.disconnect()
                        wsRef.current?.connect()
                    }}
                    onDismiss={() => setWsError(null)}
                />
            )}

            {/* ── TOP ROW: 5 vital cards ───────────────── */}
            <div className="grid grid-cols-5 gap-3">
                <VitalCard
                    label="Heart Rate" unit="bpm" icon={Heart}
                    value={vitals.heart_rate} prev={prevVitals?.heart_rate}
                    iconColor="text-red-400" iconBg="bg-red-900/20"
                />
                <VitalCard
                    label="SpO₂" unit="%" icon={Wind}
                    value={vitals.spo2} prev={prevVitals?.spo2}
                    iconColor="text-blue-400" iconBg="bg-blue-900/20"
                    getStyle={spo2Style}
                />
                <VitalCard
                    label="Blood Pressure" unit="mmHg" icon={Activity}
                    value={vitals.systolic_bp && vitals.diastolic_bp
                        ? `${Math.round(vitals.systolic_bp)}/${Math.round(vitals.diastolic_bp)}`
                        : '—'}
                    prev={null}
                    iconColor="text-yellow-400" iconBg="bg-yellow-900/20"
                    getStyle={() => bpStyle(vitals.systolic_bp)}
                />
                <VitalCard
                    label="Temperature" unit="°C" icon={Thermometer}
                    value={vitals.temperature} prev={prevVitals?.temperature}
                    iconColor="text-green-400" iconBg="bg-green-900/20"
                />
                <VitalCard
                    label="EtCO₂" unit="mmHg" icon={Zap}
                    value={vitals.etco2} prev={prevVitals?.etco2}
                    iconColor="text-violet-400" iconBg="bg-violet-900/20"
                />
            </div>

            {/* ── MAIN ROW: Chart + Alerts ─────────────── */}
            <div className="grid grid-cols-3 gap-4">

                {/* Live AreaChart */}
                <div className="col-span-2 bg-gray-900 rounded-2xl border border-gray-800 p-5">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-white font-semibold text-sm">Live Vitals Chart</h3>
                        <div className="flex items-center gap-3">
                            {[
                                { color: '#ef4444', label: 'HR' },
                                { color: '#3b82f6', label: 'SpO₂' },
                                { color: '#eab308', label: 'BP' },
                                { color: '#a78bfa', label: 'EtCO₂' },
                            ].map(({ color, label }) => (
                                <div key={label} className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                                    <span className="text-xs text-gray-400">{label}</span>
                                </div>
                            ))}

                            {/* Connection status badge */}
                            {wsConnected ? (
                                <span className="bg-green-600 text-white text-[10px] font-bold animate-pulse rounded px-2 py-0.5 ml-1">
                                    LIVE
                                </span>
                            ) : (
                                <span className="bg-amber-600 text-white text-[10px] font-bold rounded px-2 py-0.5 ml-1">
                                    RECONNECTING…
                                </span>
                            )}
                        </div>
                    </div>

                    <VitalsChart data={vitalsHistory} height={220} />
                </div>

                {/* Anomaly Alerts — driven by global context */}
                <AlertPanel alerts={localAlerts} onAcknowledge={acknowledgeAlert} />
            </div>

            {/* ── BOTTOM ROW: Voice + Timeline ─────────── */}
            <div className="grid grid-cols-2 gap-4">
                <VoicePanel currentPatient={currentPatient} addAlert={addAlert} />
                <ProcedureTimeline
                    procedureStep={procedureStep}
                    currentSurgery={currentSurgery}
                    advanceStep={advanceStep}
                />
            </div>
        </div>
    )
}
