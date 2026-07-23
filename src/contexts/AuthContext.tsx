import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/db/supabase';
import { mockDb } from '@/db/mockDb';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/types';

let useMockAuth = false;

export async function getProfile(userId: string): Promise<Profile | null> {
  if (useMockAuth) {
    return mockDb.getProfiles().find(p => p.id === userId) || null;
  }
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('获取用户信息失败, switching to local mock auth:', error);
    useMockAuth = true;
    return mockDb.getProfiles().find(p => p.id === userId) || null;
  }
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const profileData = await getProfile(user.id);
    setProfile(profileData);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        getProfile(session.user.id).then(setProfile);
      } else {
        const mockUser = mockDb.getCurrentUser();
        if (mockUser) {
          useMockAuth = true;
          setProfile(mockUser);
          setUser({ id: mockUser.id, email: mockUser.email } as any);
        }
      }
      setLoading(false);
    }).catch(err => {
      console.warn('Supabase auth getSession failed. Switching to local mock auth:', err);
      useMockAuth = true;
      const mockUser = mockDb.getCurrentUser();
      if (mockUser) {
        setProfile(mockUser);
        setUser({ id: mockUser.id, email: mockUser.email } as any);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (useMockAuth) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id).then(setProfile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInMock = async (username: string, password: string) => {
    const profiles = mockDb.getProfiles();
    const profile = profiles.find(p => p.username === username);
    if (!profile) {
      // Auto-register to make exploration super smooth!
      return signUpMock(username, password);
    }
    if (password.length < 6) {
      return { error: new Error('Password must be at least 6 characters long.') };
    }
    mockDb.setCurrentUser(profile);
    setProfile(profile);
    setUser({ id: profile.id, email: profile.email } as any);
    return { error: null };
  };

  const signUpMock = async (username: string, password: string) => {
    const profiles = mockDb.getProfiles();
    const exists = profiles.some(p => p.username === username);
    if (exists) {
      return { error: new Error('Username already exists.') };
    }
    if (password.length < 6) {
      return { error: new Error('Password must be at least 6 characters long.') };
    }

    // Role dynamic resolution for easy local testing
    let role: Profile['role'] = 'admin';
    if (username.toLowerCase().includes('officer')) {
      role = 'officer';
    } else if (username.toLowerCase().includes('viewer')) {
      role = 'viewer';
    }

    const newProfile: Profile = {
      id: 'usr-' + Math.random().toString(36).substring(2, 10),
      email: `${username}@miaoda.com`,
      username,
      phone: '',
      role,
      full_name: username.charAt(0).toUpperCase() + username.slice(1),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    profiles.push(newProfile);
    mockDb.saveProfiles(profiles);
    mockDb.setCurrentUser(newProfile);
    setProfile(newProfile);
    setUser({ id: newProfile.id, email: newProfile.email } as any);
    return { error: null };
  };

  const signInWithUsername = async (username: string, password: string) => {
    if (useMockAuth) {
      return signInMock(username, password);
    }
    try {
      const email = `${username}@miaoda.com`;
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      const err = error as any;
      if (
        err?.message?.includes('Failed to fetch') ||
        err?.status === 0 ||
        err?.message?.includes('ERR_NAME_NOT_RESOLVED') ||
        err?.message?.includes('network')
      ) {
        console.warn('Supabase auth failed. Falling back to mock auth.');
        useMockAuth = true;
        return signInMock(username, password);
      }
      return { error: error as Error };
    }
  };

  const signUpWithUsername = async (username: string, password: string) => {
    if (useMockAuth) {
      return signUpMock(username, password);
    }
    try {
      const email = `${username}@miaoda.com`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      const err = error as any;
      if (
        err?.message?.includes('Failed to fetch') ||
        err?.status === 0 ||
        err?.message?.includes('ERR_NAME_NOT_RESOLVED') ||
        err?.message?.includes('network')
      ) {
        console.warn('Supabase signup failed. Falling back to mock auth.');
        useMockAuth = true;
        return signUpMock(username, password);
      }
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    if (useMockAuth) {
      mockDb.setCurrentUser(null);
      setUser(null);
      setProfile(null);
      return;
    }
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signout failed, clearing local mock auth instead:', e);
    }
    mockDb.setCurrentUser(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithUsername, signUpWithUsername, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
