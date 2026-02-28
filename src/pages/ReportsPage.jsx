import { useState } from 'react'
import { BarChart2, Download, Eye, Search, FileText, FileCheck, ShieldAlert, Stethoscope, ClipboardList } from 'lucide-react'
import { reports } from '../data/mockData'
import SectionHeader from '../components/SectionHeader'
import StatusBadge from '../components/StatusBadge'

const TYPE_META = {
    'Operative Note': { icon: FileText, color: 'text-teal-400', bg: 'bg-teal-900/30', border: 'border-teal-800/30' },
    'Discharge Summary': { icon: FileCheck, color: 'text-blue-400', bg: 'bg-blue-900/30', border: 'border-blue-800/30' },
    'Risk Assessment': { icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-800/30' },
    'Anaesthesia Record': { icon: Stethoscope, color: 'text-violet-400', bg: 'bg-violet-900/30', border: 'border-violet-800/30' },
    'Pre-Op Checklist': { icon: ClipboardList, color: 'text-amber-400', bg: 'bg-amber-900/30', border: 'border-amber-800/30' },
}

function ReportCard({ report, onPreview }) {
    const meta = TYPE_META[report.type] ?? TYPE_META['Operative Note']
    const Icon = meta.icon

    return (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl ${meta.bg} border ${meta.border} flex items-center justify-center`}>
                    <Icon size={18} className={meta.color} />
                </div>
                <StatusBadge
                    status={report.status === 'Auto-Generated' ? 'active' : 'warning'}
                    label={report.status}
                />
            </div>

            <div>
                <p className="text-sm font-semibold text-white mb-0.5">{report.type}</p>
                <p className="text-xs text-gray-400">{report.patientName}</p>
                <p className="text-[10px] text-gray-600 mt-1">{report.generatedAt}</p>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">
                {report.content}
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                <button
                    onClick={() => onPreview(report)}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                >
                    <Eye size={13} /> Preview
                </button>
                <span className="text-gray-700">·</span>
                <button className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-teal-400 transition-colors">
                    <Download size={13} /> Download
                </button>
            </div>
        </div>
    )
}

/* Inline modal preview */
function ReportModal({ report, onClose }) {
    if (!report) return null
    const meta = TYPE_META[report.type] ?? TYPE_META['Operative Note']
    const Icon = meta.icon

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-fadeIn"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl ${meta.bg} border ${meta.border} flex items-center justify-center`}>
                        <Icon size={18} className={meta.color} />
                    </div>
                    <div>
                        <p className="text-white font-semibold">{report.type}</p>
                        <p className="text-xs text-gray-400">{report.patientName} · {report.generatedAt}</p>
                    </div>
                    <button onClick={onClose} className="ml-auto text-gray-500 hover:text-white transition-colors text-xl leading-none">×</button>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{report.content}</p>
                <div className="flex gap-2 mt-5">
                    <button className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors">
                        Download PDF
                    </button>
                    <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-700 text-gray-400 text-sm hover:border-gray-600 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function ReportsPage() {
    const [search, setSearch] = useState('')
    const [preview, setPreview] = useState(null)

    const filtered = reports.filter(r =>
        r.patientName.toLowerCase().includes(search.toLowerCase()) ||
        r.type.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="animate-fadeIn space-y-6">
            <SectionHeader
                title="Reports"
                subtitle="Auto-generated operative records and summaries"
                icon={BarChart2}
                actionLabel="Generate Report"
                onAction={() => { }}
            />

            {/* Summary stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Total Reports', value: reports.length, color: 'text-teal-400' },
                    { label: 'Auto-Generated', value: reports.filter(r => r.status === 'Auto-Generated').length, color: 'text-green-400' },
                    { label: 'Pending Review', value: reports.filter(r => r.status === 'Pending Review').length, color: 'text-amber-400' },
                    { label: "Today's Reports", value: reports.length, color: 'text-blue-400' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="bg-gray-900 rounded-2xl border border-gray-800 p-4 text-center">
                        <p className={`text-3xl font-bold ${color}`}>{value}</p>
                        <p className="text-xs text-gray-500 mt-1">{label}</p>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by patient or report type…"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-teal-600 transition-colors"
                />
            </div>

            {/* Cards */}
            <div className="grid grid-cols-3 gap-4">
                {filtered.map(r => (
                    <ReportCard key={r.id} report={r} onPreview={setPreview} />
                ))}
            </div>

            <ReportModal report={preview} onClose={() => setPreview(null)} />
        </div>
    )
}
