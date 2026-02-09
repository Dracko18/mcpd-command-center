import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Tables, Enums } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type AppRole = Enums<'app_role'>;

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null, session: null, profile: null, roles: [], loading: true, isAdmin: false,
  });

  const fetchProfileAndRoles = async (userId: string) => {
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', userId),
    ]);
    const profile = profileRes.data;
    const roles = (rolesRes.data || []).map(r => r.role);
    return { profile, roles, isAdmin: roles.includes('administrator') };
  };

  const refreshProfile = async () => {
    if (!state.user) return;
    const data = await fetchProfileAndRoles(state.user.id);
    setState(s => ({ ...s, ...data }));
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Defer profile fetch to avoid Supabase deadlock
        setTimeout(async () => {
          const data = await fetchProfileAndRoles(session.user.id);
          setState({ user: session.user, session, ...data, loading: false });
        }, 0);
      } else {
        setState({ user: null, session: null, profile: null, roles: [], loading: false, isAdmin: false });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfileAndRoles(session.user.id).then(data => {
          setState({ user: session.user, session, ...data, loading: false });
        });
      } else {
        setState(s => ({ ...s, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error && state.profile?.must_change_password) {
      await supabase.from('profiles').update({ must_change_password: false }).eq('user_id', state.user!.id);
      await refreshProfile();
    }
    return { error: error ? new Error(error.message) : null };
  };

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, updatePassword, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
