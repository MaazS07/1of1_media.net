import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiCalendar, FiTrash2 } from 'react-icons/fi';
import { BiRupee } from 'react-icons/bi';
import Navbar from '../components/Navbar';
// Import premium templates
import premiumTemplatesData from '../assets/premiumTemplates.json';

interface MarketPlace {
  id: string;
  name: string;
  nodes: any[];
  edges: any[];
  createdAt: string;
}

const MarketPlace = () => {
  const [templates, setTemplates] = useState<MarketPlace[]>([]);
  const [premiumTemplates] = useState<MarketPlace[]>(premiumTemplatesData);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Function to reload templates from localStorage
  const reloadTemplates = () => {
    const savedTemplates = localStorage.getItem('d2k-templates');
    console.log('Reloading templates from localStorage:', savedTemplates);
    
    if (savedTemplates) {
      try {
        const parsedTemplates = JSON.parse(savedTemplates);
        console.log('Reloaded templates:', parsedTemplates);
        parsedTemplates.sort((a: MarketPlace, b: MarketPlace) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setTemplates(parsedTemplates);
      } catch (e) {
        console.error("Error reloading templates:", e);
      }
    }
  };

  // Add Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // Load templates from localStorage on component mount
  useEffect(() => {
    setIsLoading(true);
    const savedTemplates = localStorage.getItem('d2k-templates');
    
    console.log('Loading templates from localStorage:', savedTemplates);
    
    if (savedTemplates) {
      try {
        const parsedTemplates = JSON.parse(savedTemplates);
        console.log('Parsed templates:', parsedTemplates);
        // Sort templates by creation date (newest first)
        parsedTemplates.sort((a: MarketPlace, b: MarketPlace) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setTemplates(parsedTemplates);
        console.log('Templates set in state:', parsedTemplates);
      } catch (e) {
        console.error("Error loading templates:", e);
      }
    } else {
      console.log('No saved templates found in localStorage');
    }
    setIsLoading(false);
  }, []);

  // Reload templates when window gains focus (helpful when templates are saved in other tabs)
  useEffect(() => {
    const handleFocus = () => {
      reloadTemplates();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Filter templates based on search query
  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPremiumTemplates = premiumTemplates.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle template deletion (only for saved templates)
  const handleDeleteTemplate = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this template?')) {
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      setTemplates(updatedTemplates);
      localStorage.setItem('d2k-templates', JSON.stringify(updatedTemplates));
    }
  };

  // Handle template selection to load in workspace
  const handleLoadTemplate = (template: MarketPlace) => {
    // Create a deep copy of the template
    const sanitizedTemplate = JSON.parse(JSON.stringify(template));
    
    // Process nodes to safely handle file values
    sanitizedTemplate.nodes = sanitizedTemplate.nodes.map((node: any) => {
      // If the node has inputs
      if (node.data?.inputs) {
        node.data.inputs = node.data.inputs.map((input: any) => {
          // Handle file inputs with values that are objects
          if (input.type === 'file' && typeof input.value === 'object') {
            // Store file metadata separately and set value to null to avoid React rendering issues
            return { 
              ...input, 
              value: null, 
              fileInfo: input.value // Preserve any file metadata like filename
            };
          }
          return input;
        });
      }
      return node;
    });
    
    // Store the sanitized template
    sessionStorage.setItem('template-to-load', JSON.stringify(sanitizedTemplate));
    console.log("Template to load ",sanitizedTemplate)
    navigate('/playground');
  };
  
  // Template card component to avoid repetition
  const TemplateCard = ({ template, isPremium = false }: { template: MarketPlace, isPremium?: boolean }) => {
    // Create a proper layout for template preview
    const getNodeLayout = () => {
      const nodes = template.nodes || [];
      const maxNodes = Math.min(nodes.length, 6); // Show max 6 nodes in preview
      const previewWidth = 320; // Card width - padding
      const previewHeight = 160; // Reduced height for better spacing
      
      // If only 1-2 nodes, center them
      if (maxNodes <= 2) {
        return nodes.slice(0, maxNodes).map((node, index) => ({
          ...node,
          x: previewWidth / 2 - 60 + (index * 40),
          y: previewHeight / 2 - 20,
          width: 80,
          height: 40
        }));
      }
      
      // For 3+ nodes, arrange in a flow layout
      const cols = Math.min(3, maxNodes);
      const rows = Math.ceil(maxNodes / cols);
      const nodeWidth = 80;
      const nodeHeight = 36;
      const spacingX = (previewWidth - (cols * nodeWidth)) / (cols + 1);
      const spacingY = (previewHeight - (rows * nodeHeight)) / (rows + 1);
      
      return nodes.slice(0, maxNodes).map((node, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        return {
          ...node,
          x: spacingX + col * (nodeWidth + spacingX),
          y: spacingY + row * (nodeHeight + spacingY),
          width: nodeWidth,
          height: nodeHeight
        };
      });
    };

    const layoutNodes = getNodeLayout();
    const hasMoreNodes = template.nodes.length > 6;

    return (
      <div
        key={template.id}
        onClick={() => handleLoadTemplate(template)}
        className="bg-zinc-900 rounded-xl shadow-xl overflow-hidden border border-gray-700 hover:border-pink-400 transition-all duration-300 cursor-pointer group relative"
        style={{
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 0 30px rgba(236, 72, 153, 0.4), 0 0 60px rgba(236, 72, 153, 0.2)';
          e.currentTarget.style.transform = 'translateY(-4px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '';
          e.currentTarget.style.transform = 'translateY(0px)';
        }}
      >
        {/* Template preview */}
        <div className="h-48 bg-gradient-to-br from-gray-700 to-gray-800 p-4 relative overflow-hidden">
          {/* Premium indicator */}
          {isPremium && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full p-2 shadow-lg z-20 border border-amber-300">
              <BiRupee className="text-gray-900 w-4 h-4" />
            </div>
          )}
          
          {/* Workflow preview */}
          <div className="relative w-full h-full">
            {layoutNodes.map((node, index) => (
              <div 
                key={node.id}
                className="absolute bg-gray-900 rounded-lg shadow-lg border border-gray-500 flex flex-col items-center justify-center text-xs font-medium text-white group-hover:bg-gray-800 group-hover:border-pink-300 transition-all duration-300 overflow-hidden"
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: `${node.width}px`,
                  height: `${node.height}px`,
                  zIndex: 10 + index
                }}
              >
                <div className="truncate px-2 text-center text-[10px] font-semibold">
                  {node.data?.label || 'Node'}
                </div>
                {node.type && (
                  <div className="text-[8px] text-gray-400 truncate px-1">
                    {node.type}
                  </div>
                )}
              </div>
            ))}
            
            {/* Connection lines between nodes */}
            {layoutNodes.length > 1 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
                {layoutNodes.slice(0, -1).map((node, index) => {
                  const nextNode = layoutNodes[index + 1];
                  if (!nextNode) return null;
                  
                  const startX = node.x + node.width / 2;
                  const startY = node.y + node.height / 2;
                  const endX = nextNode.x + nextNode.width / 2;
                  const endY = nextNode.y + nextNode.height / 2;
                  
                  return (
                    <line
                      key={`connection-${index}`}
                      x1={startX}
                      y1={startY}
                      x2={endX}
                      y2={endY}
                      stroke="#6b7280"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                      className="group-hover:stroke-pink-400 transition-colors duration-300"
                    />
                  );
                })}
              </svg>
            )}
            
            {/* More nodes indicator */}
            {hasMoreNodes && (
              <div className="absolute bottom-2 right-2 bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                +{template.nodes.length - 6}
              </div>
            )}
          </div>
        </div>
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-white truncate group-hover:text-pink-300 transition-colors duration-300 text-xl font-['Poppins']">
            {template.name}
          </h3>
          {!isPremium && (
            <button
              onClick={(e) => handleDeleteTemplate(template.id, e)}
              className="p-2 rounded-full text-gray-400 hover:text-pink-400 hover:bg-gray-700 transition-all duration-300"
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 15px rgba(236, 72, 153, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <FiTrash2 size={18} />
            </button>
          )}
        </div>
        <div className="mt-4 flex items-center text-sm text-gray-300 font-['Inter']">
          <FiCalendar size={16} className="mr-2 text-pink-400" />
          <span>
            Sep 27, 2025
          </span>
        </div>
        <div className="mt-4 text-sm text-gray-400 font-['Inter']">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-700 border border-gray-600 mr-3">
            {template.nodes.length} node{template.nodes.length !== 1 ? 's' : ''}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-700 border border-gray-600">
            {template.edges.length} connection{template.edges.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

  return (
    <div className="min-h-screen bg-gray-900 font-['Inter']">
      {/* Header */}
      <header className="bg-gray-800 shadow-xl border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <Navbar 
              currentPage="marketplace" 
              currentUser={null} 
              onLogout={() => {}} 
            />
            
            {/* Search bar */}
            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-12 pr-4 py-3 border border-gray-600 rounded-xl leading-5 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-300 font-['Inter']"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  transition: 'all 0.3s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(236, 72, 153, 0.3)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = '';
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div 
              className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-400"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(236, 72, 153, 0.5))'
              }}
            ></div>
          </div>
        ) : (
          <>
            {/* Your Saved Templates Section */}
            <div className="mb-16">
              <div className="flex items-center mb-6">
                <h2 className="text-2xl font-bold text-white font-['Poppins'] mr-4">Your Saved Templates</h2>
                <button
                  onClick={reloadTemplates}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 mr-4 flex items-center gap-1"
                  title="Refresh templates"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
                <div className="h-px bg-gradient-to-r from-pink-400 to-transparent flex-1"></div>
              </div>
              
              {/* Template count */}
              <div className="mb-8">
                <p className="text-gray-300 font-['Inter'] text-lg">
                  {filteredTemplates.length} <span className="text-pink-400 font-semibold">{filteredTemplates.length === 1 ? 'Template' : 'Templates'}</span>
                  {searchQuery && (
                    <>
                      {' '}matching <span className="text-pink-300 font-medium">"{searchQuery}"</span>
                    </>
                  )}
                </p>
              </div>

              {/* Templates grid - Changed to 3 columns */}
              {filteredTemplates.length === 0 ? (
                <div className="bg-gray-800 shadow-xl rounded-2xl p-12 text-center border border-gray-700">
                  <p className="text-gray-300 text-xl mb-6 font-['Poppins']">
                    {searchQuery
                      ? `No saved templates found matching "${searchQuery}"`
                      : "No templates saved yet. Create your first template in the Playground!"}
                  </p>
                  <button
                    onClick={() => navigate('/playground')}
                    className="px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl hover:from-pink-600 hover:to-pink-700 transition-all duration-300 font-semibold font-['Poppins'] transform hover:scale-105"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 30px rgba(236, 72, 153, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    Go to Playground
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredTemplates.map(template => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>
              )}
            </div>

            {/* Premium Templates Section */}
            <div>
              <div className="flex items-center mb-6">
                <h2 className="text-2xl font-bold text-white font-['Poppins'] mr-4 flex items-center">
                  <span>Premium Templates</span>
                  <span className="ml-4 inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-amber-400 to-yellow-400 text-gray-900 font-['Poppins']">
                    <BiRupee className="mr-1" />
                    Premium
                  </span>
                </h2>
                <div className="h-px bg-gradient-to-r from-amber-400 to-transparent flex-1"></div>
              </div>
              
              {/* Template count */}
              <div className="mb-8">
                <p className="text-gray-300 font-['Inter'] text-lg">
                  {filteredPremiumTemplates.length} <span className="text-amber-400 font-semibold">{filteredPremiumTemplates.length === 1 ? 'Template' : 'Templates'}</span>
                  {searchQuery && (
                    <>
                      {' '}matching <span className="text-amber-300 font-medium">"{searchQuery}"</span>
                    </>
                  )}
                </p>
              </div>

              {/* Templates grid - Changed to 3 columns */}
              {filteredPremiumTemplates.length === 0 ? (
                <div className="bg-gray-800 shadow-xl rounded-2xl p-8 text-center border border-gray-700">
                  <p className="text-gray-300 font-['Poppins'] text-lg">
                    No premium templates found matching <span className="text-amber-300 font-medium">"{searchQuery}"</span>
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredPremiumTemplates.map(template => (
                    <TemplateCard key={template.id} template={template} isPremium={true} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default MarketPlace;