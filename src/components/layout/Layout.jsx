import { useState, useEffect, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Bell, X, CheckCheck, Settings } from 'lucide-react'

import Sidebar from './Sidebar'
import Navbar from './Navbar'
import Toast from '../ui/Toast'
import { useAlerts } from '../../hooks/useAlerts'
import { toast } from '../../utils/toast'

import DashboardPage from '../../pages/DashboardPage'
import PreOpPage from '../../pages/PreOpPage'
import IntraOpPage from '../../pages/IntraOpPage'
import PostOpPage from '../../pages/PostOpPage'
import ReportsPage from '../../pages/ReportsPage'
import ComponentShowcase from '../../pages/ComponentShowcase'

/* ── Notification panel ──────────────────────────────────── */
const NOTIF_DATA = [
    { id: 1, type: 'critical', title: 'SpO₂ Drop — David Kim', msg: 'SpO₂ fell to 91%. Immediate action required.', time: '2 min ago', read: false },
    { id: 2, type: 'warning', title: 'Elevated BP', msg: 'Robert Mills: 158/100 mmHg. Monitor closely.', time: '5 min ago', read: false },
    { id: 3, type: 'info', title: 'Operative Note Generated', msg: 'AI auto-generated note for Maria Alvarez.', time: '12 min ago', read: false },
    { id: 4, type: 'success', title: 'Discharge Complete', msg: 'Lisa Chen successfully discharged.', time: '30 min ago', read: true },
    { id: 5, type: 'info', title: 'New Patient Admitted', msg: 'Omar Farouk admitted to Pre-Op Bay 2.', time: '45 min ago', read: true },
]

const NOTIF_STYLE = {
    critical: { dot: 'bg-red-500', badge: 'bg-red-900/40 text-red-400 border border-red-800/40' },
    warning: { dot: 'bg-amber-500', badge: 'bg-amber-900/40 text-amber-400 border border-amber-800/40' },
    info: { dot: 'bg-blue-500', badge: 'bg-blue-900/40 text-blue-400 border border-blue-800/40' },
    success: { dot: 'bg-green-500', badge: 'bg-green-900/40 text-green-400 border border-green-800/40' },
}

function NotificationPanel({ open, onClose }) {
    const [notifs, setNotifs] = useState(NOTIF_DATA)
    const unread = notifs.filter(n => !n.read).length

    return (
        <>
            {open && (
                <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            )}
            <div className={`fixed top-0 right-0 h-screen w-80 bg-gray-900 border-l border-gray-800
        z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out
        ${open ? 'translate-x-0' : 'translate-x-full'}`}>

                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Bell size={16} className="text-teal-400" />
                        <h3 className="text-white font-semibold text-sm">Notifications</h3>
                        {unread > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                                {unread}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {unread > 0 && (
                            <button
                                onClick={() => setNotifs(n => n.map(x => ({ ...x, read: true })))}
                                className="text-[10px] text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1"
                            >
                                <CheckCheck size={12} /> Mark all read
                            </button>
                        )}
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors p-1">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-800">
                    {notifs.map(n => {
                        const s = NOTIF_STYLE[n.type]
                        return (
                            <div
                                key={n.id}
                                className={`px-5 py-4 hover:bg-gray-800/50 transition-colors cursor-pointer
                  ${!n.read ? 'bg-gray-800/20' : ''}`}
                                onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                            >
                                <div className="flex items-start gap-3">
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${n.read ? 'bg-gray-700' : s.dot}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-semibold mb-0.5 ${n.read ? 'text-gray-400' : 'text-white'}`}>{n.title}</p>
                                        <p className="text-xs text-gray-500 leading-snug">{n.msg}</p>
                                        <p className="text-[10px] text-gray-600 mt-1">{n.time}</p>
                                    </div>
                                    {!n.read && (
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s.badge} flex-shrink-0`}>NEW</span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </>
    )
}

/* ── Settings placeholder ────────────────────────────────── */
function SettingsPage() {
    return (
        <div className="animate-fadeIn flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center mb-4">
                <Settings size={28} className="text-gray-600" />
            </div>
            <h2 className="text-white font-semibold text-lg mb-2">Settings</h2>
            <p className="text-gray-500 text-sm max-w-xs">
                Configuration panel coming soon. Manage your preferences, notifications, and security here.
            </p>
        </div>
    )
}

/* ── Layout — top-level shell rendered inside BrowserRouter ─ */
export default function Layout() {
    const { unreadCount } = useAlerts()

    /* Mobile sidebar */
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const closeSidebar = useCallback(() => setSidebarOpen(false), [])

    /* Dark / light theme */
    const [isDark, setIsDark] = useState(() =>
        localStorage.getItem('aetheris-theme') !== 'light'
    )
    useEffect(() => {
        document.documentElement.classList.toggle('light', !isDark)
        localStorage.setItem('aetheris-theme', isDark ? 'dark' : 'light')
    }, [isDark])

    const toggleTheme = useCallback(() => {
        setIsDark(d => !d)
        toast.info(isDark ? 'Switched to light mode' : 'Switched to dark mode')
    }, [isDark])

    /* Notification panel */
    const [notifOpen, setNotifOpen] = useState(false)

    return (
        <div className="flex h-screen overflow-hidden bg-gray-950">

            {/* Sidebar (desktop + mobile) */}
            <Sidebar
                open={sidebarOpen}
                onClose={closeSidebar}
                unreadCount={unreadCount}
            />

            {/* Main content column */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar
                    onMenuClick={() => setSidebarOpen(true)}
                    isDark={isDark}
                    toggleTheme={toggleTheme}
                    unreadCount={unreadCount}
                    onBellClick={() => setNotifOpen(o => !o)}
                />

                <main className="flex-1 overflow-y-auto bg-gray-950 p-4 lg:p-6">
                    <Routes>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/preop" element={<PreOpPage />} />
                        <Route path="/intraop" element={<IntraOpPage />} />
                        <Route path="/postop" element={<PostOpPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/components" element={<ComponentShowcase />} />
                        <Route path="/settings" element={<SettingsPage />} />
                    </Routes>
                </main>
            </div>

            {/* Notification panel */}
            <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

            {/* Toast notifications */}
            <Toast />
        </div>
    )
}
