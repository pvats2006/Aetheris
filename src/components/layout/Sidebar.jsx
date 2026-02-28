import { NavLink } from 'react-router-dom'
import {
    LayoutDashboard, ClipboardList, Activity, FileText,
    BarChart2, Settings, Layers, Shield, LogOut, X,
} from 'lucide-react'

const NAV = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: true },
    { to: '/preop', label: 'Pre-Op', icon: ClipboardList },
    { to: '/intraop', label: 'Intra-Op', icon: Activity },
    { to: '/postop', label: 'Post-Op', icon: FileText },
    { to: '/reports', label: 'Reports', icon: BarChart2 },
    { to: '/components', label: 'Components', icon: Layers },
    { to: '/settings', label: 'Settings', icon: Settings },
]

/* ── Shared nav content ──────────────────────────────────── */
function SidebarContent({ unreadCount, onNavClick }) {
    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
                <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
                    <Shield size={16} className="text-white" />
                </div>
                <span className="text-white font-bold text-xl tracking-tight">Aetheris</span>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {NAV.map(({ to, label, icon: Icon, badge }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={onNavClick}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all group
               ${isActive
                                ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/40'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`
                        }
                    >
                        <Icon size={18} className="flex-shrink-0" />
                        <span className="flex-1">{label}</span>
                        {badge && unreadCount > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500
                text-white min-w-[18px] text-center">
                                {unreadCount}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User footer */}
            <div className="px-3 pb-4 border-t border-gray-800 pt-3">
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800
          transition-all cursor-pointer group">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-700
            flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        JD
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">Dr. Jane Doe</p>
                        <p className="text-[10px] text-teal-400 font-medium mt-0.5">Surgeon / Anesthesiologist</p>
                    </div>
                    <LogOut size={14} className="text-gray-600 group-hover:text-gray-400 flex-shrink-0 transition-colors" />
                </div>
            </div>
        </div>
    )
}

/* ── Sidebar wrapper (desktop always-on + mobile slide-in) ── */
export default function Sidebar({ open, onClose, unreadCount }) {
    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex w-64 bg-gray-900 border-r border-gray-800
        flex-col flex-shrink-0 z-30">
                <SidebarContent unreadCount={unreadCount} onNavClick={() => { }} />
            </aside>

            {/* Mobile backdrop */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Mobile slide-in sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-64 bg-gray-900 border-r border-gray-800
        flex flex-col z-50 lg:hidden transform transition-transform duration-300 ease-out
        ${open ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex justify-end p-3 border-b border-gray-800">
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <SidebarContent unreadCount={unreadCount} onNavClick={onClose} />
                </div>
            </aside>
        </>
    )
}
