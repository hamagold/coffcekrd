import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export type AppRole = 'super' | 'staff';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AppRole | null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (authUser: User) => {
    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', authUser.id)
      .single();

    // Get role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authUser.id)
      .single();

    setUser({
      id: authUser.id,
      email: authUser.email || '',
      name: profile?.name || authUser.email || '',
      role: (roleData?.role as AppRole) || null,
    });
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Use setTimeout to avoid deadlock with Supabase auth
          setTimeout(() => fetchUserData(session.user), 0);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string, role: AppRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { error };

    // Assign role (need to do via edge function or direct insert if super admin)
    if (data.user) {
      await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role,
      });
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return { user, loading, signIn, signUp, signOut };
}
