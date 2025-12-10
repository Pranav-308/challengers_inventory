import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getComponents } from '../services/api';
import { Search, Filter, Package } from 'lucide-react';

const ComponentList = () => {
  const [components, setComponents] = useState([]);
  const [filteredComponents, setFilteredComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    loadComponents();
  }, []);

  useEffect(() => {
    filterComponents();
  }, [searchTerm, statusFilter, categoryFilter, components]);

  const loadComponents = async () => {
    try {
      const response = await getComponents();
      console.log('Components loaded:', response.data);
      setComponents(response.data);
      setFilteredComponents(response.data);
    } catch (error) {
      console.error('Error loading components:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterComponents = () => {
    let filtered = [...components];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.componentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((c) => c.category === categoryFilter);
    }

    setFilteredComponents(filtered);
  };

  const getStatusBadge = (status) => {
    const badges = {
      available: 'badge-available',
      taken: 'badge-taken',
      overdue: 'badge-overdue',
    };
    return badges[status] || '';
  };

  const categories = ['all', ...new Set(components.map((c) => c.category))];

  if (loading) {
    return <div className="text-center py-8">Loading components...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">All Components</h1>
        <p className="text-gray-600 mt-2">
          Browse and manage component inventory
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="taken">Taken</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredComponents.length} of {components.length} components
      </div>

      {/* Components Grid */}
      {filteredComponents.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No components found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComponents.map((component) => (
            <Link
              key={component.id || component._id}
              to={`/components/${component.id || component._id}`}
              className="card hover:shadow-lg transition-shadow duration-200 overflow-hidden"
            >
              {/* Component Image */}
              {component.imageUrl && (
                <div className="w-full h-48 bg-gray-100 mb-4 -mt-6 -mx-6 overflow-hidden">
                  <img 
                    src={`http://localhost:5000${component.imageUrl}`} 
                    alt={component.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    {component.name}
                  </h3>
                  <p className="text-sm text-gray-500">{component.componentId}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`badge ${getStatusBadge(component.status)}`}>
                    {component.status}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {component.availableQuantity || 0}/{component.totalQuantity || 1} available
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {component.description || 'No description available'}
              </p>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Category:</span>
                <span className="font-medium text-gray-700">
                  {component.category}
                </span>
              </div>

              {component.totalQuantity > 1 && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <Package className="w-3 h-3" />
                  <span>Stock: {component.totalQuantity} units</span>
                </div>
              )}

              {component.currentBorrowerDetails && (
                <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
                  <span className="text-gray-500">Borrowed by: </span>
                  <span className="font-medium text-gray-900">
                    {component.currentBorrowerDetails.name}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComponentList;
