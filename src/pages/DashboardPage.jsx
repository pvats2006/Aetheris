import { useState, useEffect } from 'react'
import {
    Users, AlertTriangle, Scissors, FileText,
    Heart, Activity, TrendingUp, Download, X,
    ChevronUp, Wind, Thermometer,
} from 'lucide-react'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

/* ── COUNT-UP HOOK ────────────────────────────────────── */
function useCountUp(target, duration = 800) {
    const [count, setCount] = useState(0)
    useEffect(() => {
        let frame
        const start = performance.now()
        const tick = now => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            // ease-out quad
            const eased = 1 - Math.pow(1 - progress, 2)
            setCount(Math.round(eased * target))
            if (progress < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [target, duration])
    return count
}

/* ── SKELETON SCREEN ──────────────────────────────────── */
function SkeletonCard({ className = '' }) {
    return (
        <div className={`bg-gray-800 rounded-2xl border border-gray-700/50 animate-pulse ${className}`}>
            <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2">
                        <div className="h-2.5 w-24 bg-gray-700 rounded-full" />
                        <div className="h-8 w-16 bg-gray-700 rounded-lg" />
                    </div>
                    <div className="w-10 h-10 bg-gray-700 rounded-xl" />
                </div>
                <div className="h-2 w-20 bg-gray-700 rounded-full" />
            </div>
        </div>
    )
}

function SkeletonChart() {
    return (
        <div className="bg-gray-800 rounded-2xl border border-gray-700/50 animate-pulse p-5">
            <div className="flex items-center justify-between mb-5">
                <div className="h-4 w-36 bg-gray-700 rounded-full" />
                <div className="h-5 w-24 bg-gray-700 rounded-full" />
            </div>
            <div className="h-[220px] bg-gray-700/50 rounded-xl mb-5" />
            <div className="grid grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-14 bg-gray-700/50 rounded-xl" />
                ))}
            </div>
        </div>
    )
}

function SkeletonDashboard() {
    return (
        <div className="animate-fadeIn space-y-5">
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
            {/* Chart */}
            <SkeletonChart />
            {/* Two col row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="h-72 bg-gray-800 rounded-2xl border border-gray-700/50 animate-pulse" />
                <div className="h-72 bg-gray-800 rounded-2xl border border-gray-700/50 animate-pulse" />
            </div>
            {/* Reports row */}
            <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-36 bg-gray-800 rounded-2xl border border-gray-700/50 animate-pulse" />
                ))}
            </div>
        </div>
    )
}

/* ── DATA ─────────────────────────────────────── */
const vitalsData = [
    { time: '08:00', hr: 72, spo2: 97, bp: 118, temp: 36.5 },
    { time: '08:10', hr: 75, spo2: 98, bp: 121, temp: 36.6 },
    { time: '08:20', hr: 78, spo2: 97, bp: 119, temp: 36.7 },
    { time: '08:30', hr: 80, spo2: 99, bp: 123, temp: 36.8 },
    { time: '08:40', hr: 76, spo2: 98, bp: 120, temp: 36.7 },
    { time: '08:50', hr: 79, spo2: 98, bp: 122, temp: 36.9 },
    { time: '09:00', hr: 78, spo2: 98, bp: 120, temp: 36.8 },
    { time: '09:10', hr: 81, spo2: 97, bp: 124, temp: 36.8 },
    { time: '09:20', hr: 77, spo2: 99, bp: 119, temp: 36.7 },
]

const surgeries = [
    { id: 1, initials: 'RM', name: 'Robert Mills', type: 'Appendectomy', duration: '1h 24m', status: 'In Progress' },
    { id: 2, initials: 'SL', name: 'Sarah Lin', type: 'Knee Arthroscopy', duration: '45m', status: 'Pre-Op' },
    { id: 3, initials: 'DK', name: 'David Kim', type: 'Cardiac Bypass', duration: '3h 10m', status: 'In Progress' },
    { id: 4, initials: 'MA', name: 'Maria Alvarez', type: 'Cholecystectomy', duration: '2h 05m', status: 'Recovery' },
]

const alerts = [
    { id: 1, patient: 'David Kim', risk: 'Elevated BP — 158/100', severity: 'High' },
    { id: 2, patient: 'Robert Mills', risk: 'SpO2 dip detected — 93%', severity: 'High' },
    { id: 3, patient: 'Lena Park', risk: 'Drug interaction flagged', severity: 'Medium' },
    { id: 4, patient: 'Omar Farouk', risk: 'Post-op fever — 38.4°C', severity: 'Medium' },
    { id: 5, patient: 'Sarah Lin', risk: 'Delayed recovery vitals', severity: 'Low' },
]

