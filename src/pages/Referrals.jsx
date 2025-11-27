import { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Clock, Gift, RefreshCw, Download, Eye } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatCard from '../components/dashboard/StatCard';
import Modal from '../components/common/Modal';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate, formatCurrency } from '../utils/formatters';
import { referralAdminAPI } from '../services/api';
import './Referrals.css';

const Referrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processAction, setProcessAction] = useState('approve');
  const [processReason, setProcessReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    referrerName: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    rewarded: 0
  });

  const { success, error: showError, info } = useNotification();

  useEffect(() => {
    fetchReferrals();
  }, [filters]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const params = {};

      if (filters.status) params.status = filters.status;
      if (filters.referrerName) params.referrerName = filters.referrerName;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      params.page = filters.page;
      params.limit = filters.limit;

      const response = await referralAdminAPI.getAllReferrals(params);

      if (response) {
        setReferrals(response.referrals || []);
        calculateStats(response.referrals || []);
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch referrals:', err);
      showError('Failed to load referrals');
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    setStats({
      total: data.length,
      pending: data.filter(r => r.status === 'pending').length,
      completed: data.filter(r => r.status === 'completed').length,
      rewarded: data.filter(r => r.status === 'rewarded').length
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReferrals();
    setRefreshing(false);
    info('Referrals refreshed');
  };

  const handleViewDetails = async (referral) => {
    try {
      const response = await referralAdminAPI.getReferralDetails(referral._id);
      setSelectedReferral(response);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Failed to fetch referral details:', err);
      showError('Failed to load referral details');
    }
  };

  const handleOpenProcessModal = (referral, action) => {
    setSelectedReferral(referral);
    setProcessAction(action);
    setProcessReason('');
    setShowProcessModal(true);
  };

  const handleProcessReferral = async (e) => {
    e.preventDefault();

    if (!selectedReferral) return;

    try {
      setProcessing(true);
      const response = await referralAdminAPI.processReferral(selectedReferral._id, {
        action: processAction,
        reason: processReason
      });

      if (response) {
        success(`Referral ${processAction === 'approve' ? 'approved' : 'rejected'} successfully`);
        setShowProcessModal(false);
        setSelectedReferral(null);
        setProcessReason('');
        await fetchReferrals();
      }

      setProcessing(false);
    } catch (err) {
      console.error('Failed to process referral:', err);
      showError(`Failed to ${processAction} referral`);
      setProcessing(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      referrerName: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10
    });
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    info('Export functionality coming soon');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'warning', label: 'Pending' },
      completed: { variant: 'info', label: 'Completed' },
      rewarded: { variant: 'success', label: 'Rewarded' },
      expired: { variant: 'default', label: 'Expired' },
      cancelled: { variant: 'danger', label: 'Cancelled' }
    };

    const config = statusConfig[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRewardTypeBadge = (type) => {
    const typeConfig = {
      credit: { variant: 'success', label: 'Credit' },
      discount: { variant: 'info', label: 'Discount' },
      points: { variant: 'warning', label: 'Points' },
      freebie: { variant: 'primary', label: 'Freebie' }
    };

    const config = typeConfig[type] || { variant: 'default', label: type };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading && referrals.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Referral Management" subtitle="Manage customer referrals and rewards">
      <div className="referrals-page">
        {/* Header */}
        <div className="referrals-header">
          <h1>Referral Management</h1>
          <div className="referrals-actions">
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
              variant="outline"
              onClick={handleExport}
              icon={Download}
            >
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="referrals-stats">
          <StatCard
            title="Total Referrals"
            value={stats.total}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Rewarded"
            value={stats.rewarded}
            icon={Gift}
            color="purple"
          />
        </div>

        {/* Filters */}
        <Card className="referrals-filters">
          <Card.Body>
            <div className="filter-grid">
              <div className="filter-field">
                <label>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="rewarded">Rewarded</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="filter-field">
                <label>Referrer Name</label>
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={filters.referrerName}
                  onChange={(e) => setFilters({ ...filters, referrerName: e.target.value, page: 1 })}
                />
              </div>

              <div className="filter-field">
                <label>Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
                />
              </div>

              <div className="filter-field">
                <label>End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
                />
              </div>
            </div>

            {(filters.status || filters.referrerName || filters.startDate || filters.endDate) && (
              <div className="filter-actions">
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Referrals Table */}
        <Card className="referrals-table-container">
          <Card.Body>
            {referrals.length === 0 ? (
              <div className="empty-state">
                No referrals found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="referrals-table">
                  <thead>
                    <tr>
                      <th>Referrer</th>
                      <th>Referee</th>
                      <th>Code</th>
                      <th>Status</th>
                      <th>Rewards</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((referral) => (
                      <tr key={referral._id}>
                        <td>
                          <div className="referrer-info">
                            <div className="referrer-name">
                              {referral.referrer?.firstName} {referral.referrer?.lastName}
                            </div>
                            <div className="referrer-email">{referral.referrer?.email}</div>
                          </div>
                        </td>
                        <td>
                          <div className="referee-info">
                            <div className="referee-name">
                              {referral.referee?.firstName} {referral.referee?.lastName}
                            </div>
                            <div className="referee-email">{referral.referee?.email}</div>
                          </div>
                        </td>
                        <td>
                          <code className="referral-code">
                            {referral.referralCode}
                          </code>
                        </td>
                        <td>
                          {getStatusBadge(referral.status)}
                        </td>
                        <td>
                          <div className="rewards-info">
                            {referral.referrerReward && (
                              <div className="reward-item">
                                <span className="reward-label">Referrer:</span>
                                {getRewardTypeBadge(referral.referrerReward.type)}
                                <span>
                                  {referral.referrerReward.type === 'credit' || referral.referrerReward.type === 'discount'
                                    ? formatCurrency(referral.referrerReward.amount)
                                    : `${referral.referrerReward.amount} pts`}
                                </span>
                              </div>
                            )}
                            {referral.refereeReward && (
                              <div className="reward-item">
                                <span className="reward-label">Referee:</span>
                                {getRewardTypeBadge(referral.refereeReward.type)}
                                <span>
                                  {referral.refereeReward.type === 'credit' || referral.refereeReward.type === 'discount'
                                    ? formatCurrency(referral.refereeReward.amount)
                                    : `${referral.refereeReward.amount} pts`}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          {formatDate(referral.createdAt)}
                        </td>
                        <td>
                          <div className="table-actions">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(referral)}
                              icon={Eye}
                            >
                              View
                            </Button>
                            {referral.status === 'completed' && (
                              <>
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleOpenProcessModal(referral, 'approve')}
                                  icon={CheckCircle}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleOpenProcessModal(referral, 'reject')}
                                  icon={XCircle}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Pagination */}
        <div className="referrals-pagination">
          <div className="pagination-info">
            Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, stats.total)} of {stats.total} referrals
          </div>
          <div className="pagination-controls">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              disabled={filters.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              disabled={referrals.length < filters.limit}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedReferral && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedReferral(null);
          }}
          title="Referral Details"
        >
          {/* Referrer Info */}
          <div className="modal-section">
            <h4 className="modal-section-title">Referrer Information</h4>
            <div className="modal-info-grid">
              <div className="modal-info-row">
                <span className="modal-info-label">Name:</span>
                <span className="modal-info-value">
                  {selectedReferral.referrer?.firstName} {selectedReferral.referrer?.lastName}
                </span>
              </div>
              <div className="modal-info-row">
                <span className="modal-info-label">Email:</span>
                <span className="modal-info-value">{selectedReferral.referrer?.email}</span>
              </div>
              <div className="modal-info-row">
                <span className="modal-info-label">Phone:</span>
                <span className="modal-info-value">{selectedReferral.referrer?.phone}</span>
              </div>
            </div>
          </div>

          {/* Referee Info */}
          <div className="modal-section">
            <h4 className="modal-section-title">Referee Information</h4>
            <div className="modal-info-grid">
              <div className="modal-info-row">
                <span className="modal-info-label">Name:</span>
                <span className="modal-info-value">
                  {selectedReferral.referee?.firstName} {selectedReferral.referee?.lastName}
                </span>
              </div>
              <div className="modal-info-row">
                <span className="modal-info-label">Email:</span>
                <span className="modal-info-value">{selectedReferral.referee?.email}</span>
              </div>
              <div className="modal-info-row">
                <span className="modal-info-label">Phone:</span>
                <span className="modal-info-value">{selectedReferral.referee?.phone}</span>
              </div>
            </div>
          </div>

          {/* Referral Info */}
          <div className="modal-section">
            <h4 className="modal-section-title">Referral Information</h4>
            <div className="modal-info-grid">
              <div className="modal-info-row">
                <span className="modal-info-label">Code:</span>
                <code className="referral-code">{selectedReferral.referralCode}</code>
              </div>
              <div className="modal-info-row">
                <span className="modal-info-label">Status:</span>
                {getStatusBadge(selectedReferral.status)}
              </div>
              <div className="modal-info-row">
                <span className="modal-info-label">Created:</span>
                <span className="modal-info-value">{formatDate(selectedReferral.createdAt)}</span>
              </div>
              {selectedReferral.completedAt && (
                <div className="modal-info-row">
                  <span className="modal-info-label">Completed:</span>
                  <span className="modal-info-value">{formatDate(selectedReferral.completedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Rewards */}
          {(selectedReferral.referrerReward || selectedReferral.refereeReward) && (
            <div className="modal-section">
              <h4 className="modal-section-title">Rewards</h4>
              {selectedReferral.referrerReward && (
                <div className="reward-card mb-md">
                  <div className="reward-card-title">Referrer Reward</div>
                  <div className="modal-info-grid">
                    <div className="modal-info-row">
                      <span className="modal-info-label">Type:</span>
                      {getRewardTypeBadge(selectedReferral.referrerReward.type)}
                    </div>
                    <div className="modal-info-row">
                      <span className="modal-info-label">Amount:</span>
                      <span className="modal-info-value">
                        {selectedReferral.referrerReward.type === 'credit' || selectedReferral.referrerReward.type === 'discount'
                          ? formatCurrency(selectedReferral.referrerReward.amount)
                          : `${selectedReferral.referrerReward.amount} points`}
                      </span>
                    </div>
                    <div className="modal-info-row">
                      <span className="modal-info-label">Status:</span>
                      <Badge variant={selectedReferral.referrerReward.status === 'issued' ? 'success' : 'warning'}>
                        {selectedReferral.referrerReward.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {selectedReferral.refereeReward && (
                <div className="reward-card">
                  <div className="reward-card-title">Referee Reward</div>
                  <div className="modal-info-grid">
                    <div className="modal-info-row">
                      <span className="modal-info-label">Type:</span>
                      {getRewardTypeBadge(selectedReferral.refereeReward.type)}
                    </div>
                    <div className="modal-info-row">
                      <span className="modal-info-label">Amount:</span>
                      <span className="modal-info-value">
                        {selectedReferral.refereeReward.type === 'credit' || selectedReferral.refereeReward.type === 'discount'
                          ? formatCurrency(selectedReferral.refereeReward.amount)
                          : `${selectedReferral.refereeReward.amount} points`}
                      </span>
                    </div>
                    <div className="modal-info-row">
                      <span className="modal-info-label">Status:</span>
                      <Badge variant={selectedReferral.refereeReward.status === 'issued' ? 'success' : 'warning'}>
                        {selectedReferral.refereeReward.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* Process Modal */}
      {showProcessModal && selectedReferral && (
        <Modal
          isOpen={showProcessModal}
          onClose={() => {
            setShowProcessModal(false);
            setSelectedReferral(null);
            setProcessReason('');
          }}
          title={`${processAction === 'approve' ? 'Approve' : 'Reject'} Referral`}
        >
          <form onSubmit={handleProcessReferral}>
            <p className="modal-description">
              Are you sure you want to {processAction} this referral?
            </p>

            <div className="process-modal-warning">
              <div className="process-modal-info">
                <div><strong>Referrer:</strong> {selectedReferral.referrer?.firstName} {selectedReferral.referrer?.lastName}</div>
                <div><strong>Referee:</strong> {selectedReferral.referee?.firstName} {selectedReferral.referee?.lastName}</div>
                <div><strong>Code:</strong> {selectedReferral.referralCode}</div>
              </div>
            </div>

            <div className="form-field">
              <label>
                Reason {processAction === 'reject' ? '(Required)' : '(Optional)'}
              </label>
              <textarea
                rows="3"
                value={processReason}
                onChange={(e) => setProcessReason(e.target.value)}
                placeholder={`Enter reason for ${processAction}ing this referral...`}
                required={processAction === 'reject'}
              />
            </div>

            <div className="modal-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowProcessModal(false);
                  setSelectedReferral(null);
                  setProcessReason('');
                }}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={processAction === 'approve' ? 'success' : 'danger'}
                disabled={processing}
              >
                {processing ? 'Processing...' : processAction === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
};

export default Referrals;
