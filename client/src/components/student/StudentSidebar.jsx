
import { motion } from 'framer-motion';
import { 
  LogOut, UploadCloud, User, LayoutDashboard, BookOpen, TrendingUp 
} from 'lucide-react';

export default function StudentSidebar({ state }) {
  const { 
    isSidebarOpen, 
    activeTab, 
    changeTab, 
    setSelectedClassId, 
    currentUser, 
    logout 
  } = state;

  return (
    <aside className={`w-72 bg-gradient-to-b from-white dark:from-[var(--bg-card)] via-teal-50 dark:via-teal-900/10 to-teal-100 dark:to-teal-900/20 border-r border-teal-100/80 dark:border-teal-900/30 flex flex-col fixed h-full z-50 shadow-[2px_0_20px_rgba(20,184,166,0.12)] lg:shadow-none transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="p-6 md:p-8 flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center relative">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="w-full h-full">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]">
              <defs>
                <linearGradient id="logoGradStu" x1="0%" y1="0%" x2="100%" y2="0%">
                  <motion.stop offset="0%" animate={{ stopColor: ["#4f46e5", "#06b6d4", "#4f46e5"] }} transition={{ duration: 6, repeat: Infinity }} />
                  <motion.stop offset="100%" animate={{ stopColor: ["#06b6d4", "#4f46e5", "#06b6d4"] }} transition={{ duration: 6, repeat: Infinity }} />
                </linearGradient>
              </defs>
              <path d="M35 60 A20 20 0 1 1 55 25" stroke="url(#logoGradStu)" strokeWidth="12" fill="none" strokeLinecap="round" />
              <path d="M65 40 A20 20 0 1 1 45 75" stroke="url(#logoGradStu)" strokeWidth="12" fill="none" strokeLinecap="round" />
            </svg>
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center">
            <UploadCloud className="w-5 h-5 text-indigo-600 drop-shadow-sm" />
          </div>
        </div>
        <h1 className="text-xl font-black tracking-tighter text-[var(--text-main)]">Sync<span className="text-indigo-600">Link</span></h1>
      </div>

      <nav className="flex-1 px-4 space-y-1 md:space-y-2 mt-2 md:mt-4 overflow-y-auto custom-scrollbar">
        <button onClick={() => changeTab('overview')} className={`w-full sidebar-link ${activeTab === 'overview' ? 'sidebar-link-active' : ''}`}><LayoutDashboard className="w-5 h-5" /> Overview</button>
        <button onClick={() => { changeTab('classes'); setSelectedClassId(null); }} className={`w-full sidebar-link ${activeTab === 'classes' || activeTab === 'assignments' ? 'sidebar-link-active' : ''}`}><BookOpen className="w-5 h-5" /> Subjects</button>
        <button onClick={() => changeTab('progress')} className={`w-full sidebar-link ${activeTab === 'progress' ? 'sidebar-link-active' : ''}`}><TrendingUp className="w-5 h-5" /> My Progress</button>
      </nav>

      <div className="p-4 md:p-6 mt-auto">
        <div className="glass-card p-4 md:p-5 border-indigo-100 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><User className="w-4 h-4" /></div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Student Account</p>
            <h4 className="text-sm font-black text-[var(--text-main)] group-hover:text-indigo-600 transition-colors capitalize">{currentUser?.email?.split('@')[0]}</h4>
            <button onClick={() => changeTab('overview')} className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
              <UploadCloud className="w-4 h-4" /> New Upload
            </button>
          </div>
        </div>
        
        <button onClick={logout} className="w-full mt-4 md:mt-6 flex items-center gap-3 px-4 py-2 md:py-3 text-[var(--text-muted)] font-bold hover:text-red-500 transition-colors">
          <LogOut className="w-5 h-5" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
