import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Usuario, UserRole } from '../types';
import { authService, FAKE_PROFILES } from '../services/authService';

interface AuthContextType {
  user: Usuario | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<Usuario>;
  register: (nome: string, email: string, role: UserRole) => Promise<Usuario>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Carrega usuário da sessão salva caso exista
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
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

  const register = async (nome: string, email: string, role: UserRole): Promise<Usuario> => {
    setIsLoading(true);
    try {
      const newUser = await authService.register(nome, email, role);
      setUser(newUser);
      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    authService.logout();
    setUser(null);
  };

  const switchRole = (newRole: UserRole): void => {
    const profile = FAKE_PROFILES.find((p) => p.role === newRole);
    if (profile) {
      authService.saveSession(profile.usuario);
      setUser(profile.usuario);
    }
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
        switchRole,
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

