import { useState, useEffect } from 'react';
import { Gift, Plus, Edit2, Trash2, RefreshCw, BarChart3 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import StatCard from '../components/dashboard/StatCard';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate, formatCurrency } from '../utils/formatters';
import { referralAdminAPI } from '../services/api';
import './IncentivePrograms.css';

const IncentivePrograms = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'standard',
    isActive: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    referrerReward: {
      type: 'credit',
      amount: 0,
      description: ''
    },
    refereeReward: {
      type: 'discount',
      amount: 0,
      description: ''
    },
    conditions: {
      minPurchaseAmount: 0,
      requiresFirstPurchase: true,
      validityDays: 30
    }
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalReferrals: 0,
    totalRewards: 0
  });

  const { success, error: showError, info } = useNotification();

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await referralAdminAPI.getAllIncentives();

      if (response) {
        setPrograms(response.programs || []);
        calculateStats(response.programs || []);
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch incentive programs:', err);
      showError('Failed to load incentive programs');
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    setStats({
      total: data.length,
      active: data.filter(p => p.isActive).length,
      totalReferrals: data.reduce((sum, p) => sum + (p.stats?.totalReferrals || 0), 0),
      totalRewards: data.reduce((sum, p) => sum + (p.stats?.totalRewardsValue || 0), 0)
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrograms();
    setRefreshing(false);
    info('Programs refreshed');
  };

  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      description: '',
      type: 'standard',
      isActive: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      referrerReward: {
        type: 'credit',
        amount: 0,
        description: ''
      },
      refereeReward: {
        type: 'discount',
        amount: 0,
        description: ''
      },
      conditions: {
        minPurchaseAmount: 0,
        requiresFirstPurchase: true,
        validityDays: 30
      }
    });
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (program) => {
    setSelectedProgram(program);
    setFormData({
      name: program.name,
      description: program.description || '',
      type: program.type,
      isActive: program.isActive,
      startDate: program.startDate ? new Date(program.startDate).toISOString().split('T')[0] : '',
      endDate: program.endDate ? new Date(program.endDate).toISOString().split('T')[0] : '',
      referrerReward: program.referrerReward || { type: 'credit', amount: 0, description: '' },
      refereeReward: program.refereeReward || { type: 'discount', amount: 0, description: '' },
      conditions: program.conditions || { minPurchaseAmount: 0, requiresFirstPurchase: true, validityDays: 30 }
    });
    setShowEditModal(true);
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      const response = await referralAdminAPI.createIncentive(formData);

      if (response) {
        success('Incentive program created successfully!');
        setShowCreateModal(false);
        await fetchPrograms();
      }

      setSubmitting(false);
    } catch (err) {
      console.error('Failed to create incentive program:', err);
      showError('Failed to create incentive program');
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();

    if (!selectedProgram) return;

    try {
      setSubmitting(true);
      const response = await referralAdminAPI.updateIncentive(selectedProgram._id, formData);

      if (response) {
        success('Incentive program updated successfully!');
        setShowEditModal(false);
        setSelectedProgram(null);
        await fetchPrograms();
      }

      setSubmitting(false);
    } catch (err) {
      console.error('Failed to update incentive program:', err);
      showError('Failed to update incentive program');
      setSubmitting(false);
    }
  };

  const handleDelete = async (program) => {
    if (!window.confirm(`Are you sure you want to delete the program "${program.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await referralAdminAPI.deleteIncentive(program._id);

      if (response) {
        success('Incentive program deleted successfully');
        await fetchPrograms();
      }
    } catch (err) {
      console.error('Failed to delete incentive program:', err);
      showError(err.response?.data?.message || 'Failed to delete incentive program');
    }
  };

  const handleViewPerformance = async (program) => {
    try {
      setSelectedProgram(program);
      const response = await referralAdminAPI.getIncentivePerformance(program._id);
      setPerformanceData(response);
      setShowPerformanceModal(true);
    } catch (err) {
      console.error('Failed to fetch performance data:', err);
      showError('Failed to load performance data');
    }
  };

  const handleFormChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNestedFormChange = (parent, field, value) => {
    setFormData({
      ...formData,
      [parent]: {
        ...formData[parent],
        [field]: value
      }
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="incentive-programs-page">
        {/* Header */}
        <div className="incentive-programs-header">
          <h1>Incentive Programs</h1>
          <div className="incentive-programs-actions">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              loading={refreshing}
              icon={RefreshCw}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              onClick={handleOpenCreateModal}
              icon={Plus}
            >
              New Program
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="incentive-programs-stats">
          <StatCard
            title="Total Programs"
            value={stats.total}
            icon={Gift}
            color="blue"
          />
          <StatCard
            title="Active Programs"
            value={stats.active}
            icon={Gift}
            color="green"
          />
          <StatCard
            title="Total Referrals"
            value={stats.totalReferrals}
            icon={Gift}
            color="purple"
          />
          <StatCard
            title="Total Rewards"
            value={formatCurrency(stats.totalRewards)}
            icon={Gift}
            color="yellow"
          />
        </div>

        {/* Programs List */}
        <Card>
          <Card.Body>
            {programs.length === 0 ? (
              <div className="empty-programs-state">
                <Gift size={48} className="empty-programs-icon" />
                <p className="empty-programs-text">No incentive programs yet</p>
                <Button variant="primary" onClick={handleOpenCreateModal}>
                  Create Your First Program
                </Button>
              </div>
            ) : (
              <div className="programs-list">
                {programs.map((program) => (
                  <div key={program._id} className="program-card">
                    <div className="program-card-header">
                      <div className="program-card-info">
                        <div className="program-card-title-row">
                          <h3 className="program-card-title">{program.name}</h3>
                          <Badge variant={program.isActive ? 'success' : 'default'}>
                            {program.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="info">{program.type}</Badge>
                        </div>
                        {program.description && (
                          <p className="program-card-description">{program.description}</p>
                        )}
                        <div className="program-card-dates">
                          {program.startDate && (
                            <span>Start: {formatDate(program.startDate)}</span>
                          )}
                          {program.endDate && (
                            <span>End: {formatDate(program.endDate)}</span>
                          )}
                        </div>
                      </div>
                      <div className="program-card-actions">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPerformance(program)}
                          icon={BarChart3}
                        >
                          Performance
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(program)}
                          icon={Edit2}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(program)}
                          icon={Trash2}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    <div className="program-rewards-grid">
                      {/* Referrer Reward */}
                      <div className="reward-box reward-box-referrer">
                        <div className="reward-box-title reward-box-title-referrer">Referrer Reward</div>
                        <div className="reward-box-details">
                          <div className="reward-detail-row">
                            <span className="reward-detail-label">Type:</span>
                            <Badge variant="info">{program.referrerReward?.type}</Badge>
                          </div>
                          <div className="reward-detail-row">
                            <span className="reward-detail-label">Amount:</span>
                            <span className="reward-detail-value">
                              {program.referrerReward?.type === 'credit' || program.referrerReward?.type === 'discount'
                                ? formatCurrency(program.referrerReward?.amount || 0)
                                : `${program.referrerReward?.amount || 0} points`}
                            </span>
                          </div>
                          {program.referrerReward?.description && (
                            <div className="reward-description">
                              {program.referrerReward.description}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Referee Reward */}
                      <div className="reward-box reward-box-referee">
                        <div className="reward-box-title reward-box-title-referee">Referee Reward</div>
                        <div className="reward-box-details">
                          <div className="reward-detail-row">
                            <span className="reward-detail-label">Type:</span>
                            <Badge variant="success">{program.refereeReward?.type}</Badge>
                          </div>
                          <div className="reward-detail-row">
                            <span className="reward-detail-label">Amount:</span>
                            <span className="reward-detail-value">
                              {program.refereeReward?.type === 'credit' || program.refereeReward?.type === 'discount'
                                ? formatCurrency(program.refereeReward?.amount || 0)
                                : `${program.refereeReward?.amount || 0} points`}
                            </span>
                          </div>
                          {program.refereeReward?.description && (
                            <div className="reward-description">
                              {program.refereeReward.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Conditions */}
                    {program.conditions && (
                      <div className="program-conditions">
                        <div className="program-conditions-title">Conditions</div>
                        <div className="program-conditions-grid">
                          <div>
                            Min Purchase: {formatCurrency(program.conditions.minPurchaseAmount || 0)}
                          </div>
                          <div>
                            First Purchase Only: {program.conditions.requiresFirstPurchase ? 'Yes' : 'No'}
                          </div>
                          <div>
                            Valid for: {program.conditions.validityDays || 30} days
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create Incentive Program"
          size="large"
        >
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Program Name *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Program Type *</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.type}
                  onChange={(e) => handleFormChange('type', e.target.value)}
                  required
                >
                  <option value="standard">Standard</option>
                  <option value="promotional">Promotional</option>
                  <option value="seasonal">Seasonal</option>
                  <option value="vip">VIP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.isActive}
                  onChange={(e) => handleFormChange('isActive', e.target.value === 'true')}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.startDate}
                  onChange={(e) => handleFormChange('startDate', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.endDate}
                  onChange={(e) => handleFormChange('endDate', e.target.value)}
                />
              </div>
            </div>

            {/* Referrer Reward */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Referrer Reward</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Reward Type *</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.referrerReward.type}
                    onChange={(e) => handleNestedFormChange('referrerReward', 'type', e.target.value)}
                    required
                  >
                    <option value="credit">Credit</option>
                    <option value="discount">Discount</option>
                    <option value="points">Points</option>
                    <option value="freebie">Freebie</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Amount * {formData.referrerReward.type === 'points' ? '(points)' : '($)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.referrerReward.amount}
                    onChange={(e) => handleNestedFormChange('referrerReward', 'amount', parseFloat(e.target.value))}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.referrerReward.description}
                    onChange={(e) => handleNestedFormChange('referrerReward', 'description', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Referee Reward */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Referee Reward</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Reward Type *</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.refereeReward.type}
                    onChange={(e) => handleNestedFormChange('refereeReward', 'type', e.target.value)}
                    required
                  >
                    <option value="credit">Credit</option>
                    <option value="discount">Discount</option>
                    <option value="points">Points</option>
                    <option value="freebie">Freebie</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Amount * {formData.refereeReward.type === 'points' ? '(points)' : '($)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.refereeReward.amount}
                    onChange={(e) => handleNestedFormChange('refereeReward', 'amount', parseFloat(e.target.value))}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.refereeReward.description}
                    onChange={(e) => handleNestedFormChange('refereeReward', 'description', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Conditions */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Conditions</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Purchase Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.conditions.minPurchaseAmount}
                    onChange={(e) => handleNestedFormChange('conditions', 'minPurchaseAmount', parseFloat(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Validity Days</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.conditions.validityDays}
                    onChange={(e) => handleNestedFormChange('conditions', 'validityDays', parseInt(e.target.value))}
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.conditions.requiresFirstPurchase}
                      onChange={(e) => handleNestedFormChange('conditions', 'requiresFirstPurchase', e.target.checked)}
                    />
                    <span className="text-sm font-medium">Require First Purchase</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Program'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedProgram && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProgram(null);
          }}
          title="Edit Incentive Program"
          size="large"
        >
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            {/* Same form structure as Create Modal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Program Name *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Program Type *</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.type}
                  onChange={(e) => handleFormChange('type', e.target.value)}
                  required
                >
                  <option value="standard">Standard</option>
                  <option value="promotional">Promotional</option>
                  <option value="seasonal">Seasonal</option>
                  <option value="vip">VIP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.isActive}
                  onChange={(e) => handleFormChange('isActive', e.target.value === 'true')}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.startDate}
                  onChange={(e) => handleFormChange('startDate', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.endDate}
                  onChange={(e) => handleFormChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Referrer Reward</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Reward Type *</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.referrerReward.type}
                    onChange={(e) => handleNestedFormChange('referrerReward', 'type', e.target.value)}
                    required
                  >
                    <option value="credit">Credit</option>
                    <option value="discount">Discount</option>
                    <option value="points">Points</option>
                    <option value="freebie">Freebie</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Amount * {formData.referrerReward.type === 'points' ? '(points)' : '($)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.referrerReward.amount}
                    onChange={(e) => handleNestedFormChange('referrerReward', 'amount', parseFloat(e.target.value))}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.referrerReward.description}
                    onChange={(e) => handleNestedFormChange('referrerReward', 'description', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Referee Reward</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Reward Type *</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.refereeReward.type}
                    onChange={(e) => handleNestedFormChange('refereeReward', 'type', e.target.value)}
                    required
                  >
                    <option value="credit">Credit</option>
                    <option value="discount">Discount</option>
                    <option value="points">Points</option>
                    <option value="freebie">Freebie</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Amount * {formData.refereeReward.type === 'points' ? '(points)' : '($)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.refereeReward.amount}
                    onChange={(e) => handleNestedFormChange('refereeReward', 'amount', parseFloat(e.target.value))}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.refereeReward.description}
                    onChange={(e) => handleNestedFormChange('refereeReward', 'description', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Conditions</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Purchase Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.conditions.minPurchaseAmount}
                    onChange={(e) => handleNestedFormChange('conditions', 'minPurchaseAmount', parseFloat(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Validity Days</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.conditions.validityDays}
                    onChange={(e) => handleNestedFormChange('conditions', 'validityDays', parseInt(e.target.value))}
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.conditions.requiresFirstPurchase}
                      onChange={(e) => handleNestedFormChange('conditions', 'requiresFirstPurchase', e.target.checked)}
                    />
                    <span className="text-sm font-medium">Require First Purchase</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedProgram(null);
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Updating...' : 'Update Program'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Performance Modal */}
      {showPerformanceModal && selectedProgram && performanceData && (
        <Modal
          isOpen={showPerformanceModal}
          onClose={() => {
            setShowPerformanceModal(false);
            setSelectedProgram(null);
            setPerformanceData(null);
          }}
          title={`Performance: ${selectedProgram.name}`}
        >
          <div>
            <div className="performance-stats-grid">
              <div className="performance-stat-card performance-stat-card-blue">
                <div className="performance-stat-label">Total Referrals</div>
                <div className="performance-stat-value">{performanceData.totalReferrals}</div>
              </div>
              <div className="performance-stat-card performance-stat-card-green">
                <div className="performance-stat-label">Successful Referrals</div>
                <div className="performance-stat-value performance-stat-value-green">{performanceData.successfulReferrals}</div>
              </div>
              <div className="performance-stat-card performance-stat-card-purple">
                <div className="performance-stat-label">Rewards Issued</div>
                <div className="performance-stat-value">{performanceData.rewardsIssued}</div>
              </div>
              <div className="performance-stat-card performance-stat-card-yellow">
                <div className="performance-stat-label">Total Rewards Value</div>
                <div className="performance-stat-value">{formatCurrency(performanceData.totalRewardsValue)}</div>
              </div>
            </div>

            <div className="conversion-rate-container">
              <div className="conversion-rate-label">Conversion Rate</div>
              <div className="conversion-rate-bar-container">
                <div className="conversion-rate-track">
                  <div
                    className="conversion-rate-fill"
                    style={{
                      width: `${performanceData.conversionRate || 0}%`
                    }}
                  />
                </div>
                <div className="conversion-rate-percentage">{performanceData.conversionRate || 0}%</div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
};

export default IncentivePrograms;
