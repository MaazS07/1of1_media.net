import React from 'react';
import { User } from 'lucide-react';

interface UserInfo {
  id: string;
  username: string;
  email: string;
}

interface NavbarProps {
  currentUser: UserInfo | null;
  currentPage: 'playground' | 'marketplace' | 'api' | 'prompt';
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentUser, currentPage, onLogout }) => {
  const navItems = [
    { key: 'playground', label: 'Playground', href: '/playground' },
    { key: 'prompt', label: 'AI Playground', href: '/prompt' },
    { key: 'marketplace', label: 'Marketplace', href: '/marketplace' },
    { key: 'keys', label: 'Key Management', href: '/api' }
  ];

  return (
    <nav className="border-b border-gray-800">
      <div className="container mx-auto px-6 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              {/* <div className="relative p-2 bg-gray-900 rounded-lg border border-pink-500/20 group-hover:border-pink-500/40 transition-all duration-300">
                <Key className="text-pink-500" size={20} />
              </div> */}
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                item.key === currentPage ? (
                  <div 
                    key={item.key}
                    className="px-4 py-2 text-pink-400 bg-pink-500/10 border border-pink-500/30 rounded-lg"
                  >
                    {item.key === 'api' ? 'Key Management' : item.label}
                  </div>
                ) : (
                  <a
                    key={item.key}
                    href={item.href}
                    className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-300"
                  >
                    {item.label}
                  </a>
                )
              ))}
            </div>
          </div>
          
          {/* User Info & Actions */}
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
              onClick={onLogout}
              className="px-4 py-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-gray-700 hover:border-red-500/30 transition-all duration-300"
            >
              Logout
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className="md:hidden mt-4 pt-4 border-t border-gray-800">
          <div className="flex gap-1">
            {navItems.map((item) => (
              item.key === currentPage ? (
                <div 
                  key={item.key}
                  className="flex-1 px-3 py-2 text-center text-pink-400 bg-pink-500/10 border border-pink-500/30 rounded-lg text-xs"
                >
                  {item.key === 'api' ? 'Keys' : 
                   item.key === 'prompt' ? 'AI' : 
                   item.label}
                </div>
              ) : (
                <a
                  key={item.key}
                  href={item.href}
                  className="flex-1 px-3 py-2 text-center text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-300 text-xs"
                >
                  {item.key === 'prompt' ? 'AI' : item.label}
                </a>
              )
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
