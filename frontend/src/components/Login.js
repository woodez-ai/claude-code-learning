import React, { useState } from 'react';
import { LogIn, UserPlus, ChevronDown } from 'lucide-react';
import apiService from '../services/api';
import Logo from './Logo';
import TopPortfolios from './TopPortfolios';
import MarketMovers from './MarketMovers';

const Login = ({ onLogin, onShowRegister }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [error, setError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showRegisterDropdown, setShowRegisterDropdown] = useState(false);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiService.login(credentials.username, credentials.password);
      onLogin();
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError('');

    try {
      await apiService.register(registerData);
      onLogin();
    } catch (err) {
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === 'object') {
          const errorMessages = Object.entries(errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          setRegisterError(errorMessages);
        } else {
          setRegisterError('Registration failed. Please try again.');
        }
      } else {
        setRegisterError('Registration failed. Please try again.');
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Menu Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <Logo size="small" className="logo-login" showSubtitle={false} />
              <div>
                <h1 className="text-xl font-bold text-gray-900">WoodezFi</h1>
                <p className="text-xs text-gray-600">Gameifying Stock Trading</p>
              </div>
            </div>

            {/* Center Menu Items */}
            <div className="flex items-center space-x-4">
              {/* Login Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowLoginDropdown(!showLoginDropdown);
                    setShowRegisterDropdown(false);
                  }}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                  <ChevronDown className="h-4 w-4 ml-2" />
                </button>

                {/* Login Dropdown Form */}
                {showLoginDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="p-4">
                      <div className="text-center mb-3">
                        <div className="mx-auto h-8 w-8 flex items-center justify-center rounded-full bg-blue-100">
                          <LogIn className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="mt-2 text-sm font-medium text-gray-900">Sign in to your account</p>
                      </div>
                      
                      <form className="space-y-3" onSubmit={handleSubmit}>
                        {error && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                            {error}
                          </div>
                        )}
                        <div className="space-y-2">
                          <div>
                            <label htmlFor="login-username" className="block text-sm font-medium text-gray-700 mb-1">
                              Username
                            </label>
                            <input
                              id="login-username"
                              name="username"
                              type="text"
                              required
                              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="Enter username"
                              value={credentials.username}
                              onChange={handleChange}
                            />
                          </div>
                          <div>
                            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
                              Password
                            </label>
                            <input
                              id="login-password"
                              name="password"
                              type="password"
                              required
                              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="Enter password"
                              value={credentials.password}
                              onChange={handleChange}
                            />
                          </div>
                        </div>

                        <div>
                          <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? 'Signing in...' : 'Sign in'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>

              {/* Register Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowRegisterDropdown(!showRegisterDropdown);
                    setShowLoginDropdown(false);
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Account
                  <ChevronDown className="h-4 w-4 ml-2" />
                </button>

                {/* Register Dropdown Form */}
                {showRegisterDropdown && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="p-4">
                      <div className="text-center mb-3">
                        <div className="mx-auto h-8 w-8 flex items-center justify-center rounded-full bg-green-100">
                          <UserPlus className="h-4 w-4 text-green-600" />
                        </div>
                        <p className="mt-2 text-sm font-medium text-gray-900">Create Account</p>
                      </div>
                      
                      <form className="space-y-3" onSubmit={handleRegisterSubmit}>
                        {registerError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm whitespace-pre-line">
                            {registerError}
                          </div>
                        )}
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label htmlFor="reg-first-name" className="block text-sm font-medium text-gray-700 mb-1">
                                First Name
                              </label>
                              <input
                                id="reg-first-name"
                                name="first_name"
                                type="text"
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
                                placeholder="First Name"
                                value={registerData.first_name}
                                onChange={handleRegisterChange}
                              />
                            </div>
                            <div>
                              <label htmlFor="reg-last-name" className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name
                              </label>
                              <input
                                id="reg-last-name"
                                name="last_name"
                                type="text"
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
                                placeholder="Last Name"
                                value={registerData.last_name}
                                onChange={handleRegisterChange}
                              />
                            </div>
                          </div>
                          <div>
                            <label htmlFor="reg-username" className="block text-sm font-medium text-gray-700 mb-1">
                              Username
                            </label>
                            <input
                              id="reg-username"
                              name="username"
                              type="text"
                              required
                              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
                              placeholder="Username"
                              value={registerData.username}
                              onChange={handleRegisterChange}
                            />
                          </div>
                          <div>
                            <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
                              Email
                            </label>
                            <input
                              id="reg-email"
                              name="email"
                              type="email"
                              required
                              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
                              placeholder="Email address"
                              value={registerData.email}
                              onChange={handleRegisterChange}
                            />
                          </div>
                          <div>
                            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
                              Password
                            </label>
                            <input
                              id="reg-password"
                              name="password"
                              type="password"
                              required
                              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
                              placeholder="Password (min 8 characters)"
                              value={registerData.password}
                              onChange={handleRegisterChange}
                            />
                          </div>
                          <div>
                            <label htmlFor="reg-password-confirm" className="block text-sm font-medium text-gray-700 mb-1">
                              Confirm Password
                            </label>
                            <input
                              id="reg-password-confirm"
                              name="password_confirm"
                              type="password"
                              required
                              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
                              placeholder="Confirm password"
                              value={registerData.password_confirm}
                              onChange={handleRegisterChange}
                            />
                          </div>
                        </div>

                        <div>
                          <button
                            type="submit"
                            disabled={registerLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {registerLoading ? 'Creating account...' : 'Create Account'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right spacer for balance */}
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        {/* Market Data - Responsive Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          <TopPortfolios />
          <MarketMovers />
        </div>
      </div>
    </div>
  );
};

export default Login;