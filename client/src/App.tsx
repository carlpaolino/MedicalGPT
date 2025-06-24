import React, { useState, useEffect, createContext, useContext } from 'react';
import ChatPage from './pages/ChatPage';
import AuthPage from './pages/AuthPage';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({ token: null, setToken: () => {} });
export const useAuth = () => useContext(AuthContext);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);
  return (
    <AuthContext.Provider value={{ token, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

const MainApp: React.FC = () => {
  const { token, setToken } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-red-50 dark:from-blue-950 dark:to-red-900">
      <div className="w-full flex justify-end items-center px-8 py-4 bg-gradient-to-r from-blue-700 to-red-600 shadow-md z-20">
        {token ? (
          <button
            onClick={() => setToken(null)}
            className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-2 rounded shadow border border-white/20 transition-colors"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={() => setShowAuth(true)}
            className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-2 rounded shadow border border-white/20 transition-colors"
          >
            Login / Sign Up
          </button>
        )}
      </div>
      <div className="flex-1 flex min-h-0">
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {token ? (
            <ChatPage />
          ) : (
            showAuth && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                <div className="bg-white dark:bg-blue-950 rounded-lg shadow-lg p-0 max-w-md w-full relative">
                  <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                    onClick={() => setShowAuth(false)}
                    aria-label="Close auth modal"
                  >
                    ×
                  </button>
                  <AuthPage onAuth={(token) => { setToken(token); setShowAuth(false); }} />
                </div>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
};

export default App; 