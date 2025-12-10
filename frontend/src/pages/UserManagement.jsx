import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import { Users, UserPlus, Trash2, Shield, User, Search, X, Edit2, Save } from 'lucide-react';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getAllUsers();
      setUsers(response.data);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.sendInvite(newUser);
      setSuccess(`✅ Invitation sent to ${newUser.email}! They'll receive a code to register.`);
      setNewUser({
        name: '',
        email: '',
      });
      setShowAddForm(false);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (userId === currentUser._id) {
      setError("You can't delete your own account!");
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      await api.deleteUser(userId);
      setSuccess(`User "${username}" deleted successfully`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    if (userId === currentUser._id) {
      setError("You can't change your own role!");
      return;
    }

    try {
      await api.updateUserRole(userId, newRole);
      setSuccess('User role updated successfully');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (currentUser?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700">Access Denied</h2>
        <p className="text-gray-500 mt-2">Only admins can access user management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7" />
            Team Management
          </h1>
          <p className="text-gray-600 mt-1">Manage Challengers team members and their access</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary flex items-center gap-2"
        >
          {showAddForm ? <X className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          {showAddForm ? 'Cancel' : 'Add Team Member'}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button onClick={() => setError('')} className="float-right">×</button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
          <button onClick={() => setSuccess('')} className="float-right">×</button>
        </div>
      )}

      {/* Add User Form */}
      {showAddForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Add New Team Member</h2>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="input"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="input"
                placeholder="john@example.com"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                An invitation email with a registration code will be sent to this address
              </p>
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="btn btn-primary">
                <UserPlus className="w-4 h-4 mr-2 inline" />
                Send Invitation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by name, username, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Users List */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">
          Team Members ({filteredUsers.length})
        </h2>
        
        {loading ? (
          <p className="text-center py-4 text-gray-500">Loading team members...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-center py-4 text-gray-500">No team members found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Username</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {user.role === 'admin' ? (
                          <Shield className="w-4 h-4 text-primary-600" />
                        ) : (
                          <User className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="font-medium">{user.name}</span>
                        {user.id === currentUser._id && (
                          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">You</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{user.username}</td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4 text-gray-600">{user.phone || '-'}</td>
                    <td className="py-3 px-4">
                      {user.id === currentUser._id ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                          className="text-xs border rounded px-2 py-1"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {user.id !== currentUser._id && (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">👥 About Team Roles</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li><strong>Admin:</strong> Can manage team members, add/edit components, and view all checkouts</li>
          <li><strong>Member:</strong> Can checkout/return components and view their own history</li>
        </ul>
      </div>
    </div>
  );
};

export default UserManagement;
