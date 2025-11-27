import { useState, useEffect } from 'react';
import { Truck, Plus, Star, Package, DollarSign, TrendingUp, RefreshCw, Edit, Trash2 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatCard from '../components/dashboard/StatCard';
import Modal from '../components/common/Modal';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate, formatCurrency } from '../utils/formatters';
import { supplierAPI } from '../services/api';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('suppliers');
  const [submitting, setSubmitting] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: {
      name: '',
      email: '',
      phone: '',
      title: ''
    },
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    businessDetails: {
      taxId: '',
      registrationNumber: '',
      website: ''
    },
    categories: [],
    paymentTerms: 'net_30',
    customPaymentTerms: '',
    creditLimit: 0,
    status: 'active',
    notes: ''
  });

  const { success, error: showError, info } = useNotification();

  useEffect(() => {
    fetchSuppliers();
    fetchPurchaseOrders();
    fetchStats();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await supplierAPI.getAll();
      if (response && response.data) {
        setSuppliers(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
      showError('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const response = await supplierAPI.getPurchaseOrders();
      if (response && response.data) {
        setPurchaseOrders(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch purchase orders:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await supplierAPI.getStatistics();
      if (response && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSuppliers(), fetchPurchaseOrders(), fetchStats()]);
    setRefreshing(false);
    info('Data refreshed');
  };

  const handleApprovePO = async (poId) => {
    try {
      await supplierAPI.approvePurchaseOrder(poId);
      success('Purchase order approved successfully');
      await fetchPurchaseOrders();
      await fetchStats();
    } catch (err) {
      console.error('Failed to approve PO:', err);
      showError(err.message || 'Failed to approve purchase order');
    }
  };

  // CRUD Handlers
  const handleCreateClick = () => {
    setFormData({
      companyName: '',
      contactPerson: {
        name: '',
        email: '',
        phone: '',
        title: ''
      },
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      businessDetails: {
        taxId: '',
        registrationNumber: '',
        website: ''
      },
      categories: [],
      paymentTerms: 'net_30',
      customPaymentTerms: '',
      creditLimit: 0,
      status: 'active',
      notes: ''
    });
    setShowCreateModal(true);
  };

  const handleEditClick = (supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      companyName: supplier.companyName || '',
      contactPerson: {
        name: supplier.contactPerson?.name || '',
        email: supplier.contactPerson?.email || '',
        phone: supplier.contactPerson?.phone || '',
        title: supplier.contactPerson?.title || ''
      },
      address: {
        street: supplier.address?.street || '',
        city: supplier.address?.city || '',
        state: supplier.address?.state || '',
        zipCode: supplier.address?.zipCode || '',
        country: supplier.address?.country || ''
      },
      businessDetails: {
        taxId: supplier.businessDetails?.taxId || '',
        registrationNumber: supplier.businessDetails?.registrationNumber || '',
        website: supplier.businessDetails?.website || ''
      },
      categories: supplier.categories || [],
      paymentTerms: supplier.paymentTerms || 'net_30',
      customPaymentTerms: supplier.customPaymentTerms || '',
      creditLimit: supplier.creditLimit || 0,
      status: supplier.status || 'active',
      notes: supplier.notes || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDeleteModal(true);
  };

  const handleFormChange = (field, value, nested = null, nestedField = null) => {
    if (nested && nestedField) {
      setFormData(prev => ({
        ...prev,
        [nested]: {
          ...prev[nested],
          [nestedField]: value
        }
      }));
    } else if (nested) {
      setFormData(prev => ({
        ...prev,
        [nested]: value
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleCategoryToggle = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyName || !formData.contactPerson.name || !formData.contactPerson.email || !formData.contactPerson.phone) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await supplierAPI.create(formData);
      success('Supplier created successfully');
      setShowCreateModal(false);
      await fetchSuppliers();
      await fetchStats();
    } catch (err) {
      console.error('Failed to create supplier:', err);
      showError(err.message || 'Failed to create supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyName || !formData.contactPerson.name || !formData.contactPerson.email || !formData.contactPerson.phone) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await supplierAPI.update(selectedSupplier._id, formData);
      success('Supplier updated successfully');
      setShowEditModal(false);
      await fetchSuppliers();
      await fetchStats();
    } catch (err) {
      console.error('Failed to update supplier:', err);
      showError(err.message || 'Failed to update supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setSubmitting(true);
      await supplierAPI.delete(selectedSupplier._id);
      success('Supplier deleted successfully');
      setShowDeleteModal(false);
      await fetchSuppliers();
      await fetchStats();
    } catch (err) {
      console.error('Failed to delete supplier:', err);
      showError(err.message || 'Failed to delete supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      inactive: 'secondary',
      suspended: 'danger',
      pending: 'warning',
      approved: 'info',
      received: 'success'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };

  const supplierColumns = [
    {
      header: 'Company',
      accessor: 'companyName',
      cell: (supplier) => (
        <div>
          <div className="font-medium">{supplier.companyName}</div>
          <div className="text-sm text-gray-500">{supplier.supplierId}</div>
        </div>
      )
    },
    {
      header: 'Contact',
      accessor: 'contactPerson',
      cell: (supplier) => (
        <div>
          <div className="text-sm">{supplier.contactPerson?.name}</div>
          <div className="text-xs text-gray-500">{supplier.contactPerson?.email}</div>
        </div>
      )
    },
    {
      header: 'Categories',
      accessor: 'categories',
      cell: (supplier) => (
        <div className="flex flex-wrap gap-1">
          {supplier.categories?.map((cat, idx) => (
            <Badge key={idx} variant="secondary" size="sm">{cat}</Badge>
          ))}
        </div>
      )
    },
    {
      header: 'Rating',
      accessor: 'rating',
      cell: (supplier) => (
        <div className="flex items-center gap-1">
          <Star size={16} className="text-yellow-400 fill-current" />
          <span className="font-medium">{supplier.rating?.overall?.toFixed(1) || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Total Purchases',
      accessor: 'totalPurchases',
      cell: (supplier) => formatCurrency(supplier.totalPurchases || 0)
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (supplier) => getStatusBadge(supplier.status)
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (supplier) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={Edit}
            onClick={() => handleEditClick(supplier)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="error"
            icon={Trash2}
            onClick={() => handleDeleteClick(supplier)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  const poColumns = [
    {
      header: 'PO Number',
      accessor: 'poNumber',
      cell: (po) => <span className="font-mono font-medium">{po.poNumber}</span>
    },
    {
      header: 'Supplier',
      accessor: 'supplier',
      cell: (po) => po.supplier?.companyName
    },
    {
      header: 'Order Date',
      accessor: 'orderDate',
      cell: (po) => formatDate(po.orderDate)
    },
    {
      header: 'Expected Delivery',
      accessor: 'expectedDeliveryDate',
      cell: (po) => formatDate(po.expectedDeliveryDate)
    },
    {
      header: 'Total Amount',
      accessor: 'totalAmount',
      cell: (po) => <span className="font-bold">{formatCurrency(po.totalAmount)}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (po) => getStatusBadge(po.status)
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (po) => (
        <div className="flex gap-2">
          {po.status === 'pending' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleApprovePO(po._id)}
            >
              Approve
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <Layout title="Supplier Management" subtitle="Manage suppliers and purchase orders">
      <div className="suppliers-page">
        {/* Stats */}
        {stats && (
          <div className="grid grid-4 mb-xl">
            <StatCard
              title="Total Suppliers"
              value={stats.suppliers?.totalSuppliers || 0}
              icon={Truck}
              color="var(--primary-color)"
            />
            <StatCard
              title="Active Suppliers"
              value={stats.suppliers?.activeSuppliers || 0}
              icon={TrendingUp}
              color="var(--success)"
            />
            <StatCard
              title="Total Orders"
              value={stats.purchaseOrders?.totalOrders || 0}
              icon={Package}
              color="var(--info)"
            />
            <StatCard
              title="Total Value"
              value={formatCurrency(stats.suppliers?.totalPurchaseValue || 0)}
              icon={DollarSign}
              color="var(--warning)"
            />
          </div>
        )}

        {/* Tabs and Actions */}
        <Card>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'suppliers' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('suppliers')}
              >
                Suppliers
              </Button>
              <Button
                variant={activeTab === 'orders' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('orders')}
              >
                Purchase Orders
              </Button>
            </div>
            <div className="flex gap-2">
              {activeTab === 'suppliers' && (
                <Button
                  icon={Plus}
                  variant="primary"
                  onClick={handleCreateClick}
                >
                  Create Supplier
                </Button>
              )}
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

        {/* Suppliers Tab */}
        {activeTab === 'suppliers' && (
          <Card title="Suppliers" icon={Truck}>
            <Table
              columns={supplierColumns}
              data={suppliers}
              loading={loading}
              emptyMessage="No suppliers found"
            />
          </Card>
        )}

        {/* Purchase Orders Tab */}
        {activeTab === 'orders' && (
          <Card title="Purchase Orders" icon={Package}>
            <Table
              columns={poColumns}
              data={purchaseOrders}
              loading={loading}
              emptyMessage="No purchase orders found"
            />
          </Card>
        )}

        {/* Create Supplier Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Supplier"
          size="large"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {/* Company Information Section */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h4 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Company Information</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleFormChange('companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tax ID</label>
                    <input
                      type="text"
                      value={formData.businessDetails.taxId}
                      onChange={(e) => handleFormChange('taxId', e.target.value, 'businessDetails', 'taxId')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Registration Number</label>
                    <input
                      type="text"
                      value={formData.businessDetails.registrationNumber}
                      onChange={(e) => handleFormChange('registrationNumber', e.target.value, 'businessDetails', 'registrationNumber')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
                  <input
                    type="url"
                    value={formData.businessDetails.website}
                    onChange={(e) => handleFormChange('website', e.target.value, 'businessDetails', 'website')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            {/* Contact Person Section */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h4 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Contact Person</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson.name}
                      onChange={(e) => handleFormChange('name', e.target.value, 'contactPerson', 'name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                    <input
                      type="text"
                      value={formData.contactPerson.title}
                      onChange={(e) => handleFormChange('title', e.target.value, 'contactPerson', 'title')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.contactPerson.email}
                      onChange={(e) => handleFormChange('email', e.target.value, 'contactPerson', 'email')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.contactPerson.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value, 'contactPerson', 'phone')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h4 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Address</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Street</label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) => handleFormChange('street', e.target.value, 'address', 'street')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => handleFormChange('city', e.target.value, 'address', 'city')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">State/Province</label>
                    <input
                      type="text"
                      value={formData.address.state}
                      onChange={(e) => handleFormChange('state', e.target.value, 'address', 'state')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Postal Code</label>
                    <input
                      type="text"
                      value={formData.address.zipCode}
                      onChange={(e) => handleFormChange('zipCode', e.target.value, 'address', 'zipCode')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                    <input
                      type="text"
                      value={formData.address.country}
                      onChange={(e) => handleFormChange('country', e.target.value, 'address', 'country')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Details Section */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h4 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Business Details</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                  <div className="flex flex-wrap gap-3">
                    {['raw_materials', 'packaging', 'equipment', 'spa_products', 'office_supplies', 'other'].map(cat => (
                      <label key={cat} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(cat)}
                          onChange={() => handleCategoryToggle(cat)}
                          className="rounded text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">{cat.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Terms</label>
                    <select
                      value={formData.paymentTerms}
                      onChange={(e) => handleFormChange('paymentTerms', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="immediate">Immediate</option>
                      <option value="net_15">Net 15</option>
                      <option value="net_30">Net 30</option>
                      <option value="net_45">Net 45</option>
                      <option value="net_60">Net 60</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Credit Limit</label>
                    <input
                      type="number"
                      value={formData.creditLimit}
                      onChange={(e) => handleFormChange('creditLimit', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                {formData.paymentTerms === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Payment Terms</label>
                    <input
                      type="text"
                      value={formData.customPaymentTerms}
                      onChange={(e) => handleFormChange('customPaymentTerms', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Describe custom payment terms"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Additional notes about the supplier"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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
              >
                Create Supplier
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Supplier Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Supplier"
          size="large"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {selectedSupplier && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <span className="font-medium">Supplier ID:</span>{' '}
                  <span className="font-mono font-semibold">{selectedSupplier.supplierId}</span>
                </p>
              </div>
            )}

            {/* Company Information Section */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h4 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Company Information</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleFormChange('companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tax ID</label>
                    <input
                      type="text"
                      value={formData.businessDetails.taxId}
                      onChange={(e) => handleFormChange('taxId', e.target.value, 'businessDetails', 'taxId')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Registration Number</label>
                    <input
                      type="text"
                      value={formData.businessDetails.registrationNumber}
                      onChange={(e) => handleFormChange('registrationNumber', e.target.value, 'businessDetails', 'registrationNumber')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
                  <input
                    type="url"
                    value={formData.businessDetails.website}
                    onChange={(e) => handleFormChange('website', e.target.value, 'businessDetails', 'website')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            {/* Contact Person Section */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h4 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Contact Person</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson.name}
                      onChange={(e) => handleFormChange('name', e.target.value, 'contactPerson', 'name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                    <input
                      type="text"
                      value={formData.contactPerson.title}
                      onChange={(e) => handleFormChange('title', e.target.value, 'contactPerson', 'title')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.contactPerson.email}
                      onChange={(e) => handleFormChange('email', e.target.value, 'contactPerson', 'email')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.contactPerson.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value, 'contactPerson', 'phone')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h4 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Address</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Street</label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) => handleFormChange('street', e.target.value, 'address', 'street')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => handleFormChange('city', e.target.value, 'address', 'city')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">State/Province</label>
                    <input
                      type="text"
                      value={formData.address.state}
                      onChange={(e) => handleFormChange('state', e.target.value, 'address', 'state')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Postal Code</label>
                    <input
                      type="text"
                      value={formData.address.zipCode}
                      onChange={(e) => handleFormChange('zipCode', e.target.value, 'address', 'zipCode')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                    <input
                      type="text"
                      value={formData.address.country}
                      onChange={(e) => handleFormChange('country', e.target.value, 'address', 'country')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Details Section */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h4 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Business Details</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                  <div className="flex flex-wrap gap-3">
                    {['raw_materials', 'packaging', 'equipment', 'spa_products', 'office_supplies', 'other'].map(cat => (
                      <label key={cat} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(cat)}
                          onChange={() => handleCategoryToggle(cat)}
                          className="rounded text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">{cat.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Terms</label>
                    <select
                      value={formData.paymentTerms}
                      onChange={(e) => handleFormChange('paymentTerms', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="immediate">Immediate</option>
                      <option value="net_15">Net 15</option>
                      <option value="net_30">Net 30</option>
                      <option value="net_45">Net 45</option>
                      <option value="net_60">Net 60</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Credit Limit</label>
                    <input
                      type="number"
                      value={formData.creditLimit}
                      onChange={(e) => handleFormChange('creditLimit', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                {formData.paymentTerms === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Payment Terms</label>
                    <input
                      type="text"
                      value={formData.customPaymentTerms}
                      onChange={(e) => handleFormChange('customPaymentTerms', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Describe custom payment terms"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Additional notes about the supplier"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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
              >
                Update Supplier
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Supplier Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Supplier"
          size="small"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-600 mt-0.5">⚠️</div>
              <div>
                <p className="font-medium text-red-900">Warning: This action cannot be undone</p>
                <p className="text-sm text-red-700 mt-1">
                  Are you sure you want to delete supplier "{selectedSupplier?.companyName}"?
                </p>
                <p className="text-sm text-red-700 mt-2">
                  Note: Suppliers with existing purchase orders cannot be deleted.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="error"
                onClick={handleDeleteConfirm}
                loading={submitting}
              >
                Delete Supplier
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default Suppliers;
