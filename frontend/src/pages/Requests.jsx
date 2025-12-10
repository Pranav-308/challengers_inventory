import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import { Clock, CheckCircle, XCircle, Package, User, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const Requests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.getRequests({ status: filter !== 'all' ? filter : undefined });
      setRequests(response.data);
    } catch (err) {
      setError('Failed to load requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Approve this request and checkout the component?')) return;

    try {
      await api.approveRequest(requestId);
      setSuccess('Request approved and component checked out!');
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return; // User cancelled

    try {
      await api.rejectRequest(requestId, reason);
      setSuccess('Request rejected');
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request');
    }
  };

  const handleCancel = async (requestId) => {
    if (!window.confirm('Cancel this request?')) return;

    try {
      await api.cancelRequest(requestId);
      setSuccess('Request cancelled');
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel request');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';
    const date = value?.toDate ? value.toDate() : new Date(value);
    if (isNaN(date)) return 'N/A';
    return format(date, 'MMM dd, yyyy HH:mm');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-7 h-7" />
          Component Requests
        </h1>
        <p className="text-gray-600 mt-1">
          {user?.role === 'admin' 
            ? 'Manage component requests from team members'
            : 'View your component requests'}
        </p>
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

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {['pending', 'approved', 'rejected', 'all'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              filter === tab
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="card">
        {loading ? (
          <p className="text-center py-8 text-gray-500">Loading requests...</p>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No {filter !== 'all' ? filter : ''} requests found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-primary-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {request.component?.name || 'Unknown Component'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        ID: {request.component?.componentId || 'N/A'}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Requested by: <strong>{request.user?.name || 'Unknown'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Duration: <strong>{request.requestedDays || 7} days</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Requested: {formatDate(request.requestedAt)}</span>
                  </div>
                  {request.respondedAt && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Responded: {formatDate(request.respondedAt)}</span>
                    </div>
                  )}
                </div>

                {request.notes && (
                  <div className="bg-gray-50 rounded p-3 mb-3">
                    <p className="text-sm text-gray-700">
                      <strong>Notes:</strong> {request.notes}
                    </p>
                  </div>
                )}

                {request.rejectionReason && (
                  <div className="bg-red-50 rounded p-3 mb-3">
                    <p className="text-sm text-red-700">
                      <strong>Rejection Reason:</strong> {request.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Approval Status */}
                {request.status !== 'pending' && (
                  <div className="bg-blue-50 rounded p-3 mb-3 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          {request.status === 'approved' ? '✅ APPROVED' : '❌ REJECTED'}
                        </p>
                        {request.respondedBy && (
                          <p className="text-xs text-blue-700 mt-1">
                            By: {request.respondedByUser?.name || request.respondedByUser?.username || request.respondedBy}
                          </p>
                        )}
                        {request.respondedAt && (
                          <p className="text-xs text-blue-700">
                            On: {formatDate(request.respondedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Component Status */}
                {request.component && (
                  <div className="mb-3">
                    <span className="text-sm text-gray-600">Component Status: </span>
                    <span className={`text-sm font-medium ${
                      request.component.status === 'available' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {request.component.status.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Actions */}
                {request.status === 'pending' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                    {user?.role === 'admin' ? (
                      <>
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="btn btn-sm bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                          disabled={request.component?.status !== 'available'}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve & Checkout
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="btn btn-sm bg-red-600 hover:bg-red-700 text-white flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleCancel(request.id)}
                        className="btn btn-sm btn-secondary flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel Request
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Requests;
