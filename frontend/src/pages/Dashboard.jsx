import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Package, CheckCircle, XCircle, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const safeDate = (value) => {
    if (!value) return null;
    const date = value?.toDate ? value.toDate() : new Date(value);
    return isNaN(date) ? null : date;
  };

  const statCards = [
    {
      title: 'Total Components',
      value: stats?.stats.total || 0,
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      title: 'Available',
      value: stats?.stats.available || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Taken',
      value: stats?.stats.taken || 0,
      icon: XCircle,
      color: 'bg-red-500',
    },
    {
      title: 'Overdue',
      value: stats?.stats.overdue || 0,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
    },
  ];

  // Add pending requests for admins
  if (user?.role === 'admin') {
    statCards.push({
      title: 'Pending Requests',
      value: stats?.stats.pendingRequests || 0,
      icon: Clock,
      color: 'bg-purple-500',
      onClick: () => navigate('/requests'),
      clickable: stats?.stats.pendingRequests > 0,
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's an overview of the component inventory
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div 
            key={index} 
            className={`card bg-gradient-to-br from-white to-gray-50 ${stat.clickable ? 'cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-200' : 'hover:shadow-lg transition-shadow'}`}
            onClick={stat.onClick}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{stat.title}</p>
                <p className="text-4xl font-bold text-gray-900 mt-3">{stat.value}</p>
                {stat.clickable && (
                  <p className="text-xs text-primary-600 mt-2 font-semibold">View Details →</p>
                )}
              </div>
              <div className={`${stat.color} p-4 rounded-xl shadow-lg`}>
                <stat.icon className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Due Soon Components */}
      {stats?.dueSoonComponents.length > 0 && (
        <div className="card bg-gradient-to-br from-yellow-50 to-white border-l-4 border-yellow-500">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            Components Due Soon (Next 48 Hours)
          </h2>
          <div className="space-y-3">
            {stats.dueSoonComponents.map((component) => {
              const dueDate = safeDate(component.dueDate);
              const borrowerName = component.currentBorrowerDetails?.name || component.currentBorrower?.name || 'Unknown';
              
              return (
                <div
                  key={component.id || component._id}
                  className="flex items-center justify-between p-4 bg-white border border-yellow-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{component.name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      📦 {component.componentId} • 👤 {borrowerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-yellow-800">
                      {dueDate ? `Due ${formatDistanceToNow(dueDate, { addSuffix: true })}` : 'Due date pending'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          Recent Checkout Activity
        </h2>
        <div className="space-y-3">
          {stats?.recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          ) : (
            stats?.recentActivity.map((activity) => {
              const timestamp = safeDate(activity.timestamp);
              const userName = activity.userDetails?.name || activity.userId?.name || 'Unknown User';
              const componentName = activity.componentDetails?.name || activity.componentId?.name || 'Unknown Component';
              
              return (
                <div
                  key={activity.id || activity._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        activity.action === 'checkout' ? 'bg-red-500' : 'bg-green-500'
                      }`}
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        <span className="text-primary-600">{userName}</span>{' '}
                        <span className="text-gray-600">
                          {activity.action === 'checkout' ? 'checked out' : 'returned'}
                        </span>{' '}
                        <span className="font-semibold">{componentName}</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        {timestamp
                          ? formatDistanceToNow(timestamp, { addSuffix: true })
                          : 'Recently'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Top Borrowers (Admin Only) */}
      {user?.role === 'admin' && stats?.topBorrowers.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Borrowers</h2>
          <div className="space-y-3">
            {stats.topBorrowers.map((borrower, index) => (
              <div
                key={borrower.user._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <p className="font-medium text-gray-900">{borrower.user.name}</p>
                </div>
                <p className="text-gray-600">
                  {borrower.checkoutCount} checkout{borrower.checkoutCount !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
