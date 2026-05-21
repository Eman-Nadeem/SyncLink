
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/supabaseClient';
/* eslint-disable react-hooks/exhaustive-deps */
export function useStudentDashboard() {
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
      const { data: s } = await supabase.from('submissions').select('*, assignments(title, total_marks, deadline, class_id, classes(name, teacher_email))').eq('student_email', currentUser?.email).order('submitted_at', { ascending: false });
      const { data: e } = await supabase.from('enrollments').select('*').eq('student_email', currentUser?.email);
      const { data: att } = await supabase.from('attendance').select('*').eq('student_email', currentUser?.email);
      const { data: n } = await supabase.from('notifications').select('*').eq('user_email', currentUser?.email).order('created_at', { ascending: false });
      if (c) setClasses(c);
      if (a) setAssignments(a);
      if (s) setMySubmissions(s);
      if (e) setEnrollments(e);
      if (att) setAttendance(att);
      if (n) setNotifications(n);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!currentUser) { setIsLoading(false); return; }

    fetchData();

    // ✅ REALTIME CHANNEL 1: Assignments table
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
    const submissionsChannel = supabase
      .channel('realtime_submissions_student')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'submissions', 
        filter: `student_email=eq.${currentUser.email}` 
      }, (payload) => {
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
      }, () => {
        fetchData();
      })
      .subscribe();

    // ✅ REALTIME CHANNEL: Notifications (direct messages, assignment updates)
    const notificationsChannel = supabase
      .channel('realtime_notifications_student')
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
      supabase.removeChannel(assignmentsChannel);
      supabase.removeChannel(submissionsChannel);
      supabase.removeChannel(classesChannel);
      supabase.removeChannel(enrollmentsChannel);
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(notificationsChannel);
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

      // Notify the teacher of new submission
      const { data: assignmentData } = await supabase.from('assignments').select('title, classes(teacher_email)').eq('id', selectedAssignmentId).single();
      if (assignmentData && assignmentData.classes?.teacher_email) {
        await supabase.from('notifications').insert([{
          user_email: assignmentData.classes.teacher_email,
          message: `${currentUser.email.split('@')[0]} submitted work for "${assignmentData.title}"`,
          type: 'submission'
        }]);
      }

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

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!studentReply.trim()) return;
    setIsReplying(true);
    try {
      const { data: current } = await supabase.from('submissions').select('feedback').eq('id', selectedSubmissionForReply.id).single();
      const updatedFeedback = `${current.feedback}\n\nStudent Reply: ${studentReply}`;
      await supabase.from('submissions').update({ feedback: updatedFeedback }).eq('id', selectedSubmissionForReply.id);
      
      // Notify the teacher of student response
      const teacherEmail = selectedSubmissionForReply.assignments?.classes?.teacher_email;
      if (teacherEmail) {
        await supabase.from('notifications').insert([{
          user_email: teacherEmail,
          message: `${currentUser.email.split('@')[0]} sent a reply for "${selectedSubmissionForReply.assignments?.title}"`,
          type: 'reply'
        }]);
      }

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

  // Computed properties
  const myClassIds = useMemo(() => enrollments.filter(e => e.status === 'approved').map(e => e.class_id), [enrollments]);
  const pendingClassIds = useMemo(() => enrollments.filter(e => e.status === 'pending').map(e => e.class_id), [enrollments]);
  const rejectedClassIds = useMemo(() => enrollments.filter(e => e.status === 'rejected').map(e => e.class_id), [enrollments]);

  const myClasses = useMemo(() => classes.filter(c => myClassIds.includes(c.id)), [classes, myClassIds]);
  const availableClasses = useMemo(() => classes.filter(c => !myClassIds.includes(c.id) && !pendingClassIds.includes(c.id) && !rejectedClassIds.includes(c.id)), [classes, myClassIds, pendingClassIds, rejectedClassIds]);
  const pendingClasses = useMemo(() => classes.filter(c => pendingClassIds.includes(c.id)), [classes, pendingClassIds]);
  const rejectedClasses = useMemo(() => classes.filter(c => rejectedClassIds.includes(c.id)), [classes, rejectedClassIds]);

  const totalPresent = useMemo(() => attendance.filter(a => a.status === 'present').length, [attendance]);
  const totalAbsent = useMemo(() => attendance.filter(a => a.status === 'absent').length, [attendance]);
  const totalClasses = useMemo(() => totalPresent + totalAbsent, [totalPresent, totalAbsent]);
  const attendanceRate = useMemo(() => totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0, [totalClasses, totalPresent]);

  const gradedSubmissions = useMemo(() => mySubmissions.filter(s => s.status === 'graded'), [mySubmissions]);
  const avgGrade = useMemo(() => {
    return gradedSubmissions.length ? (gradedSubmissions.reduce((acc, curr) => acc + ((curr.grade / (curr.assignments?.total_marks || 100)) * 100), 0) / gradedSubmissions.length).toFixed(1) : 0;
  }, [gradedSubmissions]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()) && a.class_id === selectedClassId && myClassIds.includes(a.class_id));
  }, [assignments, searchTerm, selectedClassId, myClassIds]);

  const filteredSubmissions = useMemo(() => {
    return mySubmissions.filter(s => s.assignments?.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [mySubmissions, searchTerm]);

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

  return {
    currentUser,
    logout,
    activeTab,
    setActiveTab,
    isSidebarOpen,
    setIsSidebarOpen,
    searchTerm,
    setSearchTerm,
    classes,
    enrollments,
    selectedClassId,
    setSelectedClassId,
    assignments,
    mySubmissions,
    selectedAssignmentId,
    setSelectedAssignmentId,
    showEnrollModal,
    setShowEnrollModal,
    selectedClassToEnroll,
    setSelectedClassToEnroll,
    enrollForm,
    setEnrollForm,
    attendance,
    toasts,
    file,
    setFile,
    uploadStatus,
    isDarkMode,
    notifications,
    setNotifications,
    showNotifications,
    setShowNotifications,
    showReplyModal,
    setShowReplyModal,
    selectedSubmissionForReply,
    setSelectedSubmissionForReply,
    studentReply,
    setStudentReply,
    isReplying,
    isLoading,
    
    // Actions
    addToast,
    fetchData,
    changeTab,
    toggleDarkMode,
    handleUpload,
    handleEnrollRequest,
    handleReplySubmit,
    handleDeleteSubmission,
    handleEditSubmission,

    // Computed
    myClassIds,
    pendingClassIds,
    rejectedClassIds,
    myClasses,
    availableClasses,
    pendingClasses,
    rejectedClasses,
    attendanceRate,
    totalPresent,
    totalAbsent,
    totalClasses,
    avgGrade,
    filteredAssignments,
    filteredSubmissions,
    gradedSubmissions,
    chartData,
    pieData
  };
}
