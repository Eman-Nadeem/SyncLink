import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import AuthLayout from '../components/auth/AuthLayout';
import SignInForm from '../components/auth/SignInForm';
import SignUpForm from '../components/auth/SignUpForm';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';

export default function Login() {
  const [authMode, setAuthMode] = useState('login'); // login, signup, forgot, reset
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { loading: authLoading, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && !authLoading) {
      const r = currentUser.user_metadata?.role || 'student';
      navigate(r === 'student' ? '/student-dashboard' : '/teacher-dashboard', { replace: true });
    }

    // Check for recovery hash
    if (window.location.hash === '#reset-password') {
      setTimeout(() => setAuthMode('reset'), 0);
    }
  }, [currentUser, authLoading, navigate]);

  if (authLoading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
       <div className="w-10 h-10 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
    </div>
  );

  let title = '';
  let subtitle = '';
  let formComponent = null;

  if (authMode === 'login') {
    title = 'Welcome Back';
    subtitle = 'Access your professional academic workspace';
    formComponent = (
      <SignInForm 
        setAuthMode={setAuthMode} 
        successMsg={successMsg}
        errorMsg={errorMsg}
        setSuccessMsg={setSuccessMsg}
        setErrorMsg={setErrorMsg}
      />
    );
  } else if (authMode === 'signup') {
    title = 'Create Account';
    subtitle = 'Join the next generation of cloud learning';
    formComponent = (
      <SignUpForm 
        setAuthMode={setAuthMode} 
        successMsg={successMsg}
        errorMsg={errorMsg}
        setSuccessMsg={setSuccessMsg}
        setErrorMsg={setErrorMsg}
      />
    );
  } else if (authMode === 'forgot') {
    title = 'Reset Password';
    subtitle = 'Enter your email to receive a secure reset link';
    formComponent = (
      <ForgotPasswordForm 
        setAuthMode={setAuthMode} 
        successMsg={successMsg}
        errorMsg={errorMsg}
        setSuccessMsg={setSuccessMsg}
        setErrorMsg={setErrorMsg}
      />
    );
  } else if (authMode === 'reset') {
    title = 'Create New Password';
    subtitle = 'Choose a strong new password for your account';
    formComponent = (
      <ResetPasswordForm 
        setAuthMode={setAuthMode} 
        successMsg={successMsg}
        errorMsg={errorMsg}
        setSuccessMsg={setSuccessMsg}
        setErrorMsg={setErrorMsg}
      />
    );
  }

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      {formComponent}
    </AuthLayout>
  );
}
