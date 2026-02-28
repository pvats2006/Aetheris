import { useState, useEffect, useCallback } from 'react'
import {
    Heart, Wind, Activity, Thermometer, Zap,
    FileText, Download, Send, Copy,
    AlertTriangle, CheckCircle, ShieldAlert,
    Sparkles, BrainCircuit,
    Bell, Clock, User,
} from 'lucide-react'
import SectionHeader from '../components/SectionHeader'
import StatusBadge from '../components/StatusBadge'
import RiskDonut from '../components/charts/RiskDonut'

/* ─────────────────────────────────────────────────────────
   RECOVERY MONITOR DATA
───────────────────────────────────────────────────────── */
const PATIENT = {
    name: 'Maria Alvarez',
    age: 62,
    surgery: 'Laparoscopic Cholecystectomy',
    surgeon: 'Dr. Jane Doe',
    completedAt: '08:05',
    room: 'PACU-4',
    bloodType: 'AB+',
}

function useElapsed(startHHMM) {
    const [elapsed, setElapsed] = useState('')
    useEffect(() => {
        const calc = () => {
            const [h, m] = startHHMM.split(':').map(Number)
            const now = new Date()
            const start = new Date(now)
            start.setHours(h, m, 0, 0)
            let diff = Math.floor((now - start) / 1000)
            if (diff < 0) diff += 86400
            const hh = Math.floor(diff / 3600)
            const mm = Math.floor((diff % 3600) / 60)
            const ss = diff % 60
            setElapsed(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`)
        }
        calc()
        const id = setInterval(calc, 1000)
        return () => clearInterval(id)
    }, [startHHMM])
    return elapsed
}

const VITALS = [
    { label: 'Heart Rate', value: '74 bpm', status: 'normal' },
    { label: 'SpO₂', value: '98%', status: 'normal' },
    { label: 'Blood Pressure', value: '138/86', status: 'borderline' },
    { label: 'Temperature', value: '37.1°C', status: 'normal' },
    { label: 'Resp. Rate', value: '16 /min', status: 'normal' },
    { label: 'EtCO₂', value: '38 mmHg', status: 'normal' },
]

const DOT = {
    normal: 'bg-green-500',
    borderline: 'bg-amber-500',
    critical: 'bg-red-500',
}
const DOT_GLOW = {
    normal: 'shadow-green-500/60',
    borderline: 'shadow-amber-500/60',
    critical: 'shadow-red-500/60',
}

const PAIN_COLOR = p => p <= 3 ? 'text-green-400' : p <= 6 ? 'text-amber-400' : 'text-red-400'
const PAIN_BG = p => p <= 3 ? 'bg-green-500' : p <= 6 ? 'bg-amber-500' : 'bg-red-500'
const PAIN_LABEL = p => p <= 3 ? 'Mild' : p <= 6 ? 'Moderate' : 'Severe'

/* ─────────────────────────────────────────────────────────
   REPORTS DATA
───────────────────────────────────────────────────────── */
const OPERATIVE_NOTE = `OPERATIVE NOTE
══════════════════════════════════════
Patient:    Maria Alvarez, 62F
Surgeon:    Dr. Jane Doe
Date:       28 Feb 2026
Procedure:  Laparoscopic Cholecystectomy
Anaesthesia:General (Dr. Marcus Lee)
Duration:   2h 05m  |  EBL: < 50 mL

PRE-OPERATIVE DIAGNOSIS
  Symptomatic cholelithiasis with acute
  cholecystitis (confirmed USS 27 Feb).

PROCEDURE
  1. Patient positioned supine under GA.
  2. Hasson technique for peritoneal access.
  3. Four-port laparoscopic approach.
  4. Gallbladder dissected from liver bed.
  5. Cystic duct and artery clipped ×2,
     divided. Specimen retrieved in bag.
  6. Port-sites closed. Dressings applied.

POST-OPERATIVE STATUS
  Patient transferred to PACU in stable
  condition. Observations satisfactory.
  IV analgesia commenced. Diet as tolerated
  from 4 hours post-op.

Signed: Dr. J. Doe  |  08:12, 28 Feb 2026`

const DISCHARGE_SUMMARY = `DISCHARGE SUMMARY
══════════════════════════════════════
Patient:    Maria Alvarez, 62F, AB+
Admission:  27 Feb 2026  →  28 Feb 2026
Diagnosis:  Acute cholecystitis
Procedure:  Laparoscopic cholecystectomy
Surgeon:    Dr. Jane Doe

HOSPITAL COURSE
  Uncomplicated laparoscopic procedure.
  Post-op pain managed with IV morphine
  and ketorolac (transitioned to oral).
  Diet tolerated. Wound clean/dry/intact.

DISCHARGE MEDICATIONS
  • Paracetamol 1g QDS (5 days)
  • Ibuprofen 400mg TDS with food (5 days)
  • Omeprazole 20mg OD (14 days)

FOLLOW-UP
  GP review in 7 days.
  Outpatient clinic in 4 weeks.
  Return immediately if: fever >38.5°C,
  worsening pain, jaundice, wound dehiscence.

Signed: Dr. J. Doe  |  15:00, 28 Feb 2026`

/* ─────────────────────────────────────────────────────────
   RISK PREDICTOR DATA
───────────────────────────────────────────────────────── */
const RISKS = [
    { label: 'DVT', pct: 12, level: 'low' },
    { label: 'Infection', pct: 8, level: 'low' },
    { label: 'Pneumonia', pct: 23, level: 'medium' },
    { label: 'Readmission', pct: 18, level: 'low' },
]

const RISK_STYLE = {
    low: { bar: 'bg-green-500', badge: 'bg-green-900/40 text-green-400 border border-green-800/40', label: 'Low' },
    medium: { bar: 'bg-amber-500', badge: 'bg-amber-900/40 text-amber-400 border border-amber-800/40', label: 'Medium' },
    high: { bar: 'bg-red-500', badge: 'bg-red-900/40 text-red-400 border border-red-800/40', label: 'High' },
}

const overallScore = Math.round(RISKS.reduce((s, r) => s + r.pct, 0) / RISKS.length)


/* ═══════════════════════════════════════════════════════
   COLUMN 1 — RECOVERY MONITOR
═══════════════════════════════════════════════════════ */
function RecoveryMonitor() {
    const [pain, setPain] = useState(3)
    const [alerted, setAlerted] = useState(false)
    const elapsed = useElapsed(PATIENT.completedAt)

    return (
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <Heart size={16} className="text-teal-400" />
                <h3 className="text-white font-semibold text-sm">Recovery Monitor</h3>
            </div>

            {/* Patient card */}
            <div className="bg-gray-800/70 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-700
            flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        MA
                    </div>
                    <div>
                        <p className="text-white font-semibold text-sm">{PATIENT.name}</p>
                        <p className="text-xs text-gray-400">{PATIENT.age}F · {PATIENT.bloodType} · {PATIENT.room}</p>
                    </div>
                </div>
                <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Procedure</span>
                        <span className="text-gray-200 font-medium text-right max-w-[60%] leading-tight">
                            {PATIENT.surgery}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Completed</span>
                        <span className="text-gray-200 font-medium">{PATIENT.completedAt}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Elapsed</span>
                        <span className="text-teal-400 font-mono font-semibold">{elapsed}</span>
                    </div>
                </div>
            </div>

            {/* Recovery vitals */}
            <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-2">
                    Recovery Vitals
                </p>
                <div className="space-y-2">
                    {VITALS.map(({ label, value, status }) => (
                        <div key={label}
                            className="flex items-center justify-between py-2 border-b border-gray-800/60 last:border-0">
                            <span className="text-xs text-gray-400">{label}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-white">{value}</span>
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT[status]}
                  shadow-sm ${DOT_GLOW[status]}`} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pain scale */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-400 font-medium">Pain Scale</p>
                    <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${PAIN_COLOR(pain)}`}>{pain}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
              ${pain <= 3
                                ? 'bg-green-900/40 text-green-400 border border-green-800/40'
                                : pain <= 6
                                    ? 'bg-amber-900/40 text-amber-400 border border-amber-800/40'
                                    : 'bg-red-900/40 text-red-400 border border-red-800/40'}`}
                        >
                            {PAIN_LABEL(pain)}
                        </span>
                    </div>
                </div>

                {/* Pain track + thumb */}
                <div className="relative mb-1">
                    <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-300 ${PAIN_BG(pain)}`}
                            style={{ width: `${pain * 10}%` }}
                        />
                    </div>
                    <input
                        type="range" min={0} max={10} step={1}
                        value={pain}
                        onChange={e => setPain(Number(e.target.value))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                    />
                </div>
                <div className="flex justify-between text-[10px] text-gray-600 font-medium">
                    <span>None (0)</span><span>Severe (10)</span>
                </div>
            </div>

            {/* Alert button */}
            <button
                onClick={() => { setAlerted(true); setTimeout(() => setAlerted(false), 3000) }}
                className={`w-full rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2
          transition-all ${alerted
                        ? 'bg-red-700 text-red-100'
                        : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30 active:scale-[0.98]'}`}
            >
                <Bell size={15} />
                {alerted ? 'Nursing Staff Alerted ✓' : 'Alert Nursing Staff'}
            </button>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════
   COLUMN 2 — AUTO-GENERATED REPORTS
═══════════════════════════════════════════════════════ */
function ReportsPanel() {
    const [tab, setTab] = useState('operative')
    const [copied, setCopied] = useState(false)

    const content = tab === 'operative' ? OPERATIVE_NOTE : DISCHARGE_SUMMARY

    const handleCopy = () => {
        navigator.clipboard?.writeText(content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <FileText size={16} className="text-teal-400" />
                <h3 className="text-white font-semibold text-sm">Auto-Generated Reports</h3>
                <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full
          bg-teal-900/40 text-teal-400 border border-teal-800/30">AI</span>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800">
                {[
                    { key: 'operative', label: 'Operative Note' },
                    { key: 'discharge', label: 'Discharge Summary' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px
              ${tab === key
                                ? 'border-teal-500 text-teal-400'
                                : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-gray-800 rounded-xl p-4 text-xs text-gray-300 font-mono leading-relaxed
        min-h-64 overflow-auto flex-1 whitespace-pre-wrap border border-gray-700/50">
                {content}
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white
            rounded-lg px-4 py-2 text-xs font-medium transition-all"
                >
                    <Copy size={13} />
                    {copied ? 'Copied!' : 'Copy'}
                </button>
                <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white
          rounded-lg px-4 py-2 text-xs font-medium transition-all shadow-sm shadow-teal-900/30">
                    <Download size={13} />
                    Download PDF
                </button>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white
          rounded-lg px-4 py-2 text-xs font-medium transition-all shadow-sm shadow-blue-900/30">
                    <Send size={13} />
                    Send to EHR
                </button>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════
   COLUMN 3 — COMPLICATION RISK PREDICTOR
═══════════════════════════════════════════════════════ */
function RiskPredictor() {
    const [generated, setGenerated] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleGenerate = async () => {
        setLoading(true)
        await new Promise(r => setTimeout(r, 1800))
        setGenerated(true)
        setLoading(false)
    }

    return (
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <BrainCircuit size={16} className="text-purple-400" />
                    <h3 className="text-white font-semibold text-sm">Complication Risk Predictor</h3>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full
          bg-purple-600/20 text-purple-400 border border-purple-700/40 whitespace-nowrap">
                    Powered by ML
                </span>
            </div>

            {/* Risk items */}
            <div className="space-y-4">
                {RISKS.map(({ label, pct, level }) => {
                    const { bar, badge, label: lvlLabel } = RISK_STYLE[level]
                    return (
                        <div key={label}>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs text-gray-400 font-medium">{label} Risk</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white">{pct}%</span>
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badge}`}>
                                        {lvlLabel}
                                    </span>
                                </div>
                            </div>
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${bar} rounded-full transition-all duration-700`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-800" />

            {/* Overall donut */}
            <div>
                <p className="text-xs text-gray-400 font-medium mb-3 text-center">
                    Overall Risk Score
                </p>
                <RiskDonut score={overallScore} />

                <div className="flex justify-center gap-4 mt-1">
                    {[
                        { color: 'bg-amber-500', label: 'Risk' },
                        { color: 'bg-gray-700', label: 'Clear' },
                    ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-sm ${color}`} />
                            <span className="text-[10px] text-gray-500">{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Generate button */}
            <button
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2
          transition-all ${loading
                        ? 'bg-purple-800 text-purple-200 cursor-not-allowed'
                        : generated
                            ? 'bg-green-700 hover:bg-green-600 text-white'
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 active:scale-[0.98]'}`}
            >
                {loading ? (
                    <>
                        <span className="w-4 h-4 border-2 border-purple-300 border-t-transparent
              rounded-full animate-spin" />
                        Generating…
                    </>
                ) : generated ? (
                    <><CheckCircle size={15} /> Full Report Ready</>
                ) : (
                    <><Sparkles size={15} /> Generate Full Report</>
                )}
            </button>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════
   PAGE ROOT
═══════════════════════════════════════════════════════ */
export default function PostOpPage() {
    return (
        <div className="animate-fadeIn space-y-5">
            <SectionHeader
                title="Post-Op & Recovery"
                subtitle="Automated recovery monitoring, reports, and risk prediction"
                icon={Activity}
                actionLabel="Discharge Patient"
                onAction={() => { }}
            />

            <div className="grid grid-cols-3 gap-5">
                <RecoveryMonitor />
                <ReportsPanel />
                <RiskPredictor />
            </div>
        </div>
    )
}
