import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Usuario, UserRole } from '../types';
import { authService, mapSupabaseUserToUsuario, AUTH_STORAGE_KEY } from '../services/authService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface AuthContextType {
  user: Usuario | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<Usuario>;
  register: (nome: string, email: string, role: UserRole, senha?: string) => Promise<Usuario>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicialização síncrona imediata para evitar tela em branco
  const [user, setUser] = useState<Usuario | null>(() => authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState<boolean>(() => !authService.getCurrentUser());

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Timeout de segurança de 1s para nunca travar a renderização inicial
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 1000)
        );
        const sessionPromise = authService.getInitialUser();

        const initialUser = await Promise.race([sessionPromise, timeoutPromise]);

        if (isMounted && initialUser) {
          setUser(initialUser);
        }
      } catch (err) {
        console.warn('Erro ao inicializar sessão de autenticação:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Sincronização em tempo real com eventos do Supabase Auth
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!isMounted) return;
          if (session?.user) {
            const mappedUser = mapSupabaseUserToUsuario(session.user);
            authService.saveSession(mappedUser);
            setUser(mappedUser);
          } else if (_event === 'SIGNED_OUT') {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            setUser(null);
          }
        }
      );

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, senha: string): Promise<Usuario> => {
    setIsLoading(true);
    try {
      const loggedUser = await authService.loginWithPassword(email, senha);
      setUser(loggedUser);
      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (nome: string, email: string, role: UserRole, senha?: string): Promise<Usuario> => {
    setIsLoading(true);
    try {
      const newUser = await authService.register(nome, email, role, senha);
      setUser(newUser);
      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setUser(null);
    setIsLoading(false);
    await authService.logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.tipo : null,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
