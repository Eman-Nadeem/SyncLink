
import { motion } from 'framer-motion';
import { X, MessageSquare } from 'lucide-react';

export default function StudentReplyModal({ state }) {
  const {
    showReplyModal,
    setShowReplyModal,
    selectedSubmissionForReply,
    studentReply,
    setStudentReply,
    handleReplySubmit,
    isReplying
  } = state;

  if (!showReplyModal || !selectedSubmissionForReply) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md glass-card p-10 relative border-[var(--border-main)] bg-[var(--bg-card)]">
        <button onClick={() => setShowReplyModal(false)} className="absolute top-6 right-6 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"><X className="w-5 h-5" /></button>
        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mb-6">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-[var(--text-main)] mb-2">Send Response</h2>
        <p className="text-[var(--text-muted)] text-sm mb-8 font-medium">Guidance for: <span className="text-indigo-500 font-bold">{selectedSubmissionForReply?.assignments?.title}</span></p>
        <form onSubmit={handleReplySubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3 px-1">Your Message</label>
            <textarea required rows="4" value={studentReply} onChange={e => setStudentReply(e.target.value)} className="input-glass resize-none py-4 text-sm font-bold bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--border-main)]" placeholder="Write your message to the teacher..." />
          </div>
          <div className="flex flex-col gap-3">
            <button type="submit" disabled={isReplying} className="w-full btn-premium py-4">{isReplying ? 'Sending...' : 'Send Message'}</button>
            <button type="button" onClick={() => setShowReplyModal(false)} className="w-full py-2 text-[var(--text-muted)] font-bold text-xs hover:text-red-500 transition-colors">Discard</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
