import { useState, useEffect, useRef, useCallback } from 'react'
import {
    Heart, Wind, Activity, Thermometer, Zap,
    TrendingUp, TrendingDown, Minus,
    AlertCircle, ShieldCheck, Mic, MicOff, Clock,
    ChevronRight,
} from 'lucide-react'
import SectionHeader from '../components/SectionHeader'
import VitalsChart from '../components/charts/VitalsChart'

/* ═══ CONSTANTS ══════════════════════════════════════════════ */
const HISTORY = 20
const TICK_MS = 1500

const RANGES = {
    hr: { min: 55, max: 110, step: 3 },
    spo2: { min: 90, max: 100, step: 0.4 },
    sbp: { min: 95, max: 165, step: 4 },
    dbp: { min: 55, max: 100, step: 2 },
    temp: { min: 36.0, max: 38.6, step: 0.1 },
    etco2: { min: 28, max: 48, step: 1 },
}

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)) }
function jitter(v, { min, max, step }) {
    return parseFloat(clamp(v + (Math.random() - 0.48) * step * 2, min, max).toFixed(1))
}

const PROCEDURE_STEPS = [
    { id: 'induction', label: 'Anesthesia Induction', time: '07:02' },
    { id: 'incision', label: 'Incision', time: '07:18' },
    { id: 'phase1', label: 'Procedure Phase 1', time: '07:45' },
    { id: 'phase2', label: 'Procedure Phase 2', time: '09:10' },
    { id: 'closure', label: 'Closure', time: '10:40' },
    { id: 'handoff', label: 'Recovery Handoff', time: '11:00' },
]

