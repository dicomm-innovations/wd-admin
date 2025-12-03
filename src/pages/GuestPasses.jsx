import { useState, useEffect } from 'react';
import { UserPlus, CheckCircle, XCircle, RefreshCw, FileText, Eye, Edit, Plus } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import StatCard from '../components/dashboard/StatCard';
import IndemnityFormSigner from '../components/indemnity/IndemnityFormSigner';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate, formatDateTime } from '../utils/formatters';
import { gymAPI, indemnityAPI } from '../services/api';

const GuestPasses = () => {
  const [guestPasses, setGuestPasses] = useState([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, used: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  // Modal states
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPass, setSelectedPass] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Indemnity form modal states
  const [showIndemnityModal, setShowIndemnityModal] = useState(false);
  const [selectedPassForIndemnity, setSelectedPassForIndemnity] = useState(null);
  const [selectedIndemnityForm, setSelectedIndemnityForm] = useState(null);

  // Form states for Create/Edit
  const [formData, setFormData] = useState({
    membershipId: '',
    walkIn: false,
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    validDate: new Date().toISOString().split('T')[0],
    restrictions: {
      gymOnly: true,
      noClasses: false,
      timeLimit: null
    }
  });

  // Memberships for dropdown
  const [memberships, setMemberships] = useState([]);
  const [loadingMemberships, setLoadingMemberships] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    used: 0,
    expired: 0
  });

  const { success, error: showError } = useNotification();

  useEffect(() => {
    fetchGuestPasses();
  }, [filters]);

  const fetchGuestPasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;

      const [passesRes, summaryRes] = await Promise.all([
        gymAPI.getAllGuestPasses(params),
        gymAPI.getGuestPassSummary ? gymAPI.getGuestPassSummary() : Promise.resolve(null)
      ]);

      if (passesRes?.success) {
        const passes = passesRes.guestPasses || passesRes.data?.guestPasses || [];
        const summaryPayload = passesRes.summary || passesRes.data?.summary || summaryRes?.data || summaryRes?.summary;
        setGuestPasses(passes);

        const computed = {
          total: passes.length,
          active: passes.filter(p => p.status === 'active').length,
          used: passes.filter(p => p.status === 'used').length,
          expired: passes.filter(p => p.status === 'expired').length
        };

        const merged = summaryPayload ? {
          total: summaryPayload.totalPasses ?? summaryPayload.total ?? computed.total,
          active: summaryPayload.activePasses ?? summaryPayload.active ?? computed.active,
          used: summaryPayload.usedPasses ?? summaryPayload.used ?? computed.used,
          expired: summaryPayload.expiredPasses ?? summaryPayload.expired ?? computed.expired
        } : computed;

        setStats(merged);
        setSummary(merged);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch guest passes:', err);
      setError(err.message || 'Failed to load guest passes');
      showError('Failed to load guest passes');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGuestPasses();
    setRefreshing(false);
    success('Guest passes refreshed');
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleValidate = async (pass) => {
    setSelectedPass(pass);
    setValidationResult(null);
    setShowValidateModal(true);

    try {
      const result = await gymAPI.checkGuestPassValidity(pass.passId);
      setValidationResult(result);
    } catch (err) {
      setValidationResult({
        valid: false,
        reason: err.message || 'Failed to check validity'
      });
    }
  };

  const handleCheckIn = async () => {
    if (!selectedPass) return;

    try {
      setSubmitting(true);
      await gymAPI.validateGuestPass(selectedPass.passId);
      success('Guest checked in successfully!');
      setShowValidateModal(false);
      fetchGuestPasses();
    } catch (err) {
      showError(`Check-in failed: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelClick = (pass) => {
    setSelectedPass(pass);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPass || !cancelReason.trim()) return;

    try {
      setSubmitting(true);
      await gymAPI.cancelGuestPass(selectedPass.passId, cancelReason);
      success('Guest pass cancelled successfully');
      setShowCancelModal(false);
      fetchGuestPasses();
    } catch (err) {
      showError(`Failed to cancel: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewIndemnityForm = async (pass) => {
    try {
      // Guest passes might not have a customer ID, use guest name as identifier
      const response = await indemnityAPI.getByServiceType('guest_pass', {
        guestPassId: pass._id || pass.id
      });

      const forms = response?.data?.data || [];
      if (forms.length > 0) {
        setSelectedIndemnityForm(forms[0]);
      } else {
        setSelectedIndemnityForm(null);
      }

      setSelectedPassForIndemnity(pass);
      setShowIndemnityModal(true);
    } catch (err) {
      // No form exists, prompt to create one
      setSelectedPassForIndemnity(pass);
      setSelectedIndemnityForm(null);
      setShowIndemnityModal(true);
    }
  };

  const handleSignIndemnityForm = async (formData) => {
    try {
      const customerId = selectedPassForIndemnity?.member?._id ||
        selectedPassForIndemnity?.member ||
        selectedPassForIndemnity?.memberId ||
        null;

      await indemnityAPI.createGuestPassForm({
        ...formData,
        customer: customerId || undefined,
        guestPass: selectedPassForIndemnity._id || selectedPassForIndemnity.id || selectedPassForIndemnity.passId,
        guestName: selectedPassForIndemnity.guestName,
        guestDetails: {
          name: selectedPassForIndemnity.guestName,
          email: selectedPassForIndemnity.guestEmail || '',
          phone: selectedPassForIndemnity.guestPhone || ''
        }
      });

      success('Guest pass liability waiver signed successfully!');
      setShowIndemnityModal(false);
      setSelectedPassForIndemnity(null);
      setSelectedIndemnityForm(null);
      fetchGuestPasses();
    } catch (err) {
      console.error('Failed to sign indemnity form:', err);
      showError('Failed to sign liability waiver');
      throw err;
    }
  };

  const fetchMemberships = async () => {
    try {
      setLoadingMemberships(true);
      const response = await gymAPI.getMemberships({ status: 'active' });
      if (response.success) {
        setMemberships(response.memberships || []);
      }
    } catch (err) {
      console.error('Failed to fetch memberships:', err);
      showError('Failed to load memberships');
    } finally {
      setLoadingMemberships(false);
    }
  };

  const handleCreateClick = async () => {
    await fetchMemberships();
    setFormData({
      membershipId: '',
      guestName: '',
      guestPhone: '',
      guestEmail: '',
      validDate: new Date().toISOString().split('T')[0],
      restrictions: {
        gymOnly: true,
        noClasses: false,
        timeLimit: null
      }
    });
    setShowCreateModal(true);
  };

  const handleEditClick = async (pass) => {
    await fetchMemberships();
    setSelectedPass(pass);
    setFormData({
      membershipId: pass.generatedBy?._id || pass.generatedBy,
      guestName: pass.guestName,
      guestPhone: pass.guestPhone || '',
      guestEmail: pass.guestEmail || '',
      validDate: new Date(pass.validDate).toISOString().split('T')[0],
      restrictions: {
        gymOnly: pass.restrictions?.gymOnly ?? true,
        noClasses: pass.restrictions?.noClasses ?? false,
        timeLimit: pass.restrictions?.timeLimit || null
      }
    });
    setShowEditModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('restrictions.')) {
      const restrictionField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        restrictions: {
          ...prev.restrictions,
          [restrictionField]: type === 'checkbox' ? checked : value === '' ? null : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if ((!formData.walkIn && !formData.membershipId) || !formData.guestName) return;

    try {
      setSubmitting(true);
      const payload = {
        guestDetails: {
          guestName: formData.guestName,
          guestPhone: formData.guestPhone,
          guestEmail: formData.guestEmail,
          validDate: formData.validDate,
          restrictions: formData.restrictions
        }
      };
      if (!formData.walkIn) {
        payload.membershipId = formData.membershipId;
      }
      await gymAPI.createGuestPass(payload);
      success('Guest pass created successfully!');
      setShowCreateModal(false);
      fetchGuestPasses();
    } catch (err) {
      showError(`Failed to create guest pass: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPass || !formData.guestName) return;

    try {
      setSubmitting(true);
      await gymAPI.updateGuestPass(selectedPass.passId, {
        guestName: formData.guestName,
        guestPhone: formData.guestPhone,
        guestEmail: formData.guestEmail,
        validDate: formData.validDate,
        restrictions: formData.restrictions
      });
      success('Guest pass updated successfully!');
      setShowEditModal(false);
      fetchGuestPasses();
    } catch (err) {
      showError(`Failed to update guest pass: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'passId',
      header: 'Pass ID',
      render: (value) => <span className="customer-id">{value}</span>
    },
    {
      key: 'guestName',
      header: 'Guest Name',
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          {row.guestPhone && (
            <div className="text-sm text-gray-500">{row.guestPhone}</div>
          )}
        </div>
      )
    },
    {
      key: 'memberName',
      header: 'Member',
      render: (value) => value || 'N/A'
    },
    {
      key: 'membershipNumber',
      header: 'Membership',
      render: (value, row) => (
        <div>
          <div>{value || 'N/A'}</div>
          {row.membershipType && (
            <Badge variant="default" className="text-xs capitalize">
              {row.membershipType}
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'validDate',
      header: 'Valid Date',
      render: (value) => formatDate(value)
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => {
        const variants = {
          active: 'success',
          used: 'primary',
          expired: 'error',
          cancelled: 'default'
        };
        return <Badge variant={variants[value] || 'default'}>{value}</Badge>;
      }
    },
    {
      key: 'usedAt',
      header: 'Used At',
      render: (value) => value ? formatDateTime(value) : '-'
    },
    {
      key: 'indemnityFormSigned',
      header: 'Liability Waiver',
      render: (value, row) => (
        <div className="flex items-center gap-xs">
          {value ? (
            <Badge variant="success">Signed</Badge>
          ) : (
            <Badge variant="warning">Not Signed</Badge>
          )}
          <Button
            variant="secondary"
            size="small"
            icon={value ? Eye : FileText}
            onClick={() => handleViewIndemnityForm(row)}
          >
            {value ? 'View' : 'Sign'}
          </Button>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, pass) => (
        <div className="flex gap-2">
          {pass.status === 'active' && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleValidate(pass)}
              >
                Validate
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={Edit}
                onClick={() => handleEditClick(pass)}
              >
                Edit
              </Button>
              <Button
                variant="error"
                size="sm"
                onClick={() => handleCancelClick(pass)}
              >
                Cancel
              </Button>
            </>
          )}
          {pass.status !== 'active' && (
            <span className="text-gray-400 text-sm">No actions</span>
          )}
        </div>
      )
    }
  ];

  return (
    <Layout title="Guest Passes" subtitle="Manage gym member guest passes">
      {error && (
        <div className="alert alert-error mb-lg">
          {error}
        </div>
      )}

      <div className="page-header mb-lg">
        <div className="flex gap-md">
          <Button
            variant="primary"
            icon={Plus}
            onClick={handleCreateClick}
          >
            Create Guest Pass
          </Button>
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={handleRefresh}
            loading={refreshing}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-4 mb-xl">
        <StatCard
          title="Total Passes"
          value={stats.total.toString()}
          icon={UserPlus}
          color="var(--primary-color)"
        />
        <StatCard
          title="Active"
          value={stats.active.toString()}
          icon={CheckCircle}
          color="var(--success)"
        />
        <StatCard
          title="Used"
          value={stats.used.toString()}
          icon={CheckCircle}
          color="var(--primary-color)"
        />
        <StatCard
          title="Expired"
          value={stats.expired.toString()}
          icon={XCircle}
          color="var(--error)"
        />
      </div>

      {/* Filters Card */}
      <Card className="mb-lg">
        <div className="grid grid-3 gap-md">
          <div>
            <label className="form-label">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="form-input"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="used">Used</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="form-label">Search</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by guest name, pass ID..."
              className="form-input"
            />
          </div>

          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={() => setFilters({ status: '', search: '' })}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Guest Passes Table */}
      <Card>
        <Table
          columns={columns}
          data={guestPasses}
          loading={loading}
          searchable={false}
          emptyMessage="No guest passes found"
        />
      </Card>

      {/* Validate Modal */}
      {showValidateModal && selectedPass && (
        <Modal
          isOpen={showValidateModal}
          onClose={() => setShowValidateModal(false)}
          title="Validate Guest Pass"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Pass Details</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <div><span className="font-medium">Pass ID:</span> {selectedPass.passId}</div>
                <div><span className="font-medium">Guest Name:</span> {selectedPass.guestName}</div>
                <div><span className="font-medium">Valid Until:</span> {formatDate(selectedPass.validDate)}</div>
              </div>
            </div>

            {validationResult && (
              <div className={`p-4 rounded-lg ${validationResult.valid ? 'bg-green-50' : 'bg-red-50'}`}>
                <h4 className={`font-medium mb-2 ${validationResult.valid ? 'text-green-900' : 'text-red-900'}`}>
                  {validationResult.valid ? 'Pass is Valid' : 'Pass is Invalid'}
                </h4>
                {!validationResult.valid && (
                  <p className="text-sm text-red-700">
                    Reason: {validationResult.reason}
                  </p>
                )}
                {validationResult.valid && validationResult.guestPass && (
                  <div className="text-sm text-green-700 space-y-1">
                    <div>Guest: {validationResult.guestPass.guestName}</div>
                    {validationResult.guestPass.restrictions && (
                      <div className="mt-2">
                        <div className="font-medium">Restrictions:</div>
                        <ul className="list-disc list-inside ml-2">
                          {validationResult.guestPass.restrictions.gymOnly && (
                            <li>Gym access only</li>
                          )}
                          {validationResult.guestPass.restrictions.noClasses && (
                            <li>No class access</li>
                          )}
                          {validationResult.guestPass.restrictions.timeLimit && (
                            <li>Time limit: {validationResult.guestPass.restrictions.timeLimit} hours</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => setShowValidateModal(false)}
              >
                Close
              </Button>
              {validationResult?.valid && (
                <Button
                  variant="primary"
                  onClick={handleCheckIn}
                  loading={submitting}
                  icon={CheckCircle}
                >
                  Check In Guest
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedPass && (
        <Modal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Cancel Guest Pass"
        >
          <form onSubmit={handleCancelSubmit} className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                You are about to cancel guest pass <strong>{selectedPass.passId}</strong> for <strong>{selectedPass.guestName}</strong>.
              </p>
            </div>

            <div>
              <label className="form-label">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                required
                rows={3}
                placeholder="Enter reason for cancellation..."
                className="form-input"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCancelModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="error"
                loading={submitting}
                disabled={!cancelReason.trim()}
                icon={XCircle}
              >
                Confirm Cancellation
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Indemnity Form Modal */}
      <Modal
        isOpen={showIndemnityModal}
        onClose={() => {
          setShowIndemnityModal(false);
          setSelectedPassForIndemnity(null);
          setSelectedIndemnityForm(null);
        }}
        title={selectedIndemnityForm ? 'View Liability Waiver' : 'Sign Liability Waiver'}
        size="large"
      >
        {selectedPassForIndemnity && (
          <IndemnityFormSigner
            serviceType="guest_pass"
            customer={{
              firstName: selectedPassForIndemnity.guestName?.split(' ')[0] || 'Guest',
              lastName: selectedPassForIndemnity.guestName?.split(' ').slice(1).join(' ') || '',
              email: selectedPassForIndemnity.guestEmail,
              phone: selectedPassForIndemnity.guestPhone
            }}
            existingForm={selectedIndemnityForm}
            readOnly={!!selectedIndemnityForm}
            onSign={handleSignIndemnityForm}
            onCancel={() => {
              setShowIndemnityModal(false);
              setSelectedPassForIndemnity(null);
              setSelectedIndemnityForm(null);
            }}
          />
        )}
      </Modal>

      {/* Create Guest Pass Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Guest Pass"
        size="medium"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="form-label">Guest Type</label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="walkIn"
                checked={formData.walkIn}
                onChange={(e) => {
                  handleFormChange(e);
                  if (e.target.checked) {
                    setFormData(prev => ({ ...prev, membershipId: '' }));
                  }
                }}
                className="form-checkbox"
              />
              Walk-in guest (no membership)
            </label>
          </div>

          {!formData.walkIn && (
            <div>
              <label className="form-label">
                Membership <span className="text-red-500">*</span>
              </label>
              <select
                name="membershipId"
                value={formData.membershipId}
                onChange={handleFormChange}
                className="form-input"
                disabled={loadingMemberships}
              >
                <option value="">Select a membership</option>
                {memberships.map(membership => (
                  <option key={membership._id} value={membership._id}>
                    {membership.membershipNumber} - {membership.customer?.firstName} {membership.customer?.lastName} ({membership.type})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="form-label">
              Guest Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="guestName"
              value={formData.guestName}
              onChange={handleFormChange}
              required
              placeholder="Enter guest name"
              className="form-input"
            />
          </div>

          <div className="grid grid-2 gap-md">
            <div>
              <label className="form-label">Guest Phone</label>
              <input
                type="tel"
                name="guestPhone"
                value={formData.guestPhone}
                onChange={handleFormChange}
                placeholder="Enter phone number"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Guest Email</label>
              <input
                type="email"
                name="guestEmail"
                value={formData.guestEmail}
                onChange={handleFormChange}
                placeholder="Enter email address"
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label className="form-label">
              Valid Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="validDate"
              value={formData.validDate}
              onChange={handleFormChange}
              required
              className="form-input"
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Restrictions</h4>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="restrictions.gymOnly"
                  checked={formData.restrictions.gymOnly}
                  onChange={handleFormChange}
                  className="form-checkbox"
                />
                <span className="text-sm">Gym Access Only</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="restrictions.noClasses"
                  checked={formData.restrictions.noClasses}
                  onChange={handleFormChange}
                  className="form-checkbox"
                />
                <span className="text-sm">No Class Access</span>
              </label>

              <div>
                <label className="form-label text-sm">Time Limit (hours)</label>
                <input
                  type="number"
                  name="restrictions.timeLimit"
                  value={formData.restrictions.timeLimit || ''}
                  onChange={handleFormChange}
                  placeholder="No limit"
                  min="1"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={(!formData.walkIn && !formData.membershipId) || !formData.guestName}
              icon={Plus}
            >
              Create Guest Pass
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Guest Pass Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Guest Pass"
        size="medium"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {selectedPass && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-blue-900 mb-2">Pass Details</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <div><span className="font-medium">Pass ID:</span> {selectedPass.passId}</div>
                <div><span className="font-medium">Status:</span> {selectedPass.status}</div>
              </div>
            </div>
          )}

          <div>
            <label className="form-label">
              Guest Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="guestName"
              value={formData.guestName}
              onChange={handleFormChange}
              required
              placeholder="Enter guest name"
              className="form-input"
            />
          </div>

          <div className="grid grid-2 gap-md">
            <div>
              <label className="form-label">Guest Phone</label>
              <input
                type="tel"
                name="guestPhone"
                value={formData.guestPhone}
                onChange={handleFormChange}
                placeholder="Enter phone number"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Guest Email</label>
              <input
                type="email"
                name="guestEmail"
                value={formData.guestEmail}
                onChange={handleFormChange}
                placeholder="Enter email address"
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label className="form-label">
              Valid Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="validDate"
              value={formData.validDate}
              onChange={handleFormChange}
              required
              className="form-input"
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Restrictions</h4>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="restrictions.gymOnly"
                  checked={formData.restrictions.gymOnly}
                  onChange={handleFormChange}
                  className="form-checkbox"
                />
                <span className="text-sm">Gym Access Only</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="restrictions.noClasses"
                  checked={formData.restrictions.noClasses}
                  onChange={handleFormChange}
                  className="form-checkbox"
                />
                <span className="text-sm">No Class Access</span>
              </label>

              <div>
                <label className="form-label text-sm">Time Limit (hours)</label>
                <input
                  type="number"
                  name="restrictions.timeLimit"
                  value={formData.restrictions.timeLimit || ''}
                  onChange={handleFormChange}
                  placeholder="No limit"
                  min="1"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={!formData.guestName}
              icon={Edit}
            >
              Update Guest Pass
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default GuestPasses;
