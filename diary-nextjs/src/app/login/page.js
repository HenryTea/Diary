'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isLogin) {
        // Registration validation
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
      }

      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { username: formData.username, password: formData.password }
        : { username: formData.username, email: formData.email, password: formData.password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        // Store user session using auth context
        login(result.user, result.token);
        router.replace('/');
      } else {
        setError(result.error || 'An error occurred');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center transition-colors duration-300" 
         style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md p-8 rounded-lg shadow-lg transition-colors duration-300"
           style={{ backgroundColor: 'var(--bg-content)' }}>
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 transition-colors duration-300" 
              style={{ color: 'var(--text-primary)' }}>
            Diary App
          </h1>
          <p className="transition-colors duration-300" 
             style={{ color: 'var(--text-secondary)' }}>
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>

        {/* Toggle Login/Register */}
        <div className="flex mb-6 rounded-lg overflow-hidden" 
             style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-all duration-300 ${
              isLogin ? 'text-white' : ''
            }`}
            style={{
              backgroundColor: isLogin ? 'var(--new-button-bg)' : 'transparent',
              color: isLogin ? 'var(--new-button-text)' : 'var(--text-secondary)'
            }}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-all duration-300 ${
              !isLogin ? 'text-white' : ''
            }`}
            style={{
              backgroundColor: !isLogin ? 'var(--new-button-bg)' : 'transparent',
              color: !isLogin ? 'var(--new-button-text)' : 'var(--text-secondary)'
            }}
          >
            Register
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-2 transition-colors duration-300" 
                   style={{ color: 'var(--text-primary)' }}>
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 rounded-lg border outline-none transition-all duration-300 focus:ring-2"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
                focusRingColor: 'var(--new-button-bg)'
              }}
              placeholder="Enter your username"
            />
          </div>

          {/* Email (Register only) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2 transition-colors duration-300" 
                     style={{ color: 'var(--text-primary)' }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 rounded-lg border outline-none transition-all duration-300 focus:ring-2"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
                placeholder="Enter your email"
              />
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2 transition-colors duration-300" 
                   style={{ color: 'var(--text-primary)' }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 rounded-lg border outline-none transition-all duration-300 focus:ring-2"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
              placeholder="Enter your password"
            />
          </div>

          {/* Confirm Password (Register only) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2 transition-colors duration-300" 
                     style={{ color: 'var(--text-primary)' }}>
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 rounded-lg border outline-none transition-all duration-300 focus:ring-2"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
                placeholder="Confirm your password"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 hover:opacity-90 disabled:opacity-50"
            style={{ 
              backgroundColor: 'var(--new-button-bg)',
              color: 'var(--new-button-text)'
            }}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm transition-colors duration-300" 
             style={{ color: 'var(--text-secondary)' }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium hover:underline transition-colors duration-300"
              style={{ color: 'var(--text-primary)' }}
            >
              {isLogin ? 'Register here' : 'Login here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
