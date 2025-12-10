import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateNotificationPreferences, getUserBorrowedItems, getUserHistory } from '../services/api';
import { User, Mail, Phone, Bell, Shield, Calendar, Package, Activity, Camera, LogOut } from 'lucide-react';
import { format } from 'date-fns';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const [emailNotif, setEmailNotif] = useState(user?.notificationPreferences?.email ?? true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({ borrowed: 0, totalCheckouts: 0 });
  const [profileInitial, setProfileInitial] = useState('');

  useEffect(() => {
    loadUserStats();
    // Get first letter of name for profile picture
    if (user?.name) {
      setProfileInitial(user.name.charAt(0).toUpperCase());
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      const [borrowedRes, historyRes] = await Promise.all([
        getUserBorrowedItems(user._id),
        getUserHistory(user._id),
      ]);
      setStats({
        borrowed: borrowedRes.data.length,
        totalCheckouts: historyRes.data.filter(h => h.action === 'checkout').length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handlePreferenceChange = async (type, value) => {
    setSaving(true);
    setMessage('');

    try {
      // Update local state
      setEmailNotif(value);

      // Update server
      await updateNotificationPreferences(user._id, {
        email: value,
      });

      // Update user in context
      const updatedUser = {
        ...user,
        notificationPreferences: {
          email: value,
        },
      };
      updateUser(updatedUser);

      setMessage('Preference updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to update preference');
      // Revert local state on error
      setEmailNotif(!value);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with Profile Picture */}
      <div className="card">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Profile Picture */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-5xl font-bold shadow-lg">
              {profileInitial}
            </div>
            <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition">
              <Camera className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-900">{user?.name}</h1>
            <p className="text-gray-600 mt-1">@{user?.username}</p>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
              <Shield className={`w-5 h-5 ${user?.role === 'admin' ? 'text-purple-600' : 'text-blue-600'}`} />
              <span className={`inline-block px-3 py-1 ${
                user?.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              } text-sm font-medium rounded-full capitalize`}>
                {user?.role}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Package className="w-4 h-4" />
                  <span className="text-sm">Currently Borrowed</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.borrowed}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm">Total Checkouts</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCheckouts}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Account Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Contact Information
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Email Address</p>
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Phone Number</p>
                <p className="font-medium text-gray-900">{user?.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Account Details
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Username</p>
                <p className="font-medium text-gray-900">{user?.username}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Role & Permissions</p>
                <p className="font-medium text-gray-900 capitalize">{user?.role}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {user?.role === 'admin' 
                    ? 'Full access to manage components and approve requests'
                    : 'Can request and borrow components'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Preferences
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-600">Receive updates via email</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotif}
                onChange={(e) => handlePreferenceChange('email', e.target.checked)}
                className="sr-only peer"
                disabled={saving}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {message && (
            <div className={`p-3 rounded-lg ${
              message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Logout */}
      <div className="card">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
