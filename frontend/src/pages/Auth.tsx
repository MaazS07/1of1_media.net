import { useState } from 'react';
import { User, Lock, Mail, Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      setLoading(false);
      return;
    }

    // Basic validation
    if (!formData.username || !formData.password) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (!isLogin && !formData.email) {
      setError('Email is required for registration');
      setLoading(false);
      return;
    }

    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const payload = isLogin 
      ? { username: formData.username, password: formData.password }
      : { username: formData.username, email: formData.email, password: formData.password };

    try {
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (response.ok) {
        if (isLogin) {
          // Store the JWT token from login response
          localStorage.setItem('authToken', data.access_token);
          localStorage.setItem('tokenType', data.token_type);
          
          // Show success message
          alert('Login successful!');
        } else {
          // Registration successful, store user info
          localStorage.setItem('user', JSON.stringify(data));
          
          // Show success message
          alert('Registration successful! Please login.');
          setIsLogin(true); // Switch to login mode
        }
        
        // Redirect to home page after login
        if (isLogin) {
          window.location.href = '/';
        }
        
      } else {
        setError(data.detail || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
        }
        
        .brand-font {
          font-family: 'Space Grotesk', sans-serif;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .glass-effect {
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .gradient-border {
          background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
          padding: 1px;
          border-radius: 16px;
        }
        
        .gradient-border-inner {
          background: #0f172a;
          border-radius: 15px;
        }
      `}</style>
      
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900 to-black"></div>
        
        {/* Geometric Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large triangle */}
          <div 
            className="absolute -top-32 -right-32 w-96 h-96 opacity-10"
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              transform: 'rotate(15deg)'
            }}
          ></div>
          
          {/* Rectangle */}
          <div 
            className="absolute top-1/4 -left-24 w-48 h-96 opacity-5"
            style={{
              background: 'linear-gradient(45deg, #f093fb, #f5576c)',
              transform: 'rotate(-15deg)'
            }}
          ></div>
          
          {/* Diamond */}
          <div 
            className="absolute bottom-1/4 right-1/4 w-32 h-32 opacity-10"
            style={{
              background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
              transform: 'rotate(45deg)'
            }}
          ></div>
          
          {/* Hexagon */}
          <div 
            className="absolute top-3/4 left-1/3 w-24 h-24 opacity-8"
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
          ></div>
        </div>

        {/* Main Container */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-6xl">
            <div className="gradient-border">
              <div className="gradient-border-inner">
                <div className="glass-effect rounded-2xl">
                  <div className="flex flex-col lg:flex-row min-h-[700px]">
                    
                    {/* Left Side - Auth Form */}
                    <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center bg-zinc-950">
                      {/* Logo */}
                      <div className="flex items-center mb-12">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                          <span className="text-white font-bold text-2xl brand-font">TL</span>
                        </div>
                        <span className="text-white text-3xl font-bold brand-font tracking-tight font-['Space_Grotesk'] italic">
                          Thread<span className="gradient-text">Loom</span>
                        </span>
                      </div>
                      

                      {/* Navigation */}
                      <div className="flex space-x-12 mb-12">
                        <button
                          onClick={() => {
                            setIsLogin(true);
                            setError('');
                          }}
                          className={`pb-3 text-lg font-semibold border-b-2 transition-all duration-300 ${
                            isLogin 
                              ? 'border-blue-500 text-white shadow-sm' 
                              : 'border-transparent text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          LOGIN
                        </button>
                        <button
                          onClick={() => {
                            setIsLogin(false);
                            setError('');
                          }}
                          className={`pb-3 text-lg font-semibold border-b-2 transition-all duration-300 ${
                            !isLogin 
                              ? 'border-blue-500 text-white shadow-sm' 
                              : 'border-transparent text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          REGISTER
                        </button>
                      </div>

                      {/* Error Message */}
                      {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                          {error}
                        </div>
                      )}

                      {/* Form */}
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username Field */}
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                          <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={formData.username}
                            onChange={handleInputChange}
                            disabled={loading}
                            className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 disabled:opacity-50"
                            required
                          />
                        </div>

                        {/* Email Field (Register only) */}
                        {!isLogin && (
                          <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                            <input
                              type="email"
                              name="email"
                              placeholder="Email Address"
                              value={formData.email}
                              onChange={handleInputChange}
                              disabled={loading}
                              className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 disabled:opacity-50"
                              required
                            />
                          </div>
                        )}

                        {/* Password Field */}
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleInputChange}
                            disabled={loading}
                            className="w-full pl-12 pr-12 py-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 disabled:opacity-50"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={loading}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>

                        {/* Confirm Password Field (Register only) */}
                        {!isLogin && (
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                            <input
                              type="password"
                              name="confirmPassword"
                              placeholder="Confirm Password"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              disabled={loading}
                              className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 disabled:opacity-50"
                              required
                            />
                          </div>
                        )}

                        {/* Remember Me & Forgot Password */}
                        {isLogin && (
                          <div className="flex items-center justify-between">
                            <label className="flex items-center text-gray-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                disabled={loading}
                                className="w-4 h-4 mr-3 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
                              />
                              Remember me
                            </label>
                            <button 
                              type="button" 
                              disabled={loading}
                              className="text-gray-400 hover:text-blue-400 transition-colors text-sm disabled:opacity-50"
                            >
                              Forgot password?
                            </button>
                          </div>
                        )}

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 transform hover:scale-[1.02] transition-all duration-300 shadow-xl hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {loading ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              {isLogin ? 'LOGGING IN...' : 'CREATING ACCOUNT...'}
                            </div>
                          ) : (
                            isLogin ? 'LOGIN' : 'CREATE ACCOUNT'
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Right Side - Welcome Section */}
                    <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center items-center relative bg-gradient-to-br bg-zinc-900">
                      {/* Main Content */}
                      <div className="text-center z-10 max-w-md">
                        <h1 className="text-6xl lg:text-7xl font-bold text-white mb-8 brand-font leading-tight">
                          Welcome<span className="text-blue-400">.</span>
                        </h1>
                        
                        <p className="text-gray-300 text-xl mb-10 leading-relaxed font-light">
                          Join ThreadLoom and weave your digital presence into something extraordinary. 
                          Connect, create, and collaborate like never before.
                        </p>

                        <div className="flex items-center justify-center space-x-3 text-gray-400">
                          <span>{isLogin ? 'New to ThreadLoom?' : 'Already have an account?'}</span>
                          <button
                            onClick={() => {
                              setIsLogin(!isLogin);
                              setError('');
                            }}
                            disabled={loading}
                            className="text-blue-400 hover:text-blue-300 font-semibold transition-colors disabled:opacity-50"
                          >
                            {isLogin ? 'Sign up' : 'Sign in'}
                          </button>
                        </div>
                      </div>

                      {/* Decorative geometric accent */}
                      <div className="absolute top-1/4 right-8 w-2 h-24 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full opacity-60"></div>
                      <div className="absolute bottom-1/4 left-8 w-2 h-32 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full opacity-40"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
