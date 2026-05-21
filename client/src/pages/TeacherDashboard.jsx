import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useTeacherDashboard } from '../hooks/useTeacherDashboard';
import TeacherSidebar from '../components/teacher/TeacherSidebar';
import TeacherHeader from '../components/teacher/TeacherHeader';
import ClassroomList from '../components/teacher/ClassroomList';
import ClassroomManager from '../components/teacher/ClassroomManager';
import TeacherModals from '../components/teacher/TeacherModals';

export default function TeacherDashboard() {
  const state = useTeacherDashboard();

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-[var(--text-muted)] font-bold animate-pulse">Initializing Dashboard...</p>
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
        ></div>
      )}

      {/* Sidebar Navigation */}
      <TeacherSidebar state={state} />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 min-h-screen flex flex-col w-full">
        {/* Navigation Header */}
        <TeacherHeader state={state} />

        {/* Tab & Management Views */}
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
          <AnimatePresence mode="wait">
            {state.activeTab === 'classrooms' && (
              <motion.div 
                key="classrooms" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }} 
                className="space-y-8"
              >
                {!state.selectedClassForView ? (
                  <ClassroomList state={state} />
                ) : (
                  <ClassroomManager state={state} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modal Dialog Frames */}
      <TeacherModals state={state} />

      {/* Real-time Toast Notifications */}
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
