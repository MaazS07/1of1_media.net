import React, { useState } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

interface SidebarProps {
  onAddNode: (nodeType: string) => void;
}

// Import the nodeTemplates directly
import { nodeTemplates } from '../../pages/Playground';

const Sidebar: React.FC<SidebarProps> = ({ onAddNode }) => {
  const [collapsed, setCollapsed] = useState(false);

  const handleDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a ghost drag image
    const dragGhost = document.createElement('div');
    dragGhost.innerHTML = nodeType;
    dragGhost.style.position = 'absolute';
    dragGhost.style.top = '-1000px';
    document.body.appendChild(dragGhost);
    e.dataTransfer.setDragImage(dragGhost, 0, 0);
    
    // Remove ghost element after drag starts
    setTimeout(() => {
      document.body.removeChild(dragGhost);
    }, 0);
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <>
      {/* Hide scrollbar globally */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .no-scrollbar {
          -ms-overflow-style: none;  /* Internet Explorer 10+ */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>

      <div className="relative h-full bg-zinc-950 shadow-xl border-r border-white font-['Inter']">
        <div className={`h-full bg-gray-900 select-none transition-all duration-300 ${collapsed ? 'w-0' : 'w-96'}`}>
          {/* Toggle button - positioned in the middle of the sidebar's right edge */}
          <button 
            onClick={toggleSidebar}
            className="absolute top-1/2 -translate-y-1/2 -right-6 z-10 w-12 h-12 rounded-full bg-gray-800 shadow-xl flex items-center justify-center border border-gray-700 hover:bg-gray-700 hover:border-pink-400 hover:shadow-pink-400/25 hover:shadow-lg transition-all duration-300"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? 
              <HiChevronRight className="text-white hover:text-pink-400 transition-colors duration-300" size={24} /> : 
              <HiChevronLeft className="text-white hover:text-pink-400 transition-colors duration-300" size={24} />
            }
          </button>
          
          <div className={`h-full overflow-y-auto no-scrollbar ${collapsed ? 'hidden' : 'block'}`}>
            <div className="p-5">
              <h2 className="text-xl font-bold mb-6 text-white tracking-tight">Components</h2>
              
              <div className="space-y-3">
                {Object.entries(nodeTemplates).map(([nodeType, nodeConfig]) => {
                  const IconComponent = nodeConfig.icon;
                  return (
                    <div
                      key={nodeType}
                      draggable
                      onDragStart={(e) => handleDragStart(e, nodeType)}
                      onClick={() => onAddNode(nodeType)}
                      className="flex items-center p-2 bg-gray-800/50 rounded-lg cursor-move hover:bg-gray-800 hover:border-pink-400 hover:shadow-lg hover:shadow-pink-400/25 transition-all duration-300 border border-gray-700 select-none group"
                      style={{
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(236, 72, 153, 0.5), 0 0 40px rgba(236, 72, 153, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '';
                      }}
                    >
                      <span className="text-xl mr-4 p-2 bg-gray-700 rounded-md border border-gray-600 group-hover:text-white group-hover:border-pink-400 group-hover:bg-gray-600 transition-all duration-300 text-white">
                        <IconComponent />
                      </span>
                      <span className="text-gray-300 font-medium capitalize tracking-wide group-hover:text-white transition-colors duration-300">
                        {nodeType.replace(/-/g, ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
