import { useState, useEffect, useMemo } from 'react';
import { FileText, Eye, Download, XCircle, RefreshCw, Plus, Edit, Trash2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import StatCard from '../components/dashboard/StatCard';
import IndemnityFormSigner from '../components/indemnity/IndemnityFormSigner';
import IndemnityFormModal from '../components/indemnity/IndemnityFormModal';
import IndemnityFormCreator from '../components/indemnity/IndemnityFormCreator';
import { indemnityAPI } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate } from '../utils/formatters';

const IndemnityForms = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [formConfig, setFormConfig] = useState({ customer: null, serviceType: 'gym', expiryDate: null });

  const { success, error: showError } = useNotification();

  useEffect(() => {
    fetchForms();
  }, [filterType]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const params = filterType !== 'all' ? { serviceType: filterType } : {};
      const response = await indemnityAPI.getAll(params);
      setForms(response.data || []);
    } catch (err) {
      console.error('Failed to fetch indemnity forms:', err);
      showError('Failed to load indemnity forms');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchForms();
    setRefreshing(false);
    success('Indemnity forms refreshed');
  };

  const handleViewForm = (form) => {
    setSelectedForm(form);
    setShowViewModal(true);
  };

  const handleCreateForm = () => {
    setShowCreatorModal(true);
  };

  const handleProceedToForm = (config) => {
    setFormConfig(config);
    setShowCreatorModal(false);
    setShowCreateModal(true);
  };

  const handleEditForm = (form) => {
    setSelectedForm(form);
    setShowEditModal(true);
  };

  const handleDeleteForm = async (formId) => {
    if (!window.confirm('Are you sure you want to permanently delete this indemnity form? This action cannot be undone.')) {
      return;
    }

    try {
      await indemnityAPI.delete(formId);
      success('Indemnity form deleted successfully');
      fetchForms();
    } catch (err) {
      console.error('Failed to delete form:', err);
      showError('Failed to delete indemnity form');
    }
  };

  const handleRevokeForm = async (formId) => {
    if (!window.confirm('Are you sure you want to revoke this indemnity form?')) {
      return;
    }

    const reason = prompt('Please provide a reason for revoking this form:');
    if (!reason) return;

    try {
      await indemnityAPI.revoke(formId, { reason });
      success('Indemnity form revoked successfully');
      fetchForms();
    } catch (err) {
      console.error('Failed to revoke form:', err);
      showError('Failed to revoke indemnity form');
    }
  };

  const handleDownload = async (formId) => {
    try {
      const response = await indemnityAPI.download(formId);
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `indemnity-form-${formId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      success('Form downloaded successfully');
    } catch (err) {
      console.error('Failed to download form:', err);
      showError('Failed to download form');
    }
  };

  const columns = [
    {
      key: 'formId',
      header: 'Form ID',
      render: (value) => <span className="font-mono text-sm font-semibold text-gray-700">{value}</span>
    },
    {
      key: 'serviceType',
      header: 'Service',
      render: (value) => {
        const variants = {
          childcare: 'info',
          gym: 'warning',
          guest_pass: 'secondary',
          spa: 'primary'
        };
        return <Badge variant={variants[value]}>{value.replace('_', ' ')}</Badge>;
      }
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (value) => (
        <div>
          <div className="font-medium text-gray-900">{value?.firstName} {value?.lastName}</div>
          <div className="text-xs text-gray-500">{value?.email}</div>
        </div>
      )
    },
    {
      key: 'signedDate',
      header: 'Signed Date',
      render: (value) => <span className="text-sm text-gray-700">{formatDate(value)}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => {
        const variants = {
          active: 'success',
          expired: 'warning',
          revoked: 'error'
        };
        return <Badge variant={variants[value]}>{value}</Badge>;
      }
    },
    {
      key: 'expiryDate',
      header: 'Expiry',
      render: (value) => <span className="text-sm text-gray-700">{value ? formatDate(value) : 'No expiry'}</span>
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Eye}
            onClick={() => handleViewForm(row)}
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={() => handleDownload(row._id)}
          >
            PDF
          </Button>
          {row.status !== 'revoked' && (
            <Button
              variant="outline"
              size="sm"
              icon={Edit}
              onClick={() => handleEditForm(row)}
            >
              Edit
            </Button>
          )}
          {row.status === 'active' && (
            <Button
              variant="outline"
              size="sm"
              icon={XCircle}
              onClick={() => handleRevokeForm(row._id)}
            >
              Revoke
            </Button>
          )}
          <Button
            variant="error"
            size="sm"
            icon={Trash2}
            onClick={() => handleDeleteForm(row._id)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  const stats = useMemo(() => {
    const total = forms.length;
    const active = forms.filter(f => f.status === 'active').length;
    const expired = forms.filter(f => f.status === 'expired').length;
    const revoked = forms.filter(f => f.status === 'revoked').length;
    const childcare = forms.filter(f => f.serviceType === 'childcare').length;
    const gym = forms.filter(f => f.serviceType === 'gym').length;
    const guestPass = forms.filter(f => f.serviceType === 'guest_pass').length;
    const spa = forms.filter(f => f.serviceType === 'spa').length;

    return { total, active, expired, revoked, childcare, gym, guestPass, spa };
  }, [forms]);

  return (
    <Layout title="Indemnity Forms" subtitle="Manage liability waivers and consent forms">
      {/* Status Stats */}
      <div className="grid grid-4 mb-xl">
        <StatCard
          title="Total Forms"
          value={stats.total}
          icon={FileText}
          color="var(--primary-color)"
        />
        <StatCard
          title="Active Forms"
          value={stats.active}
          icon={CheckCircle}
          color="var(--success)"
        />
        <StatCard
          title="Expired Forms"
          value={stats.expired}
          icon={Clock}
          color="var(--warning)"
        />
        <StatCard
          title="Revoked Forms"
          value={stats.revoked}
          icon={AlertCircle}
          color="var(--error)"
        />
      </div>

      {/* Service Type Stats */}
      <div className="grid grid-4 mb-xl">
        <Card>
          <div className="text-center py-3">
            <p className="text-sm font-medium text-gray-600 mb-1">Childcare</p>
            <h4 className="text-2xl font-bold text-blue-600">{stats.childcare}</h4>
          </div>
        </Card>
        <Card>
          <div className="text-center py-3">
            <p className="text-sm font-medium text-gray-600 mb-1">Gym</p>
            <h4 className="text-2xl font-bold text-orange-600">{stats.gym}</h4>
          </div>
        </Card>
        <Card>
          <div className="text-center py-3">
            <p className="text-sm font-medium text-gray-600 mb-1">Guest Pass</p>
            <h4 className="text-2xl font-bold text-purple-600">{stats.guestPass}</h4>
          </div>
        </Card>
        <Card>
          <div className="text-center py-3">
            <p className="text-sm font-medium text-gray-600 mb-1">Spa</p>
            <h4 className="text-2xl font-bold text-pink-600">{stats.spa}</h4>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">All Indemnity Forms</h3>
          <div className="flex gap-2">
            <Button
              icon={Plus}
              variant="primary"
              onClick={handleCreateForm}
            >
              Create Form
            </Button>
            <Button
              icon={RefreshCw}
              variant="outline"
              onClick={handleRefresh}
              loading={refreshing}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={filterType === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
          >
            All
          </Button>
          <Button
            variant={filterType === 'childcare' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterType('childcare')}
          >
            Childcare
          </Button>
          <Button
            variant={filterType === 'gym' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterType('gym')}
          >
            Gym
          </Button>
          <Button
            variant={filterType === 'guest_pass' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterType('guest_pass')}
          >
            Guest Pass
          </Button>
          <Button
            variant={filterType === 'spa' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterType('spa')}
          >
            Spa
          </Button>
        </div>
        <Table
          columns={columns}
          data={forms}
          loading={loading}
          searchPlaceholder="Search forms..."
        />
      </Card>

      {/* View Form Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedForm(null);
        }}
        title="View Indemnity Form"
        size="lg"
      >
        {selectedForm && (
          <IndemnityFormSigner
            serviceType={selectedForm.serviceType}
            customer={selectedForm.customer}
            existingForm={selectedForm}
            readOnly={true}
            onCancel={() => {
              setShowViewModal(false);
              setSelectedForm(null);
            }}
          />
        )}
      </Modal>

      {/* Customer & Service Selector Modal */}
      <IndemnityFormCreator
        isOpen={showCreatorModal}
        onClose={() => setShowCreatorModal(false)}
        onProceed={handleProceedToForm}
      />

      {/* Create Form Modal */}
      <IndemnityFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchForms}
        serviceType={formConfig.serviceType}
        customer={formConfig.customer}
        additionalData={{ expiryDate: formConfig.expiryDate }}
      />

      {/* Edit Form Modal */}
      {selectedForm && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedForm(null);
          }}
          title="Edit Indemnity Form"
          size="lg"
        >
          <IndemnityFormSigner
            serviceType={selectedForm.serviceType}
            customer={selectedForm.customer}
            existingForm={selectedForm}
            readOnly={false}
            onSign={async (formData) => {
              try {
                await indemnityAPI.update(selectedForm._id, formData);
                success('Indemnity form updated successfully');
                setShowEditModal(false);
                setSelectedForm(null);
                fetchForms();
              } catch (err) {
                console.error('Failed to update form:', err);
                showError('Failed to update indemnity form');
                throw err;
              }
            }}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedForm(null);
            }}
          />
        </Modal>
      )}
    </Layout>
  );
};

export default IndemnityForms;
