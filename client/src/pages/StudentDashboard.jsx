import { AnimatePresence, motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useStudentDashboard } from '../hooks/useStudentDashboard';
import StudentSidebar from '../components/student/StudentSidebar';
import StudentHeader from '../components/student/StudentHeader';
import StudentOverview from '../components/student/StudentOverview';
import StudentSubjects from '../components/student/StudentSubjects';
import StudentProgress from '../components/student/StudentProgress';
import StudentEnrollModal from '../components/student/StudentEnrollModal';
import StudentReplyModal from '../components/student/StudentReplyModal';

export default function StudentDashboard() {
  const state = useStudentDashboard();

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center gap-6">
         <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
         <p className="text-[var(--text-muted)] font-bold animate-pulse">Synchronizing Portal...</p>
      </div>
    );
  }

  if (!state.currentUser) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center text-center p-10">
         <h2 className="text-xl font-black mb-4 tracking-tight text-[var(--text-main)]">Access Restricted</h2>
         <button onClick={() => window.location.href = '/'} className="btn-premium">Return to Login</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex font-['Plus_Jakarta_Sans'] text-[var(--text-main)] transition-colors duration-300">
      {/* Mobile Overlay */}
      {state.isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => state.setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <StudentSidebar state={state} />

      <main className="flex-1 lg:ml-72 min-h-screen flex flex-col w-full">
        {/* Header */}
        <StudentHeader state={state} />

        {/* Content Tabs */}
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
          <AnimatePresence mode="wait">
            {state.activeTab === 'overview' && (
              <StudentOverview state={state} />
            )}
            {(state.activeTab === 'classes' || state.activeTab === 'assignments') && (
              <StudentSubjects state={state} />
            )}
            {state.activeTab === 'progress' && (
              <StudentProgress state={state} />
            )}
          </AnimatePresence>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {state.showEnrollModal && <StudentEnrollModal state={state} />}
          {state.showReplyModal && <StudentReplyModal state={state} />}
        </AnimatePresence>
      </main>

      {/* Floating Notifications / Toasts */}
      <div className="fixed bottom-10 right-10 z-[200] flex flex-col gap-3">
        <AnimatePresence>
          {state.toasts.map(t => (
            <motion.div 
              key={t.id} 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, scale: 0.9 }} 
              className="bg-slate-900 text-white p-4 rounded-2xl flex items-center gap-4 min-w-[300px] shadow-2xl"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 text-sm font-bold">{t.message}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
