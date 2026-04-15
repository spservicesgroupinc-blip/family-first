import React, { useState } from 'react';
import { Users, Lock, Mail, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string) => void;
  onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    
    try {
      // Check localStorage for registered users
      const users = JSON.parse(localStorage.getItem('ff_users') || '[]');
      const user = users.find((u: any) => u.username === username && u.password === password);
      
      if (user) {
        localStorage.setItem('ff_current_user', username);
        onLogin(username);
      } else {
        setError('Invalid username or password. Please try again or register a new account.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-legal-900 via-legal-800 to-legal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-legal-800 rounded-2xl border border-legal-700 mb-4">
            <Users className="w-8 h-8 text-legal-200" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-legal-50 mb-2">Family First</h1>
          <p className="text-legal-400 text-sm uppercase tracking-wider">Client Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-legal-200">
          <h2 className="text-xl font-serif font-bold text-legal-900 mb-6">Sign In</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-legal-600 mb-2">
                Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-legal-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-legal-200 rounded-lg focus:border-legal-500 focus:ring-2 focus:ring-legal-200 outline-none font-serif text-sm min-h-[44px]"
                  placeholder="Enter your username"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-legal-600 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-legal-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-legal-200 rounded-lg focus:border-legal-500 focus:ring-2 focus:ring-legal-200 outline-none font-serif text-sm min-h-[44px]"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-legal-400 hover:text-legal-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-legal-900 hover:bg-legal-800 text-legal-50 py-3 rounded-lg font-medium uppercase tracking-wider text-sm transition shadow-sm disabled:opacity-50 min-h-[44px]"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-legal-100 text-center">
            <p className="text-sm text-legal-600">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-legal-900 font-bold hover:underline"
              >
                Register here
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-legal-500 text-xs mt-6">
          &copy; {new Date().getFullYear()} Family First. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
