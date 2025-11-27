import { useState, useEffect, useMemo } from 'react';
import { Package, DollarSign, AlertCircle, RefreshCw, CheckCircle, Plus, Clock } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import StatCard from '../components/dashboard/StatCard';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate, formatCurrency } from '../utils/formatters';
import { equipmentRentalAPI, customerAPI, inventoryAPI } from '../services/api';

const EquipmentRental = () => {
  const [rentals, setRentals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [equipmentItems, setEquipmentItems] = useState([]);
  const [returnData, setReturnData] = useState({
    condition: 'good',
    damageFee: 0,
    notes: ''
  });
  const [createData, setCreateData] = useState({
    customerId: '',
    equipmentItemId: '',
    rentalPeriod: 7,
    deposit: 0,
    dailyRate: 0,
    notes: ''
  });
  const [extendData, setExtendData] = useState({
    additionalDays: 7,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const { success, error: showError, info } = useNotification();

  useEffect(() => {
    loadEquipmentData(statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    loadCustomersAndEquipment();
  }, []);

  const loadEquipmentData = async (filterValue = statusFilter) => {
    const errors = [];

    try {
      setLoading(true);

      const params = filterValue !== 'all' ? { status: filterValue } : {};

      const [rentalsResult, statsResult] = await Promise.allSettled([
        equipmentRentalAPI.getRentals(params),
        equipmentRentalAPI.getStatistics()
      ]);

      if (rentalsResult.status === 'fulfilled') {
        const payload = rentalsResult.value;
        const rentalData =
          Array.isArray(payload?.data) ? payload.data :
          Array.isArray(payload?.rentals) ? payload.rentals :
          [];
        setRentals(rentalData);
      } else {
        console.error('Failed to fetch equipment rentals:', rentalsResult.reason);
        errors.push('rentals');
        setRentals([]);
      }

      if (statsResult.status === 'fulfilled') {
        const payload = statsResult.value;
        setStats(payload?.data || payload || null);
      } else {
        console.error('Failed to fetch rental statistics:', statsResult.reason);
        errors.push('statistics');
        setStats(null);
      }

      if (errors.length) {
        const message = `Failed to load ${errors.join(', ')}.`;
        showError(message.charAt(0).toUpperCase() + message.slice(1));
      }
    } catch (error) {
      console.error('Unexpected error loading equipment rental data:', error);
      showError('Failed to load equipment rental data');
      setRentals([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomersAndEquipment = async () => {
    try {
      const [customersResult, equipmentResult] = await Promise.allSettled([
        customerAPI.getAll(),
        inventoryAPI.getItems({ category: 'gym_equipment' })
      ]);

      if (customersResult.status === 'fulfilled') {
        const payload = customersResult.value;
        const customerData = Array.isArray(payload?.data) ? payload.data :
          Array.isArray(payload?.customers) ? payload.customers : [];
        setCustomers(customerData);
      }

      if (equipmentResult.status === 'fulfilled') {
        const payload = equipmentResult.value;
        const equipmentData = Array.isArray(payload?.data) ? payload.data :
          Array.isArray(payload?.equipment) ? payload.equipment : [];
        setEquipmentItems(equipmentData.filter(item => item.status === 'available'));
      }
    } catch (error) {
      console.error('Error loading customers and equipment:', error);
    }
  };

  const handleReturnEquipment = async () => {
    if (!selectedRental || submitting) return;

    try {
      setSubmitting(true);
      await equipmentRentalAPI.returnEquipment(selectedRental._id, {
        ...returnData,
        damageFee: Number(returnData.damageFee) || 0
      });

      success('Equipment returned successfully');
      closeReturnModal();
      await loadEquipmentData();
    } catch (error) {
      console.error('Failed to return equipment:', error);
      const message = typeof error === 'string'
        ? error
        : error?.message || 'Failed to return equipment';
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEquipmentData();
    setRefreshing(false);
    info('Equipment rentals refreshed');
  };

  const openReturnModal = (rental) => {
    setSelectedRental(rental);
    setReturnData({
      condition: 'good',
      damageFee: 0,
      notes: ''
    });
    setShowReturnModal(true);
  };

  const closeReturnModal = () => {
    setShowReturnModal(false);
    setSelectedRental(null);
    setReturnData({
      condition: 'good',
      damageFee: 0,
      notes: ''
    });
  };

  const handleConditionChange = (value) => {
    setReturnData((prev) => ({
      ...prev,
      condition: value,
      damageFee: value === 'damaged' || value === 'lost' ? prev.damageFee : 0
    }));
  };

  const handleDamageFeeChange = (value) => {
    const parsed = Number(value);
    setReturnData((prev) => ({
      ...prev,
      damageFee: Number.isFinite(parsed) && parsed > 0 ? parsed : 0
    }));
  };

  const openCreateModal = () => {
    setCreateData({
      customerId: '',
      equipmentItemId: '',
      rentalPeriod: 7,
      deposit: 0,
      dailyRate: 0,
      notes: ''
    });
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateData({
      customerId: '',
      equipmentItemId: '',
      rentalPeriod: 7,
      deposit: 0,
      dailyRate: 0,
      notes: ''
    });
  };

  const handleCreateRental = async () => {
    if (!createData.customerId || !createData.equipmentItemId || submitting) return;

    try {
      setSubmitting(true);
      await equipmentRentalAPI.createRental({
        customerId: createData.customerId,
        equipmentItemId: createData.equipmentItemId,
        rentalPeriod: Number(createData.rentalPeriod) || 7,
        deposit: Number(createData.deposit) || 0,
        dailyRate: Number(createData.dailyRate) || 0,
        notes: createData.notes
      });

      success('Equipment rental created successfully');
      closeCreateModal();
      await loadEquipmentData();
      await loadCustomersAndEquipment();
    } catch (error) {
      console.error('Failed to create rental:', error);
      const message = typeof error === 'string'
        ? error
        : error?.message || 'Failed to create rental';
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const openExtendModal = (rental) => {
    setSelectedRental(rental);
    setExtendData({
      additionalDays: 7,
      notes: ''
    });
    setShowExtendModal(true);
  };

  const closeExtendModal = () => {
    setShowExtendModal(false);
    setSelectedRental(null);
    setExtendData({
      additionalDays: 7,
      notes: ''
    });
  };

  const handleExtendRental = async () => {
    if (!selectedRental || submitting) return;

    try {
      setSubmitting(true);
      await equipmentRentalAPI.extendRental(selectedRental._id, {
        additionalDays: Number(extendData.additionalDays) || 7,
        notes: extendData.notes
      });

      success('Rental period extended successfully');
      closeExtendModal();
      await loadEquipmentData();
    } catch (error) {
      console.error('Failed to extend rental:', error);
      const message = typeof error === 'string'
        ? error
        : error?.message || 'Failed to extend rental';
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'info',
      returned: 'success',
      overdue: 'warning',
      damaged: 'error',
      lost: 'error'
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {(status || 'unknown').toUpperCase()}
      </Badge>
    );
  };

  const refundAmount = useMemo(() => {
    if (!selectedRental) return 0;
    const depositAmount = selectedRental.deposit?.amount || 0;
    const damage = Number(returnData.damageFee) || 0;
    return Math.max(0, depositAmount - damage);
  }, [selectedRental, returnData.damageFee]);

  const columns = [
    {
      key: 'rentalId',
      header: 'Rental ID',
      render: (value) => <span className="font-mono text-sm">{value}</span>
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (_, rental) => {
        const firstName = rental.customer?.firstName || '';
        const lastName = rental.customer?.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim() || 'N/A';

        return (
          <div>
            <div className="text-sm font-medium">{fullName}</div>
            {rental.customer?.email && (
              <div className="text-xs text-gray">{rental.customer.email}</div>
            )}
          </div>
        );
      }
    },
    {
      key: 'equipmentItem',
      header: 'Equipment',
      render: (_, rental) => (
        <div>
          <div className="text-sm font-medium">{rental.equipmentItem?.name || 'N/A'}</div>
          {rental.equipmentItem?.sku && (
            <div className="text-xs text-gray">{rental.equipmentItem.sku}</div>
          )}
        </div>
      )
    },
    {
      key: 'rentalDate',
      header: 'Rental Date',
      render: (value) => formatDate(value)
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (value) => formatDate(value)
    },
    {
      key: 'deposit',
      header: 'Deposit',
      render: (value) => formatCurrency(value?.amount || 0)
    },
    {
      key: 'charges',
      header: 'Total Charges',
      render: (value) => (
        <span className="font-semibold text-success">
          {formatCurrency(value?.totalCharge || 0)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, rental) => (
        <div className="flex gap-sm">
          {rental.status === 'active' && (
            <>
              <Button
                size="sm"
                variant="outline"
                icon={Clock}
                onClick={() => openExtendModal(rental)}
              >
                Extend
              </Button>
              <Button
                size="sm"
                onClick={() => openReturnModal(rental)}
              >
                Process Return
              </Button>
            </>
          )}
          {rental.status === 'overdue' && (
            <Button
              size="sm"
              variant="error"
              onClick={() => openReturnModal(rental)}
            >
              Process Return
            </Button>
          )}
        </div>
      )
    }
  ];

  const filterButtons = [
    { value: 'all', label: 'All Rentals' },
    { value: 'active', label: 'Active' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'returned', label: 'Returned' },
    { value: 'damaged', label: 'Damaged' }
  ];

  return (
    <Layout title="Equipment Rental" subtitle="Track gym equipment rentals and returns">
      <div className="equipment-rental-page">
        {/* Stats */}
        {stats && (
          <div className="grid grid-4 mb-xl">
            <StatCard
              title="Active Rentals"
              value={stats.activeRentals || 0}
              icon={Package}
              color="var(--primary-color)"
            />
            <StatCard
              title="Overdue Rentals"
              value={stats.overdueRentals || 0}
              icon={AlertCircle}
              color="var(--error)"
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue || 0)}
              icon={DollarSign}
              color="var(--success-color)"
            />
            <StatCard
              title="Pending Returns"
              value={formatCurrency(stats.pendingDeposits || 0)}
              icon={CheckCircle}
              color="var(--warning-color)"
            />
          </div>
        )}

        {/* Filters and Actions */}
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-md">
            <div className="flex flex-wrap items-center gap-sm">
              {filterButtons.map((btn) => (
                <Button
                  key={btn.value}
                  variant={statusFilter === btn.value ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(btn.value)}
                >
                  {btn.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-sm">
              <Button
                icon={Plus}
                variant="primary"
                onClick={openCreateModal}
              >
                New Rental
              </Button>
              <Button
                icon={RefreshCw}
                variant="outline"
                onClick={handleRefresh}
                loading={refreshing}
              >
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        {/* Rentals Table */}
        <Card title="Equipment Rentals" icon={Package}>
          <Table
            columns={columns}
            data={rentals}
            loading={loading}
            emptyMessage="No equipment rentals found"
          />
        </Card>

        {/* Return Equipment Modal */}
        {showReturnModal && selectedRental && (
          <Modal
            isOpen={showReturnModal}
            onClose={closeReturnModal}
            title="Return Equipment"
            size="md"
            footer={
              <>
                <Button variant="outline" onClick={closeReturnModal}>
                  Cancel
                </Button>
                <Button onClick={handleReturnEquipment} loading={submitting}>
                  Process Return
                </Button>
              </>
            }
          >
            <div className="modal-sections">
              {/* Rental Information */}
              <div className="modal-section">
                <h4 className="modal-section-title">
                  Rental Information
                </h4>

                <div className="modal-info-grid">
                  <div className="modal-info-row">
                    <span className="modal-info-label">Rental ID:</span>
                    <span className="modal-info-value font-mono">{selectedRental.rentalId}</span>
                  </div>
                  <div className="modal-info-row">
                    <span className="modal-info-label">Equipment:</span>
                    <span className="modal-info-value">{selectedRental.equipmentItem?.name || 'N/A'}</span>
                  </div>
                  <div className="modal-info-row">
                    <span className="modal-info-label">Status:</span>
                    {getStatusBadge(selectedRental.status)}
                  </div>
                </div>
              </div>

              {/* Return Details */}
              <div className="modal-section">
                <h4 className="modal-section-title">
                  Return Details
                </h4>

                <div className="form-group">
                  <label className="form-label">
                    Equipment Condition
                  </label>
                  <select
                    value={returnData.condition}
                    onChange={(event) => handleConditionChange(event.target.value)}
                    className="form-select"
                  >
                    <option value="good">Good - No damage</option>
                    <option value="fair">Fair - Minor wear</option>
                    <option value="damaged">Damaged - Requires repair</option>
                    <option value="lost">Lost/Missing</option>
                  </select>
                </div>

                {(returnData.condition === 'damaged' || returnData.condition === 'lost') && (
                  <div className="form-group">
                    <label className="form-label">
                      Damage Fee ($)
                    </label>
                    <input
                      type="number"
                      value={returnData.damageFee}
                      onChange={(event) => handleDamageFeeChange(event.target.value)}
                      className="form-input"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={returnData.notes}
                    onChange={(event) => setReturnData({ ...returnData, notes: event.target.value })}
                    className="form-textarea"
                    rows={3}
                    placeholder="Additional notes about the return..."
                  />
                </div>
              </div>

              {/* Refund Summary */}
              <div className="modal-section">
                <h4 className="modal-section-title">
                  Refund Summary
                </h4>

                <div className="modal-summary">
                  <div className="modal-summary-row">
                    <span className="modal-summary-label">Deposit:</span>
                    <span className="modal-summary-value">
                      {formatCurrency(selectedRental.deposit?.amount || 0)}
                    </span>
                  </div>
                  <div className="modal-summary-row">
                    <span className="modal-summary-label">Damage Fee:</span>
                    <span className="modal-summary-value text-error">
                      -{formatCurrency(Number(returnData.damageFee) || 0)}
                    </span>
                  </div>
                  <div className="modal-summary-row modal-summary-total">
                    <span className="modal-summary-label">Refund Amount:</span>
                    <span className="modal-summary-amount text-success">
                      {formatCurrency(refundAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Create Rental Modal */}
        {showCreateModal && (
          <Modal
            isOpen={showCreateModal}
            onClose={closeCreateModal}
            title="Create Equipment Rental"
            size="lg"
            footer={
              <>
                <Button variant="outline" onClick={closeCreateModal}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateRental}
                  loading={submitting}
                  disabled={!createData.customerId || !createData.equipmentItemId}
                >
                  Create Rental
                </Button>
              </>
            }
          >
            <div className="modal-sections">
              {/* Rental Details */}
              <div className="modal-section">
                <h4 className="modal-section-title">
                  Rental Details
                </h4>

                <div className="grid grid-2 gap-md">
                  <div className="form-group">
                    <label className="form-label">
                      Customer <span className="text-error">*</span>
                    </label>
                    <select
                      value={createData.customerId}
                      onChange={(e) => setCreateData({ ...createData, customerId: e.target.value })}
                      className="form-select"
                    >
                      <option value="">Select customer...</option>
                      {customers.map((customer) => (
                        <option key={customer._id} value={customer._id}>
                          {customer.firstName} {customer.lastName} - {customer.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Equipment <span className="text-error">*</span>
                    </label>
                    <select
                      value={createData.equipmentItemId}
                      onChange={(e) => setCreateData({ ...createData, equipmentItemId: e.target.value })}
                      className="form-select"
                    >
                      <option value="">Select equipment...</option>
                      {equipmentItems.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name} {item.sku ? `(${item.sku})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Rental Terms */}
              <div className="modal-section">
                <h4 className="modal-section-title">
                  Rental Terms
                </h4>

                <div className="grid grid-3 gap-md">
                  <div className="form-group">
                    <label className="form-label">
                      Rental Period (Days)
                    </label>
                    <input
                      type="number"
                      value={createData.rentalPeriod}
                      onChange={(e) => setCreateData({ ...createData, rentalPeriod: e.target.value })}
                      className="form-input"
                      min="1"
                      placeholder="7"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Daily Rate ($)
                    </label>
                    <input
                      type="number"
                      value={createData.dailyRate}
                      onChange={(e) => setCreateData({ ...createData, dailyRate: e.target.value })}
                      className="form-input"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Deposit ($)
                    </label>
                    <input
                      type="number"
                      value={createData.deposit}
                      onChange={(e) => setCreateData({ ...createData, deposit: e.target.value })}
                      className="form-input"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={createData.notes}
                    onChange={(e) => setCreateData({ ...createData, notes: e.target.value })}
                    className="form-textarea"
                    rows={3}
                    placeholder="Additional rental notes..."
                  />
                </div>
              </div>

              {/* Rental Summary */}
              <div className="modal-section">
                <h4 className="modal-section-title">
                  Rental Summary
                </h4>

                <div className="modal-summary">
                  <div className="modal-summary-row">
                    <span className="modal-summary-label">Daily Rate:</span>
                    <span className="modal-summary-value">{formatCurrency(Number(createData.dailyRate) || 0)}</span>
                  </div>
                  <div className="modal-summary-row">
                    <span className="modal-summary-label">Rental Period:</span>
                    <span className="modal-summary-value">{createData.rentalPeriod || 0} days</span>
                  </div>
                  <div className="modal-summary-row">
                    <span className="modal-summary-label">Total Rental Charge:</span>
                    <span className="modal-summary-value">
                      {formatCurrency((Number(createData.dailyRate) || 0) * (Number(createData.rentalPeriod) || 0))}
                    </span>
                  </div>
                  <div className="modal-summary-row modal-summary-total">
                    <span className="modal-summary-label">Deposit Required:</span>
                    <span className="modal-summary-amount text-primary">
                      {formatCurrency(Number(createData.deposit) || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Extend Rental Modal */}
        {showExtendModal && selectedRental && (
          <Modal
            isOpen={showExtendModal}
            onClose={closeExtendModal}
            title="Extend Rental Period"
            size="md"
            footer={
              <>
                <Button variant="outline" onClick={closeExtendModal}>
                  Cancel
                </Button>
                <Button onClick={handleExtendRental} loading={submitting}>
                  Extend Rental
                </Button>
              </>
            }
          >
            <div className="modal-sections">
              <div className="modal-section">
                <h4 className="modal-section-title">
                  Current Rental Information
                </h4>

                <div className="modal-info-grid">
                  <div className="modal-info-row">
                    <span className="modal-info-label">Rental ID:</span>
                    <span className="modal-info-value font-mono">{selectedRental.rentalId}</span>
                  </div>
                  <div className="modal-info-row">
                    <span className="modal-info-label">Equipment:</span>
                    <span className="modal-info-value">{selectedRental.equipmentItem?.name || 'N/A'}</span>
                  </div>
                  <div className="modal-info-row">
                    <span className="modal-info-label">Current Due Date:</span>
                    <span className="modal-info-value">{formatDate(selectedRental.dueDate)}</span>
                  </div>
                  <div className="modal-info-row">
                    <span className="modal-info-label">Status:</span>
                    {getStatusBadge(selectedRental.status)}
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h4 className="modal-section-title">
                  Extension Details
                </h4>

                <div className="form-group">
                  <label className="form-label">
                    Additional Days
                  </label>
                  <input
                    type="number"
                    value={extendData.additionalDays}
                    onChange={(e) => setExtendData({ ...extendData, additionalDays: e.target.value })}
                    className="form-input"
                    min="1"
                    placeholder="7"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={extendData.notes}
                    onChange={(e) => setExtendData({ ...extendData, notes: e.target.value })}
                    className="form-textarea"
                    rows={3}
                    placeholder="Reason for extension..."
                  />
                </div>
              </div>

              <div className="modal-highlight">
                <div className="modal-highlight-content">
                  <span className="modal-highlight-label">New Due Date:</span>
                  <span className="modal-highlight-value">
                    {formatDate(
                      new Date(
                        new Date(selectedRental.dueDate).getTime() +
                        (Number(extendData.additionalDays) || 0) * 24 * 60 * 60 * 1000
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
};

export default EquipmentRental;
