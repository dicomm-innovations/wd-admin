import { useState, useEffect } from 'react';
import { UserCog, DollarSign, Clock, Award, RefreshCw, Download, Plus, Edit, Eye } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatCard from '../components/dashboard/StatCard';
import Modal from '../components/common/Modal';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate, formatCurrency, formatBusinessUnit } from '../utils/formatters';
import { downloadCSV, employeeExportColumns } from '../utils/exportHelpers';
import { employeeAPI } from '../services/api';
import './Employees.css';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalCommissions: 0,
    avgHours: 0
  });

  const { success, error: showError, info } = useNotification();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real employee data from API
      const response = await employeeAPI.getAll();

      if (response && response.employees) {
        const fetchedEmployees = response.employees;
        setEmployees(fetchedEmployees);

        // Calculate stats from real data
        const totalCommissions = fetchedEmployees.reduce((sum, e) =>
          sum + (e.totalCommissions || 0), 0
        );
        const totalHours = fetchedEmployees.reduce((sum, e) =>
          sum + (e.hoursThisMonth || 0), 0
        );

        setStats({
          total: fetchedEmployees.length,
          active: fetchedEmployees.filter(e => e.status === 'active').length,
          totalCommissions,
          avgHours: fetchedEmployees.length > 0 ?
            Math.round(totalHours / fetchedEmployees.length) : 0
        });

        setLoading(false);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      setError('Failed to load employees. Using cached data.');
      showError('Failed to load employees');
      setLoading(false);

      // Fallback to mock data
      const mockEmployees = getMockEmployees();
      setEmployees(mockEmployees);
      setStats({
        total: mockEmployees.length,
        active: mockEmployees.filter(e => e.status === 'active').length,
        totalCommissions: mockEmployees.reduce((sum, e) => sum + e.totalCommissions, 0),
        avgHours: Math.round(
          mockEmployees.reduce((sum, e) => sum + e.hoursThisMonth, 0) / mockEmployees.length
        )
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEmployees();
    setRefreshing(false);
    info('Employee list refreshed', 2000);
  };

  const handleExport = () => {
    try {
      downloadCSV(employees, employeeExportColumns, `employees_${formatDate(new Date(), 'yyyyMMdd')}.csv`);
      success('Employees exported successfully!');
    } catch (err) {
      showError('Failed to export employees');
    }
  };

  const handleCreate = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      businessUnit: 'gym',
      role: 'staff',
      position: '',
      commissionEnabled: false,
      commissionRate: 0
    });
    setShowCreateModal(true);
  };

  const handleEdit = (employee) => {
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      businessUnit: employee.businessUnit,
      role: employee.role,
      position: employee.position || '',
      commissionEnabled: employee.commissionEnabled || false,
      commissionRate: employee.commissionRate || 0
    });
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const handleDelete = async (employee) => {
    if (window.confirm(`Are you sure you want to terminate ${employee.firstName} ${employee.lastName}?`)) {
      try {
        await employeeAPI.delete(employee._id || employee.id);
        success('Employee terminated successfully!');
        fetchEmployees();
      } catch (err) {
        console.error('Failed to delete employee:', err);
        showError('Failed to terminate employee');
      }
    }
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await employeeAPI.create(formData);
      success('Employee created successfully!');
      setShowCreateModal(false);
      fetchEmployees();
    } catch (err) {
      console.error('Failed to create employee:', err);
      showError(err.error || 'Failed to create employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await employeeAPI.update(selectedEmployee._id || selectedEmployee.id, formData);
      success('Employee updated successfully!');
      setShowEditModal(false);
      fetchEmployees();
    } catch (err) {
      console.error('Failed to update employee:', err);
      showError('Failed to update employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Mock data fallback function
  const getMockEmployees = () => [
      {
        id: '1',
        employeeId: 'EMP-1704123456790',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@womensden.com',
        phone: '+263771234570',
        businessUnit: 'gym',
        role: 'gym_admin',
        position: 'Gym Manager',
        commissionEnabled: true,
        commissionRate: 30,
        status: 'active',
        totalCommissions: 4500,
        hoursThisMonth: 160
      },
      {
        id: '2',
        employeeId: 'EMP-1704123456791',
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria@womensden.com',
        phone: '+263771234571',
        businessUnit: 'spa',
        role: 'staff',
        position: 'Senior Therapist',
        commissionEnabled: true,
        commissionRate: 40,
        status: 'active',
        totalCommissions: 6200,
        hoursThisMonth: 152
      }
    ];

  const columns = [
    {
      key: 'employeeId',
      header: 'Employee ID',
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
            <div className="text-xs text-gray">{row.position}</div>
          </div>
        </div>
      )
    },
    {
      key: 'businessUnit',
      header: 'Business Unit',
      render: (value) => (
        <Badge variant={value}>{value.replace('_', ' ')}</Badge>
      )
    },
    {
      key: 'role',
      header: 'Role',
      render: (value) => value.replace('_', ' ')
    },
    {
      key: 'commissionRate',
      header: 'Commission',
      render: (value, row) => row.commissionEnabled ? `${value}%` : 'N/A'
    },
    {
      key: 'totalCommissions',
      header: 'Total Earned',
      render: (value) => `$${(value || 0).toLocaleString()}`
    },
    {
      key: 'hoursThisMonth',
      header: 'Hours (Month)',
      render: (value) => (
        <div className="flex items-center gap-xs">
          <Clock size={14} />
          {value || 0}h
        </div>
      )
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
              handleEdit(row);
            }}
            title="Edit Employee"
          >
            <Edit size={16} />
          </button>
          <button
            className="action-btn action-btn-danger"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
            title="Terminate Employee"
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
    <Layout title="Employees" subtitle="Manage staff, timesheets, and commissions">
      {/* Error Alert */}
      {error && (
        <div className="alert alert-warning mb-lg">
          {error}
        </div>
      )}

      <div className="grid grid-4 mb-xl">
        <StatCard
          title="Total Employees"
          value={stats.total.toString()}
          icon={UserCog}
          color="var(--primary-color)"
        />
        <StatCard
          title="Active Staff"
          value={stats.active.toString()}
          icon={UserCog}
          color="var(--success)"
        />
        <StatCard
          title="Total Commissions"
          value={`$${stats.totalCommissions.toLocaleString()}`}
          icon={DollarSign}
          color="var(--accent-gold-dark)"
        />
        <StatCard
          title="Avg Hours/Month"
          value={Math.round(stats.avgHours).toString()}
          icon={Clock}
          color="var(--info)"
        />
      </div>

      <Card>
        <div className="card-actions">
          <h3>All Employees</h3>
          <div className="card-actions-buttons">
            <Button
              variant="success"
              icon={Plus}
              onClick={handleCreate}
            >
              Add Employee
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
          data={employees}
          loading={loading}
          searchPlaceholder="Search employees..."
        />
      </Card>

      {/* Create Employee Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Employee"
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
            <label htmlFor="businessUnit">Business Unit *</label>
            <select
              id="businessUnit"
              name="businessUnit"
              value={formData.businessUnit || 'gym'}
              onChange={handleFormChange}
              required
              className="form-input"
            >
              <option value="gym">Gym</option>
              <option value="spa">Spa</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="childcare">Childcare</option>
              <option value="marketing">Marketing</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="role">Role *</label>
            <select
              id="role"
              name="role"
              value={formData.role || 'staff'}
              onChange={handleFormChange}
              required
              className="form-input"
            >
              <option value="staff">Staff</option>
              <option value="gym_admin">Gym Admin</option>
              <option value="spa_admin">Spa Admin</option>
              <option value="manufacturing_admin">Manufacturing Admin</option>
              <option value="childcare_admin">Childcare Admin</option>
              <option value="marketing_admin">Marketing Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="position">Position</label>
            <input
              type="text"
              id="position"
              name="position"
              value={formData.position || ''}
              onChange={handleFormChange}
              className="form-input"
              placeholder="e.g., Trainer, Therapist, Manager"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="commissionEnabled"
                checked={formData.commissionEnabled || false}
                onChange={handleFormChange}
              />
              <span>Commission Enabled</span>
            </label>
          </div>

          {formData.commissionEnabled && (
            <div className="form-group">
              <label htmlFor="commissionRate">Commission Rate (%)</label>
              <input
                type="number"
                id="commissionRate"
                name="commissionRate"
                value={formData.commissionRate || 0}
                onChange={handleFormChange}
                min="0"
                max="100"
                className="form-input"
              />
            </div>
          )}

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
              Create Employee
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Employee"
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
            <label htmlFor="edit-businessUnit">Business Unit *</label>
            <select
              id="edit-businessUnit"
              name="businessUnit"
              value={formData.businessUnit || 'gym'}
              onChange={handleFormChange}
              required
              className="form-input"
            >
              <option value="gym">Gym</option>
              <option value="spa">Spa</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="childcare">Childcare</option>
              <option value="marketing">Marketing</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="edit-role">Role *</label>
            <select
              id="edit-role"
              name="role"
              value={formData.role || 'staff'}
              onChange={handleFormChange}
              required
              className="form-input"
            >
              <option value="staff">Staff</option>
              <option value="gym_admin">Gym Admin</option>
              <option value="spa_admin">Spa Admin</option>
              <option value="manufacturing_admin">Manufacturing Admin</option>
              <option value="childcare_admin">Childcare Admin</option>
              <option value="marketing_admin">Marketing Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="edit-position">Position</label>
            <input
              type="text"
              id="edit-position"
              name="position"
              value={formData.position || ''}
              onChange={handleFormChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="commissionEnabled"
                checked={formData.commissionEnabled || false}
                onChange={handleFormChange}
              />
              <span>Commission Enabled</span>
            </label>
          </div>

          {formData.commissionEnabled && (
            <div className="form-group">
              <label htmlFor="edit-commissionRate">Commission Rate (%)</label>
              <input
                type="number"
                id="edit-commissionRate"
                name="commissionRate"
                value={formData.commissionRate || 0}
                onChange={handleFormChange}
                min="0"
                max="100"
                className="form-input"
              />
            </div>
          )}

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
              Update Employee
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Employees;
