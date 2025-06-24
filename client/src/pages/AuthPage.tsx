import React, { useState } from 'react';

interface AuthPageProps {
  onAuth: (token: string) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const endpoint = isLogin ? `${API_BASE_URL}/api/auth/login` : `${API_BASE_URL}/api/auth/register`;
      const body = isLogin
        ? { email, password }
        : { email, password, name };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Auth failed');
      const token = data.data?.token;
      if (token) {
        localStorage.setItem('token', token);
        onAuth(token);
      } else {
        throw new Error('No token returned');
      }
    } catch (err: any) {
      setError(err.message || 'Auth failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-400 to-red-400">
      <div className="flex flex-col items-center w-full">
        <h1 className="text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg mt-24 mb-8 text-center select-none" style={{letterSpacing: '0.05em'}}>MedGPT</h1>
        <div className="bg-white/90 shadow-2xl rounded-2xl px-8 py-10 w-full max-w-md flex flex-col items-center">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">{isLogin ? 'Login' : 'Sign Up'}</h2>
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {!isLogin && (
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded border border-blue-200 bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded border border-blue-200 bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded border border-blue-200 bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            {error && <div className="text-red-500 text-center">{error}</div>}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-red-500 hover:from-blue-700 hover:to-red-600 text-white py-2 rounded font-semibold shadow-md transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>
          <div className="text-center mt-4">
            <button
              type="button"
              className="text-blue-600 hover:underline text-sm font-medium"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage; 