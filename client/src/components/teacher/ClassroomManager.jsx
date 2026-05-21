
import { ArrowLeft, Plus, Layout, Clock, FileText, Users, Target, Download, Check, Settings } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';

export default function ClassroomManager({ state }) {
  const {
    selectedClassForView,
    setSelectedClassForView,
    setNewAssignment,
    newAssignment,
    setShowCreateModal,
    classTab,
    setClassTab,
    classSubmissions,
    pendingSubmissions,
    avgGrade,
    submissionTrends,
    queueTab,
    setQueueTab,
    displayedQueue,
    setSelectedSubmission,
    setGradingForm,
    setShowGradeModal,
    assignments,
    enrollments,
    handleEnrollment,
    getAttendanceStatus,
    editingAttendance,
    setEditingAttendance,
    markAttendance,
    performanceCategories
  } = state;

  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444'];

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedClassForView(null)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[var(--text-main)] tracking-tight">{selectedClassForView.name}</h1>
            <p className="text-sm text-[var(--text-muted)] font-medium">Class Management Hub</p>
          </div>
        </div>
        <button onClick={() => { setNewAssignment({...newAssignment, class_id: selectedClassForView.id}); setShowCreateModal(true); }} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all"><Plus className="w-5 h-5" /> Add Assignment</button>
      </div>

      <div className="flex bg-[var(--bg-main)] p-1 rounded-2xl border border-[var(--border-main)] mb-8 w-full md:w-fit overflow-x-auto custom-scrollbar scrollbar-hide">
        {[
          { id: 'overview', label: 'Overview', icon: Layout },
          { id: 'queue', label: 'Review Queue', icon: Clock },
          { id: 'assignments', label: 'Assignments', icon: FileText },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'performance', label: 'Analysis', icon: TrendingUpIcon }
        ].map(tab => (
          <button key={tab.id} onClick={() => setClassTab(tab.id)} className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black transition-all whitespace-nowrap ${classTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-[var(--text-muted)] hover:text-indigo-600'}`}>
            <tab.icon className="w-3.5 h-3.5 md:w-4 md:h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-8">
         {classTab === 'overview' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { label: 'Submissions', value: classSubmissions.length, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950' },
                      { label: 'Pending', value: pendingSubmissions.length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950' },
                      { label: 'Avg Performance', value: `${avgGrade}%`, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' }
                    ].map((s, i) => (
                      <div key={i} className="glass-card p-6 flex flex-col gap-4">
                        <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center`}><s.icon className="w-5 h-5"/></div>
                        <div><p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{s.label}</p><h3 className={`text-2xl font-black ${s.color} mt-1`}>{s.value}</h3></div>
                      </div>
                    ))}
                 </div>
                 <div className="glass-card p-8">
                    <h3 className="text-sm font-bold text-[var(--text-main)] mb-8">Submission Activity</h3>
                    <div className="h-48 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={submissionTrends}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)"/><XAxis dataKey="name" fontSize={8}/><YAxis fontSize={8}/><Tooltip/><Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20}/></BarChart></ResponsiveContainer></div>
                 </div>
              </div>
              <div className="space-y-8">
                 <div className="glass-card p-6">
                    <h3 className="text-sm font-bold text-[var(--text-main)] mb-6">Recent Activity</h3>
                    <div className="space-y-4">
                      {classSubmissions.slice(0, 4).map((s, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)]">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold text-[10px]">{s.student_name?.[0]}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-[var(--text-main)] truncate">{s.student_name}</p>
                            <p className="text-[9px] text-[var(--text-muted)] truncate">{s.assignments?.title}</p>
                          </div>
                        </div>
                      ))}
                      {classSubmissions.length === 0 && <p className="text-center text-[var(--text-muted)] text-xs py-10">No activity yet</p>}
                    </div>
                 </div>
              </div>
           </div>
         )}

         {classTab === 'queue' && (
           <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-main)]">
                 <h3 className="text-sm font-bold text-[var(--text-main)]">Review Queue</h3>
                 <div className="flex bg-[var(--bg-card)] rounded-lg p-1 border border-[var(--border-main)]">
                   <button onClick={() => setQueueTab('pending')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${queueTab === 'pending' ? 'bg-indigo-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>In Progress</button>
                   <button onClick={() => setQueueTab('reviewed')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${queueTab === 'reviewed' ? 'bg-indigo-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>Reviewed</button>
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--border-main)] bg-[var(--bg-main)]">
                        <th className="px-6 py-5">Student</th>
                        <th className="px-6 py-5">Assignment</th>
                        <th className="px-6 py-5">Status</th>
                        <th className="px-6 py-5 text-center">Work</th>
                        <th className="px-6 py-5 text-right">Evaluation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedQueue.map((sub, i) => (
                        <tr key={sub.id || i} className="hover:bg-[var(--bg-main)] transition-colors border-b border-[var(--border-main)] last:border-none">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[var(--bg-main)] border border-[var(--border-main)] flex items-center justify-center font-bold text-indigo-600 text-[10px]">{sub.student_name?.[0]}</div>
                              <span className="text-xs font-bold text-[var(--text-main)]">{sub.student_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-xs text-[var(--text-muted)] font-bold">{sub.assignments?.title}</td>
                          <td className="px-6 py-5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${sub.status === 'graded' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-orange-500/10 text-orange-600 border-orange-500/20'}`}>
                              {sub.status === 'graded' ? 'Reviewed' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <a href={sub.file_url} target="_blank" rel="noreferrer" className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"><Download className="w-4 h-4" /></a>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button onClick={() => { setSelectedSubmission(sub); setGradingForm({ grade: sub.grade || '', feedback: sub.feedback || '' }); setShowGradeModal(true); }} className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-lg hover:bg-indigo-700 transition-colors">{sub.status === 'graded' ? 'Edit Grade' : 'Grade'}</button>
                          </td>
                        </tr>
                      ))}
                      {displayedQueue.length === 0 && (
                        <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium italic text-sm">No assignments in this category.</td></tr>
                      )}
                    </tbody>
                 </table>
              </div>
           </div>
         )}

         {classTab === 'assignments' && (
           <div className="glass-card p-8">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-sm font-bold text-[var(--text-main)]">Manage Assignments</h3>
                 <button onClick={() => { setNewAssignment({...newAssignment, class_id: selectedClassForView.id}); setShowCreateModal(true); }} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all"><Plus className="w-4 h-4" /> Create New</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {assignments.filter(a => a.class_id === selectedClassForView.id).map(a => (
                   <div key={a.id} className="p-6 rounded-[24px] bg-[var(--bg-main)] border border-[var(--border-main)] hover:border-indigo-500/30 transition-all flex flex-col">
                     <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950 rounded-xl flex items-center justify-center text-indigo-600"><FileText className="w-5 h-5"/></div>
                     </div>
                     <h4 className="text-sm font-black text-[var(--text-main)] mb-2">{a.title}</h4>
                     <p className="text-[11px] text-[var(--text-muted)] font-medium mb-8 line-clamp-2">{a.description}</p>
                     <div className="mt-auto pt-4 border-t border-[var(--border-main)] flex items-center justify-between">
                        <span className="text-indigo-600 font-black text-[10px] uppercase">{a.total_marks} Marks</span>
                        <span className="text-[10px] font-bold text-slate-400"><Clock className="w-3.5 h-3.5 inline mr-1"/>{new Date(a.deadline).toLocaleDateString()}</span>
                     </div>
                   </div>
                 ))}
              </div>
           </div>
         )}

         {classTab === 'students' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass-card overflow-hidden">
                 <div className="p-6 border-b border-[var(--border-main)] bg-[var(--bg-main)]">
                    <h3 className="text-sm font-bold text-[var(--text-main)]">Enrollment Requests</h3>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                         <tr className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--border-main)]">
                           <th className="px-6 py-5">Student Details</th>
                           <th className="px-6 py-5">Roll No</th>
                           <th className="px-6 py-5 text-right">Action</th>
                         </tr>
                       </thead>
                       <tbody>
                         {enrollments.filter(e => e.class_id === selectedClassForView.id && e.status === 'pending').map(e => (
                           <tr key={e.id} className="border-b border-[var(--border-main)] last:border-none">
                              <td className="px-6 py-5">
                                <p className="text-sm font-bold text-[var(--text-main)]">{e.student_name}</p>
                                <p className="text-[10px] text-[var(--text-muted)] font-medium">{e.student_email}</p>
                              </td>
                              <td className="px-6 py-5 text-sm font-black text-indigo-600">{e.student_roll_no}</td>
                              <td className="px-6 py-5 text-right flex justify-end gap-2">
                                 <button onClick={() => handleEnrollment(e.id, 'approved')} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-[10px] font-black hover:bg-emerald-600 shadow-md shadow-emerald-100">Accept</button>
                                 <button onClick={() => handleEnrollment(e.id, 'rejected')} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black hover:bg-rose-100 border border-rose-100">Reject</button>
                              </td>
                           </tr>
                         ))}
                         {enrollments.filter(e => e.class_id === selectedClassForView.id && e.status === 'pending').length === 0 && (
                           <tr><td colSpan="3" className="px-6 py-12 text-center text-slate-400 font-medium italic text-sm">No pending requests for this class.</td></tr>
                         )}
                       </tbody>
                    </table>
                 </div>
              </div>
              <div className="glass-card overflow-hidden">
                 <div className="p-6 border-b border-[var(--border-main)] bg-[var(--bg-main)]">
                    <h3 className="text-sm font-bold text-[var(--text-main)]">Enrolled List</h3>
                 </div>
                 <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {enrollments.filter(e => e.class_id === selectedClassForView.id && e.status === 'approved').map(e => {
                      const status = getAttendanceStatus(e.student_email, selectedClassForView.id);
                      const isEditing = editingAttendance === e.student_email;
                      return (
                        <div key={e.id} className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)] group">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold text-xs">{e.student_name?.[0]}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-[var(--text-main)] truncate">{e.student_name}</p>
                            <p className="text-[10px] text-[var(--text-muted)] truncate">{e.student_roll_no}</p>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                             <div className="flex items-center gap-1 bg-[var(--bg-card)] p-1.5 rounded-2xl border border-[var(--border-main)] shadow-sm">
                                <button 
                                  disabled={!isEditing && status !== null}
                                  onClick={() => { markAttendance(e.student_email, 'present', selectedClassForView.id); setEditingAttendance(null); }}
                                  className={`px-3 md:px-6 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black transition-all ${status === 'present' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'text-slate-400 hover:text-emerald-600'} disabled:opacity-40`}
                                >
                                  PRESENT
                                </button>
                                <button 
                                  disabled={!isEditing && status !== null}
                                  onClick={() => { markAttendance(e.student_email, 'absent', selectedClassForView.id); setEditingAttendance(null); }}
                                  className={`px-3 md:px-6 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black transition-all ${status === 'absent' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'text-slate-400 hover:text-rose-600'} disabled:opacity-40`}
                                >
                                  ABSENT
                                </button>
                             </div>
                             {status && (
                               <button 
                                 onClick={() => setEditingAttendance(isEditing ? null : e.student_email)} 
                                 className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black transition-all ${isEditing ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-500 hover:bg-indigo-50'}`}
                               >
                                 {isEditing ? <><Check className="w-3 h-3" /> DONE</> : <><Settings className="w-3 h-3" /> EDIT STATUS</>}
                               </button>
                             )}
                          </div>
                        </div>
                      );
                    })}
                 </div>
              </div>
           </div>
         )}

         {classTab === 'performance' && (
           <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="glass-card p-8">
                    <h3 className="text-sm font-bold text-[var(--text-main)] mb-8 uppercase tracking-widest">Grade Distribution</h3>
                    <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={performanceCategories} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">{performanceCategories.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none"/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div>
                    <div className="flex justify-center gap-4 mt-6">
                       {performanceCategories.map((c, i) => (
                         <div key={i} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase">{c.name}</span>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="glass-card p-8">
                    <h3 className="text-sm font-bold text-[var(--text-main)] mb-8 uppercase tracking-widest">Student Summary</h3>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead>
                            <tr className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--border-main)]">
                              <th className="py-4">Student</th>
                              <th className="py-4">Performance Index</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...new Set(enrollments.filter(e => e.class_id === selectedClassForView.id && e.status === 'approved').map(e => e.student_email))].map((email, i) => {
                              const sbs = classSubmissions.filter(s => s.student_email === email && s.status === 'graded');
                              const avg = sbs.length ? (sbs.reduce((acc, c) => acc + (c.grade / (c.assignments?.total_marks || 100)) * 100, 0) / sbs.length).toFixed(0) : 0;
                              const name = enrollments.find(e => e.student_email === email)?.student_name || email.split('@')[0];
                              return (
                                <tr key={i} className="border-b border-[var(--border-main)] last:border-none">
                                  <td className="py-4 font-bold text-xs">{name}</td>
                                  <td className="py-4"><span className={`px-2 py-1 rounded-md text-[10px] font-black ${avg >= 50 ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600' : 'bg-rose-50 dark:bg-rose-950 text-rose-600'}`}>{avg}%</span></td>
                                </tr>
                              );
                            })}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
           </div>
         )}
      </div>
    </>
  );
}

function TrendingUpIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
  );
}