const reports = [
    { id: 1, icon: FileText, color: 'text-teal-400', bg: 'bg-teal-900/30', border: 'border-teal-800/30', type: 'Operative Note', patient: 'Robert Mills', time: '10 min ago' },
    { id: 2, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-900/30', border: 'border-blue-800/30', type: 'Discharge Summary', patient: 'Lisa Chen', time: '32 min ago' },
    { id: 3, icon: FileText, color: 'text-amber-400', bg: 'bg-amber-900/30', border: 'border-amber-800/30', type: 'Risk Assessment', patient: 'David Kim', time: '1 hr ago' },
]

/* ── HELPERS ──────────────────────────────────── */
const statusStyle = {
    'In Progress': 'bg-teal-900/50 text-teal-300 border border-teal-800/40',
    'Pre-Op': 'bg-amber-900/50 text-amber-300 border border-amber-800/40',
    'Recovery': 'bg-gray-700/50 text-gray-300 border border-gray-600/40',
}

const severityStyle = {
    High: { dot: 'bg-red-500', badge: 'bg-red-900/40 text-red-400 border border-red-800/40' },
    Medium: { dot: 'bg-amber-500', badge: 'bg-amber-900/40 text-amber-400 border border-amber-800/40' },
    Low: { dot: 'bg-yellow-500', badge: 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/40' },
}

const avatarGradients = [
    'from-teal-500 to-teal-700',
    'from-blue-500 to-blue-700',
    'from-violet-500 to-violet-700',
    'from-rose-500 to-rose-700',
]

/* ── CUSTOM TOOLTIP ───────────────────────────── */
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-xs shadow-xl">
            <p className="text-gray-400 mb-2 font-medium">{label}</p>
            {payload.map(p => (
                <div key={p.dataKey} className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                    <span className="text-gray-300">{p.name}:</span>
                    <span className="text-white font-semibold">{p.value}</span>
                </div>
            ))}
        </div>
    )
}

