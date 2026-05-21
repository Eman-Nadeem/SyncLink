import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Mail, KeyRound, Eye, EyeOff, ShieldAlert, CheckCircle, ArrowRight, User } from 'lucide-react';

export default function SignUpForm({ setAuthMode, successMsg, errorMsg, setSuccessMsg, setErrorMsg }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (!fullName.trim()) throw new Error("Please enter your name.");
      await signup(email, password, role, fullName);
      setSuccessMsg("Registration successful! You can now sign in.");
      setAuthMode('login');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl flex items-center gap-4 text-red-400 text-[11px] font-black"
            >
              <ShieldAlert className="w-5 h-5 shrink-0" /> {errorMsg}
            </motion.div>
          )}
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl flex items-center gap-4 text-emerald-400 text-[11px] font-black"
            >
              <CheckCircle className="w-5 h-5 shrink-0" /> {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

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
            <input 
              type="text" 
              required 
              value={fullName} 
              onChange={e => setFullName(e.target.value)} 
              className="w-full bg-white/[0.03] border border-white/10 rounded-full px-20 py-5 text-sm font-bold text-white focus:outline-none focus:border-teal-500/50 transition-all placeholder:text-slate-600 shadow-inner" 
              placeholder="Your full name" 
            />
          </div>
        </div>

        <div className="relative group">
          <Mail className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
          <input 
            type="email" 
            required 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="w-full bg-white/[0.03] border border-white/10 rounded-full px-20 py-5 text-sm font-bold text-white focus:outline-none focus:border-teal-500/50 transition-all placeholder:text-slate-600 shadow-inner" 
            placeholder="Email address" 
          />
        </div>

        <div className="space-y-4">
          <div className="relative group">
            <KeyRound className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
            <input 
              type={showPassword ? "text" : "password"} 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full bg-white/[0.03] border border-white/10 rounded-full px-20 py-5 text-sm font-bold text-white focus:outline-none focus:border-teal-500/50 transition-all placeholder:text-slate-600 shadow-inner !pr-16" 
              placeholder="Password" 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={submitting} 
          className="w-full py-5 rounded-full bg-gradient-to-r from-teal-500 to-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {submitting ? (
            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Create Account
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-12 text-center flex flex-col gap-4">
        <button 
          onClick={() => setAuthMode('login')} 
          className="text-slate-500 text-[11px] font-black uppercase tracking-widest hover:text-teal-400 transition-all"
        >
          Back to <span className="text-teal-400 underline underline-offset-4">Sign In</span>
        </button>
      </div>
    </div>
  );
}
