import { useState, useEffect } from 'react';
import { Megaphone, Users, Calendar, RefreshCw, Download, Plus, Edit, Trash2 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import StatCard from '../components/dashboard/StatCard';
import { format } from 'date-fns';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate } from '../utils/formatters';
import { downloadCSV } from '../utils/exportHelpers';
import { marketingAPI, employeeAPI } from '../services/api';
import './Marketing.css';

const Marketing = () => {
  const [clients, setClients] = useState([]);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    contentScheduled: 0,
    prospectClients: 0
  });

  // Modal states
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [showDeleteClientModal, setShowDeleteClientModal] = useState(false);
  const [showCreateContentModal, setShowCreateContentModal] = useState(false);
  const [showEditContentModal, setShowEditContentModal] = useState(false);
  const [showDeleteContentModal, setShowDeleteContentModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);

  // Form data for client
  const [clientFormData, setClientFormData] = useState({
    companyName: '',
    contactPerson: { firstName: '', lastName: '', position: '' },
    email: '',
    phone: '',
    industry: '',
    website: '',
    status: 'prospect',
    notes: ''
  });

  // Form data for content
  const [contentFormData, setContentFormData] = useState({
    client: '',
    title: '',
    description: '',
    contentType: 'social_media',
    platform: 'instagram',
    scheduledDate: new Date().toISOString().split('T')[0],
    assignedTo: '',
    status: 'draft',
    tags: []
  });

  // Employees for assignment dropdown
  const [employees, setEmployees] = useState([]);

  const { success, error: showError, info } = useNotification();

  useEffect(() => {
    fetchMarketingData();
  }, []);

  const fetchMarketingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [clientsRes, contentRes] = await Promise.all([
        marketingAPI.getB2BClients(),
        marketingAPI.getContentCalendar()
      ]);

      if (clientsRes && contentRes) {
        const fetchedClients = clientsRes.clients || [];
        const fetchedContent = contentRes.content || [];

        setClients(fetchedClients);
        setContent(fetchedContent);

        const prospectClients = fetchedClients.filter(c => c.status === 'prospect').length;

        setStats({
          totalClients: fetchedClients.length,
          activeClients: fetchedClients.filter(c => c.status === 'active').length,
          contentScheduled: fetchedContent.length,
          prospectClients
        });

        setLoading(false);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch marketing data:', err);
      setError('Failed to load marketing data. Using cached data.');
      showError('Failed to load marketing data');
      setLoading(false);

      const { mockClients, mockContent } = getMockData();
      setClients(mockClients);
      setContent(mockContent);
      setStats({
        totalClients: mockClients.length,
        activeClients: mockClients.filter(c => c.status === 'active').length,
        contentScheduled: mockContent.length,
        prospectClients: mockClients.filter(c => c.status === 'prospect').length
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMarketingData();
    setRefreshing(false);
    info('Marketing data refreshed', 2000);
  };

  const handleExportClients = () => {
    try {
      const exportColumns = [
        { key: 'clientId', label: 'Client ID' },
        { key: 'companyName', label: 'Company Name' },
        {
          key: 'contactPerson',
          label: 'Contact Person',
          render: (val) => {
            if (typeof val === 'object' && val) {
              return `${val.firstName || ''} ${val.lastName || ''}`.trim();
            }
            return val || '';
          }
        },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'industry', label: 'Industry' },
        { key: 'monthlyFee', label: 'Monthly Fee' },
        { key: 'status', label: 'Status' }
      ];
      downloadCSV(clients, exportColumns, `marketing_clients_${formatDate(new Date(), 'yyyyMMdd')}.csv`);
      success('Clients exported successfully!');
    } catch (err) {
      showError('Failed to export clients');
    }
  };

  const handleExportContent = () => {
    try {
      const exportColumns = [
        { key: 'contentId', label: 'Content ID' },
        { key: 'title', label: 'Title' },
        {
          key: 'client',
          label: 'Client Name',
          render: (val) => val?.companyName || val?.clientName || 'N/A'
        },
        { key: 'contentType', label: 'Content Type' },
        { key: 'platform', label: 'Platform' },
        { key: 'scheduledDate', label: 'Scheduled Date' },
        {
          key: 'assignedTo',
          label: 'Assigned To',
          render: (val) => {
            if (!val) return 'Unassigned';
            if (typeof val === 'object') {
              return `${val.firstName || ''} ${val.lastName || ''}`.trim();
            }
            return val;
          }
        },
        { key: 'status', label: 'Status' }
      ];
      downloadCSV(content, exportColumns, `marketing_content_${formatDate(new Date(), 'yyyyMMdd')}.csv`);
      success('Content calendar exported successfully!');
    } catch (err) {
      showError('Failed to export content');
    }
  };

  // Fetch employees for dropdowns
  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getAll();
      if (response.success) {
        setEmployees(response.employees || []);
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  // CLIENT CRUD HANDLERS
  const handleCreateClientClick = () => {
    setClientFormData({
      companyName: '',
      contactPerson: { firstName: '', lastName: '', position: '' },
      email: '',
      phone: '',
      industry: '',
      website: '',
      status: 'prospect',
      notes: ''
    });
    setShowCreateClientModal(true);
  };

  const handleEditClientClick = (client) => {
    setSelectedClient(client);
    setClientFormData({
      companyName: client.companyName || '',
      contactPerson: {
        firstName: client.contactPerson?.firstName || '',
        lastName: client.contactPerson?.lastName || '',
        position: client.contactPerson?.position || ''
      },
      email: client.email || '',
      phone: client.phone || '',
      industry: client.industry || '',
      website: client.website || '',
      status: client.status || 'prospect',
      notes: client.notes || ''
    });
    setShowEditClientModal(true);
  };

  const handleDeleteClientClick = (client) => {
    setSelectedClient(client);
    setShowDeleteClientModal(true);
  };

  const handleClientFormChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('contactPerson.')) {
      const field = name.split('.')[1];
      setClientFormData(prev => ({
        ...prev,
        contactPerson: {
          ...prev.contactPerson,
          [field]: value
        }
      }));
    } else {
      setClientFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCreateClientSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await marketingAPI.createClient(clientFormData);
      success('Client created successfully!');
      setShowCreateClientModal(false);
      fetchMarketingData();
    } catch (err) {
      showError(`Failed to create client: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClientSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClient) return;

    try {
      setSubmitting(true);
      await marketingAPI.updateClient(selectedClient._id || selectedClient.id, clientFormData);
      success('Client updated successfully!');
      setShowEditClientModal(false);
      fetchMarketingData();
    } catch (err) {
      showError(`Failed to update client: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClientConfirm = async () => {
    if (!selectedClient) return;

    try {
      setSubmitting(true);
      await marketingAPI.deleteClient(selectedClient._id || selectedClient.id);
      success('Client deleted successfully!');
      setShowDeleteClientModal(false);
      fetchMarketingData();
    } catch (err) {
      showError(`Failed to delete client: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // CONTENT CRUD HANDLERS
  const handleCreateContentClick = async () => {
    await fetchEmployees();
    setContentFormData({
      client: '',
      title: '',
      description: '',
      contentType: 'social_media',
      platform: 'instagram',
      scheduledDate: new Date().toISOString().split('T')[0],
      assignedTo: '',
      status: 'draft',
      tags: []
    });
    setShowCreateContentModal(true);
  };

  const handleEditContentClick = async (contentItem) => {
    await fetchEmployees();
    setSelectedContent(contentItem);
    setContentFormData({
      client: contentItem.client?._id || contentItem.client || '',
      title: contentItem.title || '',
      description: contentItem.description || '',
      contentType: contentItem.contentType || 'social_media',
      platform: contentItem.platform || 'instagram',
      scheduledDate: new Date(contentItem.scheduledDate).toISOString().split('T')[0],
      assignedTo: contentItem.assignedTo?._id || contentItem.assignedTo || '',
      status: contentItem.status || 'draft',
      tags: contentItem.tags || []
    });
    setShowEditContentModal(true);
  };

  const handleDeleteContentClick = (contentItem) => {
    setSelectedContent(contentItem);
    setShowDeleteContentModal(true);
  };

  const handleContentFormChange = (e) => {
    const { name, value } = e.target;
    setContentFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateContentSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await marketingAPI.createContent(contentFormData);
      success('Content created successfully!');
      setShowCreateContentModal(false);
      fetchMarketingData();
    } catch (err) {
      showError(`Failed to create content: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditContentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedContent) return;

    try {
      setSubmitting(true);
      await marketingAPI.updateContent(selectedContent._id || selectedContent.id, contentFormData);
      success('Content updated successfully!');
      setShowEditContentModal(false);
      fetchMarketingData();
    } catch (err) {
      showError(`Failed to update content: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContentConfirm = async () => {
    if (!selectedContent) return;

    try {
      setSubmitting(true);
      await marketingAPI.deleteContent(selectedContent._id || selectedContent.id);
      success('Content deleted successfully!');
      setShowDeleteContentModal(false);
      fetchMarketingData();
    } catch (err) {
      showError(`Failed to delete content: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getMockData = () => {
    const mockClients = [
      {
        id: '1',
        clientId: 'B2B-1704123456806',
        companyName: 'Luxury Hotels Group',
        contactPerson: 'Michael Brown',
        email: 'michael@luxuryhotels.com',
        phone: '+263771234572',
        industry: 'hospitality',
        status: 'active'
      },
      {
        id: '2',
        clientId: 'B2B-1704123456807',
        companyName: 'Wellness Spa Chain',
        contactPerson: 'Lisa Martinez',
        email: 'lisa@wellnessspa.com',
        phone: '+263771234573',
        industry: 'wellness',
        status: 'prospect'
      }
    ];

    const mockContent = [
      {
        id: '1',
        contentId: 'CONTENT-1704123456808',
        title: 'New Year Promotion Post',
        clientName: 'Luxury Hotels Group',
        contentType: 'social_media',
        platform: 'instagram',
        scheduledDate: '2024-11-10T10:00:00Z',
        status: 'approved'
      },
      {
        id: '2',
        contentId: 'CONTENT-1704123456809',
        title: 'Holiday Special Blog',
        clientName: 'Wellness Spa Chain',
        contentType: 'blog',
        platform: 'website',
        scheduledDate: '2024-11-15T09:00:00Z',
        status: 'draft'
      }
    ];

    return { mockClients, mockContent };
  };

  const clientColumns = [
    {
      key: 'clientId',
      header: 'Client ID',
      render: (value) => <span className="customer-id">{value}</span>
    },
    {
      key: 'companyName',
      header: 'Company',
      render: (value, row) => (
        <div>
          <div className="font-semibold">{value}</div>
          <div className="text-xs text-gray">
            {row.contactPerson && typeof row.contactPerson === 'object'
              ? `${row.contactPerson.firstName || ''} ${row.contactPerson.lastName || ''}`.trim()
              : row.contactPerson || 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email'
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (value) => value || 'N/A'
    },
    {
      key: 'industry',
      header: 'Industry',
      render: (value) => value ? <Badge variant="default">{value}</Badge> : 'N/A'
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <Badge variant={value === 'active' ? 'success' : value === 'prospect' ? 'warning' : 'error'}>
          {value}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, client) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Edit}
            onClick={() => handleEditClientClick(client)}
          >
            Edit
          </Button>
          <Button
            variant="error"
            size="sm"
            icon={Trash2}
            onClick={() => handleDeleteClientClick(client)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  const contentColumns = [
    {
      key: 'contentId',
      header: 'Content ID',
      render: (value) => <span className="customer-id">{value.slice(0, 20)}...</span>
    },
    {
      key: 'title',
      header: 'Title'
    },
    {
      key: 'client',
      header: 'Client',
      render: (value) => value?.companyName || value?.clientName || 'N/A'
    },
    {
      key: 'contentType',
      header: 'Type',
      render: (value) => (
        <Badge variant="info">{value.replace('_', ' ')}</Badge>
      )
    },
    {
      key: 'platform',
      header: 'Platform',
      render: (value) => (
        <Badge variant="default">{value}</Badge>
      )
    },
    {
      key: 'scheduledDate',
      header: 'Scheduled',
      render: (value) => format(new Date(value), 'MMM dd, yyyy')
    },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      render: (value) => {
        if (!value) return 'Unassigned';
        if (typeof value === 'object') {
          return `${value.firstName || ''} ${value.lastName || ''}`.trim();
        }
        return value;
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => {
        const variants = {
          draft: 'default',
          in_review: 'warning',
          approved: 'success',
          scheduled: 'info',
          published: 'success',
          revision_needed: 'warning'
        };
        return <Badge variant={variants[value] || 'default'}>{value.replace('_', ' ')}</Badge>;
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, contentItem) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Edit}
            onClick={() => handleEditContentClick(contentItem)}
          >
            Edit
          </Button>
          <Button
            variant="error"
            size="sm"
            icon={Trash2}
            onClick={() => handleDeleteContentClick(contentItem)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <Layout title="TWD Marketing" subtitle="Manage B2B clients and content calendar">
      {error && (
        <div className="alert alert-warning mb-lg">
          {error}
        </div>
      )}

      <div className="grid grid-4 mb-xl">
        <StatCard
          title="Total Clients"
          value={stats.totalClients.toString()}
          icon={Users}
          color="var(--marketing-color)"
        />
        <StatCard
          title="Active Clients"
          value={stats.activeClients.toString()}
          icon={Megaphone}
          color="var(--success)"
        />
        <StatCard
          title="Content Scheduled"
          value={stats.contentScheduled.toString()}
          icon={Calendar}
          color="var(--info)"
        />
        <StatCard
          title="Prospect Clients"
          value={stats.prospectClients.toString()}
          icon={Users}
          color="var(--warning)"
        />
      </div>

      <div className="grid grid-1 mb-xl">
        <Card>
          <div className="card-actions">
            <h3>B2B Clients</h3>
            <div className="card-actions-buttons">
              <Button
                variant="primary"
                icon={Plus}
                onClick={handleCreateClientClick}
              >
                Create Client
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
              <Button variant="secondary" icon={Download} onClick={handleExportClients}>
                Export CSV
              </Button>
            </div>
          </div>
          <Table
            columns={clientColumns}
            data={clients}
            loading={loading}
            searchPlaceholder="Search clients..."
          />
        </Card>
      </div>

      <Card>
        <div className="card-actions">
          <h3>Content Calendar</h3>
          <div className="card-actions-buttons">
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleCreateContentClick}
            >
              Create Content
            </Button>
            <Button variant="secondary" icon={Download} onClick={handleExportContent}>
              Export CSV
            </Button>
          </div>
        </div>
        <Table
          columns={contentColumns}
          data={content}
          loading={loading}
          searchPlaceholder="Search content..."
        />
      </Card>

      {/* Create Client Modal */}
      <Modal
        isOpen={showCreateClientModal}
        onClose={() => setShowCreateClientModal(false)}
        title="Create B2B Client"
        size="large"
      >
        <form onSubmit={handleCreateClientSubmit} className="space-y-4">
          <div>
            <label className="form-label">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="companyName"
              value={clientFormData.companyName}
              onChange={handleClientFormChange}
              required
              placeholder="Enter company name"
              className="form-input"
            />
          </div>

          <div className="grid grid-3 gap-md">
            <div>
              <label className="form-label">Contact First Name</label>
              <input
                type="text"
                name="contactPerson.firstName"
                value={clientFormData.contactPerson.firstName}
                onChange={handleClientFormChange}
                placeholder="First name"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Contact Last Name</label>
              <input
                type="text"
                name="contactPerson.lastName"
                value={clientFormData.contactPerson.lastName}
                onChange={handleClientFormChange}
                placeholder="Last name"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Position</label>
              <input
                type="text"
                name="contactPerson.position"
                value={clientFormData.contactPerson.position}
                onChange={handleClientFormChange}
                placeholder="Position"
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-2 gap-md">
            <div>
              <label className="form-label">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={clientFormData.email}
                onChange={handleClientFormChange}
                required
                placeholder="contact@company.com"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={clientFormData.phone}
                onChange={handleClientFormChange}
                required
                placeholder="+263..."
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-2 gap-md">
            <div>
              <label className="form-label">Industry</label>
              <input
                type="text"
                name="industry"
                value={clientFormData.industry}
                onChange={handleClientFormChange}
                placeholder="e.g., hospitality, wellness"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Website</label>
              <input
                type="url"
                name="website"
                value={clientFormData.website}
                onChange={handleClientFormChange}
                placeholder="https://..."
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Status</label>
            <select
              name="status"
              value={clientFormData.status}
              onChange={handleClientFormChange}
              className="form-input"
            >
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div>
            <label className="form-label">Notes</label>
            <textarea
              name="notes"
              value={clientFormData.notes}
              onChange={handleClientFormChange}
              rows={3}
              placeholder="Additional notes..."
              className="form-input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateClientModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              icon={Plus}
            >
              Create Client
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Client Modal */}
      <Modal
        isOpen={showEditClientModal}
        onClose={() => setShowEditClientModal(false)}
        title="Edit B2B Client"
        size="large"
      >
        <form onSubmit={handleEditClientSubmit} className="space-y-4">
          {selectedClient && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-blue-900">Client ID: {selectedClient.clientId}</h4>
            </div>
          )}

          <div>
            <label className="form-label">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="companyName"
              value={clientFormData.companyName}
              onChange={handleClientFormChange}
              required
              placeholder="Enter company name"
              className="form-input"
            />
          </div>

          <div className="grid grid-3 gap-md">
            <div>
              <label className="form-label">Contact First Name</label>
              <input
                type="text"
                name="contactPerson.firstName"
                value={clientFormData.contactPerson.firstName}
                onChange={handleClientFormChange}
                placeholder="First name"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Contact Last Name</label>
              <input
                type="text"
                name="contactPerson.lastName"
                value={clientFormData.contactPerson.lastName}
                onChange={handleClientFormChange}
                placeholder="Last name"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Position</label>
              <input
                type="text"
                name="contactPerson.position"
                value={clientFormData.contactPerson.position}
                onChange={handleClientFormChange}
                placeholder="Position"
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-2 gap-md">
            <div>
              <label className="form-label">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={clientFormData.email}
                onChange={handleClientFormChange}
                required
                placeholder="contact@company.com"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={clientFormData.phone}
                onChange={handleClientFormChange}
                required
                placeholder="+263..."
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-2 gap-md">
            <div>
              <label className="form-label">Industry</label>
              <input
                type="text"
                name="industry"
                value={clientFormData.industry}
                onChange={handleClientFormChange}
                placeholder="e.g., hospitality, wellness"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Website</label>
              <input
                type="url"
                name="website"
                value={clientFormData.website}
                onChange={handleClientFormChange}
                placeholder="https://..."
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Status</label>
            <select
              name="status"
              value={clientFormData.status}
              onChange={handleClientFormChange}
              className="form-input"
            >
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div>
            <label className="form-label">Notes</label>
            <textarea
              name="notes"
              value={clientFormData.notes}
              onChange={handleClientFormChange}
              rows={3}
              placeholder="Additional notes..."
              className="form-input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEditClientModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              icon={Edit}
            >
              Update Client
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Client Modal */}
      <Modal
        isOpen={showDeleteClientModal}
        onClose={() => setShowDeleteClientModal(false)}
        title="Delete Client"
        size="small"
      >
        <div className="space-y-4">
          {selectedClient && (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-800">
                Are you sure you want to delete <strong>{selectedClient.companyName}</strong>? This action cannot be undone.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteClientModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="error"
              loading={submitting}
              onClick={handleDeleteClientConfirm}
              icon={Trash2}
            >
              Delete Client
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Content Modal */}
      <Modal
        isOpen={showCreateContentModal}
        onClose={() => setShowCreateContentModal(false)}
        title="Create Content"
        size="large"
      >
        <form onSubmit={handleCreateContentSubmit} className="space-y-6">
          {/* Client Section */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3">Client Information</h4>
            <div>
              <label className="form-label">
                Client <span className="text-red-500">*</span>
              </label>
              <select
                name="client"
                value={contentFormData.client}
                onChange={handleContentFormChange}
                required
                className="form-input"
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client._id || client.id} value={client._id || client.id}>
                    {client.companyName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Content Details Section */}
          <div className="bg-purple-50 p-4 rounded-lg space-y-4">
            <h4 className="font-semibold text-purple-900 mb-3">Content Details</h4>

            <div>
              <label className="form-label">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={contentFormData.title}
                onChange={handleContentFormChange}
                required
                placeholder="Enter content title"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={contentFormData.description}
                onChange={handleContentFormChange}
                rows={3}
                placeholder="Describe the content..."
                className="form-input"
              />
            </div>

            <div className="grid grid-2 gap-md">
              <div>
                <label className="form-label">
                  Content Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="contentType"
                  value={contentFormData.contentType}
                  onChange={handleContentFormChange}
                  required
                  className="form-input"
                >
                  <option value="blog_post">Blog Post</option>
                  <option value="social_media">Social Media</option>
                  <option value="email_campaign">Email Campaign</option>
                  <option value="video">Video</option>
                  <option value="infographic">Infographic</option>
                  <option value="whitepaper">Whitepaper</option>
                </select>
              </div>
              <div>
                <label className="form-label">Platform</label>
                <select
                  name="platform"
                  value={contentFormData.platform}
                  onChange={handleContentFormChange}
                  className="form-input"
                >
                  <option value="">Select platform</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter</option>
                  <option value="website">Website</option>
                  <option value="email">Email</option>
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </div>
            </div>
          </div>

          {/* Scheduling Section */}
          <div className="bg-green-50 p-4 rounded-lg space-y-4">
            <h4 className="font-semibold text-green-900 mb-3">Scheduling & Assignment</h4>

            <div className="grid grid-2 gap-md">
              <div>
                <label className="form-label">
                  Scheduled Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="scheduledDate"
                  value={contentFormData.scheduledDate}
                  onChange={handleContentFormChange}
                  required
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Assign To</label>
                <select
                  name="assignedTo"
                  value={contentFormData.assignedTo}
                  onChange={handleContentFormChange}
                  className="form-input"
                >
                  <option value="">Unassigned</option>
                  {employees.map(emp => (
                    <option key={emp._id || emp.id} value={emp._id || emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Status</label>
              <select
                name="status"
                value={contentFormData.status}
                onChange={handleContentFormChange}
                className="form-input"
              >
                <option value="draft">Draft</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="revision_needed">Revision Needed</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateContentModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              icon={Plus}
            >
              Create Content
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Content Modal */}
      <Modal
        isOpen={showEditContentModal}
        onClose={() => setShowEditContentModal(false)}
        title="Edit Content"
        size="large"
      >
        <form onSubmit={handleEditContentSubmit} className="space-y-4">
          {selectedContent && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-blue-900">Content ID: {selectedContent.contentId}</h4>
            </div>
          )}

          <div>
            <label className="form-label">
              Client <span className="text-red-500">*</span>
            </label>
            <select
              name="client"
              value={contentFormData.client}
              onChange={handleContentFormChange}
              required
              className="form-input"
            >
              <option value="">Select a client</option>
              {clients.map(client => (
                <option key={client._id || client.id} value={client._id || client.id}>
                  {client.companyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={contentFormData.title}
              onChange={handleContentFormChange}
              required
              placeholder="Content title"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={contentFormData.description}
              onChange={handleContentFormChange}
              rows={3}
              placeholder="Content description..."
              className="form-input"
            />
          </div>

          <div className="grid grid-2 gap-md">
            <div>
              <label className="form-label">
                Content Type <span className="text-red-500">*</span>
              </label>
              <select
                name="contentType"
                value={contentFormData.contentType}
                onChange={handleContentFormChange}
                required
                className="form-input"
              >
                <option value="blog_post">Blog Post</option>
                <option value="social_media">Social Media</option>
                <option value="email_campaign">Email Campaign</option>
                <option value="video">Video</option>
                <option value="infographic">Infographic</option>
                <option value="whitepaper">Whitepaper</option>
              </select>
            </div>
            <div>
              <label className="form-label">Platform</label>
              <select
                name="platform"
                value={contentFormData.platform}
                onChange={handleContentFormChange}
                className="form-input"
              >
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="twitter">Twitter</option>
                <option value="website">Website</option>
                <option value="email">Email</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
              </select>
            </div>
          </div>

          <div className="grid grid-2 gap-md">
            <div>
              <label className="form-label">
                Scheduled Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="scheduledDate"
                value={contentFormData.scheduledDate}
                onChange={handleContentFormChange}
                required
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Assign To</label>
              <select
                name="assignedTo"
                value={contentFormData.assignedTo}
                onChange={handleContentFormChange}
                className="form-input"
              >
                <option value="">Unassigned</option>
                {employees.map(emp => (
                  <option key={emp._id || emp.id} value={emp._id || emp.id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Status</label>
            <select
              name="status"
              value={contentFormData.status}
              onChange={handleContentFormChange}
              className="form-input"
            >
              <option value="draft">Draft</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="revision_needed">Revision Needed</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEditContentModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              icon={Edit}
            >
              Update Content
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Content Modal */}
      <Modal
        isOpen={showDeleteContentModal}
        onClose={() => setShowDeleteContentModal(false)}
        title="Delete Content"
        size="small"
      >
        <div className="space-y-4">
          {selectedContent && (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-800">
                Are you sure you want to delete <strong>{selectedContent.title}</strong>? This action cannot be undone.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteContentModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="error"
              loading={submitting}
              onClick={handleDeleteContentConfirm}
              icon={Trash2}
            >
              Delete Content
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Marketing;
