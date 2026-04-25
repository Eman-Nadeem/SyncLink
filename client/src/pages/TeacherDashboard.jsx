import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, GraduationCap, Download, Search, CheckCircle, Clock, Plus, X, 
  Calendar as CalendarIcon, MessageSquare, FileText, Bell, BarChart2, Users, Target, User,
  Layout, BookOpen, Settings, ChevronRight, Filter, SortAsc, MoreHorizontal, ArrowLeft, Trash2, Mail, UploadCloud,
  Sun, Moon, Sparkles, Activity, TrendingUp
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';
import { supabase } from '../supabase/supabaseClient';

export default function TeacherDashboard() {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [gradingForm, setGradingForm] = useState({ grade: '', feedback: '' });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [timeframe, setTimeframe] = useState('Weekly');
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTarget, setEmailTarget] = useState(null);
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', deadline: '', time: '', totalMarks: 100 });

  const addToast = (msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message: msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const fetchData = async () => {
    try {
      const { data: a } = await supabase.from('assignments').select('*').order('created_at', { ascending: false });
      const { data: s } = await supabase.from('submissions').select(`*, assignments(title, total_marks, deadline)`).order('submitted_at', { ascending: false });
      if (a) setAssignments(a);
      if (s) setSubmissions(s);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // ✅ REALTIME CHANNEL 1: Submissions table
    // Jab student koi cheez submit kare ya reply kare
    const submissionsChannel = supabase
      .channel('realtime_submissions_teacher')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'submissions' }, (payload) => {
        // Naya submission turant table mein aa jaye bina refresh ke
        // Note: JOIN data (assignments title etc) ke liye ek baar fetch
        fetchData();
        addToast(`📥 New submission from ${payload.new.student_name}!`, 'info');
        setNotifications(prev => [{ id: Date.now(), msg: `New work submitted by ${payload.new.student_name}`, type: 'submission' }, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'submissions' }, (payload) => {
        // Direct state update — no full re-fetch
        setSubmissions(prev => prev.map(s => s.id === payload.new.id ? { ...s, ...payload.new } : s));
        if (payload.new.feedback?.includes('Student Reply:')) {
          addToast('💬 New reply from student!', 'info');
          setNotifications(prev => [{ id: Date.now(), msg: `Reply received from ${payload.new.student_name}`, type: 'reply' }, ...prev]);
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'submissions' }, (payload) => {
        setSubmissions(prev => prev.filter(s => s.id !== payload.old.id));
      })
      .subscribe();

    // ✅ REALTIME CHANNEL 2: Assignments table
    // Agar koi aur teacher ya system assignments update kare
    const assignmentsChannel = supabase
      .channel('realtime_assignments_teacher')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'assignments' }, (payload) => {
        setAssignments(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'assignments' }, (payload) => {
        setAssignments(prev => prev.map(a => a.id === payload.new.id ? payload.new : a));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'assignments' }, (payload) => {
        setAssignments(prev => prev.filter(a => a.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(submissionsChannel);
      supabase.removeChannel(assignmentsChannel);
    };
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const ts = new Date(`${newAssignment.deadline}T${newAssignment.time}`).toISOString();
      await supabase.from('assignments').insert([{ title: newAssignment.title, description: newAssignment.description, deadline: ts, total_marks: parseInt(newAssignment.totalMarks) }]);
      setShowCreateModal(false);
      fetchData();
      addToast('Assignment Published!', 'success');
      setNewAssignment({ title: '', description: '', deadline: '', time: '', totalMarks: 100 });
    } catch (err) {
      alert(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    try {
      await supabase.from('submissions').update({ grade: parseFloat(gradingForm.grade), feedback: gradingForm.feedback, status: 'graded' }).eq('id', selectedSubmission.id);
      setShowGradeModal(false);
      fetchData();
      addToast('Evaluation Saved!', 'success');
    } catch (err) {
      alert(err.message);
    }
  };

  const gradedSubmissions = submissions.filter(s => s.status === 'graded');
  const avgGrade = gradedSubmissions.length ? (gradedSubmissions.reduce((acc, curr) => acc + (curr.grade || 0), 0) / gradedSubmissions.length).toFixed(1) : 0;
  const filteredSubmissions = submissions.filter(s => s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || s.assignments?.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const performanceCategories = useMemo(() => {
    const cats = { Excellent: 0, Good: 0, Average: 0 };
    submissions.filter(s => s.status === 'graded').forEach(s => {
      const p = (s.grade / (s.assignments?.total_marks || 100)) * 100;
      if (p >= 80) cats.Excellent++;
      else if (p >= 60) cats.Good++;
      else cats.Average++;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [submissions]);

  const submissionTrends = useMemo(() => {
    const trends = {};
    submissions.forEach(s => {
      const date = new Date(s.submitted_at).toLocaleDateString();
      trends[date] = (trends[date] || 0) + 1;
    });
    return Object.entries(trends).map(([name, count]) => ({ name, count })).slice(-7);
  }, [submissions]);

  const handleDownloadReport = () => {
    const header = "SYNC LINK ACADEMIC PERFORMANCE REPORT\n------------------------------------\n";
    const dateStr = `Generated: ${new Date().toLocaleString()}\nScope: ${timeframe}\n\n`;
    const subHeader = "Student Name | Assignment | Final Grade | Status\n----------------------------------------------------\n";
    const rows = submissions.map(s => `${s.student_name} | ${s.assignments?.title || 'N/A'} | ${s.grade || 0}% | ${s.status}`).join("\n");
    
    const blob = new Blob([header + dateStr + subHeader + rows], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SyncLink_Report_${Date.now()}.txt`;
    a.click();
    addToast('Report generated successfully!', 'success');
  };

  const markAttendance = async (email, status) => {
    addToast(`Attendance marked as ${status} for ${email}`, 'success');
  };

  const COLORS = ['#6366f1', '#f59e0b', '#10b981'];

  if (isLoading) return (
    <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center gap-6">
       <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
       <p className="text-[var(--text-muted)] font-bold animate-pulse">Initializing Dashboard...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex font-['Plus_Jakarta_Sans'] text-[var(--text-main)] transition-colors duration-300">
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
          <button onClick={() => setActiveTab('dashboard')} className={`w-full sidebar-link ${activeTab === 'dashboard' ? 'sidebar-link-active' : ''}`}><Layout className="w-5 h-5" /> Dashboard</button>
          <button onClick={() => setActiveTab('classrooms')} className={`w-full sidebar-link ${activeTab === 'classrooms' ? 'sidebar-link-active' : ''}`}><BookOpen className="w-5 h-5" /> Classrooms</button>
          <button onClick={() => setActiveTab('students')} className={`w-full sidebar-link ${activeTab === 'students' ? 'sidebar-link-active' : ''}`}><Users className="w-5 h-5" /> Students & Attendance</button>
          <button onClick={() => setActiveTab('performance')} className={`w-full sidebar-link ${activeTab === 'performance' ? 'sidebar-link-active' : ''}`}><BarChart2 className="w-5 h-5" /> Performance Analytics</button>
        </nav>

        <div className="p-6 mt-auto">
          <div className="glass-card p-5 border-indigo-100 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><User className="w-4 h-4" /></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Teacher Account</p>
              <h4 className="text-sm font-black text-[var(--text-main)] group-hover:text-indigo-600 transition-colors capitalize">{currentUser?.email?.split('@')[0]}</h4>
              <button onClick={() => setShowCreateModal(true)} className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Create Class
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
            {activeTab !== 'dashboard' && (
              <button onClick={() => setActiveTab('dashboard')} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold text-[var(--text-main)] capitalize">{activeTab}</h2>
              <p className="text-sm text-[var(--text-muted)] font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search anything..." 
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
                        <h4 className="font-black text-xs text-[var(--text-muted)] uppercase tracking-widest">Recent Activity</h4>
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
           </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                {/* Teaching Guidelines & Quick Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 glass-card p-8 bg-gradient-to-br from-indigo-600/5 via-white dark:via-[var(--bg-card)] to-teal-500/5 border-indigo-500/10 relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center"><Activity className="w-5 h-5" /></div>
                          <div>
                            <h2 className="text-xl font-black text-[var(--text-main)]">Live Class Overview</h2>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Live</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        {[
                          { label: 'Total Submissions', value: submissions.length, color: 'text-indigo-600', bg: 'bg-indigo-500/10 border-indigo-500/20', icon: FileText },
                          { label: 'Graded', value: gradedSubmissions.length, color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle },
                          { label: 'Pending Review', value: submissions.filter(s => s.status !== 'graded').length, color: 'text-orange-600', bg: 'bg-orange-500/10 border-orange-500/20', icon: Clock },
                        ].map((item, i) => (
                          <div key={i} className={`${item.bg} border rounded-2xl p-4 flex flex-col gap-2`}>
                            <item.icon className={`w-4 h-4 ${item.color}`} />
                            <h3 className={`text-3xl font-black ${item.color}`}>{item.value}</h3>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-tight">{item.label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 rounded-2xl bg-white/70 dark:bg-[var(--bg-main)]/50 border border-[var(--border-main)]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 text-indigo-500" /><p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Class Avg. Mastery</p></div>
                          <span className="text-sm font-black text-indigo-600">{avgGrade}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-teal-500 rounded-full transition-all duration-1000" style={{ width: `${avgGrade}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="glass-card p-6 bg-gradient-to-br from-teal-500/5 to-indigo-500/5 flex flex-col justify-between">
                     <div className="flex items-center justify-between mb-2">
                       <div>
                         <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">Submission Status</h3>
                         <p className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">Live class snapshot</p>
                       </div>
                       <span className="relative flex h-2 w-2">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                       </span>
                     </div>
                     <div className="relative h-40">
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie
                             data={
                               submissions.length > 0
                                 ? [
                                     { name: 'Graded', value: gradedSubmissions.length },
                                     { name: 'Pending', value: submissions.filter(s => s.status !== 'graded').length },
                                   ]
                                 : [{ name: 'No Data', value: 1 }]
                             }
                             innerRadius={46}
                             outerRadius={62}
                             paddingAngle={submissions.length > 0 ? 4 : 0}
                             dataKey="value"
                             startAngle={90}
                             endAngle={-270}
                           >
                             {submissions.length > 0 ? (
                               <>
                                 <Cell fill="#14b8a6" stroke="none" />
                                 <Cell fill="#f97316" stroke="none" />
                               </>
                             ) : (
                               <Cell fill="#e2e8f0" stroke="none" />
                             )}
                           </Pie>
                         </PieChart>
                       </ResponsiveContainer>
                       <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <span className="text-3xl font-black text-[var(--text-main)]">{submissions.length}</span>
                         <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Total</span>
                       </div>
                     </div>
                     <div className="flex justify-center gap-6 mt-1">
                       <div className="flex items-center gap-1.5">
                         <div className="w-2.5 h-2.5 rounded-full bg-teal-500 flex-shrink-0"></div>
                         <span className="text-[10px] font-black text-[var(--text-muted)]">Graded <span className="text-teal-600">{gradedSubmissions.length}</span></span>
                       </div>
                       <div className="flex items-center gap-1.5">
                         <div className="w-2.5 h-2.5 rounded-full bg-orange-400 flex-shrink-0"></div>
                         <span className="text-[10px] font-black text-[var(--text-muted)]">Pending <span className="text-orange-500">{submissions.filter(s => s.status !== 'graded').length}</span></span>
                       </div>
                     </div>
                   </div>            </div>

                <div className="space-y-8">
                  <div className="space-y-8">
                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {[
                        { label: 'Total Students', value: [...new Set(submissions.map(s => s.student_email))].length, icon: Users, bg: 'bg-indigo-500/10', text: 'text-indigo-600' },
                        { label: 'Total Tasks', value: assignments.length, icon: BookOpen, bg: 'bg-orange-500/10', text: 'text-orange-600' },
                        { label: 'Pending Evaluations', value: submissions.filter(s => s.status !== 'graded').length, icon: Clock, bg: 'bg-rose-500/10', text: 'text-rose-600' },
                        { label: 'Avg. Mastery', value: `${avgGrade}%`, icon: Target, bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
                      ].map((stat, i) => (
                        <div key={i} className="glass-card p-6 flex flex-col gap-4 group">
                          <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                            <stat.icon className={`w-6 h-6 ${stat.text}`} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{stat.label}</p>
                            <h3 className="text-3xl font-black text-[var(--text-main)] mt-1 tracking-tighter">{stat.value}</h3>
                          </div>
                        </div>
                      ))}
                    </section>
                    <div className="glass-card overflow-hidden">
                      <div className="p-6 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-main)]">
                        <h3 className="text-lg font-bold text-[var(--text-main)]">Dashboard Overview</h3>
                      </div>
                      <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="glass-card p-6 bg-[var(--bg-main)]">
                            <h3 className="text-sm font-black text-[var(--text-main)] mb-6 uppercase tracking-tight">Submission Trends</h3>
                            <div className="h-44 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                 <BarChart data={submissionTrends}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
                                    <XAxis dataKey="name" fontSize={8} tickLine={false} axisLine={false} stroke="var(--text-muted)" />
                                    <YAxis fontSize={8} tickLine={false} axisLine={false} stroke="var(--text-muted)" />
                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-main)' }} />
                                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={12} />
                                 </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                          <div className="glass-card p-6 bg-[var(--bg-main)]">
                            <h3 className="text-sm font-black text-[var(--text-main)] mb-6 uppercase tracking-tight">Recent Activity</h3>
                            <div className="space-y-4">
                              {submissions.slice(0, 3).map((s, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)]">
                                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold text-[10px]">{s.student_name?.[0]}</div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-[var(--text-main)] truncate">{s.student_name}</p>
                                    <p className="text-[9px] text-[var(--text-muted)] truncate">{s.assignments?.title}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="glass-card overflow-hidden">
                          <div className="p-4 border-b border-[var(--border-main)] bg-[var(--bg-main)]">
                             <h3 className="text-sm font-bold text-[var(--text-main)]">Review Queue</h3>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--border-main)] bg-[var(--bg-main)]">
                                  <th className="px-6 py-4">Student</th>
                                  <th className="px-6 py-4">Chapter</th>
                                  <th className="px-6 py-4">Status</th>
                                  <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredSubmissions.slice(0, 5).map((sub, i) => (
                                  <tr key={i} className="hover:bg-[var(--bg-main)] transition-colors border-b border-[var(--border-main)] last:border-none">
                                    <td className="px-6 py-5">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-main)] border border-[var(--border-main)] flex items-center justify-center font-bold text-indigo-600 text-xs">
                                          {sub.student_name?.[0]}
                                        </div>
                                        <span className="text-sm font-bold text-[var(--text-main)]">{sub.student_name}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-5 text-sm text-[var(--text-muted)] font-medium">
                                      {sub.assignments?.title}
                                    </td>
                                    <td className="px-6 py-5">
                                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${sub.status === 'graded' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-orange-500/10 text-orange-600 border-orange-500/20'}`}>
                                        {sub.status === 'graded' ? 'Reviewed' : 'In Progress'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                      <button onClick={() => { setSelectedSubmission(sub); setGradingForm({ grade: sub.grade || '', feedback: sub.feedback || '' }); setShowGradeModal(true); }} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'classrooms' && (
              <motion.div key="classrooms" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Active Classrooms</h1>
                  </div>
                  <button onClick={() => setShowCreateModal(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all"><Plus className="w-5 h-5" /> New Assignment</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assignments.map(a => (
                    <div key={a.id} className="glass-card p-8 group relative overflow-hidden">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100"><BookOpen className="w-7 h-7" /></div>
                        <p className="text-lg font-black text-indigo-600">{a.total_marks}pts</p>
                      </div>
                      <h3 className="text-xl font-black text-[var(--text-main)] mb-2 group-hover:text-indigo-600 transition-colors leading-tight">{a.title}</h3>
                      <p className="text-xs text-[var(--text-muted)] font-medium line-clamp-3 mb-8 h-12">{a.description || "No specific guidelines."}</p>
                      <div className="flex items-center justify-between py-4 border-t border-[var(--border-main)]">
                        <div className="flex items-center gap-2 text-[11px] font-black text-[var(--text-muted)]"><Clock className="w-4 h-4" /> {new Date(a.deadline).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'students' && (
              <motion.div key="students" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="flex justify-between items-center mb-8">
                  <h1 className="text-3xl font-extrabold text-[var(--text-main)]">Student Directory</h1>
                  <button onClick={handleDownloadReport} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all"><Download className="w-4 h-4" /> Download Report</button>
                </div>
                <div className="glass-card overflow-hidden">
                   <div className="p-8 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-main)]">
                      <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Student Performance Index</h3>
                   </div>
                   <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--border-main)] bg-[var(--bg-main)]">
                        <th className="px-8 py-5">Full Name & ID</th>
                        <th className="px-8 py-5">Subject Mastery</th>
                        <th className="px-8 py-5">Attendance Status</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...new Set(filteredSubmissions.map(s => s.student_email))].map((email, i) => {
                        const sbs = submissions.filter(s => s.student_email === email);
                        const name = sbs[0]?.student_name || email.split('@')[0];
                        const gradedSbs = sbs.filter(s => s.status === 'graded');
                        const avg = gradedSbs.length ? (gradedSbs.reduce((acc, c) => acc + (c.grade / (c.assignments?.total_marks || 100)) * 100, 0) / gradedSbs.length).toFixed(1) : 0;
                        return (
                          <tr key={i} className="hover:bg-[var(--bg-main)] transition-colors border-b border-[var(--border-main)] last:border-none">
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 shadow-sm border border-[var(--border-main)]">{name[0]}</div>
                                <div><p className="font-black text-[var(--text-main)] text-sm">{name}</p><p className="text-[10px] text-[var(--text-muted)] font-bold">{email}</p></div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                               <div className="flex flex-col gap-2">
                                  <div className="flex justify-between items-center text-[10px] font-black">
                                     <span className="text-indigo-600">{avg}% Mastery</span>
                                  </div>
                                  <div className="w-32 h-1.5 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-main)]">
                                     <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${avg}%` }}></div>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <div className="flex gap-2">
                                  <button onClick={() => markAttendance(email, 'Present')} className="px-4 py-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-xl text-[10px] font-black hover:bg-emerald-500/20 transition-all">Present</button>
                                  <button onClick={() => markAttendance(email, 'Absent')} className="px-4 py-2 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-xl text-[10px] font-black hover:bg-rose-500/20 transition-all">Absent</button>
                               </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <button onClick={() => { setEmailTarget({ name, email }); setShowEmailModal(true); }} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all ml-auto"><Mail className="w-5 h-5" /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                   </table>
                </div>
             </motion.div>
            )}

            {activeTab === 'performance' && (
              <motion.div key="performance" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-black text-[var(--text-main)]">Analytics Overview</h1>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setTimeframe('Weekly')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${timeframe === 'Weekly' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-main)]'}`}>Weekly</button>
                    <button onClick={() => { setTimeframe('Monthly'); setShowMonthlyReport(true); }} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${timeframe === 'Monthly' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-main)]'}`}>Monthly</button>
                  </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="glass-card p-8 min-h-[400px]">
                    <h3 className="text-lg font-bold mb-8">Grade Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={performanceCategories} innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                          {performanceCategories.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="glass-card p-8 min-h-[400px]">
                    <h3 className="text-lg font-bold mb-8">Submission Trends</h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={submissionTrends}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={30} />
                         </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md glass-card p-8 relative">
              <button onClick={() => setShowCreateModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-8">New Task</h2>
              <form onSubmit={handleCreateAssignment} className="space-y-5">
                <input required type="text" value={newAssignment.title} onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} className="input-glass" placeholder="Assignment Title" />
                <textarea required rows="3" value={newAssignment.description} onChange={e => setNewAssignment({...newAssignment, description: e.target.value})} className="input-glass" placeholder="Guidelines..." />
                <div className="grid grid-cols-2 gap-4">
                  <input required type="date" value={newAssignment.deadline} onChange={e => setNewAssignment({...newAssignment, deadline: e.target.value})} className="input-glass" />
                  <input required type="time" value={newAssignment.time} onChange={e => setNewAssignment({...newAssignment, time: e.target.value})} className="input-glass" />
                </div>
                <button type="submit" className="w-full btn-premium py-4">Publish Assignment</button>
              </form>
            </motion.div>
          </div>
        )}

        {showGradeModal && selectedSubmission && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-[500px] glass-card overflow-hidden relative border-[var(--border-main)] bg-[var(--bg-card)]">
              <div className="p-8 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--bg-main)]">
                <h2 className="text-xl font-black text-[var(--text-main)]">Evaluate Work</h2>
                <button onClick={() => setShowGradeModal(false)} className="text-[var(--text-muted)] hover:text-indigo-600 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-8 space-y-6">
                <form onSubmit={handleGradeSubmit} className="space-y-6">
                    <input required type="number" step="0.5" value={gradingForm.grade} onChange={e => setGradingForm({...gradingForm, grade: e.target.value})} className="input-glass text-center text-5xl font-black text-indigo-600 py-10 bg-[var(--bg-main)]" placeholder="00" />
                    <div>
                      <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3 px-1">Evaluation & Feedback</label>
                      <textarea rows="4" value={gradingForm.feedback} onChange={e => setGradingForm({...gradingForm, feedback: e.target.value})} className="input-glass resize-none text-sm font-bold bg-[var(--bg-main)]" placeholder="Provide detailed guidance..." />
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

        {showEmailModal && emailTarget && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md glass-card p-8">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Message Student</h2>
              <p className="text-slate-500 text-sm mb-6">Direct guidance for {emailTarget.name}</p>
              <form onSubmit={(e) => { e.preventDefault(); addToast('Message sent to student!', 'success'); setShowEmailModal(false); }} className="space-y-4">
                <textarea required rows="4" className="input-glass text-sm" placeholder="Type your message here..." />
                <button type="submit" className="w-full btn-premium py-4">Send Message</button>
                <button type="button" onClick={() => setShowEmailModal(false)} className="w-full py-3 text-slate-400 text-sm font-bold text-center">Cancel</button>
              </form>
            </motion.div>
          </div>
        )}

        {showMonthlyReport && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-10 text-center max-w-sm border-[var(--border-main)] bg-[var(--bg-card)]">
               <div className="w-16 h-16 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-6">
                 <Download className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-black mb-3 text-[var(--text-main)]">Generate Analytics</h3>
               <p className="text-[var(--text-muted)] mb-8 text-sm font-medium leading-relaxed">Download a comprehensive performance report for all students in this billing cycle.</p>
               <div className="flex flex-col gap-3">
                 <button onClick={() => { handleDownloadReport(); setShowMonthlyReport(false); }} className="w-full btn-premium py-4">Download PDF Report</button>
                 <button onClick={() => setShowMonthlyReport(false)} className="w-full py-3 text-[var(--text-muted)] font-black text-sm hover:text-red-500 transition-colors">Dismiss</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-10 right-10 z-[200] flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-slate-900 text-white p-4 rounded-2xl flex items-center gap-4 min-w-[300px] shadow-2xl">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400"><Bell className="w-5 h-5" /></div>
              <div className="flex-1 text-sm font-bold">{t.message}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
