import React, { createContext, useContext, useState, useCallback } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Authentication Context Provider
 * 
 * Placeholder implementation for authentication functionality.
 * In a real implementation, this would handle Azure AD, MSAL, or other auth providers.
 */
export const AuthenticationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // For MVP, assume always authenticated
  const [user, setUser] = useState<any | null>({ name: 'Test User', email: 'test@example.com' });

  const login = useCallback(async (credentials: any): Promise<void> => {
    // Placeholder login logic
    setIsAuthenticated(true);
    setUser({ name: 'User', email: 'user@example.com' });
  }, []);

  const logout = useCallback((): void => {
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthenticationProvider');
  }
  return context;
};