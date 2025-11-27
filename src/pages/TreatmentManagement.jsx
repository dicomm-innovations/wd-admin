import { useState, useEffect } from 'react';
import { Flower2, Plus, Edit, Trash2, Copy, Filter, Star, TrendingUp, DollarSign, Clock, Sparkles, RefreshCw } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import StatCard from '../components/dashboard/StatCard';
import { useNotification } from '../contexts/NotificationContext';
import { treatmentManagementAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TreatmentManagement = () => {
  const [loading, setLoading] = useState(false);
  const [treatments, setTreatments] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const { success, error: showError, info } = useNotification();

  const [filters, setFilters] = useState({
    category: '',
    status: 'active',
    search: '',
    minPrice: '',
    maxPrice: '',
    page: 1,
    limit: 20
  });

  const [formData, setFormData] = useState({
    name: '',
    category: 'facial',
    description: '',
    shortDescription: '',
    pricing: {
      basePrice: '',
      memberPrice: '',
      currency: 'USD'
    },
    duration: 60,
    preparationTime: 5,
    cleanupTime: 10,
    status: 'active',
    experienceLevel: 'any',
    bookingSettings: {
      requiresConsultation: false,
      requiresIndemnity: false,
      minAdvanceBooking: 2,
      allowOnlineBooking: true
    },
    therapistCommission: {
      type: 'percentage',
      value: 30
    }
  });

  useEffect(() => {
    fetchTreatments();
    fetchStats();
    fetchCategories();
  }, []);

  const fetchTreatments = async () => {
    try {
      setLoading(true);
      const response = await treatmentManagementAPI.getAllTreatments(filters);
      if (response.success) {
        setTreatments(response.data.treatments || []);
      }
    } catch (err) {
      console.error('Failed to fetch treatments:', err);
      showError('Failed to load treatments');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await treatmentManagementAPI.getTreatmentStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await treatmentManagementAPI.getCategories();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleCreateTreatment = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await treatmentManagementAPI.createTreatment(formData);

      if (response.success) {
        success('Treatment created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchTreatments();
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to create treatment:', err);
      showError(err.error || 'Failed to create treatment');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTreatment = async (e) => {
    e.preventDefault();

    if (!selectedTreatment) return;

    try {
      setLoading(true);
      const response = await treatmentManagementAPI.updateTreatment(
        selectedTreatment._id,
        formData
      );

      if (response.success) {
        success('Treatment updated successfully!');
        setShowCreateModal(false);
        setSelectedTreatment(null);
        resetForm();
        fetchTreatments();
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to update treatment:', err);
      showError(err.error || 'Failed to update treatment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTreatment = async (treatmentId) => {
    if (!confirm('Are you sure you want to discontinue this treatment?')) return;

    try {
      setLoading(true);
      const response = await treatmentManagementAPI.deleteTreatment(treatmentId);

      if (response.success) {
        success('Treatment discontinued successfully');
        fetchTreatments();
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to delete treatment:', err);
      showError(err.error || 'Failed to discontinue treatment');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateTreatment = async (treatmentId) => {
    try {
      setLoading(true);
      const response = await treatmentManagementAPI.duplicateTreatment(treatmentId);

      if (response.success) {
        success('Treatment duplicated successfully!');
        fetchTreatments();
      }
    } catch (err) {
      console.error('Failed to duplicate treatment:', err);
      showError(err.error || 'Failed to duplicate treatment');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTreatment = (treatment) => {
    setSelectedTreatment(treatment);
    setFormData({
      name: treatment.name,
      category: treatment.category,
      description: treatment.description,
      shortDescription: treatment.shortDescription || '',
      pricing: treatment.pricing,
      duration: treatment.duration,
      preparationTime: treatment.preparationTime,
      cleanupTime: treatment.cleanupTime,
      status: treatment.status,
      experienceLevel: treatment.experienceLevel || 'any',
      bookingSettings: treatment.bookingSettings || {
        requiresConsultation: false,
        requiresIndemnity: false,
        minAdvanceBooking: 2,
        allowOnlineBooking: true
      },
      therapistCommission: treatment.therapistCommission || {
        type: 'percentage',
        value: 30
      }
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'facial',
      description: '',
      shortDescription: '',
      pricing: {
        basePrice: '',
        memberPrice: '',
        currency: 'USD'
      },
      duration: 60,
      preparationTime: 5,
      cleanupTime: 10,
      status: 'active',
      experienceLevel: 'any',
      bookingSettings: {
        requiresConsultation: false,
        requiresIndemnity: false,
        minAdvanceBooking: 2,
        allowOnlineBooking: true
      },
      therapistCommission: {
        type: 'percentage',
        value: 30
      }
    });
    setSelectedTreatment(null);
  };

  const applyFilters = () => {
    fetchTreatments();
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      status: 'active',
      search: '',
      minPrice: '',
      maxPrice: '',
      page: 1,
      limit: 20
    });
  };

  const handleRefresh = () => {
    fetchTreatments();
    fetchStats();
    info('Data refreshed', 2000);
  };

  const treatmentColumns = [
    {
      key: 'name',
      label: 'Treatment',
      render: (_, treatment) => (
        <div>
          <div className="font-semibold text-gray-900">{treatment.name}</div>
          <div className="text-xs text-gray-500">{treatment.treatmentId}</div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (value, treatment) => (
        <Badge variant="info">{value || treatment.category}</Badge>
      )
    },
    {
      key: 'pricing',
      label: 'Price',
      render: (value, treatment) => {
        const pricing = value || treatment.pricing || {};
        const basePrice = pricing.basePrice ?? treatment.price ?? 0;
        const memberPrice = pricing.memberPrice;
        return (
          <div>
            <div className="font-medium text-gray-900">{formatCurrency(basePrice)}</div>
            {typeof memberPrice === 'number' && (
              <div className="text-xs text-emerald-600 font-medium">
                Member: {formatCurrency(memberPrice)}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (value) => (
        <div className="flex items-center gap-1 text-gray-700">
          <Clock size={14} className="text-purple-500" />
          <span className="font-medium">{value || 0} mins</span>
        </div>
      )
    },
    {
      key: 'totalBookings',
      label: 'Bookings',
      render: (_, treatment) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{treatment.totalBookings || 0}</span>
          {treatment.averageRating > 0 && (
            <div className="flex items-center text-amber-500">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-xs ml-1 font-medium">{treatment.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, treatment) => (
        <Badge
          variant={
            (value || treatment.status) === 'active'
              ? 'success'
              : (value || treatment.status) === 'inactive'
              ? 'warning'
              : 'error'
          }
        >
          {value || treatment.status}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, treatment) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditTreatment(treatment)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDuplicateTreatment(treatment._id)}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteTreatment(treatment._id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Discontinue"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];

  return (
    <Layout title="The Olive Room (Spa)" subtitle="Treatment Management & Services">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-3">
          <Button variant="primary" icon={Plus} onClick={() => setShowCreateModal(true)}>
            Add Treatment
          </Button>
          <Button variant="secondary" icon={RefreshCw} onClick={handleRefresh} loading={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <>
          <div className="grid grid-4 mb-xl">
            <StatCard
              title="Total Treatments"
              value={stats.overview.total.toString()}
              icon={Flower2}
              color="var(--spa-color)"
            />
            <StatCard
              title="Active Treatments"
              value={stats.overview.active.toString()}
              icon={Sparkles}
              color="var(--success)"
            />
            <StatCard
              title="Average Price"
              value={formatCurrency(stats.pricing.avgPrice)}
              icon={DollarSign}
              color="var(--warning)"
            />
            <StatCard
              title="Categories"
              value={stats.byCategory.length.toString()}
              icon={TrendingUp}
              color="var(--primary-color)"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-2 mb-xl">
            {/* By Category */}
            <Card title="Treatments by Category" subtitle="Distribution across services">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                  <XAxis dataKey="_id" stroke="var(--gray-400)" />
                  <YAxis stroke="var(--gray-400)" />
                  <Tooltip contentStyle={{
                    background: 'var(--white)',
                    border: '1px solid var(--gray-200)',
                    borderRadius: 'var(--radius-lg)'
                  }} />
                  <Legend />
                  <Bar dataKey="count" fill="var(--spa-color)" radius={[8, 8, 0, 0]} name="Treatments" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Top Rated */}
            <Card title="Top Rated Treatments" subtitle="Customer favorites">
              {stats.topRated && stats.topRated.length > 0 ? (
                <div className="space-y-3">
                  {stats.topRated.slice(0, 5).map((treatment, idx) => (
                    <div key={treatment._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{treatment.name}</div>
                          <div className="text-xs text-gray-500 capitalize">{treatment.category}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-amber-600">{treatment.averageRating.toFixed(1)}</span>
                        </div>
                        <Badge variant="info">{treatment.reviewCount} reviews</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No ratings yet</p>
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {/* Filters & Table */}
      <Card>
        <div className="card-actions">
          <h3>All Treatments</h3>
        </div>

        {/* Filters Section */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white font-medium transition-all"
            >
              <option value="">All Categories</option>
              <option value="facial">💆‍♀️ Facial</option>
              <option value="massage">💆 Massage</option>
              <option value="body_treatment">🧖 Body Treatment</option>
              <option value="manicure">💅 Manicure</option>
              <option value="pedicure">🦶 Pedicure</option>
              <option value="hair">💇 Hair</option>
              <option value="waxing">✨ Waxing</option>
              <option value="makeup">💄 Makeup</option>
              <option value="package">🎁 Package</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white font-medium transition-all"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="seasonal">Seasonal</option>
              <option value="discontinued">Discontinued</option>
            </select>

            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search treatments..."
              className="px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white font-medium transition-all"
            />

            <Button onClick={applyFilters} variant="primary" className="font-semibold">
              <Filter size={16} className="mr-2" />
              Apply
            </Button>

            <Button onClick={clearFilters} variant="outline" className="font-semibold">
              Clear
            </Button>
          </div>
        </div>

        <Table
          data={treatments}
          columns={treatmentColumns}
          loading={loading}
          searchPlaceholder="Search treatments..."
        />
      </Card>

      {/* Create/Edit Treatment Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title={selectedTreatment ? 'Edit Treatment' : 'Create New Treatment'}
        size="large"
      >
        <form onSubmit={selectedTreatment ? handleUpdateTreatment : handleCreateTreatment}>
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {/* Basic Info Section */}
            <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-xl border border-purple-200">
              <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-purple-600" />
                Basic Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Treatment Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="e.g., Signature Facial Treatment"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-medium"
                  >
                    <option value="facial">💆‍♀️ Facial</option>
                    <option value="massage">💆 Massage</option>
                    <option value="body_treatment">🧖 Body Treatment</option>
                    <option value="manicure">💅 Manicure</option>
                    <option value="pedicure">🦶 Pedicure</option>
                    <option value="hair">💇 Hair</option>
                    <option value="waxing">✨ Waxing</option>
                    <option value="makeup">💄 Makeup</option>
                    <option value="package">🎁 Package</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Brief one-line description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Full Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Detailed description of the treatment..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-gradient-to-br from-green-50 to-white p-5 rounded-xl border border-green-200">
              <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                <DollarSign size={18} className="text-green-600" />
                Pricing
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Base Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.pricing.basePrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, basePrice: e.target.value }
                      })
                    }
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Member Price ($)
                  </label>
                  <input
                    type="number"
                    value={formData.pricing.memberPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, memberPrice: e.target.value }
                      })
                    }
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-medium"
                    placeholder="Discounted price"
                  />
                </div>
              </div>
            </div>

            {/* Duration Section */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                <Clock size={18} className="text-blue-600" />
                Time Settings
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Duration (mins) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    min="15"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Prep Time (mins)
                  </label>
                  <input
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({ ...formData, preparationTime: parseInt(e.target.value) })}
                    min="0"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Cleanup (mins)
                  </label>
                  <input
                    type="number"
                    value={formData.cleanupTime}
                    onChange={(e) => setFormData({ ...formData, cleanupTime: parseInt(e.target.value) })}
                    min="0"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Status & Experience Section */}
            <div className="bg-gradient-to-br from-orange-50 to-white p-5 rounded-xl border border-orange-200">
              <h3 className="font-bold text-orange-900 mb-4">Settings</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-medium"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="seasonal">Seasonal</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Experience Level
                  </label>
                  <select
                    value={formData.experienceLevel}
                    onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-medium"
                  >
                    <option value="any">Any</option>
                    <option value="junior">Junior</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="senior">Senior</option>
                    <option value="master">Master</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Commission Section */}
            <div className="bg-gradient-to-br from-pink-50 to-white p-5 rounded-xl border border-pink-200">
              <h3 className="font-bold text-pink-900 mb-4">Therapist Commission</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Commission Type
                  </label>
                  <select
                    value={formData.therapistCommission.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        therapistCommission: { ...formData.therapistCommission, type: e.target.value }
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all font-medium"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Commission Value
                  </label>
                  <input
                    type="number"
                    value={formData.therapistCommission.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        therapistCommission: { ...formData.therapistCommission, value: parseFloat(e.target.value) }
                      })
                    }
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Booking Settings Section */}
            <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-xl border border-indigo-200">
              <h3 className="font-bold text-indigo-900 mb-4">Booking Settings</h3>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.bookingSettings.requiresConsultation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bookingSettings: { ...formData.bookingSettings, requiresConsultation: e.target.checked }
                      })
                    }
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Requires Consultation</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.bookingSettings.requiresIndemnity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bookingSettings: { ...formData.bookingSettings, requiresIndemnity: e.target.checked }
                      })
                    }
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Requires Indemnity Form</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.bookingSettings.allowOnlineBooking}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bookingSettings: { ...formData.bookingSettings, allowOnlineBooking: e.target.checked }
                      })
                    }
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Allow Online Booking</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-4 border-t-2 border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              className="flex-1 font-semibold"
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="flex-1 font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              {selectedTreatment ? 'Update Treatment' : 'Create Treatment'}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default TreatmentManagement;
