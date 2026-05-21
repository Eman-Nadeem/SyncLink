
import { motion } from 'framer-motion';
import { 
  CheckCircle2, BookOpen, ChevronRight, Search, Clock, XCircle 
} from 'lucide-react';

export default function StudentSubjects({ state }) {
  const {
    activeTab,
    myClasses,
    assignments,
    setSelectedClassId,
    changeTab,
    availableClasses,
    setSelectedClassToEnroll,
    setShowEnrollModal,
    pendingClasses,
    rejectedClasses,
    selectedClassId,
    filteredAssignments,
    mySubmissions
  } = state;

  if (activeTab === 'classes') {
    return (
      <motion.div key="classes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
         {/* My Classes */}
         <div>
           <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight mb-6 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> My Approved Classes</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myClasses.map(c => {
              const classAssignments = assignments.filter(a => a.class_id === c.id);
              return (
                <div key={c.id} onClick={() => { setSelectedClassId(c.id); changeTab('assignments'); }} className="glass-card p-6 group flex flex-col relative overflow-hidden cursor-pointer hover:border-indigo-500/50">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-all"></div>
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform border border-indigo-500/20"><BookOpen className="w-6 h-6" /></div>
                  <h3 className="text-xl font-black text-[var(--text-main)] mb-2 group-hover:text-indigo-600 transition-colors">{c.name}</h3>
                  <p className="text-xs text-[var(--text-muted)] mb-4">{classAssignments.length} Assignments</p>
                  <div className="mt-auto text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">View Tasks <ChevronRight className="w-4 h-4" /></div>
                </div>
              );
            })}
            {myClasses.length === 0 && (
              <div className="col-span-full py-10 text-center text-slate-400 font-bold italic">You are not enrolled in any classes yet.</div>
            )}
           </div>
         </div>

         {/* Available Classes */}
         <div className="pt-8 border-t border-[var(--border-main)]">
           <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight mb-6 flex items-center gap-2"><Search className="w-5 h-5 text-indigo-500" /> Available Classes</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableClasses.map(c => (
              <div key={c.id} className="glass-card p-6 flex flex-col relative overflow-hidden">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-6"><BookOpen className="w-6 h-6" /></div>
                <h3 className="text-xl font-black text-[var(--text-main)] mb-2">{c.name}</h3>
                <p className="text-xs text-[var(--text-muted)] mb-6">Instructor: {c.teacher_email}</p>
                <button onClick={() => { setSelectedClassToEnroll(c); setShowEnrollModal(true); }} className="mt-auto py-2.5 w-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-xl font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
                  Request Enrollment
                </button>
              </div>
            ))}
            {pendingClasses.map(c => (
              <div key={c.id} className="glass-card p-6 flex flex-col relative overflow-hidden opacity-60">
                <div className="w-12 h-12 bg-orange-50 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 mb-6"><Clock className="w-6 h-6" /></div>
                <h3 className="text-xl font-black text-[var(--text-main)] mb-2">{c.name}</h3>
                <p className="text-xs text-[var(--text-muted)] mb-6">Instructor: {c.teacher_email}</p>
                <div className="mt-auto py-2.5 w-full bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 rounded-xl font-bold text-xs text-center border border-orange-200 dark:border-orange-500/20">
                  Pending Approval
                </div>
              </div>
            ))}
            {rejectedClasses.map(c => (
              <div key={c.id} className="glass-card p-6 flex flex-col relative overflow-hidden opacity-60 border-red-500/20">
                <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-6"><XCircle className="w-6 h-6" /></div>
                <h3 className="text-xl font-black text-[var(--text-main)] mb-2">{c.name}</h3>
                <p className="text-xs text-[var(--text-muted)] mb-6">Instructor: {c.teacher_email}</p>
                <div className="mt-auto py-2.5 w-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-xl font-bold text-xs text-center border border-red-200 dark:border-red-500/20">
                  Request Rejected
                </div>
              </div>
            ))}
            {availableClasses.length === 0 && pendingClasses.length === 0 && rejectedClasses.length === 0 && (
              <div className="col-span-full py-10 text-center text-slate-400 font-bold italic">No more classes available to join.</div>
            )}
           </div>
         </div>
      </motion.div>
    );
  }

  if (activeTab === 'assignments' && selectedClassId) {
    return (
      <motion.div key="assignments" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map(a => {
            const sub = mySubmissions.find(s => s.assignment_id === a.id);
            const isGraded = sub?.status === 'graded';
            const percentage = isGraded ? ((sub.grade / (a.total_marks || 100)) * 100) : 0;
            const gradeColor = isGraded ? (percentage < 50 ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20') : 'bg-orange-500/10 text-orange-600 border-orange-500/20';

            return (
              <div key={a.id} className="glass-card p-6 group flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-all"></div>
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform border border-indigo-500/20"><BookOpen className="w-6 h-6" /></div>
                <h3 className="text-lg font-black text-[var(--text-main)] mb-2 group-hover:text-indigo-600 transition-colors">{a.title}</h3>
                <p className="text-xs text-[var(--text-muted)] line-clamp-3 mb-8 leading-relaxed h-12">{a.description || 'No additional guidelines provided.'}</p>
                <div className="flex items-center justify-between py-4 border-t border-[var(--border-main)] mt-auto">
                  {sub ? (
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black border ${gradeColor}`}>
                      {isGraded ? `Score: ${sub.grade}/${a.total_marks}` : 'Under Review'}
                    </span>
                  ) : (
                    <button onClick={() => { changeTab('overview'); state.setSelectedAssignmentId(a.id); }} className="text-[10px] font-black text-indigo-600 hover:bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20 transition-all">Submit Now</button>
                  )}
                  <div className="text-[10px] font-black text-[var(--text-muted)] flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(a.deadline).toLocaleDateString()}</div>
                </div>
              </div>
            );
          })}
          {filteredAssignments.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 font-bold italic">No tasks in this subject matching your search.</div>
          )}
         </div>
      </motion.div>
    );
  }

  return null;
}
