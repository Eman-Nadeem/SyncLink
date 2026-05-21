
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function StudentEnrollModal({ state }) {
  const {
    showEnrollModal,
    setShowEnrollModal,
    selectedClassToEnroll,
    enrollForm,
    setEnrollForm,
    handleEnrollRequest
  } = state;

  if (!showEnrollModal || !selectedClassToEnroll) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm glass-card p-8 relative border-[var(--border-main)] bg-[var(--bg-card)]">
        <button onClick={() => setShowEnrollModal(false)} className="absolute top-6 right-6 text-[var(--text-muted)] hover:text-indigo-600 transition-colors"><X className="w-5 h-5" /></button>
        <h2 className="text-xl font-black text-[var(--text-main)] mb-2">Join Class</h2>
        <p className="text-xs text-[var(--text-muted)] mb-6 font-medium">Instructor: {selectedClassToEnroll.teacher_email}</p>
        <form onSubmit={handleEnrollRequest} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1">Your Full Name</label>
            <input required type="text" value={enrollForm.name} onChange={e => setEnrollForm({ ...enrollForm, name: e.target.value })} className="input-glass text-sm bg-[var(--bg-main)] text-[var(--text-main)]" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1">University Roll Number / ID</label>
            <input required type="text" value={enrollForm.rollNo} onChange={e => setEnrollForm({ ...enrollForm, rollNo: e.target.value })} className="input-glass text-sm bg-[var(--bg-main)] text-[var(--text-main)]" placeholder="e.g. FA20-BSE-123" />
          </div>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[10px] font-bold leading-relaxed">
            Your request will be sent to the instructor for approval. You will not be able to see assignments until approved.
          </div>
          <button type="submit" className="w-full btn-premium py-4">Send Enrollment Request</button>
        </form>
      </motion.div>
    </div>
  );
}
