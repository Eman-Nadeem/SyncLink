import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ FIX 1: Pehle onAuthStateChange subscribe karo
    // Yeh Supabase ka cached session se INSTANTLY fire karta hai
    // Isse initial load pe spinner nahi dikhta (zyada der ke liye)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
      setLoading(false); // <- Yeh fast fire hota hai cached session se
    });

    return () => subscription.unsubscribe();
  }, []);

  const signup = async (email, password, role, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role,
          full_name: fullName,
        }
      }
    });
    if (error) throw error;
    return data;
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  // ✅ FIX 2: Optimistic Logout - UI turant clear ho jata hai
  // Server call background mein hoti hai - user ko wait nahi karna padta
  const logout = async () => {
    setCurrentUser(null); // <- Ye line turant UI update kar deti hai
    await supabase.auth.signOut(); // <- Background mein hoti hai
  };

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
