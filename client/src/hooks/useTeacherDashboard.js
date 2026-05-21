import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/supabaseClient';

export function useTeacherDashboard() {
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
      const { data: n } = await supabase.from('notifications').select('*').eq('user_email', currentUser.email).order('created_at', { ascending: false });
      if (c) setClasses(c);
      if (a) setAssignments(a);
      if (s) setSubmissions(s);
      if (e) setEnrollments(e);
      if (att) setAttendance(att);
      if (n) setNotifications(n);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();

    // ✅ REALTIME CHANNEL 1: Submissions table
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        fetchData();
      })
      .subscribe();

    // ✅ REALTIME CHANNEL: Notifications table
    const notificationsChannel = supabase
      .channel('realtime_notifications_teacher')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_email=eq.${currentUser.email}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        addToast(`🔔 ${payload.new.message}`, 'info');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(submissionsChannel);
      supabase.removeChannel(assignmentsChannel);
      supabase.removeChannel(classesChannel);
      supabase.removeChannel(enrollChannel);
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(notificationsChannel);
    };
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
      
      // Notify enrolled students
      const { data: enrolledStudents } = await supabase.from('enrollments').select('student_email').eq('class_id', newAssignment.class_id).eq('status', 'approved');
      if (enrolledStudents && enrolledStudents.length > 0) {
        const notificationsToInsert = enrolledStudents.map(s => ({
          user_email: s.student_email,
          message: `New assignment posted: ${newAssignment.title}`,
          type: 'assignment'
        }));
        await supabase.from('notifications').insert(notificationsToInsert);
      }

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
      const { error } = await supabase.from('submissions').update({ 
        grade: Number(gradingForm.grade), 
        feedback: gradingForm.feedback,
        status: 'graded'
      }).eq('id', selectedSubmission.id);
      if (error) throw error;
      
      // Notify student
      await supabase.from('notifications').insert([{
        user_email: selectedSubmission.student_email,
        message: `Your assignment "${selectedSubmission.assignments?.title || 'work'}" was graded.`,
        type: 'grade'
      }]);

      addToast('Evaluation Saved! Student has been notified.', 'success');
      fetchData();
      setShowGradeModal(false);
    } catch (err) {
      alert(err.message);
    }
  };

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

  // Computed properties
  const classSubmissions = useMemo(() => {
    return selectedClassForView ? submissions.filter(s => s.assignments?.class_id === selectedClassForView.id) : [];
  }, [submissions, selectedClassForView]);

  const gradedSubmissions = useMemo(() => {
    return classSubmissions.filter(s => s.status === 'graded');
  }, [classSubmissions]);

  const pendingSubmissions = useMemo(() => {
    return classSubmissions.filter(s => s.status !== 'graded');
  }, [classSubmissions]);

  const avgGrade = useMemo(() => {
    let totalPercentage = 0;
    gradedSubmissions.forEach(s => {
      const p = (s.grade / (s.assignments?.total_marks || 100)) * 100;
      totalPercentage += p;
    });
    return gradedSubmissions.length ? (totalPercentage / gradedSubmissions.length).toFixed(1) : 0;
  }, [gradedSubmissions]);

  const displayedQueue = useMemo(() => {
    return (queueTab === 'pending' ? pendingSubmissions : gradedSubmissions)
      .filter(s => s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.assignments?.title?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [queueTab, pendingSubmissions, gradedSubmissions, searchTerm]);

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

  return {
    currentUser,
    logout,
    activeTab,
    setActiveTab,
    classTab,
    setClassTab,
    isSidebarOpen,
    setIsSidebarOpen,
    queueTab,
    setQueueTab,
    searchTerm,
    setSearchTerm,
    submissions,
    classes,
    assignments,
    enrollments,
    selectedClassForView,
    setSelectedClassForView,
    attendance,
    isLoading,
    showCreateClassModal,
    setShowCreateClassModal,
    showCreateModal,
    setShowCreateModal,
    editingAttendance,
    setEditingAttendance,
    showGradeModal,
    setShowGradeModal,
    selectedSubmission,
    setSelectedSubmission,
    isCreating,
    toasts,
    gradingForm,
    setGradingForm,
    isDarkMode,
    timeframe,
    setTimeframe,
    showMonthlyReport,
    setShowMonthlyReport,
    notifications,
    setNotifications,
    showNotifications,
    setShowNotifications,
    showEmailModal,
    setShowEmailModal,
    emailTarget,
    setEmailTarget,
    newAssignment,
    setNewAssignment,
    newClass,
    setNewClass,

    // Actions
    addToast,
    fetchData,
    toggleDarkMode,
    handleCreateAssignment,
    handleCreateClass,
    handleGradeSubmit,
    handleDownloadReport,
    markAttendance,
    getAttendanceStatus,
    handleEnrollment,

    // Computed
    classSubmissions,
    gradedSubmissions,
    pendingSubmissions,
    avgGrade,
    displayedQueue,
    performanceCategories,
    submissionTrends
  };
}
