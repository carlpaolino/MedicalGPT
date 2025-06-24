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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50 dark:bg-blue-900">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-blue-950 p-8 rounded-lg shadow-md w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-200 mb-2">{isLogin ? 'Login' : 'Sign Up'}</h2>
        {!isLogin && (
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 rounded border border-blue-200 dark:border-blue-800 bg-transparent text-blue-900 dark:text-blue-100"
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded border border-blue-200 dark:border-blue-800 bg-transparent text-blue-900 dark:text-blue-100"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-3 py-2 rounded border border-blue-200 dark:border-blue-800 bg-transparent text-blue-900 dark:text-blue-100"
          required
        />
        {error && <div className="text-red-500 text-center">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
        </button>
        <div className="text-center mt-2">
          <button
            type="button"
            className="text-blue-500 hover:underline text-sm"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AuthPage; 