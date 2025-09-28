import React, { useState, useEffect } from 'react';
import { FiPlus, FiPlay, FiTrash2, FiCode, FiTool, FiX, FiSettings } from 'react-icons/fi';
import { BsRobot } from 'react-icons/bs';

interface CustomTool {
  name: string;
  description: string;
  mode: string;
  parameters: any;
  python?: {
    file_path: string;
    entry_point: string;
  };
  isActive: boolean;
}

interface CustomToolsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomToolsSidebar: React.FC<CustomToolsSidebarProps> = ({ isOpen, onClose }) => {
  const [tools, setTools] = useState<CustomTool[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [serviceStatus, setServiceStatus] = useState<'unknown' | 'available' | 'unavailable'>('unknown');
  
  // Form states
  const [toolName, setToolName] = useState('');
  const [toolDescription, setToolDescription] = useState('');
  const [toolPrompt, setToolPrompt] = useState('');
  const [toolProvider, setToolProvider] = useState<'gemini' | 'groq'>('gemini');
  
  // Execution states
  const [selectedTool, setSelectedTool] = useState<CustomTool | null>(null);
  const [toolArguments, setToolArguments] = useState<{ [key: string]: string }>({});
  const [detectedParams, setDetectedParams] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchTools();
    }
  }, [isOpen]);

  // Function to extract parameters from tool file
  const analyzeToolParameters = async (toolName: string): Promise<string[]> => {
    try {
      const response = await fetch(`http://localhost:8000/tools/${toolName}/analyze`);
      if (response.ok) {
        const data = await response.json();
        return data.parameters || [];
      }
    } catch (error) {
      console.error('Failed to analyze tool parameters:', error);
    }
    
    // Fallback: try to guess from common patterns
    return guessParametersFromToolName(toolName);
  };

  const guessParametersFromToolName = (toolName: string): string[] => {
    const lowerName = toolName.toLowerCase();
    
    // Common parameter patterns
    if (lowerName.includes('add') || lowerName.includes('sum')) {
      return ['num1', 'num2'];
    }
    if (lowerName.includes('multiply')) {
      return ['num1', 'num2'];
    }
    if (lowerName.includes('divide')) {
      return ['dividend', 'divisor'];
    }
    if (lowerName.includes('image') || lowerName.includes('generate')) {
      return ['prompt', 'width', 'height'];
    }
    if (lowerName.includes('text') || lowerName.includes('translate')) {
      return ['text', 'language'];
    }
    if (lowerName.includes('email')) {
      return ['to', 'subject', 'message'];
    }
    if (lowerName.includes('search')) {
      return ['query', 'limit'];
    }
    
    // Default parameters
    return ['input', 'options'];
  };

  const getPlaceholderForParam = (param: string): string => {
    const lowerParam = param.toLowerCase();
    
    if (lowerParam.includes('num') || lowerParam.includes('number')) {
      return 'Enter a number (e.g., 42)';
    }
    if (lowerParam.includes('prompt') || lowerParam.includes('description')) {
      return 'Enter your prompt here...';
    }
    if (lowerParam.includes('text') || lowerParam.includes('message')) {
      return 'Enter text content...';
    }
    if (lowerParam.includes('url') || lowerParam.includes('link')) {
      return 'https://example.com';
    }
    if (lowerParam.includes('email')) {
      return 'user@example.com';
    }
    if (lowerParam.includes('width') || lowerParam.includes('height')) {
      return '512';
    }
    if (lowerParam.includes('language')) {
      return 'English';
    }
    if (lowerParam.includes('query') || lowerParam.includes('search')) {
      return 'Search term...';
    }
    if (lowerParam.includes('limit') || lowerParam.includes('count')) {
      return '10';
    }
    
    return `Enter ${param}...`;
  };

  const fetchTools = async () => {
    try {
      const response = await fetch('http://localhost:8000/tools');
      if (response.ok) {
        const data = await response.json();
        setTools(data.tools || []);
        setServiceStatus('available');
      } else {
        setServiceStatus('unavailable');
      }
    } catch (error) {
      console.error('Failed to fetch tools:', error);
      setServiceStatus('unavailable');
      setTools([]); // Clear tools on error
    }
  };

  const handleCreateTool = async () => {
    if (!toolName.trim() || !toolPrompt.trim()) {
      alert('Please fill in tool name and prompt');
      return;
    }

    setIsCreating(true);
    try {
      const endpoint = toolProvider === 'gemini' 
        ? 'http://localhost:8000/tools/generate'
        : 'http://localhost:8000/tools/generate-groq';
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: toolName,
          description: toolDescription,
          prompt: toolPrompt,
          model: toolProvider === 'gemini' ? 'gemini-pro' : 'openai/gpt-oss-120b',
          temperature: 0.2
        })
      });

      const result = await response.json();
      
      if (result.ok || result.file_path) {  // Handle both success formats
        // Reset form
        setToolName('');
        setToolDescription('');
        setToolPrompt('');
        // Refresh tools list
        await fetchTools();
        alert('Tool created successfully!');
      } else {
        alert(`Failed to create tool: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating tool:', error);
      alert('Failed to create tool');
    } finally {
      setIsCreating(false);
    }
  };

  const handleExecuteTool = async (tool: CustomTool) => {
    setIsExecuting(tool.name);
    try {
      // Build args from individual fields
      const args: { [key: string]: any } = {};
      detectedParams.forEach(param => {
        const value = toolArguments[param];
        if (value !== undefined && value !== '') {
          // Try to parse as number if it looks like a number
          if (!isNaN(Number(value)) && value.trim() !== '') {
            args[param] = Number(value);
          } else {
            args[param] = value;
          }
        }
      });

      const response = await fetch(`http://localhost:8000/tools/${tool.name}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tool.name, args })
      });

      const result = await response.json();
      
      if (result.ok || result.result !== undefined) {  // Handle both success formats
        setExecutionResult({
          success: true,
          message: 'Tool executed successfully!',
          data: result.result
        });
      } else {
        setExecutionResult({
          success: false,
          message: result.error || 'Tool execution failed'
        });
      }
    } catch (error) {
      console.error('Error executing tool:', error);
      setExecutionResult({
        success: false,
        message: 'Failed to execute tool'
      });
    } finally {
      setIsExecuting(null);
    }
  };

  const handleDeleteTool = async (toolName: string) => {
    if (!confirm(`Are you sure you want to delete "${toolName}"?`)) return;
    
    try {
      const response = await fetch(`http://localhost:8000/tools/${toolName}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchTools();
        alert('Tool deleted successfully!');
      } else {
        alert('Failed to delete tool');
      }
    } catch (error) {
      console.error('Error deleting tool:', error);
      alert('Failed to delete tool');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-black border-l border-pink-500/30 shadow-2xl z-50 overflow-hidden"
           style={{
             boxShadow: '-10px 0 50px rgba(236, 72, 153, 0.3), -5px 0 30px rgba(236, 72, 153, 0.1)'
           }}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-pink-500/20 bg-black relative overflow-hidden">
            {/* Pink glow background */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-500/5 to-transparent"></div>
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="relative">
                <FiTool className="text-pink-400 text-xl" 
                       style={{
                         filter: 'drop-shadow(0 0 8px rgba(236, 72, 153, 0.8))'
                       }} />
                <div className="absolute inset-0 bg-pink-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-['Poppins']"
                    style={{
                      textShadow: '0 0 20px rgba(236, 72, 153, 0.5)'
                    }}>Custom Tools</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${
                    serviceStatus === 'available' ? 'bg-green-400' : 
                    serviceStatus === 'unavailable' ? 'bg-yellow-400' : 'bg-gray-400'
                  }`}
                        style={{
                          boxShadow: serviceStatus === 'available' ? 
                            '0 0 8px rgba(34, 197, 94, 0.8)' : 
                            serviceStatus === 'unavailable' ? 
                            '0 0 8px rgba(251, 191, 36, 0.8)' : 
                            '0 0 8px rgba(107, 114, 128, 0.8)'
                        }} />
                  <span className="text-xs text-gray-300">
                    {serviceStatus === 'available' ? 'Service Available' : 
                     serviceStatus === 'unavailable' ? 'Using Fallback' : 'Checking...'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-300 hover:text-pink-400 hover:bg-pink-500/20 rounded-lg transition-all duration-300 relative z-10 group"
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(236, 72, 153, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <FiX size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-black">
            {/* Create Tool Section */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-4 border border-pink-500/20 relative overflow-hidden"
                 style={{
                   boxShadow: '0 0 30px rgba(236, 72, 153, 0.1), inset 0 1px 0 rgba(236, 72, 153, 0.1)'
                 }}>
              {/* Subtle pink glow background */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-purple-500/5 opacity-50"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent"></div>
              
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <div className="relative">
                  <FiPlus className="text-green-400" 
                          style={{
                            filter: 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.6))'
                          }} />
                  <div className="absolute inset-0 bg-green-400 rounded-full blur-lg opacity-20 animate-pulse"></div>
                </div>
                <h3 className="text-lg font-semibold text-white font-['Poppins']"
                    style={{
                      textShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
                    }}>Create Tool</h3>
              </div>
              
              {serviceStatus === 'unavailable' && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                  <p className="text-yellow-400 text-sm">
                    <strong>Info:</strong> Using local fallback mode. Tools will be generated and stored locally.
                  </p>
                </div>
              )}
              
              <div className="space-y-4 relative z-10">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2 font-['Inter']">Tool Name</label>
                  <input
                    type="text"
                    value={toolName}
                    onChange={(e) => setToolName(e.target.value)}
                    placeholder="e.g., image_generator"
                    className="w-full p-3 bg-black/80 border border-pink-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-300 font-['Inter']"
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(236, 72, 153, 0.3), inset 0 1px 0 rgba(236, 72, 153, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = '';
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2 font-['Inter']">Description (Optional)</label>
                  <input
                    type="text"
                    value={toolDescription}
                    onChange={(e) => setToolDescription(e.target.value)}
                    placeholder="Brief description of the tool"
                    className="w-full p-3 bg-black/80 border border-pink-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-300 font-['Inter']"
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(236, 72, 153, 0.3), inset 0 1px 0 rgba(236, 72, 153, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = '';
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2 font-['Inter']">AI Provider</label>
                  <select
                    value={toolProvider}
                    onChange={(e) => setToolProvider(e.target.value as 'gemini' | 'groq')}
                    className="w-full p-3 bg-black/80 border border-pink-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-300 font-['Inter']"
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(236, 72, 153, 0.3), inset 0 1px 0 rgba(236, 72, 153, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="groq">Groq (Llama)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2 font-['Inter']">Tool Prompt</label>
                  <textarea
                    value={toolPrompt}
                    onChange={(e) => setToolPrompt(e.target.value)}
                    placeholder="Describe what this tool should do. Be specific about inputs and outputs.

Example: Create a tool that takes a text description and generates an image URL using Pollinations API. The function should accept 'prompt' as input and return the image URL."
                    rows={6}
                    className="w-full p-3 bg-black/80 border border-pink-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 resize-none transition-all duration-300 font-['Inter']"
                    onFocus={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(236, 72, 153, 0.3), inset 0 1px 0 rgba(236, 72, 153, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = '';
                    }}
                  />
                </div>

                <button
                  onClick={handleCreateTool}
                  disabled={isCreating}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold font-['Poppins'] transform hover:scale-[1.02] relative overflow-hidden group"
                  onMouseEnter={(e) => {
                    if (!isCreating) {
                      e.currentTarget.style.boxShadow = '0 0 30px rgba(236, 72, 153, 0.6), 0 0 60px rgba(236, 72, 153, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <BsRobot size={16} className="group-hover:animate-bounce" />
                      Generate Tool
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Tools List Section */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-4 border border-pink-500/20 relative overflow-hidden"
                 style={{
                   boxShadow: '0 0 30px rgba(236, 72, 153, 0.1), inset 0 1px 0 rgba(236, 72, 153, 0.1)'
                 }}>
              {/* Subtle pink glow background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-50"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent"></div>
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <FiCode className="text-blue-400" 
                            style={{
                              filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.6))'
                            }} />
                    <div className="absolute inset-0 bg-blue-400 rounded-full blur-lg opacity-20 animate-pulse"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-white font-['Poppins']"
                      style={{
                        textShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
                      }}>Your Tools</h3>
                </div>
                <span className="text-sm text-gray-300 bg-pink-500/10 px-2 py-1 rounded-full border border-pink-500/20">
                  {tools.length} tools
                </span>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto relative z-10">
                {tools.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <div className="relative inline-block">
                      <FiTool size={32} className="mx-auto mb-2 opacity-50" 
                              style={{
                                filter: 'drop-shadow(0 0 10px rgba(236, 72, 153, 0.3))'
                              }} />
                      <div className="absolute inset-0 bg-pink-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
                    </div>
                    <p className="text-gray-300 font-medium">No custom tools yet</p>
                    <p className="text-sm text-gray-500">Create your first tool above</p>
                  </div>
                ) : (
                  tools.map((tool) => (
                    <div key={tool.name} 
                         className="bg-black/60 backdrop-blur-sm rounded-lg p-4 border border-pink-500/20 hover:border-pink-500/40 transition-all duration-300 relative overflow-hidden group"
                         style={{
                           boxShadow: '0 2px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(236, 72, 153, 0.1)'
                         }}
                         onMouseEnter={(e) => {
                           e.currentTarget.style.boxShadow = '0 4px 30px rgba(236, 72, 153, 0.2), inset 0 1px 0 rgba(236, 72, 153, 0.2)';
                         }}
                         onMouseLeave={(e) => {
                           e.currentTarget.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(236, 72, 153, 0.1)';
                         }}>
                      {/* Subtle glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="flex items-start justify-between mb-3 relative z-10">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-white">{tool.name}</h4>
                            <FiTool className="text-gray-400" size={14} />
                          </div>
                          {tool.description && (
                            <p className="text-sm text-gray-400 mb-2 line-clamp-2">{tool.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`px-2 py-1 rounded-full ${tool.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                              {tool.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-gray-500">{tool.mode}</span>
                            {tool.python?.file_path && (
                              <span className="text-blue-400">Python</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 ml-3">
                          <button
                            onClick={async () => {
                              setSelectedTool(tool);
                              // Try to analyze parameters from the actual file
                              const params = await analyzeToolParameters(tool.name);
                              setDetectedParams(params);
                              const initialArgs: { [key: string]: string } = {};
                              params.forEach(param => {
                                initialArgs[param] = '';
                              });
                              setToolArguments(initialArgs);
                            }}
                            className="p-2 text-green-400 hover:bg-green-400/20 rounded-lg transition-colors group"
                            title="Execute Tool"
                          >
                            <FiPlay size={16} className="group-hover:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={() => handleDeleteTool(tool.name)}
                            className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors group"
                            title="Delete Tool"
                          >
                            <FiTrash2 size={16} className="group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tool Execution Modal */}
      {selectedTool && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Execute Tool</h3>
                  <p className="text-gray-400 mt-1">{selectedTool.name}</p>
                  {selectedTool.description && (
                    <p className="text-sm text-gray-500 mt-1">{selectedTool.description}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedTool(null);
                    setDetectedParams([]);
                    setToolArguments({});
                  }}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {detectedParams.length > 0 ? (
                <>
                  <div className="text-sm text-gray-400 mb-3">
                    Fill in the required parameters:
                  </div>
                  {detectedParams.map((param) => (
                    <div key={param}>
                      <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                        {param.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                        {['num1', 'num2', 'input', 'prompt', 'query', 'text'].includes(param.toLowerCase()) && 
                          <span className="text-red-400 ml-1">*</span>
                        }
                      </label>
                      <input
                        type="text"
                        value={toolArguments[param] || ''}
                        onChange={(e) => setToolArguments(prev => ({
                          ...prev,
                          [param]: e.target.value
                        }))}
                        placeholder={getPlaceholderForParam(param)}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 font-mono text-sm"
                      />
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <FiSettings className="mx-auto mb-2" size={24} />
                  <p>No parameters detected</p>
                  <p className="text-sm">This tool may not require inputs</p>
                </div>
              )}
              
              <div className="flex gap-2 pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    setSelectedTool(null);
                    setDetectedParams([]);
                    setToolArguments({});
                  }}
                  className="flex-1 p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleExecuteTool(selectedTool)}
                  disabled={isExecuting === selectedTool.name}
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors disabled:opacity-50"
                >
                  {isExecuting === selectedTool.name ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <FiPlay size={16} />
                      Execute
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Execution Result Modal */}
      {executionResult && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-70 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${executionResult.success ? 'text-green-400' : 'text-red-400'}`}>
                  Execution {executionResult.success ? 'Success' : 'Failed'}
                </h3>
                <button
                  onClick={() => setExecutionResult(null)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-96">
              <p className="text-gray-300 mb-4">{executionResult.message}</p>
              {executionResult.data && (
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-white font-medium mb-2">Result:</h4>
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                    {typeof executionResult.data === 'string' 
                      ? executionResult.data 
                      : JSON.stringify(executionResult.data, null, 2)
                    }
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomToolsSidebar;
