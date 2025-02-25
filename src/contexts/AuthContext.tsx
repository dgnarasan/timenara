
import { createContext, useContext } from 'react';

// Simple context with minimal functionality
type AuthContextType = {
  user: null;
  loading: boolean; // Changed from literal 'false' to broader 'boolean' type
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Simplified provider with no authentication
  const value: AuthContextType = {
    user: null,
    loading: false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
