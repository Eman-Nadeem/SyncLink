import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Mail, KeyRound, ArrowRight, User, ShieldAlert, UploadCloud, FileText, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Player } from '@lottiefiles/react-lottie-player';

export default function Login() {
  const [authMode, setAuthMode] = useState('login'); // login, signup, forgot, reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { login, signup, resetPassword, updatePassword, loading: authLoading, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && !authLoading) {
      const r = currentUser.user_metadata?.role || 'student';
      navigate(r === 'student' ? '/student-dashboard' : '/teacher-dashboard', { replace: true });
    }

    // Check for recovery hash
    if (window.location.hash === '#reset-password') {
      setAuthMode('reset');
    }
  }, [currentUser, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setErrorMsg(''); setSuccessMsg('');
    
    try {
      if (authMode === 'login') {
        const d = await login(email, password);
        const r = d.user.user_metadata?.role || 'student';
        navigate(r === 'student' ? '/student-dashboard' : '/teacher-dashboard');
      } else if (authMode === 'signup') {
        if (!fullName.trim()) throw new Error("Please enter your name.");
        await signup(email, password, role, fullName);
        setSuccessMsg("Registration successful! You can now sign in.");
        setAuthMode('login');
      } else if (authMode === 'forgot') {
        if (!email) throw new Error("Please enter your email address.");
        await resetPassword(email);
        setSuccessMsg("Reset link sent! Please check your email.");
      } else if (authMode === 'reset') {
        if (!password) throw new Error("Please enter a new password.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        await updatePassword(password);
        setSuccessMsg("Password updated! You can now sign in.");
        setTimeout(() => setAuthMode('login'), 2000);
        window.location.hash = '';
      }
    } catch (e) { setErrorMsg(e.message); } finally { setSubmitting(false); }
  };

  if (authLoading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
       <div className="w-10 h-10 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-teal-950 via-slate-900 to-blue-950 text-slate-100 font-sans relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-600/25 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-teal-400/10 blur-[100px] rounded-full"></div>
      
      
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="w-full max-w-[860px] glass-card overflow-hidden flex flex-col md:flex-row bg-slate-900/40 min-h-[500px] md:min-h-0">
        
        {/* Left Side Info */}
        <div className="w-full md:w-[42%] p-8 md:p-14 flex flex-col justify-between bg-white/[0.01] border-b md:border-b-0 md:border-r border-white/5">
          <div>
            <div className="flex items-center gap-4 mb-12">
              <div className="w-14 h-14 flex items-center justify-center relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="w-full h-full"
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]">
                    <defs>
                      <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <motion.stop offset="0%" animate={{ stopColor: ["#1e40af", "#22d3ee", "#1e40af"] }} transition={{ duration: 6, repeat: Infinity }} />
                        <motion.stop offset="100%" animate={{ stopColor: ["#22d3ee", "#1e40af", "#22d3ee"] }} transition={{ duration: 6, repeat: Infinity }} />
                      </linearGradient>
                    </defs>
                    <path d="M35 60 A20 20 0 1 1 55 25" stroke="url(#flowGrad)" strokeWidth="10" fill="none" strokeLinecap="round" />
                    <path d="M65 40 A20 20 0 1 1 45 75" stroke="url(#flowGrad)" strokeWidth="10" fill="none" strokeLinecap="round" />
                  </svg>
                </motion.div>
                {/* Cloud in Center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 4, repeat: Infinity }}>
                    <UploadCloud className="w-7 h-7 text-white drop-shadow-md" />
                  </motion.div>
                </div>
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-white">Sync<span className="text-teal-400">Link</span></h1>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight mb-8 tracking-tighter">
              Assignment Cloud <br/>
              <span className="bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent italic">Perfected.</span>
            </h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[300px]">
              The ultimate cloud platform for seamless assignment collaboration and grading.
            </p>
          </div>

          <div className="flex justify-center py-6 md:py-12">
             <div className="w-40 h-40 md:w-56 md:h-56 bg-indigo-500/[0.02] rounded-full flex items-center justify-center border border-white/5 shadow-inner relative group">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border border-dashed border-teal-500/20 rounded-full"
                ></motion.div>
                
                <div className="relative flex items-center justify-center">
                   <motion.div 
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1]
                      }}
                      transition={{ duration: 5, repeat: Infinity }}
                      className="absolute w-32 h-32 bg-indigo-500 rounded-full blur-3xl"
                   />
                   <div className="w-32 h-32 relative z-10">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="w-full h-full"
                      >
                        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                          <defs>
                            <linearGradient id="splashGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <motion.stop offset="0%" animate={{ stopColor: ["#1e40af", "#22d3ee", "#1e40af"] }} transition={{ duration: 6, repeat: Infinity }} />
                              <motion.stop offset="100%" animate={{ stopColor: ["#22d3ee", "#1e40af", "#22d3ee"] }} transition={{ duration: 6, repeat: Infinity }} />
                            </linearGradient>
                          </defs>
                          <path d="M35 60 A20 20 0 1 1 55 25" stroke="url(#splashGrad)" strokeWidth="8" fill="none" strokeLinecap="round" />
                          <path d="M65 40 A20 20 0 1 1 45 75" stroke="url(#splashGrad)" strokeWidth="8" fill="none" strokeLinecap="round" />
                        </svg>
                      </motion.div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                          <UploadCloud className="w-16 h-16 text-white drop-shadow-2xl" />
                        </motion.div>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">ASSIGN • SUBMIT • COLLABORATE • ACHIEVE</p>
            <p className="text-xs font-semibold text-slate-700 tracking-wider">
              SyncLink Cloud © 2026
            </p>
          </div>
        </div>

        <div className="flex-1 p-8 md:p-16 lg:p-20 flex flex-col justify-center">
          <div className="mb-6 md:mb-10">
            <h2 className="text-2xl md:text-4xl font-black mb-3 text-white tracking-tighter">
              {authMode === 'login' && 'Welcome Back'}
              {authMode === 'signup' && 'Create Account'}
              {authMode === 'forgot' && 'Reset Password'}
              {authMode === 'reset' && 'Create New Password'}
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              {authMode === 'login' && 'Access your professional academic workspace'}
              {authMode === 'signup' && 'Join the next generation of cloud learning'}
              {authMode === 'forgot' && 'Enter your email to receive a secure reset link'}
              {authMode === 'reset' && 'Choose a strong new password for your account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl flex items-center gap-4 text-red-400 text-[11px] font-black">
                  <ShieldAlert className="w-5 h-5 shrink-0" /> {errorMsg}
                </motion.div>
              )}
              {successMsg && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl flex items-center gap-4 text-emerald-400 text-[11px] font-black">
                  <CheckCircle className="w-5 h-5 shrink-0" /> {successMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {authMode === 'signup' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button" 
                    onClick={() => setRole('student')} 
                    className={`relative p-5 rounded-2xl border transition-all duration-500 flex flex-col items-center gap-3 overflow-hidden ${role === 'student' ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)]' : 'bg-white/[0.03] border-white/5 hover:border-white/10'}`}
                  >
                    {role === 'student' && <motion.div layoutId="roleGlow" className="absolute inset-0 bg-indigo-500/10 blur-2xl" />}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 relative z-10 ${role === 'student' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 rotate-3' : 'bg-slate-800/50 text-slate-500'}`}>
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <span className={`text-[10px] font-black tracking-[0.2em] uppercase relative z-10 ${role === 'student' ? 'text-white' : 'text-slate-500'}`}>Student</span>
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => setRole('teacher')} 
                    className={`relative p-5 rounded-2xl border transition-all duration-500 flex flex-col items-center gap-3 overflow-hidden ${role === 'teacher' ? 'bg-emerald-600/10 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-white/[0.03] border-white/5 hover:border-white/10'}`}
                  >
                    {role === 'teacher' && <motion.div layoutId="roleGlow" className="absolute inset-0 bg-emerald-500/10 blur-2xl" />}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 relative z-10 ${role === 'teacher' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/40 -rotate-3' : 'bg-slate-800/50 text-slate-500'}`}>
                      <User className="w-7 h-7" />
                    </div>
                    <span className={`text-[10px] font-black tracking-[0.2em] uppercase relative z-10 ${role === 'teacher' ? 'text-white' : 'text-slate-500'}`}>Teacher</span>
                  </button>
                </div>
                <div className="relative group">
                  <User className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                  <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-full px-20 py-5 text-sm font-bold text-white focus:outline-none focus:border-teal-500/50 transition-all placeholder:text-slate-600 shadow-inner" placeholder="Your full name" />
                </div>
              </div>
            )}

            {(authMode === 'login' || authMode === 'signup' || authMode === 'forgot' || authMode === 'reset') && (
              <div className="relative group">
                <Mail className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-full px-20 py-5 text-sm font-bold text-white focus:outline-none focus:border-teal-500/50 transition-all placeholder:text-slate-600 shadow-inner" placeholder="Email address" />
              </div>
            )}
            
            {(authMode === 'login' || authMode === 'signup' || authMode === 'reset') && (
              <div className="space-y-4">
                <div className="relative group">
                  <KeyRound className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                  <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-full px-20 py-5 text-sm font-bold text-white focus:outline-none focus:border-teal-500/50 transition-all placeholder:text-slate-600 shadow-inner !pr-16" placeholder={authMode === 'reset' ? "New Password" : "Password"} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {authMode === 'reset' && (
                  <div className="relative group">
                    <KeyRound className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    <input type={showPassword ? "text" : "password"} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-full px-20 py-5 text-sm font-bold text-white focus:outline-none focus:border-teal-500/50 transition-all placeholder:text-slate-600 shadow-inner" placeholder="Confirm New Password" />
                  </div>
                )}
                {/* Forgot Password Removed */}
              </div>
            )}

            <button type="submit" disabled={submitting} className="w-full py-5 rounded-full bg-gradient-to-r from-teal-500 to-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
              {submitting ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" /> : (
                <>
                  {authMode === 'login' && 'Access Portal'}
                  {authMode === 'signup' && 'Create Account'}
                  {authMode === 'forgot' && 'Send Reset Link'}
                  {authMode === 'reset' && 'Update Password'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center flex flex-col gap-4">
            {authMode === 'login' && (
              <button onClick={() => setAuthMode('signup')} className="text-slate-500 text-[11px] font-black uppercase tracking-widest hover:text-teal-400 transition-all">
                New here? <span className="text-teal-400 underline underline-offset-4">Create an account</span>
              </button>
            )}
            {(authMode === 'signup' || authMode === 'forgot' || authMode === 'reset') && (
              <button onClick={() => setAuthMode('login')} className="text-slate-500 text-[11px] font-black uppercase tracking-widest hover:text-teal-400 transition-all">
                Back to <span className="text-teal-400 underline underline-offset-4">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
