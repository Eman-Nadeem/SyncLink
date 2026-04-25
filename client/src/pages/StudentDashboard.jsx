import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, UploadCloud, FileText, CheckCircle2, Clock, 
  Award, Bell, X, ChevronDown, GraduationCap, Download, BarChart2, User, LayoutDashboard,
  PieChart as PieIcon, TrendingUp, Search, ChevronRight, Filter, SortAsc, MoreHorizontal, BookOpen, Target, ArrowLeft, MessageSquare,
  Sun, Moon, Sparkles
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';
import { supabase } from '../supabase/supabaseClient';

export default function StudentDashboard() {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [toasts, setToasts] = useState([]);
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedSubmissionForReply, setSelectedSubmissionForReply] = useState(null);
  const [studentReply, setStudentReply] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000);
  };

  const fetchData = async () => {
    try {
      const { data: a } = await supabase.from('assignments').select('*').order('deadline', { ascending: true });
      const { data: s } = await supabase.from('submissions').select('*, assignments(title, total_marks, deadline)').eq('student_email', currentUser?.email).order('submitted_at', { ascending: false });
      if (a) setAssignments(a);
      if (s) setMySubmissions(s);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) { setIsLoading(false); return; }

    fetchData();

    // ✅ REALTIME CHANNEL 1: Assignments table
    // Jab teacher naya assignment add kare, student ko turant dikh jaye
    const assignmentsChannel = supabase
      .channel('realtime_assignments_student')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'assignments' }, (payload) => {
        setAssignments(prev => [payload.new, ...prev]);
        addToast(`New assignment: "${payload.new.title}"`, 'info');
        setNotifications(prev => [{ id: Date.now(), msg: `New assignment posted: ${payload.new.title}`, type: 'assignment' }, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'assignments' }, (payload) => {
        setAssignments(prev => prev.map(a => a.id === payload.new.id ? payload.new : a));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'assignments' }, (payload) => {
        setAssignments(prev => prev.filter(a => a.id !== payload.old.id));
      })
      .subscribe();

    // ✅ REALTIME CHANNEL 2: My Submissions (grading updates)
    // Jab teacher grade kare, student ko bell notification aaye
    const submissionsChannel = supabase
      .channel('realtime_submissions_student')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'submissions', 
        filter: `student_email=eq.${currentUser.email}` 
      }, (payload) => {
        // Update state directly — no full re-fetch needed
        setMySubmissions(prev => prev.map(s => s.id === payload.new.id ? { ...s, ...payload.new } : s));
        if (payload.new.status === 'graded') {
          addToast('🎉 Your assignment was graded!', 'success');
          setNotifications(prev => [{ id: Date.now(), msg: `New grade received for "${payload.new.file_name}"`, type: 'grade' }, ...prev]);
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'submissions', filter: `student_email=eq.${currentUser.email}` }, (payload) => {
        setMySubmissions(prev => prev.filter(s => s.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(assignmentsChannel);
      supabase.removeChannel(submissionsChannel);
    };
  }, [currentUser?.email]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleUpload = async () => {
    if (!file || !selectedAssignmentId) return alert('Select assignment & file');
    setUploadStatus('uploading');
    try {
      const ext = file.name.split('.').pop();
      const path = `${currentUser.email}/${Date.now()}.${ext}`;
      await supabase.storage.from('assignments').upload(path, file);
      const { data: { publicUrl } } = supabase.storage.from('assignments').getPublicUrl(path);
      await supabase.from('submissions').insert([{ 
        assignment_id: selectedAssignmentId, 
        student_name: currentUser.email.split('@')[0], 
        student_email: currentUser.email,
        file_url: publicUrl, 
        file_name: file.name, 
        file_size: (file.size/1024/1024).toFixed(2)+'MB', 
        status: 'submitted'
      }]);
      setUploadStatus('success');
      fetchData();
      addToast('Work Submitted!', 'success');
      setTimeout(() => {
        setUploadStatus('idle');
        setFile(null);
        setSelectedAssignmentId('');
      }, 3000);
    } catch (e) {
      alert(e.message);
      setUploadStatus('idle');
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!studentReply.trim()) return;
    setIsReplying(true);
    try {
      const { data: current } = await supabase.from('submissions').select('feedback').eq('id', selectedSubmissionForReply.id).single();
      const updatedFeedback = `${current.feedback}\n\nStudent Reply: ${studentReply}`;
      await supabase.from('submissions').update({ feedback: updatedFeedback }).eq('id', selectedSubmissionForReply.id);
      addToast('Reply sent successfully!', 'success');
      setShowReplyModal(false);
      setStudentReply('');
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsReplying(false);
    }
  };

  const handleDeleteSubmission = async (submissionId) => {
    if (!window.confirm('Are you sure you want to delete this submission? You can re-upload after deleting.')) return;
    try {
      await supabase.from('submissions').delete().eq('id', submissionId);
      addToast('Submission deleted', 'success');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const gradedSubmissions = mySubmissions.filter(s => s.status === 'graded');
  const avgGrade = gradedSubmissions.length ? (gradedSubmissions.reduce((acc, curr) => acc + ((curr.grade / (curr.assignments?.total_marks || 100)) * 100), 0) / gradedSubmissions.length).toFixed(1) : 0;
  const filteredAssignments = assignments.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredSubmissions = mySubmissions.filter(s => s.assignments?.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const chartData = useMemo(() => {
    const graded = mySubmissions
      .filter(s => s.status === 'graded' && s.assignments?.title)
      .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
    
    if (graded.length === 0) return [{ name: 'N/A', grade: 0 }];

    return graded.map(s => ({
      name: s.assignments?.title.substring(0, 8) + '...',
      grade: s.grade,
      fullTitle: s.assignments?.title
    }));
  }, [mySubmissions]);

  const pieData = useMemo(() => {
    const graded = mySubmissions.filter(s => s.status === 'graded').length;
    const pending = mySubmissions.filter(s => s.status === 'submitted').length;
    if (graded === 0 && pending === 0) return [{ name: 'No Data', value: 1, color: '#f1f5f9' }];
    return [
      { name: 'Graded', value: graded, color: '#6366f1' },
      { name: 'Pending', value: pending, color: '#f59e0b' }
    ];
  }, [mySubmissions]);

  if (isLoading) return (
    <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center gap-6">
       <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
       <p className="text-[var(--text-muted)] font-bold animate-pulse">Synchronizing Portal...</p>
    </div>
  );

  if (!currentUser) return (
    <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center text-center p-10">
       <h2 className="text-xl font-black mb-4 tracking-tight text-[var(--text-main)]">Access Restricted</h2>
       <button onClick={() => window.location.href = '/'} className="btn-premium">Return to Login</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex font-['Plus_Jakarta_Sans'] text-[var(--text-main)] transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-white dark:from-[var(--bg-card)] via-teal-50 dark:via-teal-900/10 to-teal-100 dark:to-teal-900/20 border-r border-teal-100/80 dark:border-teal-900/30 flex flex-col fixed h-full z-20 shadow-[2px_0_20px_rgba(20,184,166,0.12)] dark:shadow-none">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center relative">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="w-full h-full">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]">
                <defs>
                  <linearGradient id="logoGradStu" x1="0%" y1="0%" x2="100%" y2="0%">
                    <motion.stop offset="0%" animate={{ stopColor: ["#4f46e5", "#06b6d4", "#4f46e5"] }} transition={{ duration: 6, repeat: Infinity }} />
                    <motion.stop offset="100%" animate={{ stopColor: ["#06b6d4", "#4f46e5", "#06b6d4"] }} transition={{ duration: 6, repeat: Infinity }} />
                  </linearGradient>
                </defs>
                <path d="M35 60 A20 20 0 1 1 55 25" stroke="url(#logoGradStu)" strokeWidth="12" fill="none" strokeLinecap="round" />
                <path d="M65 40 A20 20 0 1 1 45 75" stroke="url(#logoGradStu)" strokeWidth="12" fill="none" strokeLinecap="round" />
              </svg>
            </motion.div>
            <div className="absolute inset-0 flex items-center justify-center">
              <UploadCloud className="w-5 h-5 text-indigo-600 drop-shadow-sm" />
            </div>
          </div>
          <h1 className="text-xl font-black tracking-tighter text-[var(--text-main)]">Sync<span className="text-indigo-600">Link</span></h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button onClick={() => setActiveTab('overview')} className={`w-full sidebar-link ${activeTab === 'overview' ? 'sidebar-link-active' : ''}`}><LayoutDashboard className="w-5 h-5" /> Overview</button>
          <button onClick={() => setActiveTab('assignments')} className={`w-full sidebar-link ${activeTab === 'assignments' ? 'sidebar-link-active' : ''}`}><BookOpen className="w-5 h-5" /> Assignments</button>
          <button onClick={() => setActiveTab('progress')} className={`w-full sidebar-link ${activeTab === 'progress' ? 'sidebar-link-active' : ''}`}><TrendingUp className="w-5 h-5" /> My Progress</button>
        </nav>

        <div className="p-6 mt-auto">
          <div className="glass-card p-5 border-indigo-100 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><User className="w-4 h-4" /></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Account</p>
              <h4 className="text-sm font-black text-[var(--text-main)] group-hover:text-indigo-600 transition-colors capitalize">{currentUser?.email?.split('@')[0]}</h4>
              <button onClick={() => setActiveTab('overview')} className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                <UploadCloud className="w-4 h-4" /> New Upload
              </button>
            </div>
          </div>
          
          <button onClick={logout} className="w-full mt-6 flex items-center gap-3 px-4 py-3 text-slate-400 font-bold hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-72 min-h-screen">
        <header className="h-20 bg-teal-500/[0.03] backdrop-blur-md border-b border-[var(--border-main)] sticky top-0 z-40 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {activeTab !== 'overview' && (
              <button onClick={() => setActiveTab('overview')} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold text-[var(--text-main)] capitalize">{activeTab}</h2>
              <p className="text-sm text-[var(--text-muted)] font-medium">Student Management Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Find assignments..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] rounded-xl py-2 pl-10 pr-4 text-sm w-64 focus:ring-2 focus:ring-indigo-500/20 outline-none" 
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="w-10 h-10 flex items-center justify-center text-[var(--text-muted)] hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative">
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
                </button>
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-4 w-80 glass-card p-6 z-[60] shadow-2xl overflow-hidden border-[var(--border-main)] bg-[var(--bg-card)]">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="font-black text-xs text-[var(--text-muted)] uppercase tracking-widest">Recent Updates</h4>
                        {notifications.length > 0 && <button onClick={() => setNotifications([])} className="text-[10px] font-bold text-indigo-600 hover:underline">Clear</button>}
                      </div>
                      <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                        {notifications.map(n => (
                          <div key={n.id} className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[11px] font-bold text-[var(--text-main)] flex gap-4 items-start group">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                            <span className="leading-relaxed">{n.msg}</span>
                          </div>
                        ))}
                        {notifications.length === 0 && <p className="text-center text-[var(--text-muted)] py-10 italic text-[11px] font-medium">No new notifications</p>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={toggleDarkMode} className="w-10 h-10 flex items-center justify-center text-[var(--text-muted)] hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-main)] overflow-hidden border border-[var(--border-main)] ml-2 flex items-center justify-center font-bold text-indigo-600 text-xs">
                {currentUser?.email?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h1 className="text-3xl font-black text-[var(--text-main)]">Hello, {currentUser?.email?.split('@')[0]}!</h1>
                    <p className="text-[var(--text-muted)] font-medium">You have {assignments.length - mySubmissions.length} pending tasks for this week.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="glass-card p-8">
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
                          <label className="block text-xs font-bold text-slate-400 mb-2 px-1 uppercase tracking-widest">Select Assignment</label>
                          <div className="relative">
                            <select value={selectedAssignmentId} onChange={e => setSelectedAssignmentId(e.target.value)} className="input-glass appearance-none cursor-pointer pr-12 bg-slate-50">
                              <option value="">Choose a task to submit</option>
                              {assignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                            </select>
                            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                          </div>
                        </div>
                        <div className={`border-2 border-dashed rounded-[24px] p-12 text-center transition-all ${!selectedAssignmentId ? 'border-slate-100 opacity-50' : 'border-indigo-100 bg-indigo-50/20 hover:border-indigo-300 group'}`}>
                          {uploadStatus === 'idle' ? (
                            <>
                              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Download className="w-8 h-8 text-indigo-300 group-hover:text-indigo-600 transition-colors" />
                              </div>
                              <p className="text-sm font-bold text-slate-900 mb-1">Drag and drop your file here</p>
                              <p className="text-xs text-slate-400 mb-8 font-medium">Supported formats: PDF, DOCX (Max 10MB)</p>
                              <input type="file" id="stu-v3-up" className="hidden" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files[0])} disabled={!selectedAssignmentId} />
                              <label htmlFor="stu-v3-up" className={`btn-premium inline-flex py-3 px-10 text-sm ${!selectedAssignmentId ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>Browse Files</label>
                              {file && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 flex items-center justify-between p-4 bg-white rounded-2xl border border-indigo-100 max-w-md mx-auto shadow-sm">
                                  <div className="flex items-center gap-3 overflow-hidden">
                                    <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                                    <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
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
                              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6"><CheckCircle2 className="w-8 h-8 text-emerald-600" /></div>
                              <p className="text-xl font-extrabold text-slate-900">Successfully Submitted!</p>
                              <p className="text-sm text-slate-500 font-medium mt-1">Your instructor will be notified shortly.</p>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="glass-card p-6 min-h-[300px]">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-600" /> Grade Trend</h3>
                          <button onClick={() => setActiveTab('progress')}><MoreHorizontal className="w-5 h-5 text-slate-300" /></button>
                        </div>
                        <div className="h-[200px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#6366f1' }} />
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
                                {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
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
                              <h5 className="text-sm font-bold text-[var(--text-main)] line-clamp-2">{sub.assignments?.title}</h5>
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${sub.status === 'graded' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                {sub.status === 'graded' ? 'Graded' : 'Submitted'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                               <p className="text-[11px] text-slate-400 font-medium">Submitted on {new Date(sub.submitted_at).toLocaleDateString()}</p>
                               {sub.status !== 'graded' && (
                                 <button onClick={() => handleDeleteSubmission(sub.id)} className="text-[10px] font-bold text-red-500 hover:underline">Delete / Edit</button>
                               )}
                            </div>
                          </div>
                        ))}
                        {mySubmissions.length === 0 && <p className="text-center text-slate-400 text-xs py-10 italic">No activity yet</p>}
                      </div>
                    </div>
                    <div className="glass-card p-6 bg-slate-900 text-white border-none shadow-xl shadow-slate-200 overflow-hidden relative group">
                      <div className="relative z-10">
                        <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-white"><Sparkles className="w-5 h-5 text-amber-400" /> Mastery Level</h3>
                        <div className="space-y-6">
                          <div>
                            <div className="flex justify-between text-[10px] font-black mb-2 uppercase tracking-widest text-slate-400"><span>Attendance Rate</span><span className="text-white">94%</span></div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full" style={{ width: '94%' }}></div></div>
                          </div>
                          <div>
                            <div className="flex justify-between text-[10px] font-black mb-2 uppercase tracking-widest text-slate-400"><span>Avg Performance</span><span className="text-white">{avgGrade}%</span></div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${avgGrade}%` }}></div></div>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            const report = `STUDENT ACADEMIC REPORT\nName: ${currentUser.email.split('@')[0]}\nAvg Mastery: ${avgGrade}%\nAttendance: 94%\n\nDetailed Scores:\n` + gradedSubmissions.map(s => `- ${s.assignments?.title}: ${s.grade}/${s.assignments?.total_marks}`).join('\n');
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
            )}

            {activeTab === 'assignments' && (
              <motion.div key="assignments" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAssignments.map(a => {
                    const sub = mySubmissions.find(s => s.assignment_id === a.id);
                    return (
                      <div key={a.id} className="glass-card p-6 group flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-all"></div>
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform border border-indigo-500/20"><BookOpen className="w-6 h-6" /></div>
                        <h3 className="text-lg font-black text-[var(--text-main)] mb-2 group-hover:text-indigo-600 transition-colors">{a.title}</h3>
                        <p className="text-xs text-[var(--text-muted)] line-clamp-3 mb-8 leading-relaxed h-12">{a.description || 'No additional guidelines provided.'}</p>
                        <div className="flex items-center justify-between py-4 border-t border-[var(--border-main)] mt-auto">
                          {sub ? (
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black border ${sub.status === 'graded' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-orange-500/10 text-orange-600 border-orange-500/20'}`}>
                              {sub.status === 'graded' ? `Score: ${sub.grade}/${a.total_marks}` : 'Under Review'}
                            </span>
                          ) : (
                            <button onClick={() => { setActiveTab('overview'); setSelectedAssignmentId(a.id); }} className="text-[10px] font-black text-indigo-600 hover:bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20 transition-all">Submit Now</button>
                          )}
                          <div className="text-[10px] font-black text-[var(--text-muted)] flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(a.deadline).toLocaleDateString()}</div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredAssignments.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                      <p className="text-slate-400 font-bold italic">No assignments found matching your search.</p>
                    </div>
                  )}
                 </div>
              </motion.div>
            )}

            {activeTab === 'progress' && (
              <motion.div key="progress" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="glass-card p-8">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Attendance & Performance</h3>
                    <div className="flex items-center gap-8">
                      <div className="w-32 h-32 relative">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366f1" strokeWidth="3" strokeDasharray="94, 100" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-slate-900">94%</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">Present</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-3">
                         {[
                           { label: 'Classes Conducted', value: '24', color: 'text-slate-900' },
                           { label: 'Total Present', value: '22', color: 'text-emerald-500' },
                           { label: 'Total Absent', value: '2', color: 'text-rose-500' }
                         ].map((s, i) => (
                           <div key={i} className="flex justify-between items-center text-sm">
                              <span className="font-bold text-slate-400">{s.label}</span>
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
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showReplyModal && (
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
                    <textarea required rows="4" value={studentReply} onChange={e => setStudentReply(e.target.value)} className="input-glass resize-none py-4 text-sm font-bold bg-[var(--bg-main)]" placeholder="Write your message to the teacher..." />
                  </div>
                  <div className="flex flex-col gap-3">
                    <button type="submit" disabled={isReplying} className="w-full btn-premium py-4">{isReplying ? 'Sending...' : 'Send Message'}</button>
                    <button type="button" onClick={() => setShowReplyModal(false)} className="w-full py-2 text-[var(--text-muted)] font-bold text-xs hover:text-red-500 transition-colors">Discard</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <div className="fixed bottom-10 right-10 z-[200] flex flex-col gap-3">
        <AnimatePresence>{toasts.map(t => (
          <motion.div key={t.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-slate-900 text-white p-4 rounded-2xl flex items-center gap-4 min-w-[300px] shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400"><Bell className="w-5 h-5" /></div>
            <div className="flex-1 text-sm font-bold">{t.message}</div>
          </motion.div>
        ))}</AnimatePresence>
      </div>
    </div>
  );
}
