import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, UploadCloud, FileText, CheckCircle2, Clock, 
  Award, Bell, X, ChevronDown, GraduationCap, Download, BarChart2, User, LayoutDashboard,
  PieChart as PieIcon, TrendingUp, Search, ChevronRight, Filter, SortAsc, MoreHorizontal, BookOpen, Target, ArrowLeft, MessageSquare,
  Sun, Moon, Sparkles, Menu, XCircle
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';
import { supabase } from '../supabase/supabaseClient';

export default function StudentDashboard() {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(() => window.location.hash.replace('#', '') || 'overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedClassToEnroll, setSelectedClassToEnroll] = useState(null);
  const [enrollForm, setEnrollForm] = useState({ name: '', rollNo: '' });
  const [attendance, setAttendance] = useState([]);
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
      const { data: c } = await supabase.from('classes').select('*').order('created_at', { ascending: false });
      const { data: a } = await supabase.from('assignments').select('*, classes(name)').order('deadline', { ascending: true });
      const { data: s } = await supabase.from('submissions').select('*, assignments(title, total_marks, deadline, class_id, classes(name))').eq('student_email', currentUser?.email).order('submitted_at', { ascending: false });
      const { data: e } = await supabase.from('enrollments').select('*').eq('student_email', currentUser?.email);
      const { data: att } = await supabase.from('attendance').select('*').eq('student_email', currentUser?.email);
      if (c) setClasses(c);
      if (a) setAssignments(a);
      if (s) setMySubmissions(s);
      if (e) setEnrollments(e);
      if (att) setAttendance(att);
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
        setAssignments(prev => prev.some(a => a.id === payload.new.id) ? prev : [payload.new, ...prev]);
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
          setNotifications(prev => [{ id: Date.now(), msg: `Assignment Graded: ${payload.new.assignments?.title || 'Evaluation complete'}`, type: 'grade' }, ...prev]);
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'submissions', filter: `student_email=eq.${currentUser.email}` }, (payload) => {
        setMySubmissions(prev => prev.filter(s => s.id !== payload.old.id));
      })
      .subscribe();

    const classesChannel = supabase
      .channel('realtime_classes_student')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'classes' }, (payload) => {
        setClasses(prev => prev.some(c => c.id === payload.new.id) ? prev : [payload.new, ...prev]);
      })
      .subscribe();

    // ✅ REALTIME CHANNEL 4: Enrollments (approval/rejection)
    const enrollmentsChannel = supabase
      .channel('realtime_enrollments_student')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'enrollments',
        filter: `student_email=eq.${currentUser.email}`
      }, (payload) => {
        setEnrollments(prev => prev.map(e => e.id === payload.new.id ? payload.new : e));
        if (payload.new.status === 'approved') {
          addToast('✅ Enrollment Approved!', 'success');
          setNotifications(prev => [{ id: Date.now(), msg: `Enrollment Approved for class`, type: 'enrollment' }, ...prev]);
        } else if (payload.new.status === 'rejected') {
          addToast('❌ Enrollment Rejected', 'error');
          setNotifications(prev => [{ id: Date.now(), msg: `Enrollment Rejected for class`, type: 'enrollment' }, ...prev]);
        }
      })
      .subscribe();

    const attendanceChannel = supabase
      .channel('realtime_attendance_student')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'attendance',
        filter: `student_email=eq.${currentUser.email}`
      }, (payload) => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(assignmentsChannel);
      supabase.removeChannel(submissionsChannel);
      supabase.removeChannel(classesChannel);
      supabase.removeChannel(enrollmentsChannel);
      supabase.removeChannel(attendanceChannel);
    };
  }, [currentUser?.email]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'overview';
      setActiveTab(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const changeTab = (tab) => {
    window.location.hash = tab;
    setIsSidebarOpen(false);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleUpload = async () => {
    if (!file || !selectedAssignmentId) return alert('Select assignment & file');
    
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext)) {
      alert('Invalid file format! Only PDF, DOC, and DOCX files are allowed.');
      setFile(null);
      return;
    }

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

  const handleEnrollRequest = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('enrollments').insert([{
        class_id: selectedClassToEnroll.id,
        student_email: currentUser.email,
        student_name: enrollForm.name,
        student_roll_no: enrollForm.rollNo,
        status: 'pending'
      }]);
      if (error) throw error;
      addToast('Enrollment request sent!', 'success');
      setShowEnrollModal(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const myClassIds = enrollments.filter(e => e.status === 'approved').map(e => e.class_id);
  const pendingClassIds = enrollments.filter(e => e.status === 'pending').map(e => e.class_id);
  const rejectedClassIds = enrollments.filter(e => e.status === 'rejected').map(e => e.class_id);

  const myClasses = classes.filter(c => myClassIds.includes(c.id));
  const availableClasses = classes.filter(c => !myClassIds.includes(c.id) && !pendingClassIds.includes(c.id) && !rejectedClassIds.includes(c.id));
  const pendingClasses = classes.filter(c => pendingClassIds.includes(c.id));
  const rejectedClasses = classes.filter(c => rejectedClassIds.includes(c.id));

  const totalPresent = attendance.filter(a => a.status === 'present').length;
  const totalAbsent = attendance.filter(a => a.status === 'absent').length;
  const totalClasses = totalPresent + totalAbsent;
  const attendanceRate = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

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
      addToast('Submission deleted successfully', 'success');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditSubmission = async (submission) => {
    if (!window.confirm('To edit, your previous submission will be removed so you can upload a new one. Continue?')) return;
    try {
      await supabase.from('submissions').delete().eq('id', submission.id);
      addToast('Ready for new upload.', 'info');
      fetchData();
      changeTab('overview');
      setSelectedAssignmentId(submission.assignment_id);
    } catch (err) {
      alert(err.message);
    }
  };

  const gradedSubmissions = mySubmissions.filter(s => s.status === 'graded');
  const avgGrade = gradedSubmissions.length ? (gradedSubmissions.reduce((acc, curr) => acc + ((curr.grade / (curr.assignments?.total_marks || 100)) * 100), 0) / gradedSubmissions.length).toFixed(1) : 0;
  const filteredAssignments = assignments.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()) && a.class_id === selectedClassId && myClassIds.includes(a.class_id));
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
      {/* Mobile Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
      
      {/* Sidebar */}
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
          <button onClick={() => changeTab('overview')} className={`w-full sidebar-link ${activeTab === 'overview' ? 'sidebar-link-active' : ''}`}><LayoutDashboard className="w-5 h-5" /> Overview</button>
          <button onClick={() => { changeTab('classes'); setSelectedClassId(null); }} className={`w-full sidebar-link ${activeTab === 'classes' || activeTab === 'assignments' ? 'sidebar-link-active' : ''}`}><BookOpen className="w-5 h-5" /> Subjects</button>
          <button onClick={() => changeTab('progress')} className={`w-full sidebar-link ${activeTab === 'progress' ? 'sidebar-link-active' : ''}`}><TrendingUp className="w-5 h-5" /> My Progress</button>
        </nav>

        <div className="p-4 md:p-6 mt-auto">
          <div className="glass-card p-4 md:p-5 border-indigo-100 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><User className="w-4 h-4" /></div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Student Account</p>
              <h4 className="text-sm font-black text-[var(--text-main)] group-hover:text-indigo-600 transition-colors capitalize">{currentUser?.email?.split('@')[0]}</h4>
              <button onClick={() => changeTab('overview')} className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                <UploadCloud className="w-4 h-4" /> New Upload
              </button>
            </div>
          </div>
          
          <button onClick={logout} className="w-full mt-4 md:mt-6 flex items-center gap-3 px-4 py-2 md:py-3 text-[var(--text-muted)] font-bold hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-72 min-h-screen flex flex-col w-full">
        <header className="h-20 bg-teal-500/[0.03] backdrop-blur-md border-b border-[var(--border-main)] sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden w-10 h-10 flex items-center justify-center text-[var(--text-muted)] hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
              <Menu className="w-5 h-5" />
            </button>
            {activeTab !== 'overview' && activeTab !== 'classes' && (
              <button onClick={() => { if (activeTab === 'assignments') changeTab('classes'); else changeTab('overview'); }} className="hidden md:flex w-10 h-10 items-center justify-center text-[var(--text-muted)] hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
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

        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
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
                            <select value={selectedAssignmentId} onChange={e => setSelectedAssignmentId(e.target.value)} className="input-glass appearance-none cursor-pointer pr-12 bg-[var(--bg-main)]">
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
                          <button onClick={() => changeTab('progress')}><MoreHorizontal className="w-5 h-5 text-slate-300" /></button>
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
                                   <div className="w-px h-3 bg-slate-200"></div>
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
                            const report = `STUDENT ACADEMIC REPORT\nName: ${currentUser.email.split('@')[0]}\nAvg Performance: ${avgGrade}%\nAttendance: 94%\n\nDetailed Scores:\n` + gradedSubmissions.map(s => `- ${s.assignments?.title}: ${s.grade}/${s.assignments?.total_marks}`).join('\n');
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

            {activeTab === 'classes' && (
              <motion.div key="classes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                 
                 {/* My Classes */}
                 <div>
                   <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight mb-6 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> My Approved Classes</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myClasses.map(c => {
                      const classAssignments = assignments.filter(a => a.class_id === c.id);
                      return (
                        <div key={c.id} onClick={() => { setSelectedClassId(c.id); changeTab('assignments'); }} className="glass-card p-6 group flex flex-col relative overflow-hidden cursor-pointer hover:border-indigo-500/50">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-all"></div>
                          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform border border-indigo-500/20"><BookOpen className="w-6 h-6" /></div>
                          <h3 className="text-xl font-black text-[var(--text-main)] mb-2 group-hover:text-indigo-600 transition-colors">{c.name}</h3>
                          <p className="text-xs text-[var(--text-muted)] mb-4">{classAssignments.length} Assignments</p>
                          <div className="mt-auto text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">View Tasks <ChevronRight className="w-4 h-4" /></div>
                        </div>
                      );
                    })}
                    {myClasses.length === 0 && (
                      <div className="col-span-full py-10 text-center text-slate-400 font-bold italic">You are not enrolled in any classes yet.</div>
                    )}
                   </div>
                 </div>

                 {/* Available Classes */}
                 <div className="pt-8 border-t border-[var(--border-main)]">
                   <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight mb-6 flex items-center gap-2"><Search className="w-5 h-5 text-indigo-500" /> Available Classes</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableClasses.map(c => (
                      <div key={c.id} className="glass-card p-6 flex flex-col relative overflow-hidden">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-6"><BookOpen className="w-6 h-6" /></div>
                        <h3 className="text-xl font-black text-[var(--text-main)] mb-2">{c.name}</h3>
                        <p className="text-xs text-[var(--text-muted)] mb-6">Instructor: {c.teacher_email}</p>
                        <button onClick={() => { setSelectedClassToEnroll(c); setShowEnrollModal(true); }} className="mt-auto py-2.5 w-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-xl font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
                          Request Enrollment
                        </button>
                      </div>
                    ))}
                    {pendingClasses.map(c => (
                      <div key={c.id} className="glass-card p-6 flex flex-col relative overflow-hidden opacity-60">
                        <div className="w-12 h-12 bg-orange-50 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 mb-6"><Clock className="w-6 h-6" /></div>
                        <h3 className="text-xl font-black text-[var(--text-main)] mb-2">{c.name}</h3>
                        <p className="text-xs text-[var(--text-muted)] mb-6">Instructor: {c.teacher_email}</p>
                        <div className="mt-auto py-2.5 w-full bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 rounded-xl font-bold text-xs text-center border border-orange-200 dark:border-orange-500/20">
                          Pending Approval
                        </div>
                      </div>
                    ))}
                    {rejectedClasses.map(c => (
                      <div key={c.id} className="glass-card p-6 flex flex-col relative overflow-hidden opacity-60 border-red-500/20">
                        <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-6"><XCircle className="w-6 h-6" /></div>
                        <h3 className="text-xl font-black text-[var(--text-main)] mb-2">{c.name}</h3>
                        <p className="text-xs text-[var(--text-muted)] mb-6">Instructor: {c.teacher_email}</p>
                        <div className="mt-auto py-2.5 w-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-xl font-bold text-xs text-center border border-red-200 dark:border-red-500/20">
                          Request Rejected
                        </div>
                      </div>
                    ))}
                    {availableClasses.length === 0 && pendingClasses.length === 0 && rejectedClasses.length === 0 && (
                      <div className="col-span-full py-10 text-center text-slate-400 font-bold italic">No more classes available to join.</div>
                    )}
                   </div>
                 </div>

              </motion.div>
            )}

            {activeTab === 'assignments' && selectedClassId && (
              <motion.div key="assignments" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAssignments.map(a => {
                    const sub = mySubmissions.find(s => s.assignment_id === a.id);
                    const isGraded = sub?.status === 'graded';
                    const percentage = isGraded ? ((sub.grade / (a.total_marks || 100)) * 100) : 0;
                    const gradeColor = isGraded ? (percentage < 50 ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20') : 'bg-orange-500/10 text-orange-600 border-orange-500/20';

                    return (
                      <div key={a.id} className="glass-card p-6 group flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-all"></div>
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform border border-indigo-500/20"><BookOpen className="w-6 h-6" /></div>
                        <h3 className="text-lg font-black text-[var(--text-main)] mb-2 group-hover:text-indigo-600 transition-colors">{a.title}</h3>
                        <p className="text-xs text-[var(--text-muted)] line-clamp-3 mb-8 leading-relaxed h-12">{a.description || 'No additional guidelines provided.'}</p>
                        <div className="flex items-center justify-between py-4 border-t border-[var(--border-main)] mt-auto">
                          {sub ? (
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black border ${gradeColor}`}>
                              {isGraded ? `Score: ${sub.grade}/${a.total_marks}` : 'Under Review'}
                            </span>
                          ) : (
                            <button onClick={() => { changeTab('overview'); setSelectedAssignmentId(a.id); }} className="text-[10px] font-black text-indigo-600 hover:bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20 transition-all">Submit Now</button>
                          )}
                          <div className="text-[10px] font-black text-[var(--text-muted)] flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(a.deadline).toLocaleDateString()}</div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredAssignments.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-400 font-bold italic">No tasks in this subject matching your search.</div>
                  )}
                 </div>
              </motion.div>
            )}

            {activeTab === 'progress' && (
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
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
        {showEnrollModal && selectedClassToEnroll && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm glass-card p-8 relative border-[var(--border-main)] bg-[var(--bg-card)]">
              <button onClick={() => setShowEnrollModal(false)} className="absolute top-6 right-6 text-[var(--text-muted)] hover:text-indigo-600 transition-colors"><X className="w-5 h-5" /></button>
              <h2 className="text-xl font-black text-[var(--text-main)] mb-2">Join Class</h2>
              <p className="text-xs text-[var(--text-muted)] mb-6 font-medium">Instructor: {selectedClassToEnroll.teacher_email}</p>
              <form onSubmit={handleEnrollRequest} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1">Your Full Name</label>
                  <input required type="text" value={enrollForm.name} onChange={e => setEnrollForm({ ...enrollForm, name: e.target.value })} className="input-glass text-sm bg-[var(--bg-main)]" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1">University Roll Number / ID</label>
                  <input required type="text" value={enrollForm.rollNo} onChange={e => setEnrollForm({ ...enrollForm, rollNo: e.target.value })} className="input-glass text-sm bg-[var(--bg-main)]" placeholder="e.g. FA20-BSE-123" />
                </div>
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[10px] font-bold leading-relaxed">
                  Your request will be sent to the instructor for approval. You will not be able to see assignments until approved.
                </div>
                <button type="submit" className="w-full btn-premium py-4">Send Enrollment Request</button>
              </form>
            </motion.div>
          </div>
        )}

        {showReplyModal && selectedSubmissionForReply && (
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
