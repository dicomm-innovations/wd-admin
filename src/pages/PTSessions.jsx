import { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, RefreshCw, Download, Plus, Filter, Eye, Edit2, User, Dumbbell, Target } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatCard from '../components/dashboard/StatCard';
import Modal from '../components/common/Modal';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate, formatCurrency, formatTime } from '../utils/formatters';
import { downloadCSV } from '../utils/exportHelpers';
import { ptAdminAPI, customerAPI } from '../services/api';

const PTSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalSessions: 0,
    limit: 20
  });
  const [filters, setFilters] = useState({
    status: '',
    trainerId: '',
    startDate: '',
    endDate: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    upcoming: 0,
    revenue: 0
  });

  const { success, error: showError, info } = useNotification();

  useEffect(() => {
    fetchSessions();
    fetchTrainers();
  }, [pagination.currentPage, filters]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });

      const response = await ptAdminAPI.getAllSessions(params);

      if (response && response.sessions) {
        setSessions(response.sessions);
        setPagination(response.pagination);

        // Calculate stats
        const completed = response.sessions.filter(s => s.status === 'completed').length;
        const upcoming = response.sessions.filter(s =>
          ['booked', 'confirmed'].includes(s.status) && new Date(s.sessionDate) > new Date()
        ).length;
        const revenue = response.sessions
          .filter(s => s.status === 'completed')
          .reduce((sum, s) => sum + s.price, 0);

        setStats({
          total: response.pagination.totalSessions,
          completed,
          upcoming,
          revenue
        });
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      showError('Failed to load PT sessions');
      setLoading(false);
    }
  };

  const fetchTrainers = async () => {
    try {
      const response = await ptAdminAPI.getTrainersWithStats();
      if (response && response.trainers) {
        setTrainers(response.trainers.filter(t => t.status === 'active'));
      }
    } catch (err) {
      console.error('Failed to fetch trainers:', err);
    }
  };

  const searchCustomers = async (query) => {
    try {
      const response = await customerAPI.getAll({ search: query, limit: 10 });
      if (response && response.customers) {
        setCustomers(response.customers);
      }
    } catch (err) {
      console.error('Failed to search customers:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
    info('Sessions list refreshed');
  };

  const handleExport = () => {
    try {
      const exportData = sessions.map(s => ({
        'Session ID': s.bookingId,
        'Customer': `${s.customer?.firstName} ${s.customer?.lastName}`,
        'Trainer': `${s.trainer?.firstName} ${s.trainer?.lastName}`,
        'Date': formatDate(s.sessionDate),
        'Time': `${s.startTime} - ${s.endTime}`,
        'Type': s.sessionType,
        'Duration': `${s.duration} min`,
        'Price': formatCurrency(s.price),
        'Status': s.status,
        'Created': formatDate(s.createdAt)
      }));

      downloadCSV(exportData, Object.keys(exportData[0]), `pt_sessions_${formatDate(new Date(), 'yyyyMMdd')}.csv`);
      success('Sessions exported successfully!');
    } catch (err) {
      showError('Failed to export sessions');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      trainerId: '',
      startDate: '',
      endDate: ''
    });
  };

  const handleCreateSession = () => {
    setFormData({
      customerId: '',
      trainerId: '',
      sessionDate: '',
      startTime: '',
      duration: 60,
      sessionType: 'general',
      goals: '',
      price: 100,
      notes: ''
    });
    setShowCreateModal(true);
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await ptAdminAPI.createManualBooking(formData);
      success('PT session created successfully!');
      setShowCreateModal(false);
      fetchSessions();
    } catch (err) {
      console.error('Failed to create session:', err);
      showError(err.message || 'Failed to create session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = (session) => {
    setSelectedSession(session);
    setFormData({
      status: session.status,
      reason: ''
    });
    setShowStatusModal(true);
  };

  const handleSubmitStatus = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await ptAdminAPI.updateSessionStatus(selectedSession._id, formData);
      success('Session status updated successfully!');
      setShowStatusModal(false);
      fetchSessions();
    } catch (err) {
      console.error('Failed to update status:', err);
      showError(err.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      booked: 'blue',
      confirmed: 'cyan',
      checked_in: 'purple',
      in_progress: 'yellow',
      completed: 'green',
      cancelled: 'red',
      no_show: 'gray'
    };
    return colors[status] || 'gray';
  };

  const columns = [
    {
      key: 'bookingId',
      label: 'Booking ID',
      render: (session) => (
        <div className="font-mono text-sm font-semibold text-gray-900">{session.bookingId}</div>
      )
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (session) => (
        <div>
          <div className="font-semibold text-gray-900">
            {session.customer?.firstName} {session.customer?.lastName}
          </div>
          <div className="text-sm text-gray-500">{session.customer?.email}</div>
        </div>
      )
    },
    {
      key: 'trainer',
      label: 'Trainer',
      render: (session) => (
        <div>
          <div className="font-semibold text-gray-900">
            {session.trainer?.firstName} {session.trainer?.lastName}
          </div>
          <div className="text-sm text-gray-500">{session.trainer?.position}</div>
        </div>
      )
    },
    {
      key: 'datetime',
      label: 'Date & Time',
      render: (session) => (
        <div>
          <div className="font-medium text-gray-900">{formatDate(session.sessionDate, 'MMM dd, yyyy')}</div>
          <div className="text-sm text-gray-500">
            {session.startTime} - {session.endTime}
          </div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (session) => (
        <span className="capitalize font-medium text-gray-900">{session.sessionType}</span>
      )
    },
    {
      key: 'price',
      label: 'Price',
      render: (session) => (
        <span className="font-semibold text-green-600">{formatCurrency(session.price)}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (session) => (
        <Badge color={getStatusColor(session.status)}>
          {session.status.replace('_', ' ')}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (session) => (
        <button
          onClick={() => handleUpdateStatus(session)}
          className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
          title="Update Status"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
        {/* Header with Gradient Background */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-xl)',
          padding: 'var(--spacing-2xl)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)' }}>
                <Calendar size={32} />
                PT Sessions
              </h1>
              <p style={{ opacity: 0.9, marginTop: 'var(--spacing-sm)' }}>Manage personal training sessions and bookings</p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                icon={RefreshCw}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.4)'
                }}
              >
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                icon={Download}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.4)'
                }}
              >
                Export
              </Button>
              <Button
                onClick={handleCreateSession}
                icon={Plus}
                style={{
                  backgroundColor: 'white',
                  color: '#10b981',
                  fontWeight: '600',
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                Manual Booking
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-4">
          <StatCard
            title="Total Sessions"
            value={stats.total}
            icon={Calendar}
            color="var(--info)"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={Calendar}
            color="var(--success)"
          />
          <StatCard
            title="Upcoming"
            value={stats.upcoming}
            icon={Clock}
            color="var(--gym-color)"
          />
          <StatCard
            title="Revenue"
            value={formatCurrency(stats.revenue)}
            icon={DollarSign}
            color="var(--warning)"
          />
        </div>

        {/* Filters - Enhanced */}
        <Card>
          <Card.Body>
            <div style={{
              background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 30%, #99f6e4 70%, #ccfbf1 100%)',
              padding: 'var(--spacing-xl)',
              borderRadius: 'var(--radius-xl)',
              border: '2px solid #6ee7b7',
              boxShadow: 'var(--shadow-md)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#065f46', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <Filter size={18} color="#059669" />
                  Filters
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearFilters}
                  style={{ fontWeight: '600', borderWidth: '2px' }}
                >
                  Clear Filters
                </Button>
              </div>
              <div className="grid grid-4">
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', color: '#065f46', marginBottom: 'var(--spacing-sm)' }}>Status</label>
                  <select
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-md)',
                      border: '2px solid #6ee7b7',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      backgroundColor: 'white',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">📋 All Statuses</option>
                    <option value="booked">📅 Booked</option>
                    <option value="confirmed">✅ Confirmed</option>
                    <option value="checked_in">👋 Checked In</option>
                    <option value="in_progress">🏋️ In Progress</option>
                    <option value="completed">✔️ Completed</option>
                    <option value="cancelled">❌ Cancelled</option>
                    <option value="no_show">⚠️ No Show</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', color: '#0f766e', marginBottom: 'var(--spacing-sm)' }}>Trainer</label>
                  <select
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-md)',
                      border: '2px solid #5eead4',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      backgroundColor: 'white',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    value={filters.trainerId}
                    onChange={(e) => handleFilterChange('trainerId', e.target.value)}
                  >
                    <option value="">👥 All Trainers</option>
                    {trainers.map(trainer => (
                      <option key={trainer._id} value={trainer._id}>
                        {trainer.firstName} {trainer.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', color: '#065f46', marginBottom: 'var(--spacing-sm)' }}>Start Date</label>
                  <input
                    type="date"
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-md)',
                      border: '2px solid #6ee7b7',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      backgroundColor: 'white',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', color: '#0f766e', marginBottom: 'var(--spacing-sm)' }}>End Date</label>
                  <input
                    type="date"
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-md)',
                      border: '2px solid #5eead4',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      backgroundColor: 'white',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Sessions Table */}
        <Card>
          <Card.Header>
            <h2 className="text-lg font-semibold text-gray-900">All PT Sessions</h2>
            <p className="text-gray-500 text-sm">View and manage all personal training sessions</p>
          </Card.Header>
          <Card.Body>
            <Table
              columns={columns}
              data={sessions}
              loading={loading}
              emptyMessage="No PT sessions found"
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-gray-200">
                <div className="text-sm text-gray-600 font-medium">
                  Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalSessions)} of{' '}
                  {pagination.totalSessions} sessions
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    disabled={pagination.currentPage === 1}
                    className="font-semibold"
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="font-semibold"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Create Session Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create PT Session (Manual Booking)"
          size="large"
        >
          <form onSubmit={handleSubmitCreate}>
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {/* Session Details Section */}
              <div className="bg-gradient-to-br from-green-50 to-white p-5 rounded-xl border border-green-200">
                <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                  <Dumbbell size={18} className="text-green-600" />
                  Session Details
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Trainer <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-medium"
                        value={formData.trainerId || ''}
                        onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                        required
                      >
                        <option value="">Select Trainer</option>
                        {trainers.map(trainer => (
                          <option key={trainer._id} value={trainer._id}>
                            {trainer.firstName} {trainer.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Customer ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        value={formData.customerId || ''}
                        onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                        placeholder="Enter customer ID"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Session Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        value={formData.sessionDate || ''}
                        onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Start Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        value={formData.startTime || ''}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Type & Pricing Section */}
              <div className="bg-gradient-to-br from-teal-50 to-white p-5 rounded-xl border border-teal-200">
                <h3 className="font-bold text-teal-900 mb-4 flex items-center gap-2">
                  <Target size={18} className="text-teal-600" />
                  Type & Pricing
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Duration (min)
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-medium"
                      value={formData.duration || 60}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      min={30}
                      step={15}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Session Type
                    </label>
                    <select
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-medium"
                      value={formData.sessionType || 'general'}
                      onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })}
                    >
                      <option value="strength">Strength</option>
                      <option value="cardio">Cardio</option>
                      <option value="hiit">HIIT</option>
                      <option value="flexibility">Flexibility</option>
                      <option value="general">General</option>
                      <option value="assessment">Assessment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-medium"
                      value={formData.price || 100}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      min={0}
                      step={10}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Additional Info Section */}
              <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <User size={18} className="text-blue-600" />
                  Additional Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Goals
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      rows={2}
                      value={formData.goals || ''}
                      onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                      placeholder="Session goals..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Notes
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      rows={2}
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Internal notes..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t-2 border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={submitting}
                className="flex-1 font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 font-semibold bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
              >
                {submitting ? 'Creating...' : 'Create Session'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Update Status Modal */}
        <Modal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          title="Update Session Status"
          size="md"
        >
          <form onSubmit={handleSubmitStatus}>
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-green-50 to-white p-5 rounded-xl border border-green-200">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-medium"
                    value={formData.status || ''}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="booked">Booked</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked_in">Checked In</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No Show</option>
                  </select>
                </div>

                {(formData.status === 'cancelled' || formData.status === 'no_show') && (
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Reason
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      rows={3}
                      value={formData.reason || ''}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Provide a reason..."
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowStatusModal(false)}
                  disabled={submitting}
                  className="flex-1 font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 font-semibold bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                >
                  {submitting ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default PTSessions;
