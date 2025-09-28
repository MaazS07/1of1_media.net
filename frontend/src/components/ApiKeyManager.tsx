import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy,
  HelpCircle,
  X,
  CheckCircle,
  ExternalLink,
  User
} from 'lucide-react';

// Updated interfaces to match backend schema
interface ApiKey {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
  created_at: string;
}

interface EmailConfig {
  receiver_email: string;
  sender_email: string;
  sender_name: string;
  sender_passkey: string;
}

interface UserInfo {
  id: string;
  username: string;
  email: string;
}

interface ApiGuide {
  type: string;
  title: string;
  steps: string[];
  url: string;
}

const API_GUIDES: ApiGuide[] = [
  {
    type: 'TWILIO_ACCOUNT_SID',
    title: 'Twilio Account SID',
    steps: [
      'Go to twilio.com and sign up for a free account',
      'Complete the verification process with your phone number',
      'Navigate to the Twilio Console dashboard',
      'Find "Account Info" section on the right side',
      'Copy your Account SID (starts with "AC")',
      'Keep this secure - it identifies your Twilio account'
    ],
    url: 'https://console.twilio.com/'
  },
  {
    type: 'TWILIO_AUTH_TOKEN',
    title: 'Twilio Auth Token',
    steps: [
      'Login to your Twilio Console',
      'Navigate to the dashboard',
      'In the "Account Info" section, find Auth Token',
      'Click "Show" to reveal the token',
      'Copy the Auth Token',
      'Never share this token - it provides full access to your account'
    ],
    url: 'https://console.twilio.com/'
  },
  {
    type: 'GROQ_API_KEY',
    title: 'Groq API Key',
    steps: [
      'Visit console.groq.com and create an account',
      'Complete email verification',
      'Go to the API Keys section',
      'Click "Create API Key"',
      'Give your key a descriptive name',
      'Copy the generated key (starts with "gsk_")',
      'Store securely - you won\'t be able to see it again'
    ],
    url: 'https://console.groq.com/keys'
  },
  {
    type: 'GOOGLE_API_KEY',
    title: 'Google Cloud API Key',
    steps: [
      'Go to Google Cloud Console (console.cloud.google.com)',
      'Create a new project or select existing one',
      'Enable the required APIs (Maps, Translate, etc.)',
      'Navigate to "Credentials" in the left menu',
      'Click "Create Credentials" → "API Key"',
      'Copy the generated API key',
      'Restrict the key for security (optional but recommended)'
    ],
    url: 'https://console.cloud.google.com/apis/credentials'
  },
  {
    type: 'ZOOM_ACCOUNT_ID',
    title: 'Zoom Account ID',
    steps: [
      'Go to marketplace.zoom.us and sign in',
      'Click "Develop" → "Build App"',
      'Choose "Server-to-Server OAuth" app type',
      'Fill in app information and create',
      'In app settings, find "Account ID"',
      'Copy the Account ID',
      'This identifies your Zoom account for API access'
    ],
    url: 'https://marketplace.zoom.us/'
  },
  {
    type: 'ZOOM_CLIENT_ID',
    title: 'Zoom Client ID',
    steps: [
      'In your Zoom app settings (marketplace.zoom.us)',
      'Navigate to "App Credentials" tab',
      'Find "Client ID" and copy it',
      'This is used along with Client Secret for authentication',
      'Add required scopes for your app functionality',
      'Keep this secure for your app authentication'
    ],
    url: 'https://marketplace.zoom.us/'
  },
  {
    type: 'ZOOM_CLIENT_SECRET',
    title: 'Zoom Client Secret',
    steps: [
      'In your Zoom app settings (marketplace.zoom.us)',
      'Navigate to "App Credentials" tab',
      'Find "Client Secret" and copy it',
      'This is used along with Client ID for authentication',
      'Never share this secret - it provides full access to your app',
      'Store securely and rotate regularly'
    ],
    url: 'https://marketplace.zoom.us/'
  },
  {
    type: 'EMAIL_CONFIG',
    title: 'Email Configuration',
    steps: [
      'For Gmail: Go to Google Account settings',
      'Enable 2-Factor Authentication',
      'Go to "App Passwords" section',
      'Generate app password for "Mail"',
      'Use your Gmail address as sender_email',
      'Use the app password as sender_passkey',
      'Set your display name as sender_name'
    ],
    url: 'https://myaccount.google.com/apppasswords'
  }
];

