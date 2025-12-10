import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getComponent,
  checkoutComponent,
  returnComponent,
  getComponentHistory,
  requestComponent,
  uploadComponentImage,
} from '../services/api';
import { ArrowLeft, Calendar, User, Clock, History, Upload, Image as ImageIcon } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const ComponentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [component, setComponent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [requestDays, setRequestDays] = useState(7);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  useEffect(() => {
    console.log('ComponentDetail - User:', user);
    console.log('ComponentDetail - User role:', user?.role);
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const compResponse = await getComponent(id);
      setComponent(compResponse.data);
      
      // Try to load history, but don't fail if it errors
      try {
        const histResponse = await getComponentHistory(id);
        setHistory(histResponse.data);
      } catch (histError) {
        console.log('History not available for this component');
        setHistory([]);
      }
    } catch (error) {
      console.error('Error loading component:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!window.confirm('Checkout this component?')) return;

    setActionLoading(true);
    try {
      await checkoutComponent(id, notes);
      setNotes('');
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to checkout component');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!window.confirm('Return this component?')) return;

    setActionLoading(true);
    try {
      await returnComponent(id, notes);
      setNotes('');
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to return component');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequest = async () => {
    if (!window.confirm(`Request this component for ${requestDays} days?`)) return;

    setActionLoading(true);
    try {
      await requestComponent({
        componentId: id,
        notes,
        requestedDays: requestDays,
      });
      setNotes('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to request component');
    } finally {
      setActionLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setUploadMessage('Please select an image file');
      setTimeout(() => setUploadMessage(''), 3000);
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadMessage('Image must be less than 5MB');
      setTimeout(() => setUploadMessage(''), 3000);
      return;
    }

    setUploading(true);
    setUploadMessage('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      await uploadComponentImage(id, formData);
      setUploadMessage('Image uploaded successfully!');
      setTimeout(() => setUploadMessage(''), 3000);
      loadData(); // Reload to show new image
    } catch (error) {
      setUploadMessage(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!component) {
    return null;
  }

  // Only members can checkout/return components
  const isMember = user && user.role === 'member';
  const isAdmin = user && user.role === 'admin';
  
  const canCheckout = isMember && component.status === 'available';
  const canReturn = isMember &&
    (component.status === 'taken' || component.status === 'overdue') &&
    (component.currentBorrower === user.id || component.currentBorrower === user._id);

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

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      taken: 'bg-red-100 text-red-800',
      overdue: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || '';
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/components')}
        className="btn btn-secondary flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Components
      </button>

      {/* Component Details */}
      <div className="card">
        {/* Component Image */}
        {component.imageUrl && (
          <div className="mb-6 rounded-lg overflow-hidden bg-gray-100">
            <img 
              src={`http://localhost:5000${component.imageUrl}`} 
              alt={component.name}
              className="w-full h-64 object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Upload Image (Admin Only) */}
        {isAdmin && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
            <label className="flex items-center justify-center gap-3 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
              <div className="flex items-center gap-3">
                {uploading ? (
                  <>
                    <Clock className="w-5 h-5 text-blue-600 animate-spin" />
                    <span className="text-blue-700 font-medium">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-700 font-medium">
                      {component.imageUrl ? 'Change Component Image' : 'Upload Component Image'}
                    </span>
                  </>
                )}
              </div>
            </label>
            {uploadMessage && (
              <p className={`text-sm text-center mt-2 ${
                uploadMessage.includes('success') ? 'text-green-600' : 'text-red-600'
              }`}>
                {uploadMessage}
              </p>
            )}
            <p className="text-xs text-gray-500 text-center mt-2">
              Maximum file size: 5MB • Accepted: JPG, PNG, GIF
            </p>
          </div>
        )}

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {component.name}
            </h1>
            <p className="text-lg text-gray-600 mt-1">{component.componentId}</p>
          </div>
          <span className={`badge text-lg ${getStatusColor(component.status)}`}>
            {component.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Category</p>
            <p className="text-lg font-medium text-gray-900">
              {component.category}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Checkout Duration</p>
            <p className="text-lg font-medium text-gray-900">
              {component.checkoutDuration} days
            </p>
          </div>

          {component.currentBorrower && (
            <>
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Borrower</p>
                <p className="text-lg font-medium text-gray-900">
                  {component.currentBorrowerDetails?.name || 'Unknown'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Checked Out</p>
                <p className="text-lg font-medium text-gray-900">
                  {safeDate(component.checkedOutAt) ? format(safeDate(component.checkedOutAt), 'MMM dd, yyyy') : 'Date unavailable'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Due Date</p>
                <p className="text-lg font-medium text-gray-900">
                  {safeDate(component.dueDate) ? (
                    <>
                      {format(safeDate(component.dueDate), 'MMM dd, yyyy')}
                      {' ('}
                      {formatDistanceToNow(safeDate(component.dueDate), {
                        addSuffix: true,
                      })}
                      {')'}
                    </>
                  ) : (
                    'Date unavailable'
                  )}
                </p>
              </div>
            </>
          )}
        </div>

        {component.description && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">Description</p>
            <p className="text-gray-900">{component.description}</p>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            ✅ Request submitted! Admin will review and approve your request.
          </div>
        )}

        {/* Actions */}
        <div className="space-y-4">
          {(canCheckout || canReturn) && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input"
                  rows="3"
                  placeholder="Add any notes about this request..."
                />
              </div>

              {canCheckout && isMember && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Request Duration (days)
                  </label>
                  <input
                    type="number"
                    value={requestDays}
                    onChange={(e) => setRequestDays(parseInt(e.target.value) || 7)}
                    className="input w-32"
                    min="1"
                    max="30"
                  />
                </div>
              )}

              <div className="flex gap-3">
                {console.log('Rendering buttons - canCheckout:', canCheckout, 'user.role:', user?.role)}
                {canCheckout && isAdmin && (
                  <button
                    onClick={handleCheckout}
                    disabled={actionLoading}
                    className="btn btn-primary"
                  >
                    {actionLoading ? 'Processing...' : 'Checkout Component (Admin)'}
                  </button>
                )}

                {canCheckout && isMember && (
                  <button
                    onClick={handleRequest}
                    disabled={actionLoading}
                    className="btn btn-primary"
                  >
                    {actionLoading ? 'Submitting...' : 'Request Component'}
                  </button>
                )}

                {canReturn && (
                  <button
                    onClick={handleReturn}
                    disabled={actionLoading}
                    className="btn btn-danger"
                  >
                    {actionLoading ? 'Processing...' : 'Return Component'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* History */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <History className="w-6 h-6" />
          History
        </h2>

        {history.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No history available</p>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => (
              <div
                key={entry._id}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div
                  className={`w-3 h-3 rounded-full mt-1 ${
                    entry.action === 'checkout' ? 'bg-red-500' : 'bg-green-500'
                  }`}
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {entry.userId?.name}{' '}
                    <span className="text-gray-600">
                      {entry.action === 'checkout' ? 'checked out' : 'returned'}
                    </span>{' '}
                    this component
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(entry.timestamp), 'MMM dd, yyyy HH:mm')}
                    {' • '}
                    {formatDistanceToNow(new Date(entry.timestamp), {
                      addSuffix: true,
                    })}
                  </p>
                  {entry.notes && (
                    <p className="text-sm text-gray-600 mt-1">
                      Note: {entry.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentDetail;
