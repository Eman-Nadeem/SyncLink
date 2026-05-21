import { 
  Plus, BookOpen, ChevronRight 
} from 'lucide-react';
export default function ClassroomList({ state }) {
  const {
    classes,
    assignments,
    enrollments,
    setSelectedClassForView,
    setShowCreateClassModal
  } = state;

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Active Classrooms</h1>
        </div>
        <button onClick={() => setShowCreateClassModal(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all"><Plus className="w-5 h-5" /> New Subject</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(c => {
           const classAssignments = assignments.filter(a => a.class_id === c.id);
           const pendingReqs = enrollments.filter(e => e.class_id === c.id && e.status === 'pending').length;
           return (
             <div key={c.id} onClick={() => setSelectedClassForView(c)} className="glass-card p-8 group relative overflow-hidden cursor-pointer hover:border-indigo-500/50">
               <div className="flex justify-between items-start mb-6">
                 <div className="flex items-center gap-3">
                   <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 dark:border-indigo-900"><BookOpen className="w-7 h-7" /></div>
                 </div>
                 {pendingReqs > 0 && <span className="px-3 py-1 bg-rose-500/10 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{pendingReqs} Pending</span>}
               </div>
               <h3 className="text-xl font-black text-[var(--text-main)] mb-2 group-hover:text-indigo-600 transition-colors leading-tight">{c.name}</h3>
               <p className="text-xs text-[var(--text-muted)] font-medium mb-8">{classAssignments.length} Assignments • {enrollments.filter(e => e.class_id === c.id && e.status === 'approved').length} Students</p>
               <div className="mt-auto text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">Manage Class <ChevronRight className="w-4 h-4" /></div>
             </div>
           );
        })}
        {classes.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 font-bold italic">No subjects created yet.</div>
        )}
      </div>
    </>
  );
}