/* ── SECTION: STATS ROW ───────────────────────── */
function StatCard({ label, target, badge, badgeStyle, trend, icon: Icon, iconBg, iconColor }) {
    const count = useCountUp(target)
    return (
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 hover:border-gray-700
          transition-colors duration-200 group cursor-default">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-3xl font-bold text-white tabular-nums">{count}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center
                  flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                    <Icon size={20} className={iconColor} />
                </div>
            </div>
            {badge && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badgeStyle}`}>
                    {badge}
                </span>
            )}
            {trend && (
                <div className="flex items-center gap-1.5 text-green-400">
                    <ChevronUp size={14} />
                    <span className="text-xs font-medium">{trend}</span>
                </div>
            )}
        </div>
    )
}

function StatsRow() {
    const stats = [
        { label: 'Active Patients', target: 12, badge: 'In Surgery', badgeStyle: 'bg-green-900/40 text-green-400 border border-green-800/40', icon: Users, iconBg: 'bg-teal-600/20', iconColor: 'text-teal-400' },
        { label: 'Risk Alerts', target: 5, badge: 'Requires Attention', badgeStyle: 'bg-red-900/40 text-red-400 border border-red-800/40', icon: AlertTriangle, iconBg: 'bg-red-600/20', iconColor: 'text-red-400' },
        { label: 'Surgeries Today', target: 8, badge: null, trend: '+2 vs yesterday', icon: Scissors, iconBg: 'bg-green-600/20', iconColor: 'text-green-400' },
        { label: 'Reports Generated', target: 24, badge: 'Auto-Generated', badgeStyle: 'bg-teal-900/40 text-teal-400 border border-teal-800/40', icon: FileText, iconBg: 'bg-teal-600/20', iconColor: 'text-teal-400' },
    ]
    return (
        <div className="grid grid-cols-4 gap-4">
            {stats.map(s => <StatCard key={s.label} {...s} />)}
        </div>
    )
}

/* ── SECTION: LIVE VITALS ─────────────────────── */
function LiveVitals() {
    const chips = [
        { label: 'HR', value: '78 bpm', icon: Heart, color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-800/30' },
        { label: 'SpO₂', value: '98%', icon: Wind, color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-800/30' },
        { label: 'BP', value: '120/80', icon: Activity, color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-800/30' },
        { label: 'Temp', value: '36.8°C', icon: Thermometer, color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-800/30' },
    ]

    return (
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                    </span>
                    <h2 className="text-white font-semibold text-base">Live Patient Vitals</h2>
                </div>
                <span className="text-xs text-gray-500 font-medium">Patient: David Kim · OR-3</span>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={220}>
                <LineChart data={vitalsData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ fontSize: '11px', color: '#9ca3af', paddingTop: '12px' }}
                        iconType="circle"
                        iconSize={8}
                    />
                    <Line type="monotone" dataKey="hr" name="Heart Rate" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="spo2" name="SpO₂" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="bp" name="Blood Pressure" stroke="#eab308" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="temp" name="Temperature" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
            </ResponsiveContainer>

            {/* Metric chips */}
            <div className="grid grid-cols-4 gap-3 mt-5">
                {chips.map(({ label, value, icon: Icon, color, bg, border }) => (
                    <div key={label} className={`flex items-center gap-3 rounded-xl px-4 py-3 ${bg} border ${border}`}>
                        <Icon size={16} className={color} />
                        <div>
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{label}</p>
                            <p className={`text-sm font-bold ${color}`}>{value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ── SECTION: ACTIVE SURGERIES ────────────────── */
function ActiveSurgeries() {
    return (
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold text-base">Active Surgeries</h2>
                <span className="text-xs text-gray-500 font-medium">{surgeries.length} ongoing</span>
            </div>
            <div className="space-y-3">
                {surgeries.map(({ id, initials, name, type, duration, status }, idx) => (
                    <div
                        key={id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 border border-gray-700/40 hover:border-gray-600/60 transition-all"
                    >
                        {/* Avatar */}
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradients[idx % avatarGradients.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {initials}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{name}</p>
                            <p className="text-xs text-gray-400 truncate">{type}</p>
                        </div>
                        {/* Duration */}
                        <div className="text-right flex-shrink-0">
                            <p className="text-xs text-gray-400 mb-1">{duration}</p>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyle[status]}`}>
                                {status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ── SECTION: RISK ALERTS ─────────────────────── */
function RiskAlerts() {
    const [dismissed, setDismissed] = useState([])
    const visible = alerts.filter(a => !dismissed.includes(a.id))

    return (
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold text-base">Risk Alerts</h2>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-900/40 text-red-400 border border-red-800/30">
                    {visible.length} active
                </span>
            </div>
            <div className="space-y-3">
                {visible.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        All clear — no active alerts
                    </div>
                )}
                {visible.map(({ id, patient, risk, severity }) => {
                    const { dot, badge } = severityStyle[severity]
                    return (
                        <div
                            key={id}
                            className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/50 border border-gray-700/40 hover:border-gray-600/60 transition-all group"
                        >
                            {/* Icon */}
                            <div className="w-8 h-8 rounded-lg bg-red-900/30 border border-red-800/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <AlertTriangle size={14} className="text-red-400" />
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                    <p className="text-sm font-semibold text-white">{patient}</p>
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${badge}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                                        {severity}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 truncate">{risk}</p>
                            </div>
                            {/* Dismiss */}
                            <button
                                onClick={() => setDismissed(d => [...d, id])}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-gray-700/60 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                                title="Dismiss"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/* ── SECTION: RECENT REPORTS ──────────────────── */
function RecentReports() {
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold text-base">Recent Reports</h2>
                <button className="text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium">View All →</button>
            </div>
            <div className="grid grid-cols-3 gap-4">
                {reports.map(({ id, icon: Icon, color, bg, border, type, patient, time }) => (
                    <div
                        key={id}
                        className="bg-gray-900 rounded-2xl p-5 border border-gray-800 hover:border-gray-700 transition-all group flex flex-col gap-4"
                    >
                        {/* Icon + type */}
                        <div className="flex items-start justify-between">
                            <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center`}>
                                <Icon size={18} className={color} />
                            </div>
                            <TrendingUp size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                        </div>
                        {/* Info */}
                        <div>
                            <p className="text-sm font-semibold text-white mb-1">{type}</p>
                            <p className="text-xs text-gray-400">{patient}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{time}</p>
                        </div>
                        {/* Download */}
                        <button className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-teal-400 transition-colors mt-auto">
                            <Download size={13} />
                            Download PDF
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ── PAGE ROOT ────────────────────────────────── */
export default function DashboardPage() {
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 2000)
        return () => clearTimeout(t)
    }, [])

    if (loading) return <SkeletonDashboard />

    return (
        <div className="animate-fadeIn space-y-5">
            <StatsRow />
            <LiveVitals />
            <div className="grid grid-cols-2 gap-4">
                <ActiveSurgeries />
                <RiskAlerts />
            </div>
            <RecentReports />
        </div>
    )
}
