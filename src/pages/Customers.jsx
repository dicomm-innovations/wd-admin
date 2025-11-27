import { useState, useEffect } from 'react';
import { Users, Plus, Eye, Edit, Download, Award, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import StatCard from '../components/dashboard/StatCard';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate } from '../utils/formatters';
import { downloadCSV, customerExportColumns } from '../utils/exportHelpers';
import { customerAPI } from '../services/api';
import './Customers.css';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    newThisMonth: 0,
    totalLoyaltyPoints: 0
  });

  const { success, error: showError, info } = useNotification();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real customer data from API
      const response = await customerAPI.getAll();
      const fetchedCustomers = response?.data?.customers || response?.customers || [];

      setCustomers(fetchedCustomers);

      // Calculate stats from real data
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      setStats({
        total: fetchedCustomers.length,
        active: fetchedCustomers.filter(c => c.status === 'active').length,
        newThisMonth: fetchedCustomers.filter(c =>
          new Date(c.createdAt) >= firstDayOfMonth
        ).length,
        totalLoyaltyPoints: fetchedCustomers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0)
      });

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setError('Failed to load customers from server');
      showError('Failed to load customers');
      setLoading(false);
      setCustomers([]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
    info('Customer list refreshed', 2000);
  };

  const handleViewDetails = async (customer) => {
    try {
      // Fetch detailed customer data
      const response = await customerAPI.getProfileSummary(customer._id || customer.id);
      const summary = response?.data?.summary || response?.summary;

      if (summary) {
        // Flatten the nested structure from the API
        const flattenedCustomer = {
          firstName: customer.firstName,
          lastName: customer.lastName,
          customerId: summary.customer?.customerId || customer.customerId,
          email: summary.customer?.email || customer.email,
          phone: summary.customer?.phone || customer.phone,
          status: customer.status,
          createdAt: customer.createdAt,
          lastVisit: customer.lastVisit,
          loyaltyPoints: summary.loyaltyPoints || customer.loyaltyPoints || 0,
          totalSpent: customer.totalSpent || 0,
          vouchers: summary.vouchers,
          businessUnits: summary.businessUnits || customer.businessUnits
        };
        setSelectedCustomer(flattenedCustomer);
      } else {
        // Use basic customer data if summary not in expected format
        setSelectedCustomer(customer);
      }

      setShowDetailsModal(true);
    } catch (err) {
      console.error('Failed to fetch customer details:', err);
      // Use basic customer data if detailed fetch fails
      setSelectedCustomer(customer);
      setShowDetailsModal(true);
    }
  };

  const handleExport = () => {
    try {
      downloadCSV(customers, customerExportColumns, `customers_${formatDate(new Date(), 'yyyyMMdd')}.csv`);
      success('Customers exported successfully!');
    } catch (err) {
      showError('Failed to export customers');
    }
  };

  const handleCreate = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      dateOfBirth: '',
      status: 'active'
    });
    setShowCreateModal(true);
  };

  const handleEdit = (customer) => {
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      dateOfBirth: customer.dateOfBirth ? new Date(customer.dateOfBirth).toISOString().split('T')[0] : '',
      status: customer.status
    });
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const handleDelete = async (customer) => {
    if (window.confirm(`Are you sure you want to deactivate ${customer.firstName} ${customer.lastName}?`)) {
      try {
        await customerAPI.delete(customer._id || customer.id);
        success('Customer deactivated successfully!');
        fetchCustomers();
      } catch (err) {
        console.error('Failed to delete customer:', err);
        showError('Failed to deactivate customer');
      }
    }
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await customerAPI.create(formData);
      success('Customer created successfully!');
      setShowCreateModal(false);
      fetchCustomers();
    } catch (err) {
      console.error('Failed to create customer:', err);
      showError(err.error || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await customerAPI.update(selectedCustomer._id || selectedCustomer.id, formData);
      success('Customer updated successfully!');
      setShowEditModal(false);
      fetchCustomers();
    } catch (err) {
      console.error('Failed to update customer:', err);
      showError('Failed to update customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const columns = [
    {
      key: 'customerId',
      header: 'Customer ID',
      render: (value) => <span className="customer-id">{value}</span>
    },
    {
      key: 'name',
      header: 'Name',
      render: (_, row) => (
        <div className="customer-name">
          <div className="customer-avatar">
            {row.firstName[0]}{row.lastName[0]}
          </div>
          <div>
            <div className="font-semibold">{row.firstName} {row.lastName}</div>
            <div className="text-xs text-gray">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      header: 'Phone'
    },
    {
      key: 'loyaltyPoints',
      header: 'Loyalty Points',
      render: (value) => (
        <div className="loyalty-points">
          <Award size={16} />
          <span>{(value || 0).toLocaleString()}</span>
        </div>
      )
    },
    {
      key: 'totalSpent',
      header: 'Total Spent',
      render: (value) => `$${(value || 0).toLocaleString()}`
    },
    {
      key: 'lastVisit',
      header: 'Last Visit',
      render: (value) => value ? formatDate(value) : 'N/A'
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <Badge variant={value === 'active' ? 'success' : 'error'}>
          {value}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="table-actions">
          <button
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(row);
            }}
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            title="Edit Customer"
          >
            <Edit size={16} />
          </button>
          <button
            className="action-btn action-btn-danger"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
            title="Deactivate Customer"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )
    }
  ];

  return (
    <Layout title="Customers" subtitle="Manage customer accounts and view activity">
      <div className="customers-page">
        {/* Error Alert */}
        {error && (
          <div className="alert alert-warning mb-lg">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-4 mb-xl">
          <StatCard
            title="Total Customers"
            value={stats.total.toLocaleString()}
            icon={Users}
            color="var(--primary-color)"
            trend="up"
            trendValue="12.5"
          />
          <StatCard
            title="Active Customers"
            value={stats.active.toLocaleString()}
            icon={Users}
            color="var(--success)"
          />
          <StatCard
            title="New This Month"
            value={stats.newThisMonth.toLocaleString()}
            icon={Plus}
            color="var(--info)"
            trend="up"
            trendValue="8"
          />
          <StatCard
            title="Total Loyalty Points"
            value={stats.totalLoyaltyPoints.toLocaleString()}
            icon={Award}
            color="var(--accent-gold-dark)"
          />
        </div>

        {/* Table */}
        <Card>
          <div className="card-actions">
            <h3>All Customers</h3>
            <div className="card-actions-buttons">
              <Button
                variant="success"
                icon={Plus}
                onClick={handleCreate}
              >
                Add Customer
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
              <Button variant="primary" icon={Download} onClick={handleExport}>
                Export CSV
              </Button>
            </div>
          </div>

          <Table
            columns={columns}
            data={customers}
            loading={loading}
            onRowClick={handleViewDetails}
            searchPlaceholder="Search customers..."
          />
        </Card>

        {/* Customer Details Modal */}
        {selectedCustomer && (
          <Modal
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            title="Customer Details"
            size="lg"
          >
            <div className="customer-details">
              <div className="customer-details-header">
                <div className="customer-details-avatar">
                  {selectedCustomer.firstName?.[0] || 'U'}{selectedCustomer.lastName?.[0] || 'N'}
                </div>
                <div>
                  <h2>{selectedCustomer.firstName || 'Unknown'} {selectedCustomer.lastName || 'Name'}</h2>
                  <p className="text-gray">{selectedCustomer.customerId || 'N/A'}</p>
                </div>
                <Badge variant={selectedCustomer.status === 'active' ? 'success' : 'error'}>
                  {selectedCustomer.status || 'unknown'}
                </Badge>
              </div>

              <div className="customer-details-grid">
                <div className="detail-item">
                  <label>Email</label>
                  <p>{selectedCustomer.email || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Phone</label>
                  <p>{selectedCustomer.phone || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Member Since</label>
                  <p>{selectedCustomer.createdAt ? format(new Date(selectedCustomer.createdAt), 'MMMM dd, yyyy') : 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Last Visit</label>
                  <p>{selectedCustomer.lastVisit ? format(new Date(selectedCustomer.lastVisit), 'MMMM dd, yyyy') : 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Loyalty Points</label>
                  <p className="loyalty-points">
                    <Award size={18} />
                    {(selectedCustomer.loyaltyPoints || 0).toLocaleString()}
                  </p>
                </div>
                <div className="detail-item">
                  <label>Total Spent</label>
                  <p className="font-bold">${(selectedCustomer.totalSpent || 0).toLocaleString()}</p>
                </div>
              </div>

              {selectedCustomer.vouchers && (
                <div className="customer-details-stats">
                  <div className="stat-box">
                    <div className="stat-label">Total Vouchers</div>
                    <div className="stat-value">{selectedCustomer.vouchers.total || 0}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Childcare Vouchers</div>
                    <div className="stat-value">{selectedCustomer.vouchers.childcare || 0}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Spa Vouchers</div>
                    <div className="stat-value">{selectedCustomer.vouchers.spa || 0}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Business Units</div>
                    <div className="stat-value">{selectedCustomer.businessUnits?.length || 0}</div>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Create Customer Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Add New Customer"
          size="md"
        >
          <form onSubmit={handleSubmitCreate} className="form-modal">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName || ''}
                onChange={handleFormChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName || ''}
                onChange={handleFormChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email || ''}
                onChange={handleFormChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleFormChange}
                required
                className="form-input"
                placeholder="+263771234567"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password || ''}
                onChange={handleFormChange}
                required
                className="form-input"
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth || ''}
                onChange={handleFormChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status || 'active'}
                onChange={handleFormChange}
                className="form-input"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className="form-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
              >
                Create Customer
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Customer Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Customer"
          size="md"
        >
          <form onSubmit={handleSubmitEdit} className="form-modal">
            <div className="form-group">
              <label htmlFor="edit-firstName">First Name *</label>
              <input
                type="text"
                id="edit-firstName"
                name="firstName"
                value={formData.firstName || ''}
                onChange={handleFormChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-lastName">Last Name *</label>
              <input
                type="text"
                id="edit-lastName"
                name="lastName"
                value={formData.lastName || ''}
                onChange={handleFormChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-email">Email *</label>
              <input
                type="email"
                id="edit-email"
                name="email"
                value={formData.email || ''}
                onChange={handleFormChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-phone">Phone *</label>
              <input
                type="tel"
                id="edit-phone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleFormChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-dateOfBirth">Date of Birth</label>
              <input
                type="date"
                id="edit-dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth || ''}
                onChange={handleFormChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-status">Status</label>
              <select
                id="edit-status"
                name="status"
                value={formData.status || 'active'}
                onChange={handleFormChange}
                className="form-input"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className="form-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowEditModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
              >
                Update Customer
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default Customers;
