import { AnimatePresence, motion } from 'framer-motion';
import { 
  Menu, ArrowLeft, Search, Bell, Sun, Moon, X 
} from 'lucide-react';

export default function TeacherHeader({ state }) {
  const {
    setIsSidebarOpen,
    selectedClassForView,
    setSelectedClassForView,
    searchTerm,
    setSearchTerm,
    showNotifications,
    setShowNotifications,
    notifications,
    setNotifications,
    toggleDarkMode,
    isDarkMode
  } = state;

  return (
    <header className="h-20 bg-teal-500/[0.03] backdrop-blur-md border-b border-[var(--border-main)] sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3 md:gap-4">
        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden w-10 h-10 flex items-center justify-center text-[var(--text-muted)] hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
          <Menu className="w-5 h-5" />
        </button>
        {selectedClassForView && (
          <button onClick={() => setSelectedClassForView(null)} className="hidden md:flex w-10 h-10 items-center justify-center text-[var(--text-muted)] hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h2 className="text-xl font-bold text-[var(--text-main)] capitalize">{selectedClassForView ? selectedClassForView.name : 'Dashboard'}</h2>
          <p className="text-sm text-[var(--text-muted)] font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] rounded-xl py-2 pl-10 pr-4 text-sm w-64 focus:ring-2 focus:ring-indigo-500/20 outline-none" 
          />
        </div>
        <div className="flex items-center gap-3">
            <button onClick={() => setShowNotifications(!showNotifications)} aria-label="Toggle notifications" className="w-10 h-10 flex items-center justify-center text-[var(--text-muted)] hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative">
              <Bell className="w-5 h-5 icon-primary" />
              {notifications.length > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-4 w-72 glass-card p-6 z-[60] shadow-2xl overflow-hidden border-[var(--border-main)] bg-[var(--bg-card)]">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="font-black text-xs text-[var(--text-muted)] uppercase tracking-widest">Recent Activity</h4>
                      <div className="flex items-center gap-2">
                        {notifications.length > 0 && (
                          <button onClick={() => setNotifications([])} className="text-[10px] font-bold text-indigo-600 hover:underline">Clear</button>
                        )}
                        <button onClick={() => setShowNotifications(false)} aria-label="Close notifications" className="p-1 text-[var(--text-main)] hover:text-indigo-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                    {notifications.map(n => (
                      <div key={n.id} className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[11px] font-bold text-[var(--text-main)] flex gap-4 items-start group">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                        <span className="leading-relaxed">{n.msg}</span>
                      </div>
                    ))}
                    {notifications.length === 0 && <p className="text-center text-[var(--text-muted)] py-10 italic text-[11px] font-medium">No new notifications</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={toggleDarkMode} aria-label="Toggle dark mode" className="w-10 h-10 flex items-center justify-center text-[var(--text-muted)] hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-500 icon-primary" /> : <Moon className="w-5 h-5 icon-primary" />}
          </button>
       </div>
    </header>
  );
}
