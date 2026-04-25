import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/" />;
  }
  
  const userRole = currentUser.user_metadata?.role || 'student';
  
  if (allowedRole && userRole !== allowedRole) {
    // Redirect to their respective dashboard if they try to access the wrong one
    return <Navigate to={userRole === 'student' ? '/student-dashboard' : '/teacher-dashboard'} />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route 
        path="/student-dashboard" 
        element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher-dashboard" 
        element={
          <ProtectedRoute allowedRole="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-950 font-sans selection:bg-emerald-500/30">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
