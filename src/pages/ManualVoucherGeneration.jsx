import { useState, useEffect } from 'react';
import { Ticket, AlertTriangle, TestTube, Users, Plus, Search } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Table from '../components/common/Table';
import { useNotification } from '../contexts/NotificationContext';
import { voucherAPI, customerAPI } from '../services/api';
import { formatDate, formatCurrency } from '../utils/formatters';
import './ManualVoucherGeneration.css';

const ManualVoucherGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [recentVouchers, setRecentVouchers] = useState([]);

  const [formData, setFormData] = useState({
    type: 'spa',
    value: '',
    expiryDays: 30,
    reason: 'testing',
    sendNotification: true
  });

  const [bulkMode, setBulkMode] = useState(false);
  const [bulkCustomers, setBulkCustomers] = useState([]);

  const { success, error: showError } = useNotification();

  useEffect(() => {
    fetchRecentManualVouchers();
  }, []);

  const fetchRecentManualVouchers = async () => {
    try {
      const response = await voucherAPI.getAllVouchers({ limit: 10 });
      if (response.data?.vouchers) {
        // Filter manual vouchers (those with TEST or EMERG prefix)
        const manualVouchers = response.data.vouchers.filter(v =>
          v.voucherCode?.startsWith('TEST-') || v.voucherCode?.startsWith('EMERG-')
        );
        setRecentVouchers(manualVouchers);
      }
    } catch (err) {
      console.error('Failed to fetch recent vouchers:', err);
    }
  };

  const searchCustomers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await customerAPI.getAll({ search: query, limit: 10 });
      if (response.data?.customers) {
        setSearchResults(response.data.customers);
      }
    } catch (err) {
      console.error('Failed to search customers:', err);
      showError('Failed to search customers');
    }
  };

  const handleCustomerSearch = (e) => {
    const value = e.target.value;
    setCustomerSearch(value);
    searchCustomers(value);
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setSearchResults([]);
    setCustomerSearch(`${customer.firstName} ${customer.lastName}`);
  };

  const addToBulk = () => {
    if (selectedCustomer && !bulkCustomers.find(c => c._id === selectedCustomer._id)) {
      setBulkCustomers([...bulkCustomers, selectedCustomer]);
      setSelectedCustomer(null);
      setCustomerSearch('');
    }
  };

  const removeFromBulk = (customerId) => {
    setBulkCustomers(bulkCustomers.filter(c => c._id !== customerId));
  };

  const handleGenerateSingle = async (e) => {
    e.preventDefault();

    if (!selectedCustomer) {
      showError('Please select a customer');
      return;
    }

    if (!formData.value || parseFloat(formData.value) <= 0) {
      showError('Please enter a valid voucher value');
      return;
    }

    try {
      setLoading(true);

      const response = await voucherAPI.manualGenerate({
        customerId: selectedCustomer._id,
        type: formData.type,
        value: parseFloat(formData.value),
        expiryDays: parseInt(formData.expiryDays),
        reason: formData.reason,
        sendNotification: formData.sendNotification
      });

      if (response.success) {
        success(`Voucher ${response.data.voucher.voucherCode} generated successfully!`);

        // Reset form
        setSelectedCustomer(null);
        setCustomerSearch('');
        setFormData({
          type: 'spa',
          value: '',
          expiryDays: 30,
          reason: 'testing',
          sendNotification: true
        });

        // Refresh recent vouchers
        fetchRecentManualVouchers();
      }
    } catch (err) {
      console.error('Failed to generate voucher:', err);
      showError(err.error || 'Failed to generate voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBulk = async (e) => {
    e.preventDefault();

    if (bulkCustomers.length === 0) {
      showError('Please add at least one customer');
      return;
    }

    if (bulkCustomers.length > 50) {
      showError('Maximum 50 customers allowed per bulk generation');
      return;
    }

    if (!formData.value || parseFloat(formData.value) <= 0) {
      showError('Please enter a valid voucher value');
      return;
    }

    try {
      setLoading(true);

      const response = await voucherAPI.bulkGenerate({
        customers: bulkCustomers.map(c => c._id),
        type: formData.type,
        value: parseFloat(formData.value),
        expiryDays: parseInt(formData.expiryDays),
        reason: 'bulk_testing'
      });

      if (response.success) {
        success(`${response.summary.successful} vouchers generated successfully!`);

        if (response.summary.failed > 0) {
          showError(`${response.summary.failed} vouchers failed to generate`);
        }

        // Reset
        setBulkCustomers([]);
        setFormData({
          type: 'spa',
          value: '',
          expiryDays: 30,
          reason: 'testing',
          sendNotification: true
        });

        // Refresh recent vouchers
        fetchRecentManualVouchers();
      }
    } catch (err) {
      console.error('Failed to bulk generate vouchers:', err);
      showError(err.error || 'Failed to bulk generate vouchers');
    } finally {
      setLoading(false);
    }
  };

  const voucherColumns = [
    {
      key: 'voucherCode',
      label: 'Voucher Code',
      render: (voucher) => (
        <div className="voucher-table-code">
          <div className="voucher-table-code-value">{voucher.voucherCode}</div>
          <Badge variant={voucher.voucherCode?.startsWith('TEST-') ? 'info' : 'warning'}>
            {voucher.voucherCode?.startsWith('TEST-') ? 'Test' : 'Emergency'}
          </Badge>
        </div>
      )
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (voucher) => (
        <div>
          {voucher.customer ?
            `${voucher.customer.firstName} ${voucher.customer.lastName}` :
            'N/A'}
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (voucher) => (
        <Badge variant={voucher.type === 'spa' ? 'success' : 'primary'}>
          {voucher.type}
        </Badge>
      )
    },
    {
      key: 'value',
      label: 'Value',
      render: (voucher) => formatCurrency(voucher.value)
    },
    {
      key: 'status',
      label: 'Status',
      render: (voucher) => (
        <Badge variant={
          voucher.status === 'available' ? 'success' :
          voucher.status === 'expired' ? 'error' : 'warning'
        }>
          {voucher.status}
        </Badge>
      )
    },
    {
      key: 'expiryDate',
      label: 'Expires',
      render: (voucher) => formatDate(voucher.expiryDate)
    }
  ];

  return (
    <Layout>
      <div className="manual-voucher-page">
        <div className="manual-voucher-header">
          <h1>Manual Voucher Generation</h1>
          <p>Generate vouchers for testing or emergency situations</p>
        </div>

        {/* Mode Toggle */}
        <div className="mode-toggle-container">
          <div className="mode-toggle">
            <button
              onClick={() => setBulkMode(false)}
              className={`mode-toggle-button ${
                !bulkMode
                  ? 'mode-toggle-button-active'
                  : 'mode-toggle-button-inactive'
              }`}
            >
              <TestTube className="mode-toggle-icon" />
              Single Voucher
            </button>
            <button
              onClick={() => setBulkMode(true)}
              className={`mode-toggle-button ${
                bulkMode
                  ? 'mode-toggle-button-active'
                  : 'mode-toggle-button-inactive'
              }`}
            >
              <Users className="mode-toggle-icon" />
              Bulk Generation
            </button>
          </div>
        </div>

        <div className="voucher-grid">
          {/* Generation Form */}
          <div className="generation-form-container">
            <Card title={bulkMode ? 'Bulk Voucher Generation' : 'Single Voucher Generation'}>
              <form className="generation-form" onSubmit={bulkMode ? handleGenerateBulk : handleGenerateSingle}>
                {/* Customer Search */}
                <div className="form-field">
                  <label>Search Customer</label>
                  <div className="search-input-container">
                    <Search className="search-icon" />
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={handleCustomerSearch}
                      placeholder="Search by name, email, or phone..."
                      className="search-input"
                    />
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="search-results">
                      {searchResults.map(customer => (
                        <div
                          key={customer._id}
                          onClick={() => selectCustomer(customer)}
                          className="search-result-item"
                        >
                          <div className="search-result-name">{customer.firstName} {customer.lastName}</div>
                          <div className="search-result-email">{customer.email}</div>
                          <div className="search-result-phone">{customer.phone}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected Customer */}
                  {selectedCustomer && !bulkMode && (
                    <div className="selected-customer">
                      <div className="selected-customer-name">
                        {selectedCustomer.firstName} {selectedCustomer.lastName}
                      </div>
                      <div className="selected-customer-email">{selectedCustomer.email}</div>
                    </div>
                  )}

                  {/* Bulk Mode - Add to List */}
                  {selectedCustomer && bulkMode && (
                    <div className="add-bulk-container">
                      <Button
                        type="button"
                        onClick={addToBulk}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="submit-button-icon" />
                        Add to Bulk List
                      </Button>
                    </div>
                  )}
                </div>

                {/* Bulk Customer List */}
                {bulkMode && bulkCustomers.length > 0 && (
                  <div className="bulk-customers-list">
                    <label>Selected Customers ({bulkCustomers.length}/50)</label>
                    <div className="bulk-customers-container">
                      {bulkCustomers.map(customer => (
                        <div
                          key={customer._id}
                          className="bulk-customer-item"
                        >
                          <div>
                            <div className="bulk-customer-info-name">{customer.firstName} {customer.lastName}</div>
                            <div className="bulk-customer-info-email">{customer.email}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromBulk(customer._id)}
                            className="bulk-customer-remove"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Voucher Type */}
                <div className="form-field">
                  <label>Voucher Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="form-select"
                  >
                    <option value="spa">Spa</option>
                    <option value="childcare">Childcare</option>
                  </select>
                </div>

                {/* Value */}
                <div className="form-field">
                  <label>Voucher Value ($)</label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    min="1"
                    step="0.01"
                    placeholder="50.00"
                    className="form-input"
                    required
                  />
                </div>

                {/* Expiry Days */}
                <div className="form-field">
                  <label>Expiry Days</label>
                  <input
                    type="number"
                    value={formData.expiryDays}
                    onChange={(e) => setFormData({ ...formData, expiryDays: e.target.value })}
                    min="1"
                    max="365"
                    className="form-input"
                    required
                  />
                </div>

                {/* Reason (Single mode only) */}
                {!bulkMode && (
                  <div className="form-field">
                    <label>Reason</label>
                    <select
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="form-select"
                    >
                      <option value="testing">Testing</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                )}

                {/* Send Notification (Single mode only) */}
                {!bulkMode && (
                  <div className="form-checkbox-container">
                    <label className="form-checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.sendNotification}
                        onChange={(e) => setFormData({ ...formData, sendNotification: e.target.checked })}
                        className="form-checkbox"
                      />
                      <span className="form-checkbox-text">
                        Send notification to admin
                      </span>
                    </label>
                  </div>
                )}

                {/* Warning Message */}
                <div className="warning-box">
                  <AlertTriangle className="warning-icon" />
                  <div className="warning-text">
                    <strong>Warning:</strong> Manual voucher generation creates {bulkMode ? 'BULK-' : formData.reason === 'testing' ? 'TEST-' : 'EMERG-'}
                    prefixed vouchers for easy identification and tracking. All manual generations are logged in the audit trail.
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading || (!bulkMode && !selectedCustomer) || (bulkMode && bulkCustomers.length === 0)}
                  className="submit-button-full"
                >
                  <Ticket className="submit-button-icon" />
                  {bulkMode ? `Generate ${bulkCustomers.length} Vouchers` : 'Generate Voucher'}
                </Button>
              </form>
            </Card>
          </div>

          {/* Recent Manual Vouchers */}
          <div className="recent-vouchers-sidebar">
            <Card title="Recent Manual Vouchers" icon={Ticket}>
              <div className="recent-vouchers-list">
                {recentVouchers.length === 0 ? (
                  <div className="recent-voucher-empty">
                    No manual vouchers yet
                  </div>
                ) : (
                  recentVouchers.map(voucher => (
                    <div key={voucher._id} className="recent-voucher-card">
                      <div className="recent-voucher-header">
                        <Badge variant={voucher.voucherCode?.startsWith('TEST-') ? 'info' : 'warning'}>
                          {voucher.voucherCode}
                        </Badge>
                        <Badge variant={voucher.status === 'available' ? 'success' : 'error'}>
                          {voucher.status}
                        </Badge>
                      </div>
                      <div className="recent-voucher-customer">
                        {voucher.customer ?
                          `${voucher.customer.firstName} ${voucher.customer.lastName}` :
                          'N/A'}
                      </div>
                      <div className="recent-voucher-value">
                        {formatCurrency(voucher.value)}
                      </div>
                      <div className="recent-voucher-expiry">
                        Expires: {formatDate(voucher.expiryDate)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Generations Table */}
        {recentVouchers.length > 0 && (
          <div className="voucher-history-section">
            <Card title="Manual Voucher History">
              <Table
                data={recentVouchers}
                columns={voucherColumns}
              />
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ManualVoucherGeneration;