// Configuration
const getApiBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_API_URL || 'http://localhost:8000';
  }
  

  
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

const ApiKeyManager: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showGuide, setShowGuide] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [keyValues, setKeyValues] = useState<Map<string, string>>(new Map()); // Store fetched key values
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  
  // Form states - Updated to match backend
  const [newKey, setNewKey] = useState({
    name: '',
    value: '', // Single value to match backend
    type: 'OPENAI_API_KEY'
  });
  
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    receiver_email: '',
    sender_email: '',
    sender_name: '',
    sender_passkey: ''
  });

  const [showEmailForm, setShowEmailForm] = useState(false);

  // API Helper functions
  const getAuthToken = () => localStorage.getItem('authToken');
  const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr) as UserInfo;
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
    return null;
  };

  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        }
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error(`Server returned HTML instead of JSON. Check if backend is running on ${API_BASE_URL}`);
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to server at ${API_BASE_URL}. Please ensure the backend server is running.`);
      }
      throw error;
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      window.location.href = '/auth';
      return;
    }
    
    const user = getCurrentUser();
    setCurrentUser(user);
    
    loadApiKeys();
    loadEmailConfig();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest('/api-keys');
      if (Array.isArray(data)) {
        // Backend returns array directly
        setApiKeys(data);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
      setError(`Failed to load API keys: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailConfig = async () => {
    try {
      const data = await apiRequest('/api/email-config');
      if (data.success) {
        setEmailConfig(data.emailConfig || {
          receiver_email: '',
          sender_email: '',
          sender_name: '',
          sender_passkey: ''
        });
      }
    } catch (error) {
      console.error('Error loading email config:', error);
    }
  };

  const addApiKey = async () => {
    if (!newKey.name.trim() || !newKey.value.trim()) {
      setError('Please fill in the name and key value');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiRequest('/api-keys', {
        method: 'POST',
        body: JSON.stringify({
          name: newKey.name.trim(),
          value: newKey.value.trim(),
          type: newKey.type
        })
      });
      
      if (data.id) {
        // Success - the backend returns the API key object with an id
        await loadApiKeys(); // Refresh the entire list to get updated data
        setNewKey({ name: '', value: '', type: 'OPENAI_API_KEY' });
        setShowAddForm(false);
      } else {
        throw new Error('Failed to add API key');
      }
    } catch (error) {
      console.error('Error adding API key:', error);
      setError(`Failed to add API key: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKey = async (id: number) => {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await apiRequest(`/api-keys/${id}`, {
        method: 'DELETE'
      });
      
      if (data.message) {
        // Backend returns success message
        setApiKeys(apiKeys.filter(key => key.id !== id));
      } else {
        throw new Error('Failed to delete API key');
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      setError(`Failed to delete API key: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };



  const saveEmailConfig = async () => {
    if (!emailConfig.receiver_email || !emailConfig.sender_email || 
        !emailConfig.sender_name || !emailConfig.sender_passkey) {
      setError('All email configuration fields are required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiRequest('/api/email-config', {
        method: 'POST',
        body: JSON.stringify(emailConfig)
      });
      
      if (data.success) {
        setShowEmailForm(false);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to save email configuration');
      }
    } catch (error) {
      console.error('Error saving email config:', error);
      setError(`Failed to save email configuration: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper function for managing single value in form
  const updateValue = (value: string) => {
    setNewKey({...newKey, value: value});
  };

  const fetchKeyValue = async (keyId: string) => {
    try {
      const data = await apiRequest(`/api-keys/${keyId}/value`);
      if (data.value) {
        setKeyValues(prev => new Map(prev).set(keyId, data.value));
        return data.value;
      }
    } catch (error) {
      console.error('Failed to fetch key value:', error);
      setError(`Failed to fetch key value: ${(error as Error).message}`);
    }
    return null;
  };

  const toggleKeyVisibility = async (id: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(id)) {
      newVisibleKeys.delete(id);
    } else {
      // Fetch the key value if we don't have it yet
      if (!keyValues.has(id)) {
        setLoading(true);
        await fetchKeyValue(id);
        setLoading(false);
      }
      newVisibleKeys.add(id);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(id);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return '*'.repeat(key.length);
    return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  const getGuideForType = (type: string) => {
    return API_GUIDES.find(guide => guide.type === type);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="border-b border-gray-800">
        <div className="container mx-auto px-6 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              </div>
              
              <div className="hidden md:flex items-center gap-1">
                <a href="/playground" className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-300">
                  Playground
                </a>
                <a href="/marketplace" className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-300">
                  Marketplace
                </a>
                <div className="px-4 py-2 text-pink-400 bg-pink-500/10 border border-pink-500/30 rounded-lg">
                  Key Management
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {currentUser && (
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full blur opacity-40"></div>
                    <div className="relative w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                      <User className="text-pink-400" size={16} />
                    </div>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{currentUser.username}</p>
                    <p className="text-gray-400 text-xs">{currentUser.email}</p>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-gray-700 hover:border-red-500/30 transition-all duration-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-7xl">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            <div className="flex justify-between items-start">
              <div><strong>Error:</strong> {error}</div>
              <button 
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
                <div className="relative p-4 bg-gray-900 rounded-xl border border-pink-500/20 group-hover:border-pink-500/50 transition-all duration-300">
                  <Key className="text-pink-500" size={28} />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-pink-200 bg-clip-text text-transparent">
                  Key Management
                </h1>
                <p className="text-gray-400 text-lg mt-1">
                  Welcome {currentUser?.username || 'User'} - Securely manage your API keys
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowEmailForm(true)}
                disabled={loading}
                className="group relative px-6 py-3 bg-gray-800 text-gray-300 rounded-xl border border-gray-700 hover:border-pink-500/50 transition-all duration-300 overflow-hidden disabled:opacity-50"
              >
                <span className="relative group-hover:text-white transition-colors duration-300">Email Config</span>
              </button>
              
              <button
                onClick={() => setShowAddForm(true)}
                disabled={loading}
                className="group relative px-6 py-3 bg-gradient-to-r from-pink-600 to-pink-700 rounded-xl text-white font-medium overflow-hidden transform hover:scale-105 transition-all duration-300 disabled:opacity-50"
              >
                <div className="relative flex items-center gap-2">
                  <Plus size={20} />
                  Add API Key
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
            <div className="relative bg-gray-900 p-6 rounded-2xl border border-gray-800 group-hover:border-pink-500/30 transition-all duration-300">
              <h3 className="text-pink-400 font-medium">Total Keys</h3>
              <p className="text-3xl font-bold text-white mt-1">{apiKeys.length}</p>
            </div>
          </div>
          
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
            <div className="relative bg-gray-900 p-6 rounded-2xl border border-gray-800 group-hover:border-pink-500/30 transition-all duration-300">
              <h3 className="text-pink-400 font-medium">Total Values</h3>
              <p className="text-3xl font-bold text-white mt-1">
                {apiKeys.length}
              </p>
            </div>
          </div>
          
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
            <div className="relative bg-gray-900 p-6 rounded-2xl border border-gray-800 group-hover:border-pink-500/30 transition-all duration-300">
              <h3 className="text-pink-400 font-medium">Email Configured</h3>
              <p className="text-3xl font-bold text-white mt-1">
                {emailConfig.sender_email ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
            <p className="text-gray-400 mt-2">Loading...</p>
          </div>
        )}

        {/* API Keys Grid */}
        {!loading && apiKeys.length === 0 ? (
          <div className="text-center py-16">
            <div className="relative group inline-block">
              <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full blur opacity-10 group-hover:opacity-20 transition duration-300"></div>
              <Key className="relative mx-auto text-gray-600 mb-6" size={64} />
            </div>
            <h2 className="text-2xl font-bold text-gray-400 mb-2">No API keys configured yet</h2>
            <p className="text-gray-500 text-lg">Add your first API key to get started with secure key management</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-15 transition duration-500"></div>
                <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-6 group-hover:border-pink-500/30 transition-all duration-500">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className="px-4 py-2 bg-pink-500/10 text-pink-300 rounded-xl text-sm font-medium border border-pink-400/30">
                        {apiKey.type.replace(/_/g, ' ')}
                      </span>
                      <h3 className="text-xl font-semibold text-white">
                        {apiKey.name}
                      </h3>
                      <button
                        onClick={() => setShowGuide(apiKey.type)}
                        className="p-2 text-gray-400 hover:text-pink-400 hover:bg-pink-500/10 rounded-lg transition-all duration-300"
                        title="How to get this API key"
                      >
                        <HelpCircle size={20} />
                      </button>
                      <span className="text-sm text-gray-400">
                        (1 key)
                      </span>
                    </div>
                    
                    <button
                      onClick={() => deleteApiKey(apiKey.id)}
                      disabled={loading}
                      className="p-3 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-xl transition-all duration-300 disabled:opacity-50"
                      title="Delete entire API key collection"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Display API key value */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <code className="flex-1 bg-black/50 px-4 py-3 rounded-xl text-gray-300 font-mono text-sm border border-gray-700">
                        {visibleKeys.has(apiKey.id.toString()) ? 
                          (keyValues.get(apiKey.id.toString()) || 'Loading...') : 
                          maskApiKey(keyValues.get(apiKey.id.toString()) || '••••••••••••••••••••••••••••••••')
                        }
                      </code>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleKeyVisibility(apiKey.id.toString())}
                          className="p-2 text-gray-400 hover:text-white hover:bg-pink-500/20 rounded-lg transition-all duration-300"
                          title={visibleKeys.has(apiKey.id.toString()) ? "Hide key" : "Show key"}
                        >
                          {visibleKeys.has(apiKey.id.toString()) ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(keyValues.get(apiKey.id.toString()) || 'No value available', apiKey.id.toString())}
                          className="p-2 text-gray-400 hover:text-pink-400 hover:bg-pink-500/20 rounded-lg transition-all duration-300"
                          title="Copy to clipboard"
                        >
                          {copiedKey === apiKey.id.toString() ? (
                            <CheckCircle className="text-green-400" size={16} />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => deleteApiKey(apiKey.id)}
                          disabled={loading}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-300 disabled:opacity-50"
                          title="Delete this API key"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-500 text-sm mt-4">
                    Added on {new Date(apiKey.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add API Key Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-pink-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-gray-900 rounded-3xl border border-pink-500/20 p-8 w-full max-w-2xl shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Add New API Key</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all duration-300"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-3">API Type</label>
                  <select
                    value={newKey.type}
                    onChange={(e) => setNewKey({...newKey, type: e.target.value as ApiKey['type']})}
                    disabled={loading}
                    className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-pink-400 focus:outline-none transition-all duration-300 disabled:opacity-50"
                  >
                    <option value="TWILIO_ACCOUNT_SID">Twilio Account SID</option>
                    <option value="TWILIO_AUTH_TOKEN">Twilio Auth Token</option>
                    <option value="GROQ_API_KEY">Groq API Key</option>
                    <option value="GOOGLE_API_KEY">Google API Key</option>
                    <option value="ZOOM_ACCOUNT_ID">Zoom Account ID</option>
                    <option value="ZOOM_CLIENT_ID">Zoom Client ID</option>
                    <option value="ZOOM_CLIENT_SECRET">Zoom Client Secret</option>
                    <option value="EMAIL_CONFIG">Email Configuration</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-3">Key Name</label>
                  <input
                    type="text"
                    value={newKey.name}
                    onChange={(e) => setNewKey({...newKey, name: e.target.value})}
                    placeholder="e.g., Production Gemini Keys"
                    disabled={loading}
                    className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-pink-400 focus:outline-none transition-all duration-300 disabled:opacity-50"
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-gray-300 text-sm font-medium">API Key Values</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowGuide(newKey.type)}
                        className="text-pink-400 hover:text-pink-300 text-sm flex items-center gap-1 transition-colors duration-300"
                      >
                        <HelpCircle size={16} />
                        How to get this?
                      </button>

                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <textarea
                          value={newKey.value}
                          onChange={(e) => updateValue(e.target.value)}
                          placeholder="Enter your API key..."
                          rows={3}
                          disabled={loading}
                          className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-pink-400 focus:outline-none transition-all duration-300 font-mono text-sm resize-none disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowAddForm(false)}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 hover:text-white transition-all duration-300 border border-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addApiKey}
                  disabled={!newKey.name.trim() || !newKey.value.trim() || loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-xl hover:from-pink-500 hover:to-pink-600 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {loading ? 'Adding...' : 'Add Keys'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Configuration Modal */}
      {showEmailForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-pink-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-gray-900 rounded-3xl border border-pink-500/20 p-8 w-full max-w-3xl shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Email Configuration</h2>
                <button
                  onClick={() => setShowEmailForm(false)}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all duration-300"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-3">Sender Email</label>
                  <input
                    type="email"
                    value={emailConfig.sender_email}
                    onChange={(e) => setEmailConfig({...emailConfig, sender_email: e.target.value})}
                    placeholder="your-email@gmail.com"
                    disabled={loading}
                    className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-pink-400 focus:outline-none transition-all duration-300 disabled:opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-3">Sender Name</label>
                  <input
                    type="text"
                    value={emailConfig.sender_name}
                    onChange={(e) => setEmailConfig({...emailConfig, sender_name: e.target.value})}
                    placeholder="Your Name"
                    disabled={loading}
                    className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-pink-400 focus:outline-none transition-all duration-300 disabled:opacity-50"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-gray-300 text-sm font-medium">App Password</label>
                    <button
                      onClick={() => setShowGuide('EMAIL_CONFIG')}
                      className="text-pink-400 hover:text-pink-300 text-sm flex items-center gap-1 transition-colors duration-300"
                    >
                      <HelpCircle size={16} />
                      How to get this?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={emailConfig.sender_passkey}
                    onChange={(e) => setEmailConfig({...emailConfig, sender_passkey: e.target.value})}
                    placeholder="App password (not your regular password)"
                    disabled={loading}
                    className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-pink-400 focus:outline-none transition-all duration-300 disabled:opacity-50"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-gray-300 text-sm font-medium mb-3">Receiver Email</label>
                  <input
                    type="email"
                    value={emailConfig.receiver_email}
                    onChange={(e) => setEmailConfig({...emailConfig, receiver_email: e.target.value})}
                    placeholder="recipient@example.com"
                    disabled={loading}
                    className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-pink-400 focus:outline-none transition-all duration-300 disabled:opacity-50"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowEmailForm(false)}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 hover:text-white transition-all duration-300 border border-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEmailConfig}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-xl hover:from-pink-500 hover:to-pink-600 transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Config'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-pink-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-gray-900 rounded-3xl border border-pink-500/20 p-8 w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-2xl">
              {(() => {
                if (!showGuide) return null;
                const guide = getGuideForType(showGuide);
                if (!guide) return null;
                
                return (
                  <>
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold text-white">How to get {guide.title}</h2>
                      <button
                        onClick={() => setShowGuide(null)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all duration-300"
                      >
                        <X size={24} />
                      </button>
                    </div>
                    
                    <div className="space-y-6 mb-8">
                      {guide.steps.map((step, index) => (
                        <div key={index} className="flex gap-4 group">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-pink-500/20 transition-all duration-300">
                            <span className="text-white font-semibold text-sm">{index + 1}</span>
                          </div>
                          <p className="text-gray-300 leading-relaxed text-lg pt-2 group-hover:text-white transition-colors duration-300">{step}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-4">
                      <button
                        onClick={() => setShowGuide(null)}
                        className="flex-1 px-6 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 hover:text-white transition-all duration-300 border border-gray-700"
                      >
                        Close
                      </button>
                      <a
                        href={guide.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-xl hover:from-pink-500 hover:to-pink-600 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <ExternalLink size={20} />
                        Open Platform
                      </a>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>  
      )}
    </div>
  );
};

export default ApiKeyManager;