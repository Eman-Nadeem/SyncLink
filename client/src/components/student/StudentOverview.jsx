
import { motion } from 'framer-motion';
import { 
  Clock, CheckCircle2, XCircle, Target, UploadCloud, ChevronDown, 
  Download, FileText, MoreHorizontal, Sparkles 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';

export default function StudentOverview({ state }) {
  const {
    currentUser,
    assignments,
    mySubmissions,
    attendanceRate,
    totalPresent,
    totalAbsent,
    avgGrade,
    selectedAssignmentId,
    setSelectedAssignmentId,
    myClassIds,
    uploadStatus,
    file,
    setFile,
    handleUpload,
    chartData,
    pieData,
    changeTab,
    handleEditSubmission,
    handleDeleteSubmission,
    gradedSubmissions,
    addToast
  } = state;

  return (
    <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[var(--text-main)]">Hello, {currentUser?.email?.split('@')[0]}!</h1>
          <p className="text-xs md:text-sm text-[var(--text-muted)] font-medium">You have {assignments.length - mySubmissions.length} pending tasks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Attendance</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-indigo-600">{attendanceRate}%</h3>
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600"><Clock className="w-4 h-4"/></div>
          </div>
        </div>
        <div className="glass-card p-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Present</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-emerald-600">{totalPresent}</h3>
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600"><CheckCircle2 className="w-4 h-4"/></div>
          </div>
        </div>
        <div className="glass-card p-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Absent</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-rose-600">{totalAbsent}</h3>
            <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600"><XCircle className="w-4 h-4"/></div>
          </div>
        </div>
        <div className="glass-card p-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Performance Index</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-amber-600">{avgGrade}%</h3>
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600"><Target className="w-4 h-4"/></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-[var(--text-main)] flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                  <UploadCloud className="text-indigo-600 w-5 h-5" />
                </div>
                Submit Your Work
              </h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 px-1 uppercase tracking-widest">Select Assignment</label>
                <div className="relative">
                  <select value={selectedAssignmentId} onChange={e => setSelectedAssignmentId(e.target.value)} className="input-glass appearance-none cursor-pointer pr-12 bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--border-main)]">
                    <option value="">Choose a task to submit</option>
                    {assignments.filter(a => {
                       if (!myClassIds.includes(a.class_id)) return false;
                       const sub = mySubmissions.find(s => s.assignment_id === a.id);
                       return !sub || sub.status !== 'graded';
                    }).map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] pointer-events-none" />
                </div>
              </div>
              <div className={`border-2 border-dashed rounded-[24px] p-6 md:p-12 text-center transition-all ${!selectedAssignmentId ? 'border-[var(--border-main)] opacity-50' : 'border-indigo-100 bg-indigo-50/20 hover:border-indigo-300 group'}`}>
                {uploadStatus === 'idle' ? (
                  <>
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-[var(--bg-main)] rounded-3xl flex items-center justify-center shadow-sm mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                      <Download className="w-8 h-8 text-indigo-300 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <p className="text-sm font-bold text-[var(--text-main)] mb-1">Drag and drop your file here</p>
                    <p className="text-xs text-[var(--text-muted)] mb-8 font-medium">Supported formats: PDF, DOCX (Max 10MB)</p>
                    <input type="file" id="stu-v3-up" className="hidden" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files[0])} disabled={!selectedAssignmentId} />
                    <label htmlFor="stu-v3-up" className={`btn-premium inline-flex py-3 px-10 text-sm ${!selectedAssignmentId ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>Browse Files</label>
                    {file && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-slate-800 max-w-md mx-auto shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{file.name}</p>
                        </div>
                        <button onClick={handleUpload} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex-shrink-0 ml-4">Upload Now</button>
                      </motion.div>
                    )}
                  </>
                ) : uploadStatus === 'uploading' ? (
                  <div className="flex flex-col items-center py-6">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6" />
                    <p className="text-sm font-bold text-indigo-600 animate-pulse">Uploading to Secure Storage...</p>
                  </div>
                ) : (
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex flex-col items-center py-6">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center mb-6"><CheckCircle2 className="w-8 h-8 text-emerald-600" /></div>
                    <p className="text-xl font-extrabold text-[var(--text-main)]">Successfully Submitted!</p>
                    <p className="text-sm text-[var(--text-muted)] font-medium mt-1">Your instructor will be notified shortly.</p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-6 min-h-[300px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2"><TrendingUpIcon className="w-5 h-5 text-indigo-600" /> Grade Trend</h3>
                <button onClick={() => changeTab('progress')}><MoreHorizontal className="w-5 h-5 text-slate-300" /></button>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-main)', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#6366f1' }} />
                    <Line type="monotone" dataKey="grade" stroke="#6366f1" strokeWidth={4} dot={{ fill: '#6366f1', strokeWidth: 2, r: 4, stroke: '#fff' }} activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass-card p-6 flex flex-col items-center min-h-[300px]">
              <div className="w-full flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2"><PieIcon className="w-5 h-5 text-amber-500" /> Submission Status</h3>
                <MoreHorizontal className="w-5 h-5 text-slate-300" />
              </div>
              <div className="h-[200px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((e, i) => <Cell key={i} fill={e.color || '#6366f1'} stroke="none" />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-[var(--text-main)]">{mySubmissions.length}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Tasks</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-card flex flex-col overflow-hidden">
            <div className="p-6 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--bg-main)]">
              <h2 className="font-bold text-lg text-[var(--text-main)]">Your Activity</h2>
              <Clock className="w-5 h-5 text-slate-300" />
            </div>
            <div className="p-6 space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar">
              {mySubmissions.slice(0, 5).map(sub => (
                <div key={sub.id} className="p-4 rounded-2xl border border-[var(--border-main)] hover:border-indigo-500/50 transition-all group bg-[var(--bg-card)]">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="flex flex-col gap-1">
                      {sub.assignments?.classes?.name && <span className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">{sub.assignments.classes.name}</span>}
                      <h5 className="text-sm font-bold text-[var(--text-main)] line-clamp-2">{sub.assignments?.title}</h5>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${sub.status === 'graded' ? (((sub.grade / (sub.assignments?.total_marks || 100)) * 100) < 50 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100') : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                      {sub.status === 'graded' ? 'Graded' : 'Submitted'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                     <p className="text-[11px] text-[var(--text-muted)] font-medium">Submitted on {new Date(sub.submitted_at).toLocaleDateString()}</p>
                     {sub.status !== 'graded' && (
                       <div className="flex items-center gap-3">
                         <button onClick={() => handleEditSubmission(sub)} className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 transition-colors">Edit</button>
                         <div className="w-px h-3 bg-slate-200 dark:bg-slate-800"></div>
                         <button onClick={() => handleDeleteSubmission(sub.id)} className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors">Delete</button>
                       </div>
                     )}
                  </div>
                </div>
              ))}
              {mySubmissions.length === 0 && <p className="text-center text-slate-400 text-xs py-10 italic">No activity yet</p>}
            </div>
          </div>
          <div className="glass-card p-6 bg-slate-900 text-white border-none shadow-xl shadow-slate-200 overflow-hidden relative group">
            <div className="relative z-10">
              <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-white"><Sparkles className="w-5 h-5 text-amber-400" /> Performance Index</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-[10px] font-black mb-2 uppercase tracking-widest text-slate-400"><span>Attendance Rate</span><span className="text-white">{attendanceRate}%</span></div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${attendanceRate}%` }}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-black mb-2 uppercase tracking-widest text-slate-400"><span>Avg Performance</span><span className="text-white">{avgGrade}%</span></div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${avgGrade}%` }}></div></div>
                </div>
              </div>
              <button 
                onClick={() => {
                  const report = `STUDENT ACADEMIC REPORT\nName: ${currentUser.email.split('@')[0]}\nAvg Performance: ${avgGrade}%\nAttendance: ${attendanceRate}%\n\nDetailed Scores:\n` + gradedSubmissions.map(s => `- ${s.assignments?.title}: ${s.grade}/${s.assignments?.total_marks || 100}`).join('\n');
                  const blob = new Blob([report], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Academic_Report_${Date.now()}.txt`;
                  a.click();
                  addToast('Full report generated!', 'success');
                }} 
                className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-white/10"
              >
                Download Full Report <Download className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Reusable micro-component layout icons to avoid recharts package scope leaks
function TrendingUpIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
  );
}

function PieIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
  );
}