const VOICE_RESPONSES = [
    'HR trending up — continue monitoring.',
    'Vasopressor bolus noted.',
    'Increasing FiO₂ to 60%.',
    'Calling anaesthesiologist to bedside.',
    'Adding norepinephrine to infusion.',
    'ECG rhythm confirmed — sinus.',
]
const MOCK_CMDS = [
    'Increase anaesthetic depth',
    'Log BP reading',
    'Alert surgeon: SpO₂ drop',
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
                        <div key={a.id} className={`border-l-4 ${BORDER[a.type]} bg-gray-800 rounded-r-xl p-3`}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${BADGE[a.type]}`}>
                                            {a.type.toUpperCase()}
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

/* ═══ VOICE COMMAND UI ═══════════════════════════════════════ */
function VoicePanel() {
    const [listening, setListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [response, setResponse] = useState('')
    const [history, setHistory] = useState(MOCK_CMDS)
    const timerRef = useRef(null)

    const startListening = useCallback(() => {
        if (listening) return
        setListening(true)
        setTranscript('Listening…')
        setResponse('')

        timerRef.current = setTimeout(() => {
            const cmd = MOCK_CMDS[Math.floor(Math.random() * MOCK_CMDS.length)]
            const res = VOICE_RESPONSES[Math.floor(Math.random() * VOICE_RESPONSES.length)]
            setTranscript(`> ${cmd}`)
            setResponse(res)
            setHistory(prev => [cmd, ...prev].slice(0, 3))
            setListening(false)
        }, 2500)
    }, [listening])

    useEffect(() => () => clearTimeout(timerRef.current), [])

    return (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-5">
                <Mic size={16} className="text-teal-400" />
                <h3 className="text-white font-semibold text-sm">Voice Command Interface</h3>
            </div>

            {/* Mic button */}
            <div className="flex justify-center mb-5">
                <div className="relative">
                    {listening && (
                        <span className="absolute inset-0 rounded-full ring-4 ring-teal-500/50 animate-ping" />
                    )}
                    <button
                        onClick={startListening}
                        disabled={listening}
                        className={`relative z-10 rounded-full p-6 flex items-center justify-center transition-all shadow-lg
              ${listening
                                ? 'bg-red-600 shadow-red-900/40 scale-110'
                                : 'bg-teal-600 hover:bg-teal-500 shadow-teal-900/40 hover:scale-105 active:scale-95'}`}
                    >
                        {listening
                            ? <MicOff size={28} className="text-white" />
                            : <Mic size={28} className="text-white" />}
                    </button>
                </div>
            </div>

            <p className="text-center text-xs text-gray-500 mb-4">
                {listening ? 'Listening — speak your command' : 'Tap mic to issue a voice command'}
            </p>

            {/* Transcription box */}
            <div className="bg-gray-800 rounded-xl p-3 min-h-16 font-mono text-sm text-green-400 mb-4 border border-gray-700">
                {transcript || <span className="text-gray-600">Awaiting input…</span>}
                {response && <p className="text-teal-400 mt-1 text-xs">← {response}</p>}
            </div>

            {/* History chips */}
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
        </div>
    )
}

/* ═══ PROCEDURE TIMELINE ════════════════════════════════════ */
function ProcedureTimeline() {
    const [currentStep, setCurrentStep] = useState(2)  // 0-indexed; phase1 is current

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
                    const done = i < currentStep
                    const current = i === currentStep
                    const pending = i > currentStep

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
                                {/* Connector line */}
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
                onClick={() => setCurrentStep(s => Math.min(s + 1, PROCEDURE_STEPS.length - 1))}
                disabled={currentStep >= PROCEDURE_STEPS.length - 1}
                className="mt-1 w-full py-2 rounded-xl border border-teal-800/50 text-teal-400 text-xs font-semibold
          hover:bg-teal-900/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
                Advance Step →
            </button>
        </div>
    )
}

/* ═══ MAIN PAGE ══════════════════════════════════════════════ */
const initVitals = () => ({
    hr: 78,
    spo2: 97.5,
    sbp: 122,
    dbp: 80,
    temp: 36.8,
    etco2: 36,
})

const makeLabel = () => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
}

let alertSeed = 1

export default function IntraOpPage() {
    const [vitals, setVitals] = useState(initVitals)
    const [prev, setPrev] = useState(null)
    const [history, setHistory] = useState([])
    const [alerts, setAlerts] = useState([
        { id: 'a1', type: 'critical', title: 'SpO₂ Drop', message: 'SpO₂ fell to 91% — check airway.', time: '2 min ago' },
        { id: 'a2', type: 'warning', title: 'Elevated BP', message: 'Blood pressure 158/100 — monitor closely.', time: '5 min ago' },
        { id: 'a3', type: 'info', title: 'Temp normalising', message: 'Temperature trending back to 36.8°C.', time: '8 min ago' },
    ])

    /* Live tick */
    useEffect(() => {
        const id = setInterval(() => {
            setVitals(prev => {
                const next = {
                    hr: jitter(prev.hr, RANGES.hr),
                    spo2: jitter(prev.spo2, RANGES.spo2),
                    sbp: jitter(prev.sbp, RANGES.sbp),
                    dbp: jitter(prev.dbp, RANGES.dbp),
                    temp: jitter(prev.temp, RANGES.temp),
                    etco2: jitter(prev.etco2, RANGES.etco2),
                }
                setPrev(prev)

                /* Append history point */
                const point = {
                    time: makeLabel(),
                    hr: Math.round(next.hr),
                    spo2: parseFloat(next.spo2.toFixed(1)),
                    bp: Math.round(next.sbp),
                    etco2: Math.round(next.etco2),
                }
                setHistory(h => [...h, point].slice(-HISTORY))

                /* Auto-generate anomaly alert if SpO2 drops low */
                if (next.spo2 < 93) {
                    alertSeed++
                    setAlerts(a => {
                        const alreadyHas = a.some(x => x.title === 'SpO₂ Critical')
                        if (alreadyHas) return a
                        return [{
                            id: `auto-${alertSeed}`,
                            type: 'critical',
                            title: 'SpO₂ Critical',
                            message: `SpO₂ fell to ${next.spo2.toFixed(0)}% — immediate action required.`,
                            time: 'just now',
                        }, ...a]
                    })
                }

                return next
            })
        }, TICK_MS)
        return () => clearInterval(id)
    }, [])

    /* Seed initial history */
    useEffect(() => {
        const now = new Date()
        const seed = Array.from({ length: HISTORY }, (_, i) => {
            const t = new Date(now - (HISTORY - i) * TICK_MS)
            return {
                time: `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`,
                hr: Math.round(jitter(78, RANGES.hr)),
                spo2: parseFloat(jitter(97.5, RANGES.spo2).toFixed(1)),
                bp: Math.round(jitter(122, RANGES.sbp)),
                etco2: Math.round(jitter(36, RANGES.etco2)),
            }
        })
        setHistory(seed)
    }, [])

    const acknowledgeAlert = useCallback(id =>
        setAlerts(a => a.filter(x => x.id !== id)), [])

    /* SpO₂ color logic */
    const spo2Style = val => val > 95
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

    return (
        <div className="animate-fadeIn space-y-4">
            <SectionHeader
                title="Intra-Op Monitor"
                subtitle="Real-time operative vitals and anaesthesia tracking"
                icon={Activity}
            />

            {/* ── TOP ROW: 5 vital cards ───────────────── */}
            <div className="grid grid-cols-5 gap-3">
                <VitalCard
                    label="Heart Rate" unit="bpm" icon={Heart}
                    value={vitals.hr} prev={prev?.hr}
                    iconColor="text-red-400" iconBg="bg-red-900/20"
                />
                <VitalCard
                    label="SpO₂" unit="%" icon={Wind}
                    value={vitals.spo2} prev={prev?.spo2}
                    iconColor="text-blue-400" iconBg="bg-blue-900/20"
                    getStyle={spo2Style}
                />
                <VitalCard
                    label="Blood Pressure" unit="mmHg" icon={Activity}
                    value={`${Math.round(vitals.sbp)}/${Math.round(vitals.dbp)}`}
                    prev={null}
                    iconColor="text-yellow-400" iconBg="bg-yellow-900/20"
                    getStyle={() => bpStyle(vitals.sbp)}
                />
                <VitalCard
                    label="Temperature" unit="°C" icon={Thermometer}
                    value={vitals.temp} prev={prev?.temp}
                    iconColor="text-green-400" iconBg="bg-green-900/20"
                />
                <VitalCard
                    label="EtCO₂" unit="mmHg" icon={Zap}
                    value={vitals.etco2} prev={prev?.etco2}
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
                            {/* Legend dots */}
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
                            <span className="bg-red-600 text-white text-[10px] font-bold animate-pulse rounded px-2 py-0.5 ml-1">
                                LIVE
                            </span>
                        </div>
                    </div>

                    {/* Live vitals chart — using reusable VitalsChart component */}
                    <VitalsChart data={history} height={220} />
                </div>

                {/* Anomaly Alerts */}
                <AlertPanel alerts={alerts} onAcknowledge={acknowledgeAlert} />
            </div>

            {/* ── BOTTOM ROW: Voice + Timeline ─────────── */}
            <div className="grid grid-cols-2 gap-4">
                <VoicePanel />
                <ProcedureTimeline />
            </div>
        </div>
    )
}
