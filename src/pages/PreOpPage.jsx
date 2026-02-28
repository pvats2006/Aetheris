import { useState, useCallback } from 'react'
import {
    Brain, Sparkles, CheckCircle, AlertTriangle, Circle,
    ShieldCheck, Pill, ClipboardCheck, Loader2,
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import SectionHeader from '../components/SectionHeader'

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
const FORM_DEFAULTS = {
    name: '',
    age: '',
    gender: '',
    surgeryType: '',
    asa: '',
    allergies: '',
    medications: '',
}

/* Risk level derived from overall score */
function riskLevel(score) {
    if (score >= 65) return { label: 'High', color: 'text-red-400', bg: 'bg-red-500', ring: '#ef4444' }
    if (score >= 35) return { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500', ring: '#f59e0b' }
    return { label: 'Low', color: 'text-green-400', bg: 'bg-green-500', ring: '#22c55e' }
}

/* Drug interactions seeded by medication text */
const SAMPLE_INTERACTIONS = [
    { drug: 'Warfarin', interacts: 'Aspirin', severity: 'high', effect: 'Increased bleeding risk' },
    { drug: 'Metformin', interacts: 'Contrast dye', severity: 'medium', effect: 'Lactic acidosis risk' },
    { drug: 'Lisinopril', interacts: 'Potassium', severity: 'low', effect: 'Hyperkalaemia risk' },
]

const SEV_STYLE = {
    high: { badge: 'bg-red-900/40 text-red-400 border border-red-800/40', dot: 'bg-red-500', label: 'High' },
    medium: { badge: 'bg-amber-900/40 text-amber-400 border border-amber-800/40', dot: 'bg-amber-500', label: 'Medium' },
    low: { badge: 'bg-blue-900/40 text-blue-400 border border-blue-800/40', dot: 'bg-blue-500', label: 'Low' },
}

const CHECKLIST_ITEMS = [
    { id: 'consent', label: 'Consent form signed' },
    { id: 'blood', label: 'Blood work reviewed' },
    { id: 'imaging', label: 'Imaging reviewed' },
    { id: 'npo', label: 'NPO status confirmed' },
    { id: 'allergies', label: 'Allergies verified' },
    { id: 'iv', label: 'IV access confirmed' },
    { id: 'anesthesia', label: 'Anesthesia plan approved' },
]

/* ═══════════════════════════════════════════════════
   SVG CIRCULAR PROGRESS RING
═══════════════════════════════════════════════════ */
function RiskRing({ score, color }) {
    const R = 52
    const C = 2 * Math.PI * R          // circumference
    const offset = C - (score / 100) * C

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width="130" height="130" viewBox="0 0 130 130" className="-rotate-90">
                {/* Track */}
                <circle
                    cx="65" cy="65" r={R}
                    fill="none"
                    stroke="#1f2937"
                    strokeWidth="10"
                />
                {/* Progress */}
                <circle
                    cx="65" cy="65" r={R}
                    fill="none"
                    stroke={color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={C}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
            </svg>
            {/* Centre label */}
            <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold text-white">{score}</span>
                <span className="text-xs text-gray-500 -mt-0.5">/ 100</span>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════
   PROGRESS BAR
═══════════════════════════════════════════════════ */
function ProgressBar({ value, color = 'bg-teal-500', label, pct }) {
    return (
        <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{label}</span>
                <span className="text-gray-300 font-semibold">{pct}%</span>
            </div>
            <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                    className={`${color} h-2 rounded-full transition-all duration-1000`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════
   CARD 1 — AI RISK SCORE
═══════════════════════════════════════════════════ */
function RiskScoreCard({ result }) {
    if (!result) {
        return (
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                    <Brain size={16} className="text-teal-400" />
                    <h3 className="text-white font-semibold text-sm">AI Risk Score</h3>
                </div>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mb-3">
                        <Brain size={22} className="text-gray-600" />
                    </div>
                    <p className="text-gray-500 text-sm">Run the AI Assessment to see risk analysis</p>
                </div>
            </div>
        )
    }

    const { overall, cardiac, anesthesia, surgical } = result
    const level = riskLevel(overall)

    return (
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <Brain size={16} className="text-teal-400" />
                    <h3 className="text-white font-semibold text-sm">AI Risk Score</h3>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
          ${level.label === 'High' ? 'bg-red-900/40 text-red-400 border border-red-800/40' :
                        level.label === 'Medium' ? 'bg-amber-900/40 text-amber-400 border border-amber-800/40' :
                            'bg-green-900/40 text-green-400 border border-green-800/40'}`}>
                    {level.label} Risk
                </span>
            </div>

            {/* Ring */}
            <div className="flex justify-center mb-6">
                <RiskRing score={overall} color={level.ring} />
            </div>

            {/* Breakdown progress bars */}
            <div className="border-t border-gray-800 pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-3">Risk Breakdown</p>
                <ProgressBar label="Cardiac Risk" pct={cardiac} color="bg-red-500" />
                <ProgressBar label="Anesthesia Risk" pct={anesthesia} color="bg-amber-500" />
                <ProgressBar label="Surgical Risk" pct={surgical} color="bg-blue-500" />
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════
   CARD 2 — DRUG INTERACTION CHECKER
═══════════════════════════════════════════════════ */
function DrugInteractionCard({ interactions, hasRun }) {
    return (
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Pill size={16} className="text-teal-400" />
                    <h3 className="text-white font-semibold text-sm">Drug Interaction Checker</h3>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-900/40 text-teal-400 border border-teal-800/30">
                    OpenFDA API
                </span>
            </div>

            {!hasRun && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Pill size={22} className="text-gray-600 mb-2" />
                    <p className="text-gray-500 text-sm">Enter medications and run assessment</p>
                </div>
            )}

            {hasRun && interactions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-5 text-center">
                    <div className="w-10 h-10 rounded-full bg-green-900/30 border border-green-800/30 flex items-center justify-center mb-3">
                        <CheckCircle size={18} className="text-green-400" />
                    </div>
                    <p className="text-green-400 text-sm font-semibold">No interactions found</p>
                    <p className="text-gray-500 text-xs mt-1">Medication profile appears safe</p>
                </div>
            )}

            {hasRun && interactions.length > 0 && (
                <div className="space-y-2.5">
                    {interactions.map((item, i) => {
                        const sev = SEV_STYLE[item.severity]
                        return (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/50 border border-gray-700/30">
                                <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                        <span className="text-xs font-semibold text-white">{item.drug}</span>
                                        <span className="text-gray-600 text-xs">+</span>
                                        <span className="text-xs font-semibold text-white">{item.interacts}</span>
                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${sev.badge}`}>
                                            {sev.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 truncate">{item.effect}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

/* ═══════════════════════════════════════════════════
   CARD 3 — PRE-OP CHECKLIST
═══════════════════════════════════════════════════ */
function ChecklistCard({ hasRun }) {
    const [checked, setChecked] = useState({})
    const toggle = id => setChecked(prev => ({ ...prev, [id]: !prev[id] }))
    const doneCount = Object.values(checked).filter(Boolean).length
    const pct = Math.round((doneCount / CHECKLIST_ITEMS.length) * 100)

    return (
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-teal-400" />
                <h3 className="text-white font-semibold text-sm">AI-Generated Checklist</h3>
            </div>

            {!hasRun ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                    <ClipboardCheck size={22} className="text-gray-600 mb-2" />
                    <p className="text-gray-500 text-sm">Checklist generates after AI assessment</p>
                </div>
            ) : (
                <>
                    <div className="space-y-2 mb-5">
                        {CHECKLIST_ITEMS.map(({ id, label }) => (
                            <label
                                key={id}
                                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-800/50 cursor-pointer transition-colors group"
                            >
                                {/* Custom checkbox */}
                                <div
                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all
                    ${checked[id]
                                            ? 'bg-teal-600 border-teal-600'
                                            : 'border-gray-600 group-hover:border-gray-500'}`}
                                    onClick={() => toggle(id)}
                                >
                                    {checked[id] && (
                                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>
                                <span className={`text-sm transition-colors ${checked[id] ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                    {label}
                                </span>
                            </label>
                        ))}
                    </div>

                    {/* Progress bar */}
                    <div className="border-t border-gray-800 pt-4">
                        <div className="flex justify-between text-xs mb-2">
                            <span className="text-gray-400 font-medium">{doneCount} of {CHECKLIST_ITEMS.length} complete</span>
                            <span className={`font-bold ${pct === 100 ? 'text-green-400' : 'text-teal-400'}`}>{pct}%</span>
                        </div>
                        <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-2 rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-500' : 'bg-teal-500'}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

/* ═══════════════════════════════════════════════════
   FORM FIELD HELPERS
═══════════════════════════════════════════════════ */
const inputClass =
    'bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white w-full text-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ' +
    'placeholder-gray-600'

const labelClass = 'block text-gray-400 text-xs mb-1 font-medium'

function Field({ label, children }) {
    return (
        <div>
            <label className={labelClass}>{label}</label>
            {children}
        </div>
    )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function PreOpPage() {
    const [form, setForm] = useState(FORM_DEFAULTS)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [interactions, setInteractions] = useState([])
    const [hasRun, setHasRun] = useState(false)

    const set = useCallback((key, val) =>
        setForm(prev => ({ ...prev, [key]: val })), [])

    /* Simulate AI risk calculation */
    const runAssessment = useCallback(async () => {
        setLoading(true)
        await new Promise(r => setTimeout(r, 2200))

        /* Pseudo-random but deterministic-ish score based on form inputs */
        const base = parseInt(form.age || 40) > 60 ? 20 : 5
        const asaBonus = { I: 0, II: 10, III: 25, IV: 40, V: 60 }[form.asa] ?? 15
        const surgBonus = { Cardiac: 30, Neuro: 20, Orthopedic: 10, General: 5 }[form.surgeryType] ?? 10
        const allergyBonus = form.allergies.trim().length > 0 ? 5 : 0
        const medBonus = form.medications.trim().length > 5 ? 8 : 0

        const overall = Math.min(99, base + asaBonus + surgBonus + allergyBonus + medBonus)
        const cardiac = Math.min(99, Math.round(overall * 0.9 + Math.random() * 10))
        const anesthesia = Math.min(99, Math.round(overall * 0.7 + Math.random() * 15))
        const surgical = Math.min(99, Math.round(overall * 0.8 + Math.random() * 12))

        /* Drug interactions — show some if medications text is non-empty */
        const meds = form.medications.trim()
        const detected = meds.length > 3
            ? SAMPLE_INTERACTIONS.slice(0, meds.split('\n').length > 1 ? 3 : 1)
            : []

        setResult({ overall, cardiac, anesthesia, surgical })
        setInteractions(detected)
        setHasRun(true)
        setLoading(false)
    }, [form])

    return (
        <div className="animate-fadeIn">
            <SectionHeader
                title="Pre-Op Management"
                subtitle="Patient intake, AI risk assessment and pre-operative checklist"
                icon={ClipboardCheck}
                actionLabel="Export Summary"
                onAction={() => { }}
            />

            <div className="grid grid-cols-3 gap-6">

                {/* ── LEFT PANEL: Patient Intake Form ─────── */}
                <div className="col-span-1">
                    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-7 h-7 rounded-lg bg-teal-600/20 flex items-center justify-center">
                                <ClipboardCheck size={14} className="text-teal-400" />
                            </div>
                            <h3 className="text-white font-semibold text-sm">Patient Intake Form</h3>
                        </div>

                        <div className="space-y-4">
                            <Field label="Patient Name">
                                <input
                                    type="text"
                                    placeholder="Full name"
                                    value={form.name}
                                    onChange={e => set('name', e.target.value)}
                                    className={inputClass}
                                />
                            </Field>

                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Age">
                                    <input
                                        type="number"
                                        placeholder="Years"
                                        min={0} max={130}
                                        value={form.age}
                                        onChange={e => set('age', e.target.value)}
                                        className={inputClass}
                                    />
                                </Field>
                                <Field label="Gender">
                                    <select
                                        value={form.gender}
                                        onChange={e => set('gender', e.target.value)}
                                        className={inputClass + ' appearance-none cursor-pointer'}
                                    >
                                        <option value="" disabled>Select</option>
                                        <option>Male</option>
                                        <option>Female</option>
                                        <option>Non-binary</option>
                                        <option>Prefer not to say</option>
                                    </select>
                                </Field>
                            </div>

                            <Field label="Surgery Type">
                                <select
                                    value={form.surgeryType}
                                    onChange={e => set('surgeryType', e.target.value)}
                                    className={inputClass + ' appearance-none cursor-pointer'}
                                >
                                    <option value="" disabled>Select procedure</option>
                                    <option value="Cardiac">Cardiac</option>
                                    <option value="Orthopedic">Orthopedic</option>
                                    <option value="Neuro">Neuro</option>
                                    <option value="General">General</option>
                                </select>
                            </Field>

                            <Field label="ASA Classification">
                                <select
                                    value={form.asa}
                                    onChange={e => set('asa', e.target.value)}
                                    className={inputClass + ' appearance-none cursor-pointer'}
                                >
                                    <option value="" disabled>Select class</option>
                                    <option value="I">Class I — Normal healthy patient</option>
                                    <option value="II">Class II — Mild systemic disease</option>
                                    <option value="III">Class III — Severe systemic disease</option>
                                    <option value="IV">Class IV — Life-threatening disease</option>
                                    <option value="V">Class V — Moribund patient</option>
                                </select>
                            </Field>

                            <Field label="Known Allergies">
                                <textarea
                                    placeholder="List allergies (one per line)…"
                                    value={form.allergies}
                                    onChange={e => set('allergies', e.target.value)}
                                    rows={3}
                                    className={inputClass + ' resize-none leading-relaxed'}
                                />
                            </Field>

                            <Field label="Current Medications">
                                <textarea
                                    placeholder="List medications (one per line)…"
                                    value={form.medications}
                                    onChange={e => set('medications', e.target.value)}
                                    rows={3}
                                    className={inputClass + ' resize-none leading-relaxed'}
                                />
                            </Field>
                        </div>

                        {/* CTA */}
                        <button
                            onClick={runAssessment}
                            disabled={loading}
                            className={`w-full mt-5 rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 transition-all
                ${loading
                                    ? 'bg-teal-700 text-teal-200 cursor-not-allowed'
                                    : 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/30 active:scale-[0.98]'}`}
                        >
                            {loading ? (
                                <>
                                    <LoadingSpinner size="sm" color="white" />
                                    Analysing…
                                </>
                            ) : (
                                <>
                                    <Brain size={16} />
                                    Run AI Risk Assessment
                                </>
                            )}
                        </button>

                        {result && !loading && (
                            <p className="text-center text-xs text-gray-500 mt-3 font-medium">
                                ✓ Assessment complete · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        )}
                    </div>
                </div>

                {/* ── RIGHT PANEL: Three stacked cards ────── */}
                <div className="col-span-2 flex flex-col gap-5">
                    <RiskScoreCard result={result} />
                    <DrugInteractionCard interactions={interactions} hasRun={hasRun} />
                    <ChecklistCard hasRun={hasRun} />
                </div>

            </div>
        </div>
    )
}
