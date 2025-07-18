'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: '',
    username: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [recoveryResult, setRecoveryResult] = useState(null);
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
        // Store user session using auth context (cookie is set by server)
        login(result.user);
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

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setRecoveryResult(null);

    try {
      // Validate passwords match
      if (forgotPasswordData.newPassword !== forgotPasswordData.confirmNewPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      // Validate password length
      if (forgotPasswordData.newPassword.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: forgotPasswordData.email,
          username: forgotPasswordData.username,
          newPassword: forgotPasswordData.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRecoveryResult({
          success: true,
          message: 'Password reset successful!',
          userInfo: data.user
        });
      } else {
        setError(data.error || 'Password reset failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Password recovery error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordInputChange = (e) => {
    setForgotPasswordData({
      ...forgotPasswordData,
      [e.target.name]: e.target.value
    });
  };

  const resetForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotPasswordData({ email: '', username: '', newPassword: '', confirmNewPassword: '' });
    setRecoveryResult(null);
    setError('');
  };

  // If showing forgot password form
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors duration-300" 
           style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-full max-w-md p-8 rounded-lg shadow-lg transition-colors duration-300"
             style={{ backgroundColor: 'var(--bg-content)' }}>
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 transition-colors duration-300" 
                style={{ color: 'var(--text-primary)' }}>
              Forgot Password
            </h1>
            <p className="transition-colors duration-300" 
               style={{ color: 'var(--text-secondary)' }}>
              Enter your email, username, and new password to reset your account
            </p>
          </div>

          {/* Success Message */}
          {recoveryResult && recoveryResult.success && (
            <div className="mb-6 p-4 rounded-lg" 
                 style={{ backgroundColor: 'var(--bg-secondary)', borderLeft: '4px solid #10b981' }}>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Password Reset Successful!
              </h3>
              <div className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                <p>Your password has been successfully updated for:</p>
                <p><strong>Username:</strong> {recoveryResult.userInfo.username}</p>
                <p><strong>Email:</strong> {recoveryResult.userInfo.email}</p>
                <p className="mt-2">You can now login with your new password.</p>
              </div>
              <button
                onClick={resetForgotPassword}
                className="px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:opacity-90"
                style={{ 
                  backgroundColor: 'var(--new-button-bg)',
                  color: 'var(--new-button-text)'
                }}
              >
                Back to Login
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg" 
                 style={{ backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444' }}>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Recovery Form */}
          {!recoveryResult && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2 transition-colors duration-300" 
                       style={{ color: 'var(--text-primary)' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={forgotPasswordData.email}
                  onChange={handleForgotPasswordInputChange}
                  required
                  className="w-full px-3 py-2 rounded-lg border outline-none transition-all duration-300 focus:ring-2"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Enter your email address"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium mb-2 transition-colors duration-300" 
                       style={{ color: 'var(--text-primary)' }}>
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={forgotPasswordData.username}
                  onChange={handleForgotPasswordInputChange}
                  required
                  className="w-full px-3 py-2 rounded-lg border outline-none transition-all duration-300 focus:ring-2"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Enter your username"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium mb-2 transition-colors duration-300" 
                       style={{ color: 'var(--text-primary)' }}>
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={forgotPasswordData.newPassword}
                  onChange={handleForgotPasswordInputChange}
                  required
                  className="w-full px-3 py-2 rounded-lg border outline-none transition-all duration-300 focus:ring-2"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Enter your new password"
                />
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-medium mb-2 transition-colors duration-300" 
                       style={{ color: 'var(--text-primary)' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmNewPassword"
                  value={forgotPasswordData.confirmNewPassword}
                  onChange={handleForgotPasswordInputChange}
                  required
                  className="w-full px-3 py-2 rounded-lg border outline-none transition-all duration-300 focus:ring-2"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Confirm your new password"
                />
              </div>

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
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Back to Login */}
          {!recoveryResult && (
            <div className="mt-6 text-center">
              <button
                onClick={resetForgotPassword}
                className="text-sm hover:underline transition-colors duration-300"
                style={{ color: 'var(--text-secondary)' }}
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

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
          
          {/* Forgot Password Link - Only show on login */}
          {isLogin && (
            <div className="mt-4">
              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-sm hover:underline transition-colors duration-300"
                style={{ color: 'var(--text-secondary)' }}
              >
                Forgot your password?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
