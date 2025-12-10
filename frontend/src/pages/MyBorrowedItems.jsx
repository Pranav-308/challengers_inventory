import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserBorrowedItems } from '../services/api';
import { Package, Calendar, AlertTriangle } from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';

const MyBorrowedItems = () => {
  const { user } = useAuth();
  const [borrowedItems, setBorrowedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBorrowedItems();
  }, []);

  const loadBorrowedItems = async () => {
    try {
      const response = await getUserBorrowedItems(user.id || user._id);
      setBorrowedItems(response.data);
    } catch (error) {
      console.error('Error loading borrowed items:', error);
    } finally {
      setLoading(false);
    }
  };

  const safeDate = (value) => {
    if (!value) return null;
    if (value?.toDate) return value.toDate();
    if (typeof value === 'object' && (value._seconds || value.seconds)) {
      const seconds = value._seconds ?? value.seconds;
      const nanos = value._nanoseconds ?? value.nanoseconds ?? 0;
      return new Date(seconds * 1000 + nanos / 1e6);
    }
    const date = new Date(value);
    return isNaN(date) ? null : date;
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const isOverdue = (dueDate) => {
    const date = safeDate(dueDate);
    if (!date) return false;
    return isPast(date);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Borrowed Items</h1>
        <p className="text-gray-600 mt-2">
          Components currently checked out by you
        </p>
      </div>

      {borrowedItems.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No borrowed items</p>
          <p className="text-gray-400 mt-2">
            You haven't checked out any components yet
          </p>
          <Link to="/components" className="btn btn-primary mt-4 inline-block">
            Browse Components
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {borrowedItems.map((component) => {
            const overdue = isOverdue(component.dueDate);
            const checkedOutAt = safeDate(component.checkedOutAt);
            const dueDate = safeDate(component.dueDate);
            return (
              <Link
                key={component.id || component._id}
                to={`/components/${component.id || component._id}`}
                className={`card hover:shadow-lg transition-shadow duration-200 ${
                  overdue ? 'border-2 border-yellow-400' : ''
                }`}
              >
                {overdue && (
                  <div className="flex items-center gap-2 text-yellow-700 bg-yellow-100 px-3 py-2 rounded-lg mb-4">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Overdue!</span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">
                      {component.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {component.componentId}
                    </p>
                  </div>
                  <span
                    className={`badge ${
                      overdue ? 'badge-overdue' : 'badge-taken'
                    }`}
                  >
                    {component.status}
                  </span>
                </div>

                <p className="text-gray-600 mb-4">
                  {component.description || 'No description available'}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Checked Out
                    </span>
                    <span className="font-medium text-gray-900">
                      {checkedOutAt ? format(checkedOutAt, 'MMM dd, yyyy') : '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Due Date
                    </span>
                    <span
                      className={`font-medium ${
                        overdue ? 'text-red-600' : 'text-gray-900'
                      }`}
                    >
                      {dueDate ? format(dueDate, 'MMM dd, yyyy') : '—'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <span
                      className={`text-xs ${
                        overdue ? 'text-red-600 font-medium' : 'text-gray-500'
                      }`}
                    >
                      {dueDate
                        ? formatDistanceToNow(dueDate, { addSuffix: true })
                        : 'Due date unavailable'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBorrowedItems;
