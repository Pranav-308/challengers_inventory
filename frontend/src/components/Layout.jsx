import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, LayoutDashboard, ListChecks, User, LogOut, Users, Clock } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/components', icon: Package, label: 'Components' },
    { to: '/requests', icon: Clock, label: 'Requests' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  // Add 'My Items' only for members (not admin)
  if (user?.role !== 'admin') {
    navItems.splice(3, 0, { to: '/my-items', icon: ListChecks, label: 'My Items' });
  }

  // Add Team Management for admins only
  if (user?.role === 'admin') {
    navItems.push({ to: '/users', icon: Users, label: 'Team' });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 via-blue-900 to-primary-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.jpg" 
                alt="Challengers Logo" 
                className="h-10 w-10 object-cover rounded-full border-2 border-white/20 hover:scale-110 transition-transform duration-200"
              />
              <div>
                <h1 className="text-xl font-bold text-white">
                  Challengers Tracker
                </h1>
                <p className="text-xs text-blue-300">Component Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-blue-300 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 hover:shadow-lg"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 py-4 px-3 border-b-2 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'border-primary-600 text-primary-600 bg-primary-50'
                      : 'border-transparent text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
