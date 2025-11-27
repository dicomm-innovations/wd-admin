import { useState, useEffect, useMemo } from 'react';
import { ArrowRightLeft, Plus, DollarSign, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import StatCard from '../components/dashboard/StatCard';
import { useNotification } from '../contexts/NotificationContext';
import { formatCurrency, formatDateTime, formatBusinessUnit } from '../utils/formatters';
import { interBusinessSalesAPI, inventoryAPI } from '../services/api';

const BUSINESS_UNITS = [
  { value: 'gym', label: 'Gym' },
  { value: 'spa', label: 'Spa' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'childcare', label: 'Childcare' },
  { value: 'marketing', label: 'Marketing' }
];

const STATUS_OPTIONS = [
  { value: '', label: 'Status (All)' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'Payment (All)' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' }
];

const DEFAULT_ITEM = { inventoryItemId: '', quantity: 1, unitPrice: 0 };

const InterBusinessSales = () => {
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    fromBusinessUnit: '',
    toBusinessUnit: '',
    status: '',
    paymentStatus: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [formData, setFormData] = useState({
    fromBusinessUnit: 'manufacturing',
    toBusinessUnit: 'spa',
    items: [{ ...DEFAULT_ITEM }],
    discount: 0,
    notes: ''
  });

  const { success, error: showError, info } = useNotification();

  useEffect(() => {
    fetchSales(filters);
  }, [filters]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchSales = async (currentFilters = filters) => {
    try {
      setLoading(true);

      const params = Object.fromEntries(
        Object.entries(currentFilters).filter(([, value]) => Boolean(value))
      );

      const response = await interBusinessSalesAPI.getAll(params);
      const records =
        Array.isArray(response?.data) ? response.data :
        Array.isArray(response?.items) ? response.items :
        Array.isArray(response?.data?.data) ? response.data.data :
        Array.isArray(response) ? response : [];

      setSales(records);
    } catch (error) {
      console.error('Failed to fetch inter-business sales:', error);
      showError('Failed to load inter-business sales');
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await interBusinessSalesAPI.getStatistics();
      setStats(response?.data || response || null);
    } catch (error) {
      console.error('Failed to fetch inter-business sales statistics:', error);
      showError('Failed to load inter-business sales statistics');
      setStats(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSales(), fetchStats()]);
    setRefreshing(false);
    info('Sales data refreshed');
  };

  const openCreateModal = async () => {
    setShowCreateModal(true);
    setSubmitting(false);
    setFormData({
      fromBusinessUnit: 'manufacturing',
      toBusinessUnit: 'spa',
      items: [{ ...DEFAULT_ITEM }],
      discount: 0,
      notes: ''
    });

    if (!inventory.length) {
      await loadInventory();
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setSubmitting(false);
    setFormData({
      fromBusinessUnit: 'manufacturing',
      toBusinessUnit: 'spa',
      items: [{ ...DEFAULT_ITEM }],
      discount: 0,
      notes: ''
    });
  };

  const loadInventory = async () => {
    try {
      setInventoryLoading(true);
      const response = await inventoryAPI.getItems();
      const items =
        Array.isArray(response?.items) ? response.items :
        Array.isArray(response?.data?.items) ? response.data.items :
        Array.isArray(response?.data) ? response.data : [];
      setInventory(items);
    } catch (error) {
      console.error('Failed to fetch inventory items:', error);
      showError('Failed to load inventory items');
      setInventory([]);
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFromBusinessUnitChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      fromBusinessUnit: value,
      toBusinessUnit: prev.toBusinessUnit === value ? '' : prev.toBusinessUnit,
      items: [{ ...DEFAULT_ITEM }]
    }));
  };

  const handleToBusinessUnitChange = (value) => {
    if (value === formData.fromBusinessUnit) {
      showError('Destination business unit must differ from source');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      toBusinessUnit: value
    }));
  };

  const addItemRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { ...DEFAULT_ITEM }]
    }));
  };

  const updateItem = (index, updates) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) => (idx === index ? { ...item, ...updates } : item))
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleProductSelect = (index, inventoryItemId) => {
    const selectedItem = inventory.find((item) => item._id === inventoryItemId);

    updateItem(index, {
      inventoryItemId,
      quantity: 1,
      unitPrice: selectedItem ? selectedItem.costPrice || selectedItem.sellingPrice || 0 : 0
    });
  };

  const subtotal = useMemo(() => {
    return formData.items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      return sum + (quantity * price);
    }, 0);
  }, [formData.items]);

  const discount = Number(formData.discount) || 0;
  const total = Math.max(subtotal - discount, 0);

  const canSubmit = useMemo(() => {
    if (!formData.fromBusinessUnit || !formData.toBusinessUnit) return false;
    if (formData.fromBusinessUnit === formData.toBusinessUnit) return false;
    if (!formData.items.length) return false;

    return formData.items.every((item) =>
      item.inventoryItemId &&
      Number(item.quantity) > 0 &&
      Number(item.unitPrice) >= 0
    );
  }, [formData]);

  const handleCreateSale = async () => {
    if (!canSubmit || submitting) {
      return;
    }

    try {
      setSubmitting(true);

      await interBusinessSalesAPI.create({
        fromBusinessUnit: formData.fromBusinessUnit,
        toBusinessUnit: formData.toBusinessUnit,
        items: formData.items.map((item) => ({
          inventoryItemId: item.inventoryItemId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice)
        })),
        discount,
        notes: formData.notes?.trim() || ''
      });

      success('Inter-business transfer created successfully');
      closeCreateModal();
      await Promise.all([fetchSales(), fetchStats()]);
    } catch (error) {
      console.error('Failed to create inter-business sale:', error);
      const message = typeof error === 'string'
        ? error
        : error?.message || 'Failed to create inter-business sale';
      showError(message);
      setSubmitting(false);
    }
  };

  const availableInventory = useMemo(() => {
    if (!formData.fromBusinessUnit) return inventory;
    return inventory.filter((item) =>
      item.location === formData.fromBusinessUnit || item.location === 'shared'
    );
  }, [inventory, formData.fromBusinessUnit]);

  const statsSummary = stats?.overall || {
    totalSales: 0,
    totalAmount: 0,
    completedSales: 0,
    pendingSales: 0,
    totalPaid: 0,
    totalOutstanding: 0
  };

  const renderBusinessUnitBadge = (unit) => {
    if (!unit) {
      return <span className="text-sm text-gray">N/A</span>;
    }

    const validVariants = ['gym', 'spa', 'manufacturing', 'childcare', 'marketing'];
    const variant = validVariants.includes(unit) ? unit : 'default';

    return <Badge variant={variant}>{formatBusinessUnit(unit)}</Badge>;
  };

  const columns = [
    {
      key: 'saleId',
      header: 'Transfer ID',
      render: (value) => <span className="font-mono text-sm">{value}</span>
    },
    {
      key: 'fromBusinessUnit',
      header: 'From',
      render: (value) => renderBusinessUnitBadge(value)
    },
    {
      key: 'toBusinessUnit',
      header: 'To',
      render: (value) => renderBusinessUnitBadge(value)
    },
    {
      key: 'items',
      header: 'Items',
      render: (items = []) => (
        <div className="flex flex-col gap-1">
          {items.length > 0 ? items.map((item, idx) => (
            <Badge key={idx} variant="default" size="sm">
              {(item.inventoryItem?.name || item.itemName || 'Item')} × {item.quantity}
            </Badge>
          )) : (
            <span className="text-sm text-gray">No items</span>
          )}
        </div>
      )
    },
    {
      key: 'totalAmount',
      header: 'Value',
      render: (value) => <span className="font-semibold">{formatCurrency(value || 0)}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => {
        const variants = {
          pending: 'warning',
          approved: 'info',
          completed: 'success',
          cancelled: 'error'
        };

        return (
          <Badge variant={variants[value] || 'default'}>
            {(value || 'N/A').replace('_', ' ').toUpperCase()}
          </Badge>
        );
      }
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (value) => {
        const variants = {
          unpaid: 'warning',
          partial: 'info',
          paid: 'success'
        };

        return (
          <Badge variant={variants[value] || 'default'}>
            {(value || 'N/A').replace('_', ' ').toUpperCase()}
          </Badge>
        );
      }
    },
    {
      key: 'saleDate',
      header: 'Date',
      render: (value) => formatDateTime(value)
    },
    {
      key: 'requestedBy',
      header: 'Requested By',
      render: (employee) => {
        if (!employee) {
          return <span className="text-sm text-gray">N/A</span>;
        }

        const name = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();

        return (
          <div>
            <div className="text-sm font-medium">{name || 'N/A'}</div>
            {employee.role && (
              <div className="text-xs text-gray">{employee.role}</div>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <Layout title="Inter-Business Sales" subtitle="Track product transfers across business units">
      <div className="inter-business-sales-page">
        {/* Stats */}
        <div className="grid grid-4 mb-xl">
          <StatCard
            title="Total Transfers"
            value={statsSummary.totalSales || 0}
            icon={ArrowRightLeft}
            color="var(--primary-color)"
          />
          <StatCard
            title="Transfer Value"
            value={formatCurrency(statsSummary.totalAmount || 0)}
            icon={DollarSign}
            color="var(--accent-gold)"
          />
          <StatCard
            title="Completed Transfers"
            value={statsSummary.completedSales || 0}
            icon={CheckCircle}
            color="var(--success)"
          />
          <StatCard
            title="Outstanding Balance"
            value={formatCurrency(statsSummary.totalOutstanding || 0)}
            icon={AlertTriangle}
            color="var(--warning)"
          />
        </div>

        {/* Filters and Actions */}
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-md">
            <div className="flex flex-wrap items-center gap-3">
              <select
                name="fromBusinessUnit"
                value={filters.fromBusinessUnit}
                onChange={handleFilterChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">From (All)</option>
                {BUSINESS_UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>{unit.label}</option>
                ))}
              </select>

              <select
                name="toBusinessUnit"
                value={filters.toBusinessUnit}
                onChange={handleFilterChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">To (All)</option>
                {BUSINESS_UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>{unit.label}</option>
                ))}
              </select>

              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value || 'all-status'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                name="paymentStatus"
                value={filters.paymentStatus}
                onChange={handleFilterChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value || 'all-payment'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                icon={RefreshCw}
                onClick={handleRefresh}
                loading={refreshing}
              >
                Refresh
              </Button>
              <Button icon={Plus} onClick={openCreateModal}>
                New Transfer
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Inter-Business Transfers" icon={ArrowRightLeft}>
          <Table
            columns={columns}
            data={sales}
            loading={loading}
            emptyMessage="No inter-business transfers found"
          />
        </Card>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
        title="Create Inter-Business Transfer"
        size="lg"
        footer={(
          <>
            <Button variant="outline" onClick={closeCreateModal}>
              Cancel
            </Button>
            <Button onClick={handleCreateSale} loading={submitting} disabled={!canSubmit}>
              Create Transfer
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          {/* Business Units */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <h4 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Transfer Details
            </h4>
            <div className="grid grid-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  From Business Unit <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.fromBusinessUnit}
                  onChange={(event) => handleFromBusinessUnitChange(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {BUSINESS_UNITS.map((unit) => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  To Business Unit <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.toBusinessUnit}
                  onChange={(event) => handleToBusinessUnitChange(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select destination</option>
                  {BUSINESS_UNITS.filter((unit) => unit.value !== formData.fromBusinessUnit).map((unit) => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Transfer Notes</label>
              <textarea
                value={formData.notes}
                onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Add context for the receiving team..."
              />
            </div>
          </div>

          {/* Items to Transfer */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
              <div>
                <h4 className="text-base font-semibold text-gray-900">Items to Transfer</h4>
                <p className="text-sm text-gray-600 mt-0.5">Select inventory items and set quantities</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={addItemRow}
                disabled={inventoryLoading}
              >
                Add Item
              </Button>
            </div>

            {inventoryLoading && (
              <div className="text-sm text-gray-600">Loading inventory...</div>
            )}

            {!inventoryLoading && formData.items.length === 0 && (
              <div className="text-sm text-gray-600">
                No items added yet. Click &quot;Add Item&quot; to get started.
              </div>
            )}

            {!inventoryLoading && formData.items.length > 0 && (
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="grid grid-2 gap-3 mb-3">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Inventory Item <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={item.inventoryItemId}
                          onChange={(event) => handleProductSelect(index, event.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                        >
                          <option value="">Select product</option>
                          {availableInventory.map((inventoryItem) => (
                            <option key={inventoryItem._id} value={inventoryItem._id}>
                              {inventoryItem.name} ({inventoryItem.itemCode}) — Stock: {inventoryItem.quantity}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) => updateItem(index, { quantity: Number(event.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Unit Price <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(event) => updateItem(index, { unitPrice: Number(event.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Line Total</label>
                        <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md font-semibold text-gray-900">
                          {formatCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                        </div>
                      </div>
                    </div>

                    {formData.items.length > 1 && (
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          Remove Item
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <h4 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Transfer Summary
            </h4>
            <div className="grid grid-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subtotal</label>
                <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md font-semibold text-gray-900">
                  {formatCurrency(subtotal)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discount}
                  onChange={(event) => setFormData((prev) => ({
                    ...prev,
                    discount: Math.max(Number(event.target.value) || 0, 0)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Total</label>
                <div className="w-full px-3 py-2 bg-primary-50 border border-primary-300 rounded-md font-bold text-primary-900">
                  {formatCurrency(total)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default InterBusinessSales;
