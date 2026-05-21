import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Download } from 'lucide-react';
import { supabase } from '../../supabase/supabaseClient';

export default function TeacherModals({ state }) {
  const {
    showCreateModal,
    setShowCreateModal,
    newAssignment,
    setNewAssignment,
    classes,
    currentUser,
    handleCreateAssignment,
    isCreating,

    showCreateClassModal,
    setShowCreateClassModal,
    newClass,
    setNewClass,
    handleCreateClass,

    showGradeModal,
    setShowGradeModal,
    selectedSubmission,
    gradingForm,
    setGradingForm,
    handleGradeSubmit,

    showEmailModal,
    setShowEmailModal,
    emailTarget,
    addToast,

    showMonthlyReport,
    setShowMonthlyReport,
    handleDownloadReport
  } = state;

  return (
    <AnimatePresence>
      {/* 1. New Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="w-full max-w-md glass-card p-8 relative"
          >
            <button onClick={() => setShowCreateModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-8">New Task</h2>
            <form onSubmit={handleCreateAssignment} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Subject</label>
                <select 
                  required 
                  value={newAssignment.class_id} 
                  onChange={e => setNewAssignment({...newAssignment, class_id: e.target.value})} 
                  className="input-glass bg-white text-sm"
                >
                  <option value="">Select Subject/Class</option>
                  {classes.filter(c => c.teacher_email === currentUser.email).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Assignment Title</label>
                <input 
                  required 
                  type="text" 
                  value={newAssignment.title} 
                  onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} 
                  className="input-glass text-sm" 
                  placeholder="e.g. Midterm Report" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Guidelines</label>
                <textarea 
                  required 
                  rows="3" 
                  value={newAssignment.description} 
                  onChange={e => setNewAssignment({...newAssignment, description: e.target.value})} 
                  className="input-glass text-sm" 
                  placeholder="Detailed instructions..." 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Total Marks</label>
                <input 
                  required 
                  type="number" 
                  min="1" 
                  value={newAssignment.totalMarks} 
                  onChange={e => setNewAssignment({...newAssignment, totalMarks: e.target.value})} 
                  className="input-glass text-sm" 
                  placeholder="100" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Deadline</label>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    required 
                    type="date" 
                    value={newAssignment.deadline} 
                    onChange={e => setNewAssignment({...newAssignment, deadline: e.target.value})} 
                    className="input-glass text-sm" 
                  />
                  <input 
                    required 
                    type="time" 
                    value={newAssignment.time} 
                    onChange={e => setNewAssignment({...newAssignment, time: e.target.value})} 
                    className="input-glass text-sm" 
                  />
                </div>
              </div>
              <button type="submit" disabled={isCreating} className="w-full btn-premium py-4 mt-2">
                {isCreating ? 'Publishing...' : 'Publish Assignment'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* 2. Create Subject Modal */}
      {showCreateClassModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="w-full max-w-sm glass-card p-8 relative border-[var(--border-main)] bg-[var(--bg-card)]"
          >
            <button onClick={() => setShowCreateClassModal(false)} className="absolute top-6 right-6 text-[var(--text-muted)] hover:text-indigo-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-black text-[var(--text-main)] mb-6">Create New Subject</h2>
            <form onSubmit={handleCreateClass} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1">Subject Name</label>
                <input 
                  required 
                  type="text" 
                  value={newClass.name} 
                  onChange={e => setNewClass({ name: e.target.value })} 
                  className="input-glass text-sm bg-[var(--bg-main)]" 
                  placeholder="e.g. Cloud Computing 101" 
                />
              </div>
              <button type="submit" disabled={isCreating} className="w-full btn-premium py-4">
                {isCreating ? 'Creating...' : 'Create Subject'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* 3. Evaluate Submission Modal */}
      {showGradeModal && selectedSubmission && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="w-full max-w-[500px] glass-card max-h-[90vh] overflow-y-auto relative border-[var(--border-main)] bg-[var(--bg-card)] custom-scrollbar"
          >
            <div className="p-8 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--bg-main)]">
              <h2 className="text-xl font-black text-[var(--text-main)]">Evaluate Work</h2>
              <button onClick={() => setShowGradeModal(false)} className="text-[var(--text-muted)] hover:text-indigo-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <form onSubmit={handleGradeSubmit} className="space-y-6">
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative">
                      <input 
                        required 
                        type="number" 
                        step="0.5" 
                        max={selectedSubmission.assignments?.total_marks || 100} 
                        value={gradingForm.grade} 
                        onChange={e => setGradingForm({...gradingForm, grade: e.target.value})} 
                        className="input-glass text-center text-5xl font-black text-indigo-600 py-10 bg-[var(--bg-main)] w-full" 
                        placeholder="0" 
                      />
                      <div className="absolute bottom-3 right-4 text-sm font-bold text-slate-400">/ {selectedSubmission.assignments?.total_marks || 100}</div>
                    </div>
                    {gradingForm.grade && (
                      <div className={`mt-3 px-4 py-1.5 rounded-full text-xs font-black border ${(gradingForm.grade / (selectedSubmission.assignments?.total_marks || 100)) * 100 >= 50 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}>
                        {((gradingForm.grade / (selectedSubmission.assignments?.total_marks || 100)) * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3 px-1">Evaluation & Feedback</label>
                    <textarea 
                      rows="4" 
                      value={gradingForm.feedback} 
                      onChange={e => setGradingForm({...gradingForm, feedback: e.target.value})} 
                      className="input-glass resize-none text-sm font-bold bg-[var(--bg-main)]" 
                      placeholder="Provide detailed guidance..." 
                    />
                    {selectedSubmission.feedback?.includes('Student Reply:') && (
                       <div className="mt-4 p-5 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                         <div className="flex items-center gap-2 mb-2">
                           <MessageSquare className="w-3 h-3 text-indigo-500" />
                           <p className="text-[10px] font-black text-indigo-500 uppercase">Student Response</p>
                         </div>
                         <p className="text-xs text-[var(--text-main)] italic font-medium leading-relaxed">"{selectedSubmission.feedback.split('Student Reply:')[1].trim()}"</p>
                       </div>
                     )}
                   </div>
                  <button type="submit" className="w-full btn-premium py-4">Publish Evaluation</button>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* 4. Direct message Modal */}
      {showEmailModal && emailTarget && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="w-full max-w-md glass-card p-8 border-[var(--border-main)] bg-[var(--bg-card)]"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-extrabold text-[var(--text-main)]">Message Student</h2>
              <button onClick={() => setShowEmailModal(false)} className="text-[var(--text-muted)] hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-[var(--text-muted)] text-sm mb-6">Sending direct message to <span className="font-bold text-indigo-500">{emailTarget.student_name || emailTarget.name}</span></p>
            <MessageForm emailTarget={emailTarget} addToast={addToast} setShowEmailModal={setShowEmailModal} />
          </motion.div>
        </div>
      )}

      {/* 5. Monthly Report Analytics Modal */}
      {showMonthlyReport && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="glass-card p-10 text-center max-w-sm border-[var(--border-main)] bg-[var(--bg-card)]"
          >
             <div className="w-16 h-16 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-6">
               <Download className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-black mb-3 text-[var(--text-main)]">Generate Analytics</h3>
             <p className="text-[var(--text-muted)] mb-8 text-sm font-medium leading-relaxed">Download a comprehensive performance report for all students in this billing cycle.</p>
             <div className="flex flex-col gap-3">
               <button 
                 onClick={() => { 
                   handleDownloadReport(); 
                   setShowMonthlyReport(false); 
                 }} 
                 className="w-full btn-premium py-4"
               >
                 Download PDF Report
               </button>
               <button onClick={() => setShowMonthlyReport(false)} className="w-full py-3 text-[var(--text-muted)] font-black text-sm hover:text-red-500 transition-colors">Dismiss</button>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function MessageForm({ emailTarget, addToast, setShowEmailModal }) {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const email = emailTarget.student_email || emailTarget.email;
      const { error } = await supabase.from('notifications').insert([{
        user_email: email,
        message: text,
        type: 'message'
      }]);
      if (error) throw error;
      addToast('Message sent to student!', 'success');
      setShowEmailModal(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <textarea
        required
        rows="4"
        value={text}
        onChange={e => setText(e.target.value)}
        className="input-glass text-sm"
        placeholder="Type your message here..."
        disabled={isSending}
      />
      <button type="submit" disabled={isSending} className="w-full btn-premium py-4">
        {isSending ? 'Sending...' : 'Send Message'}
      </button>
      <button
        type="button"
        disabled={isSending}
        onClick={() => setShowEmailModal(false)}
        className="w-full py-3 text-slate-400 text-sm font-bold text-center"
      >
        Cancel
      </button>
    </form>
  );
}
