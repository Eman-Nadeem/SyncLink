import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, GraduationCap, Download, Search, CheckCircle, Clock, Plus, X, 
  Calendar as CalendarIcon, MessageSquare, FileText, Bell, BarChart2, Users, Target, User,
  Layout, BookOpen, Settings, ChevronRight, Filter, SortAsc, MoreHorizontal, ArrowLeft, Trash2, Mail, UploadCloud,
  Sun, Moon, Sparkles, Activity, TrendingUp, Menu, Check
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';
import { supabase } from '../supabase/supabaseClient';

export default function TeacherDashboard() {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('classrooms');
  const [classTab, setClassTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [queueTab, setQueueTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedClassForView, setSelectedClassForView] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
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
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', deadline: '', time: '', totalMarks: 100, class_id: '' });
  const [newClass, setNewClass] = useState({ name: '' });

  const addToast = (msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message: msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const fetchData = async () => {
    try {
      const { data: c } = await supabase.from('classes').select('*').order('created_at', { ascending: false });
      const { data: a } = await supabase.from('assignments').select('*, classes(name)').order('created_at', { ascending: false });
      const { data: s } = await supabase.from('submissions').select(`*, assignments(title, total_marks, deadline, class_id, classes(name))`).order('submitted_at', { ascending: false });
      const { data: e } = await supabase.from('enrollments').select('*, classes(name)').order('enrolled_at', { ascending: false });
      const { data: att } = await supabase.from('attendance').select('*').eq('date', new Date().toISOString().split('T')[0]);
      if (c) setClasses(c);
      if (a) setAssignments(a);
      if (s) setSubmissions(s);
      if (e) setEnrollments(e);
      if (att) setAttendance(att);
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
        fetchData();
        addToast(`📥 New submission from ${payload.new.student_name}!`, 'info');
        setNotifications(prev => [{ id: Date.now(), msg: `New work submitted by ${payload.new.student_name}`, type: 'submission' }, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'submissions' }, (payload) => {
        fetchData();
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
        setAssignments(prev => prev.some(a => a.id === payload.new.id) ? prev : [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'assignments' }, (payload) => {
        setAssignments(prev => prev.map(a => a.id === payload.new.id ? payload.new : a));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'assignments' }, (payload) => {
        setAssignments(prev => prev.filter(a => a.id !== payload.old.id));
      })
      .subscribe();

    const classesChannel = supabase
      .channel('realtime_classes_teacher')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'classes' }, (payload) => {
        setClasses(prev => prev.some(c => c.id === payload.new.id) ? prev : [payload.new, ...prev]);
      })
      .subscribe();

    const enrollChannel = supabase
      .channel('realtime_enrollments_teacher')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enrollments' }, (payload) => {
        fetchData();
        if (payload.eventType === 'INSERT') addToast('🔔 New enrollment request received!', 'info');
      })
      .subscribe();

    const attendanceChannel = supabase
      .channel('realtime_attendance_teacher')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, (payload) => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(submissionsChannel);
      supabase.removeChannel(assignmentsChannel);
      supabase.removeChannel(classesChannel);
      supabase.removeChannel(enrollChannel);
      supabase.removeChannel(attendanceChannel);
    };
  }, []);

  useEffect(() => {
    // Keep URL clean, or we can use it to store class id if we want.
    // For now, simpler to just rely on state.
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newAssignment.class_id) return addToast('Please select a subject/class', 'error');
    setIsCreating(true);
    try {
      const ts = new Date(`${newAssignment.deadline}T${newAssignment.time}`).toISOString();
      const { error } = await supabase.from('assignments').insert([{ 
        title: newAssignment.title, 
        description: newAssignment.description, 
        deadline: ts, 
        total_marks: parseInt(newAssignment.totalMarks),
        class_id: newAssignment.class_id
      }]);
      if (error) throw error;
      setShowCreateModal(false);
      fetchData();
      addToast('Assignment Published!', 'success');
      setNewAssignment({ title: '', description: '', deadline: '', time: '', totalMarks: 100, class_id: '' });
    } catch (err) {
      alert(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const { error } = await supabase.from('classes').insert([{ name: newClass.name, teacher_email: currentUser.email }]);
      if (error) throw error;
      setShowCreateClassModal(false);
      fetchData();
      addToast('Subject Created Successfully!', 'success');
      setNewClass({ name: '' });
    } catch (err) {
      alert(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('submissions').update({ grade: parseFloat(gradingForm.grade), feedback: gradingForm.feedback, status: 'graded' }).eq('id', selectedSubmission.id);
      if (error) throw error;
      setShowGradeModal(false);
      fetchData();
      addToast('Evaluation Saved!', 'success');
    } catch (err) {
      alert(err.message);
    }
  };

  const classSubmissions = selectedClassForView ? submissions.filter(s => s.assignments?.class_id === selectedClassForView.id) : [];
  const gradedSubmissions = classSubmissions.filter(s => s.status === 'graded');
  const pendingSubmissions = classSubmissions.filter(s => s.status !== 'graded');
  
  // Calculate average based on percentages instead of raw marks
  let totalPercentage = 0;
  gradedSubmissions.forEach(s => {
    const p = (s.grade / (s.assignments?.total_marks || 100)) * 100;
    totalPercentage += p;
  });
  const avgGrade = gradedSubmissions.length ? (totalPercentage / gradedSubmissions.length).toFixed(1) : 0;
  
  const displayedQueue = (queueTab === 'pending' ? pendingSubmissions : gradedSubmissions)
    .filter(s => s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.assignments?.title?.toLowerCase().includes(searchTerm.toLowerCase()));

  const performanceCategories = useMemo(() => {
    const cats = { Excellent: 0, Good: 0, Average: 0 };
    gradedSubmissions.forEach(s => {
      const p = (s.grade / (s.assignments?.total_marks || 100)) * 100;
      if (p >= 80) cats.Excellent++;
      else if (p >= 60) cats.Good++;
      else cats.Average++;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [gradedSubmissions]);

  const submissionTrends = useMemo(() => {
    const trends = {};
    classSubmissions.forEach(s => {
      const date = new Date(s.submitted_at).toLocaleDateString();
      trends[date] = (trends[date] || 0) + 1;
    });
    return Object.entries(trends).map(([name, count]) => ({ name, count })).slice(-7);
  }, [classSubmissions]);

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

  const markAttendance = async (email, status, classId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('attendance').upsert([{ 
        student_email: email, 
        class_id: classId, 
        status: status, 
        date: today 
      }], { onConflict: 'class_id, student_email, date' });
      
      if (error) throw error;
      addToast(`Attendance: ${status} for ${email}`, 'success');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getAttendanceStatus = (email, classId) => {
    if (!classId) return null;
    return attendance.find(a => a.student_email === email && a.class_id === classId)?.status || null;
  };

  const handleEnrollment = async (enrollId, status) => {
    try {
      const { error } = await supabase.from('enrollments').update({ status }).eq('id', enrollId);
      if (error) throw error;
      addToast(`Enrollment ${status}`, 'success');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
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
      {/* Mobile Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

      <aside className={`w-72 bg-gradient-to-b from-white dark:from-[var(--bg-card)] via-teal-50 dark:via-teal-900/10 to-teal-100 dark:to-teal-900/20 border-r border-teal-100/80 dark:border-teal-900/30 flex flex-col fixed h-full z-50 shadow-[2px_0_20px_rgba(20,184,166,0.12)] lg:shadow-none transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 md:p-8 flex items-center gap-3">
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
        
        <nav className="flex-1 px-4 space-y-1 md:space-y-2 mt-2 md:mt-4 overflow-y-auto custom-scrollbar">
          <button onClick={() => { setSelectedClassForView(null); setIsSidebarOpen(false); }} className={`w-full sidebar-link ${!selectedClassForView ? 'sidebar-link-active' : ''}`}><Layout className="w-5 h-5" /> All Classrooms</button>
          
          <div className="pt-4 pb-2 px-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">My Subjects</p>
            <div className="w-full h-px bg-slate-200 dark:bg-slate-800"></div>
          </div>
          
          {classes.map(c => (
             <button key={c.id} onClick={() => { setSelectedClassForView(c); setClassTab('overview'); setIsSidebarOpen(false); }} className={`w-full sidebar-link ${selectedClassForView?.id === c.id ? 'sidebar-link-active' : ''}`}><BookOpen className="w-5 h-5 shrink-0" /> <span className="truncate">{c.name}</span></button>
          ))}
        </nav>

        <div className="p-4 md:p-6 mt-auto">
          <div className="glass-card p-4 md:p-5 border-indigo-100 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><User className="w-4 h-4" /></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Teacher Account</p>
              <h4 className="text-sm font-black text-[var(--text-main)] group-hover:text-indigo-600 transition-colors capitalize">{currentUser?.email?.split('@')[0]}</h4>
              <button onClick={() => setShowCreateClassModal(true)} className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Create Subject
              </button>
            </div>
          </div>
          <button onClick={logout} className="w-full mt-4 md:mt-6 flex items-center gap-3 px-4 py-2 md:py-3 text-slate-400 font-bold hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-72 min-h-screen flex flex-col w-full">
        <header className="h-20 bg-teal-500/[0.03] backdrop-blur-md border-b border-[var(--border-main)] sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
              <Menu className="w-5 h-5" />
            </button>
            {selectedClassForView && (
              <button onClick={() => setSelectedClassForView(null)} className="hidden md:flex w-10 h-10 items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold text-[var(--text-main)] capitalize">{selectedClassForView ? selectedClassForView.name : 'Dashboard'}</h2>
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

        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
          <AnimatePresence mode="wait">


            {activeTab === 'classrooms' && (
              <motion.div key="classrooms" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                
                {!selectedClassForView ? (
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
                                 <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100"><BookOpen className="w-7 h-7" /></div>
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
                ) : (
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
                        { id: 'performance', label: 'Analysis', icon: TrendingUp }
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
                                    { label: 'Submissions', value: classSubmissions.length, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                    { label: 'Pending', value: pendingSubmissions.length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
                                    { label: 'Avg Performance', value: `${avgGrade}%`, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' }
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
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">{s.student_name?.[0]}</div>
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
                               <button onClick={() => { setNewAssignment({...newAssignment, class_id: selectedClassForView.id}); setShowCreateModal(true); }} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-indigo-100 transition-all"><Plus className="w-4 h-4" /> Create New</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                               {assignments.filter(a => a.class_id === selectedClassForView.id).map(a => (
                                 <div key={a.id} className="p-6 rounded-[24px] bg-[var(--bg-main)] border border-[var(--border-main)] hover:border-indigo-500/30 transition-all flex flex-col">
                                   <div className="flex justify-between items-start mb-4">
                                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><FileText className="w-5 h-5"/></div>
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
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">{e.student_name?.[0]}</div>
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
                                                <td className="py-4"><span className={`px-2 py-1 rounded-md text-[10px] font-black ${avg >= 50 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{avg}%</span></td>
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
                )}
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
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Subject</label>
                  <select required value={newAssignment.class_id} onChange={e => setNewAssignment({...newAssignment, class_id: e.target.value})} className="input-glass bg-white text-sm">
                    <option value="">Select Subject/Class</option>
                    {classes.filter(c => c.teacher_email === currentUser.email).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Assignment Title</label>
                  <input required type="text" value={newAssignment.title} onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} className="input-glass text-sm" placeholder="e.g. Midterm Report" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Guidelines</label>
                  <textarea required rows="3" value={newAssignment.description} onChange={e => setNewAssignment({...newAssignment, description: e.target.value})} className="input-glass text-sm" placeholder="Detailed instructions..." />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Total Marks</label>
                  <input required type="number" min="1" value={newAssignment.totalMarks} onChange={e => setNewAssignment({...newAssignment, totalMarks: e.target.value})} className="input-glass text-sm" placeholder="100" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Deadline</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input required type="date" value={newAssignment.deadline} onChange={e => setNewAssignment({...newAssignment, deadline: e.target.value})} className="input-glass text-sm" />
                    <input required type="time" value={newAssignment.time} onChange={e => setNewAssignment({...newAssignment, time: e.target.value})} className="input-glass text-sm" />
                  </div>
                </div>
                <button type="submit" disabled={isCreating} className="w-full btn-premium py-4 mt-2">{isCreating ? 'Publishing...' : 'Publish Assignment'}</button>
              </form>
            </motion.div>
          </div>
        )}

        {showCreateClassModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm glass-card p-8 relative border-[var(--border-main)] bg-[var(--bg-card)]">
              <button onClick={() => setShowCreateClassModal(false)} className="absolute top-6 right-6 text-[var(--text-muted)] hover:text-indigo-600 transition-colors"><X className="w-5 h-5" /></button>
              <h2 className="text-xl font-black text-[var(--text-main)] mb-6">Create New Subject</h2>
              <form onSubmit={handleCreateClass} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1">Subject Name</label>
                  <input required type="text" value={newClass.name} onChange={e => setNewClass({ name: e.target.value })} className="input-glass text-sm bg-[var(--bg-main)]" placeholder="e.g. Cloud Computing 101" />
                </div>
                <button type="submit" disabled={isCreating} className="w-full btn-premium py-4">{isCreating ? 'Creating...' : 'Create Subject'}</button>
              </form>
            </motion.div>
          </div>
        )}

        {showGradeModal && selectedSubmission && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-[500px] glass-card max-h-[90vh] overflow-y-auto relative border-[var(--border-main)] bg-[var(--bg-card)] custom-scrollbar">
              <div className="p-8 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--bg-main)]">
                <h2 className="text-xl font-black text-[var(--text-main)]">Evaluate Work</h2>
                <button onClick={() => setShowGradeModal(false)} className="text-[var(--text-muted)] hover:text-indigo-600 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-8 space-y-6">
                <form onSubmit={handleGradeSubmit} className="space-y-6">
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative">
                        <input required type="number" step="0.5" max={selectedSubmission.assignments?.total_marks || 100} value={gradingForm.grade} onChange={e => setGradingForm({...gradingForm, grade: e.target.value})} className="input-glass text-center text-5xl font-black text-indigo-600 py-10 bg-[var(--bg-main)] w-full" placeholder="0" />
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
