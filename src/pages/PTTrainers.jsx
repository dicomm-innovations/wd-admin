import { useState, useEffect } from 'react';
import { UserCog, DollarSign, TrendingUp, Users, RefreshCw, Download, Plus, Edit2, Calendar, Eye, Award, Briefcase, Mail, Phone } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatCard from '../components/dashboard/StatCard';
import Modal from '../components/common/Modal';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate, formatCurrency } from '../utils/formatters';
import { downloadCSV } from '../utils/exportHelpers';
import { ptAdminAPI } from '../services/api';

const PTTrainers = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    totalTrainers: 0,
    activeTrainers: 0,
    totalRevenue: 0,
    avgRating: 0
  });

  const { success, error: showError, info } = useNotification();

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const response = await ptAdminAPI.getTrainersWithStats();

      if (response && response.trainers) {
        setTrainers(response.trainers);

        // Calculate summary stats
        const totalRevenue = response.trainers.reduce((sum, t) => sum + (t.stats?.totalRevenue || 0), 0);
        const avgRating = response.trainers.reduce((sum, t) => sum + (t.stats?.averageRating || 0), 0) / response.trainers.length;

        setStats({
          totalTrainers: response.totalTrainers || response.trainers.length,
          activeTrainers: response.trainers.filter(t => t.status === 'active').length,
          totalRevenue,
          avgRating: avgRating || 0
        });
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch trainers:', err);
      showError('Failed to load trainers');
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrainers();
    setRefreshing(false);
    info('Trainer list refreshed');
  };

  const handleExport = () => {
    try {
      const exportData = trainers.map(t => ({
        Name: `${t.firstName} ${t.lastName}`,
        Email: t.email,
        Phone: t.phone,
        Position: t.position,
        Status: t.status,
        'Commission Rate': `${t.commissionRate}%`,
        'Total Sessions': t.stats?.totalSessions || 0,
        'This Month Sessions': t.stats?.thisMonthSessions || 0,
        'Total Revenue': formatCurrency(t.stats?.totalRevenue || 0),
        'Active Clients': t.stats?.activeClients || 0,
        'Average Rating': t.stats?.averageRating || 'N/A'
      }));

      downloadCSV(exportData, Object.keys(exportData[0]), `pt_trainers_${formatDate(new Date(), 'yyyyMMdd')}.csv`);
      success('Trainers exported successfully!');
    } catch (err) {
      showError('Failed to export trainers');
    }
  };

  const handleCreate = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      position: 'Personal Trainer',
      commissionRate: 70,
      specializations: [],
      certifications: [],
      bio: ''
    });
    setShowCreateModal(true);
  };

  const handleEdit = (trainer) => {
    setFormData({
      firstName: trainer.firstName,
      lastName: trainer.lastName,
      email: trainer.email,
      phone: trainer.phone,
      position: trainer.position,
      commissionRate: trainer.commissionRate,
      status: trainer.status,
      specializations: trainer.metadata?.specializations || [],
      certifications: trainer.metadata?.certifications || [],
      bio: trainer.metadata?.bio || ''
    });
    setSelectedTrainer(trainer);
    setShowEditModal(true);
  };

  const handleViewStats = (trainer) => {
    setSelectedTrainer(trainer);
    setShowStatsModal(true);
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await ptAdminAPI.createTrainer(formData);
      success('Trainer created successfully!');
      setShowCreateModal(false);
      fetchTrainers();
    } catch (err) {
      console.error('Failed to create trainer:', err);
      showError(err.message || 'Failed to create trainer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await ptAdminAPI.updateTrainer(selectedTrainer._id, formData);
      success('Trainer updated successfully!');
      setShowEditModal(false);
      fetchTrainers();
    } catch (err) {
      console.error('Failed to update trainer:', err);
      showError(err.message || 'Failed to update trainer');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Trainer',
      render: (_, trainer) => (
        <div>
          <div className="font-semibold text-gray-900">{trainer.firstName} {trainer.lastName}</div>
          <div className="text-sm text-gray-500">{trainer.email}</div>
        </div>
      )
    },
    {
      key: 'position',
      header: 'Position',
      render: (_, trainer) => (
        <span className="font-medium text-gray-900">{trainer.position || 'Personal Trainer'}</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, trainer) => (
        <Badge color={trainer.status === 'active' ? 'green' : 'gray'}>
          {trainer.status}
        </Badge>
      )
    },
    {
      key: 'commissionRate',
      header: 'Commission',
      render: (_, trainer) => (
        <span className="font-semibold text-blue-600">{trainer.commissionRate || 70}%</span>
      )
    },
    {
      key: 'stats',
      header: 'Sessions (Month)',
      render: (_, trainer) => (
        <div>
          <div className="font-semibold text-gray-900">{trainer.stats?.thisMonthSessions || 0}</div>
          <div className="text-sm text-gray-500">Total: {trainer.stats?.totalSessions || 0}</div>
        </div>
      )
    },
    {
      key: 'revenue',
      header: 'Revenue',
      render: (_, trainer) => (
        <div>
          <div className="font-semibold text-green-600">{formatCurrency(trainer.stats?.thisMonthRevenue || 0)}</div>
          <div className="text-sm text-gray-500">Total: {formatCurrency(trainer.stats?.totalRevenue || 0)}</div>
        </div>
      )
    },
    {
      key: 'clients',
      header: 'Active Clients',
      render: (_, trainer) => (
        <span className="font-semibold text-gray-900">{trainer.stats?.activeClients || 0}</span>
      )
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (_, trainer) => (
        <div className="flex items-center">
          <span className="text-yellow-500 mr-1">★</span>
          <span className="font-semibold text-gray-900">{trainer.stats?.averageRating?.toFixed(1) || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, trainer) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewStats(trainer)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="View Stats"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEdit(trainer)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
        {/* Header with Gradient Background */}
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-xl)',
          padding: 'var(--spacing-2xl)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)' }}>
                <UserCog size={32} />
                PT Trainers
              </h1>
              <p style={{ opacity: 0.9, marginTop: 'var(--spacing-sm)' }}>Manage personal trainers and track performance</p>
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
                onClick={handleCreate}
                icon={Plus}
                style={{
                  backgroundColor: 'white',
                  color: '#3b82f6',
                  fontWeight: '600',
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                Add Trainer
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-4">
          <StatCard
            title="Total Trainers"
            value={stats.totalTrainers}
            icon={UserCog}
            color="var(--info)"
          />
          <StatCard
            title="Active Trainers"
            value={stats.activeTrainers}
            icon={Users}
            color="var(--success)"
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={DollarSign}
            color="var(--gym-color)"
          />
          <StatCard
            title="Avg Rating"
            value={stats.avgRating.toFixed(1)}
            icon={TrendingUp}
            color="var(--warning)"
          />
        </div>

        {/* Trainers Table */}
        <Card>
          <Card.Header>
            <h2 className="text-lg font-semibold text-gray-900">All Trainers</h2>
            <p className="text-gray-500 text-sm">View and manage trainer details and performance</p>
          </Card.Header>
          <Card.Body>
            <Table
              columns={columns}
              data={trainers}
              loading={loading}
              emptyMessage="No trainers found"
            />
          </Card.Body>
        </Card>

        {/* Create Trainer Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Trainer"
          size="large"
        >
          <form onSubmit={handleSubmitCreate}>
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {/* Personal Info Section */}
              <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <UserCog size={18} className="text-blue-600" />
                  Personal Information
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={formData.firstName || ''}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={formData.lastName || ''}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Mail size={16} className="text-blue-600" />
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Phone size={16} className="text-blue-600" />
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              {/* Professional Info Section */}
              <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-xl border border-indigo-200">
                <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                  <Briefcase size={18} className="text-indigo-600" />
                  Professional Details
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Position
                    </label>
                    <select
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                      value={formData.position || 'Personal Trainer'}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    >
                      <option value="Personal Trainer">Personal Trainer</option>
                      <option value="Trainer">Trainer</option>
                      <option value="Head Trainer">Head Trainer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Commission Rate (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                      value={formData.commissionRate || 70}
                      onChange={(e) => setFormData({ ...formData, commissionRate: parseInt(e.target.value) })}
                      min={0}
                      max={100}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-xl border border-purple-200">
                <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                  <Award size={18} className="text-purple-600" />
                  Bio & Qualifications
                </h3>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Bio
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    rows={4}
                    value={formData.bio || ''}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Trainer bio and qualifications..."
                  />
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
                className="flex-1 font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {submitting ? 'Creating...' : 'Create Trainer'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Trainer Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Trainer"
          size="large"
        >
          <form onSubmit={handleSubmitEdit}>
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {/* Personal Info Section */}
              <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <UserCog size={18} className="text-blue-600" />
                  Personal Information
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={formData.firstName || ''}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={formData.lastName || ''}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Mail size={16} className="text-blue-600" />
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Professional Info Section */}
              <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-xl border border-indigo-200">
                <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                  <Briefcase size={18} className="text-indigo-600" />
                  Professional Details
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Position
                    </label>
                    <select
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                      value={formData.position || 'Personal Trainer'}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    >
                      <option value="Personal Trainer">Personal Trainer</option>
                      <option value="Trainer">Trainer</option>
                      <option value="Head Trainer">Head Trainer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Status
                    </label>
                    <select
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                      value={formData.status || 'active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="on_leave">On Leave</option>
                      <option value="suspended">Suspended</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Commission Rate (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                    value={formData.commissionRate || 70}
                    onChange={(e) => setFormData({ ...formData, commissionRate: parseInt(e.target.value) })}
                    min={0}
                    max={100}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t-2 border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
                disabled={submitting}
                className="flex-1 font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {submitting ? 'Updating...' : 'Update Trainer'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Trainer Stats Modal */}
        <Modal
          isOpen={showStatsModal}
          onClose={() => setShowStatsModal(false)}
          title={selectedTrainer ? `${selectedTrainer.firstName} ${selectedTrainer.lastName} - Performance` : 'Trainer Stats'}
          size="large"
        >
          {selectedTrainer && selectedTrainer.stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-5 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-sm font-semibold text-blue-900 mb-1">Total Sessions</div>
                  <div className="text-2xl font-bold text-gray-900">{selectedTrainer.stats.totalSessions}</div>
                </div>
                <div className="p-5 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-sm font-semibold text-green-900 mb-1">Completed Sessions</div>
                  <div className="text-2xl font-bold text-gray-900">{selectedTrainer.stats.completedSessions}</div>
                </div>
                <div className="p-5 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-sm font-semibold text-purple-900 mb-1">This Month</div>
                  <div className="text-2xl font-bold text-gray-900">{selectedTrainer.stats.thisMonthSessions}</div>
                </div>
                <div className="p-5 bg-gradient-to-br from-yellow-50 to-white rounded-xl border border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-sm font-semibold text-yellow-900 mb-1">Total Revenue</div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(selectedTrainer.stats.totalRevenue)}</div>
                </div>
                <div className="p-5 bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-sm font-semibold text-indigo-900 mb-1">Total Commission</div>
                  <div className="text-2xl font-bold text-indigo-600">{formatCurrency(selectedTrainer.stats.totalCommission)}</div>
                </div>
                <div className="p-5 bg-gradient-to-br from-pink-50 to-white rounded-xl border border-pink-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-sm font-semibold text-pink-900 mb-1">Active Clients</div>
                  <div className="text-2xl font-bold text-gray-900">{selectedTrainer.stats.activeClients}</div>
                </div>
                <div className="p-5 bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-sm font-semibold text-orange-900 mb-1">Upcoming Sessions</div>
                  <div className="text-2xl font-bold text-gray-900">{selectedTrainer.stats.upcomingSessions}</div>
                </div>
                <div className="p-5 bg-gradient-to-br from-teal-50 to-white rounded-xl border border-teal-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-sm font-semibold text-teal-900 mb-1">Average Rating</div>
                  <div className="text-2xl font-bold text-yellow-600">{selectedTrainer.stats.averageRating?.toFixed(1)}</div>
                </div>
                <div className="p-5 bg-gradient-to-br from-red-50 to-white rounded-xl border border-red-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-sm font-semibold text-red-900 mb-1">Cancellation Rate</div>
                  <div className="text-2xl font-bold text-red-600">{selectedTrainer.stats.cancellationRate}%</div>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-gray-200">
                <Button
                  variant="outline"
                  icon={Calendar}
                  onClick={() => {
                    setShowStatsModal(false);
                    info('Schedule view coming soon');
                  }}
                  className="font-semibold"
                >
                  View Schedule
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default PTTrainers;
