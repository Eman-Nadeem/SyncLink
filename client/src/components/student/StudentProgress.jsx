import { motion } from 'framer-motion';
import { 
  MessageSquare, ChevronRight
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function StudentProgress({ state }) {
  const {
    attendanceRate,
    totalClasses,
    totalPresent,
    totalAbsent,
    gradedSubmissions,
    setSelectedSubmissionForReply,
    setShowReplyModal,
    chartData
  } = state;

  return (
    <motion.div key="progress" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-4 md:p-8">
          <h3 className="text-lg font-bold text-[var(--text-main)] mb-6">Attendance & Performance</h3>
          <div className="flex items-center gap-8">
            <div className="w-32 h-32 relative">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--border-main)" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366f1" strokeWidth="3" strokeDasharray={`${attendanceRate}, 100`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-[var(--text-main)]">{attendanceRate}%</span>
                <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase">Present</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
               {[
                 { label: 'Classes Conducted', value: totalClasses, color: 'text-[var(--text-main)]' },
                 { label: 'Total Present', value: totalPresent, color: 'text-emerald-500' },
                 { label: 'Total Absent', value: totalAbsent, color: 'text-rose-500' }
               ].map((s, i) => (
                 <div key={i} className="flex justify-between items-center text-sm">
                    <span className="font-bold text-[var(--text-muted)]">{s.label}</span>
                    <span className={`font-black ${s.color}`}>{s.value}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        <div className="glass-card p-8">
          <h3 className="text-lg font-black text-[var(--text-main)] mb-6">Teacher's Feedback</h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {gradedSubmissions.map(s => (
              <div key={s.id} className="p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)] group hover:border-indigo-500/30 transition-all">
                 <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                       <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                       <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{s.assignments?.title}</span>
                    </div>
                    <span className="text-[10px] font-bold text-[var(--text-muted)]">{new Date(s.submitted_at).toLocaleDateString()}</span>
                 </div>
                 <p className="text-xs text-[var(--text-main)] font-medium italic mb-4 leading-relaxed">"{s.feedback || "Excellent work, keep improving your documentation."}"</p>
                 <button onClick={() => { setSelectedSubmissionForReply(s); setShowReplyModal(true); }} className="text-[10px] font-black text-indigo-500 hover:text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">Reply to Teacher <ChevronRight className="w-3 h-3" /></button>
              </div>
            ))}
            {gradedSubmissions.length === 0 && <p className="text-center text-[var(--text-muted)] text-xs py-10 italic">No feedback received yet</p>}
          </div>
        </div>
      </div>

      <div className="glass-card p-8">
         <h3 className="text-xl font-bold mb-8">Detailed Grade History</h3>
         <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                  <Line type="monotone" dataKey="grade" stroke="#6366f1" strokeWidth={5} dot={{ r: 6, fill: '#6366f1' }} activeDot={{ r: 8 }} />
               </LineChart>
            </ResponsiveContainer>
         </div>
      </div>
    </motion.div>
  );
}
