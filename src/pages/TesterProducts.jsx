import { useState, useEffect } from 'react';
import { Droplet, MessageSquare, ShoppingBag, Package, RefreshCw, Star, AlertTriangle, TrendingUp, Users, Image, FileText, Filter, X, Plus, Edit, Trash2, Activity } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatCard from '../components/dashboard/StatCard';
import Modal from '../components/common/Modal';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate, formatCurrency } from '../utils/formatters';
import { testerProductAPI, inventoryAPI } from '../services/api';

const TesterProducts = () => {
  const [distributions, setDistributions] = useState([]);
  const [consumptions, setConsumptions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('distributions');
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState(null);

  // CRUD Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Product Form
  const [productForm, setProductForm] = useState({
    itemCode: '',
    name: '',
    description: '',
    category: 'tester_product',
    quantity: 0,
    unit: 'units',
    costPrice: 0,
    reorderLevel: 10,
    location: 'spa',
    supplier: ''
  });

  // Stock Adjustment Form
  const [stockForm, setStockForm] = useState({
    quantity: 0,
    type: 'add',
    reason: ''
  });

  // Filters
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    therapist: '',
    product: '',
    status: '',
    rating: ''
  });

  const { error: showError, info } = useNotification();

  useEffect(() => {
    loadTesterData();
  }, []);

  const loadTesterData = async () => {
    const errors = [];

    try {
      setLoading(true);

      const [
        distributionsResult,
        consumptionsResult,
        statsResult,
        inventoryResult
      ] = await Promise.allSettled([
        testerProductAPI.getDistributions(),
        testerProductAPI.getConsumptions(),
        testerProductAPI.getStatistics(),
        inventoryAPI.getItems({ category: 'tester_product' })
      ]);

      if (distributionsResult.status === 'fulfilled') {
        setDistributions(distributionsResult.value?.data || []);
      } else {
        console.error('Failed to fetch tester distributions:', distributionsResult.reason);
        errors.push('tester distributions');
        setDistributions([]);
      }

      if (consumptionsResult.status === 'fulfilled') {
        setConsumptions(consumptionsResult.value?.data || []);
      } else {
        console.error('Failed to fetch product consumption:', consumptionsResult.reason);
        errors.push('service product consumption');
        setConsumptions([]);
      }

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value?.data || null);
      } else {
        console.error('Failed to fetch tester product stats:', statsResult.reason);
        errors.push('statistics');
        setStats(null);
      }

      if (inventoryResult.status === 'fulfilled') {
        setInventory(inventoryResult.value?.items || inventoryResult.value?.data || []);
      } else {
        console.error('Failed to fetch tester product inventory:', inventoryResult.reason);
        errors.push('tester product inventory');
        setInventory([]);
      }

      if (errors.length) {
        const message = `Failed to load ${errors.join(', ')}.`;
        showError(message.charAt(0).toUpperCase() + message.slice(1));
      }
    } catch (error) {
      console.error('Unexpected error loading tester product data:', error);
      showError('Failed to load tester product data');
      setDistributions([]);
      setConsumptions([]);
      setStats(null);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTesterData();
    setRefreshing(false);
    info('Data refreshed');
  };

  const handleViewDetails = (distribution) => {
    setSelectedDistribution(distribution);
    setShowDetailsModal(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      therapist: '',
      product: '',
      status: '',
      rating: ''
    });
  };

  // CRUD Handlers
  const handleCreateProduct = async () => {
    try {
      await inventoryAPI.createItem(productForm);
      info('Product created successfully');
      setShowCreateModal(false);
      setProductForm({
        itemCode: '',
        name: '',
        description: '',
        category: 'tester_product',
        quantity: 0,
        unit: 'units',
        costPrice: 0,
        reorderLevel: 10,
        location: 'spa',
        supplier: ''
      });
      await loadTesterData();
    } catch (error) {
      console.error('Error creating product:', error);
      showError(error.response?.data?.message || 'Failed to create product');
    }
  };

  const handleEditProduct = async () => {
    try {
      await inventoryAPI.updateItem(selectedProduct._id, productForm);
      info('Product updated successfully');
      setShowEditModal(false);
      setSelectedProduct(null);
      await loadTesterData();
    } catch (error) {
      console.error('Error updating product:', error);
      showError(error.response?.data?.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async () => {
    try {
      await inventoryAPI.deleteItem(selectedProduct._id);
      info('Product deleted successfully');
      setShowDeleteModal(false);
      setSelectedProduct(null);
      await loadTesterData();
    } catch (error) {
      console.error('Error deleting product:', error);
      showError(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleStockAdjustment = async () => {
    try {
      await inventoryAPI.adjustStock(selectedProduct._id, {
        quantity: stockForm.type === 'add' ? stockForm.quantity : -stockForm.quantity,
        reason: stockForm.reason
      });
      info('Stock adjusted successfully');
      setShowStockModal(false);
      setSelectedProduct(null);
      setStockForm({ quantity: 0, type: 'add', reason: '' });
      await loadTesterData();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      showError(error.response?.data?.message || 'Failed to adjust stock');
    }
  };

  const openCreateModal = () => {
    setProductForm({
      itemCode: '',
      name: '',
      description: '',
      category: 'tester_product',
      quantity: 0,
      unit: 'units',
      costPrice: 0,
      reorderLevel: 10,
      location: 'spa',
      supplier: ''
    });
    setShowCreateModal(true);
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setProductForm({
      itemCode: product.itemCode || '',
      name: product.name || '',
      description: product.description || '',
      category: product.category || 'tester_product',
      quantity: product.quantity || 0,
      unit: product.unit || 'units',
      costPrice: product.costPrice || 0,
      reorderLevel: product.reorderLevel || 10,
      location: product.location || 'spa',
      supplier: product.supplier || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setStockForm({ quantity: 0, type: 'add', reason: '' });
    setShowStockModal(true);
  };

  const getFilteredDistributions = () => {
    return distributions.filter(dist => {
      if (filters.dateFrom && new Date(dist.distributedDate) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(dist.distributedDate) > new Date(filters.dateTo)) return false;
      if (filters.status && getDistributionStatus(dist).label !== filters.status) return false;
      if (filters.rating && (!dist.customerFeedback?.rating || dist.customerFeedback.rating < parseInt(filters.rating))) return false;
      return true;
    });
  };

  const getFilteredConsumptions = () => {
    return consumptions.filter(cons => {
      if (filters.dateFrom && new Date(cons.serviceDate) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(cons.serviceDate) > new Date(filters.dateTo)) return false;
      if (filters.therapist) {
        const therapistName = `${cons.therapist?.firstName} ${cons.therapist?.lastName}`.toLowerCase();
        if (!therapistName.includes(filters.therapist.toLowerCase())) return false;
      }
      return true;
    });
  };

  const getLowStockProducts = () => {
    return inventory.filter(item => {
      const threshold = item.reorderLevel || item.reorderPoint || 10;
      return item.quantity <= threshold;
    });
  };

  const getDistributionStatus = (distribution) => {
    if (distribution?.followUp?.completed) {
      return {
        label: 'Follow-up Completed',
        variant: 'success'
      };
    }

    if (distribution?.followUp?.required) {
      return {
        label: 'Follow-up Required',
        variant: 'warning'
      };
    }

    if (distribution?.customerFeedback?.rating) {
      return {
        label: 'Feedback Received',
        variant: 'info'
      };
    }

    return {
      label: 'Distributed',
      variant: 'default'
    };
  };

  const getRatingStars = (rating) => {
    if (!rating) return 'N/A';
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const distributionColumns = [
    {
      key: 'distributionId',
      header: 'Distribution ID',
      render: (value) => <span className="font-mono text-sm">{value}</span>
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (_, distribution) => {
        const firstName = distribution.customer?.firstName || '';
        const lastName = distribution.customer?.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim() || 'N/A';

        return (
          <div>
            <div className="text-sm font-medium">{fullName}</div>
            {distribution.customer?.email && (
              <div className="text-xs text-gray">{distribution.customer.email}</div>
            )}
          </div>
        );
      }
    },
    {
      key: 'products',
      header: 'Products',
      render: (products = []) => (
        <div className="flex flex-wrap gap-1">
          {products.length > 0 ? (
            products.map((product, idx) => (
              <Badge key={idx} variant="default" size="sm">
                {(product.inventoryItem?.name || product.productName) ?? 'Unnamed'} × {product.quantity}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-gray">No products</span>
          )}
        </div>
      )
    },
    {
      key: 'distributedDate',
      header: 'Date',
      render: (value) => formatDate(value)
    },
    {
      key: 'customerFeedback',
      header: 'Rating',
      render: (feedback) =>
        feedback?.rating ? (
          <span className="text-warning font-semibold">{getRatingStars(feedback.rating)}</span>
        ) : (
          <span className="text-sm text-gray">No rating</span>
        )
    },
    {
      key: 'customerFeedback',
      header: 'Purchase Intent',
      render: (feedback) => {
        if (feedback?.purchaseIntent) {
          return <Badge variant="success">Yes</Badge>;
        }

        if (feedback?.rating) {
          return <Badge variant="error">No</Badge>;
        }

        return <Badge variant="default">Pending</Badge>;
      }
    },
    {
      key: 'followUp',
      header: 'Status',
      render: (_, distribution) => {
        const status = getDistributionStatus(distribution);
        return <Badge variant={status.variant}>{status.label}</Badge>;
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, distribution) => (
        <Button
          size="sm"
          variant="outline"
          icon={FileText}
          onClick={() => handleViewDetails(distribution)}
        >
          Details
        </Button>
      )
    }
  ];

  const consumptionColumns = [
    {
      key: 'consumptionId',
      header: 'Consumption ID',
      render: (value) => <span className="font-mono text-sm">{value}</span>
    },
    {
      key: 'booking',
      header: 'Booking',
      render: (booking) => booking?.bookingId || 'N/A'
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (customer) => {
        const firstName = customer?.firstName || '';
        const lastName = customer?.lastName || '';
        return (
          <div className="text-sm font-medium">
            {`${firstName} ${lastName}`.trim() || 'N/A'}
          </div>
        );
      }
    },
    {
      key: 'therapist',
      header: 'Therapist',
      render: (therapist) => {
        const firstName = therapist?.firstName || '';
        const lastName = therapist?.lastName || '';
        return (
          <div className="text-sm">{`${firstName} ${lastName}`.trim() || 'N/A'}</div>
        );
      }
    },
    {
      key: 'productsUsed',
      header: 'Products Used',
      render: (products = []) => (
        <div className="flex flex-col gap-1">
          {products.length > 0 ? products.map((product, idx) => (
            <Badge key={idx} variant="default" size="sm">
              {(product.inventoryItem?.name || product.productName) ?? 'Unnamed'} × {product.quantityUsed}{product.unit || ''}
            </Badge>
          )) : (
            <span className="text-sm text-gray">No products recorded</span>
          )}
        </div>
      )
    },
    {
      key: 'totalProductCost',
      header: 'Total Cost',
      render: (value) => <span className="font-semibold">{formatCurrency(value || 0)}</span>
    },
    {
      key: 'serviceDate',
      header: 'Date',
      render: (value) => formatDate(value)
    }
  ];

  const inventoryColumns = [
    {
      key: 'itemCode',
      header: 'Product Code',
      render: (value) => <span className="font-mono text-sm">{value}</span>
    },
    {
      key: 'name',
      header: 'Product Name',
      render: (value, item) => (
        <div>
          <div className="text-sm font-medium">{value}</div>
          {item.description && (
            <div className="text-xs text-gray">{item.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'quantity',
      header: 'Stock Level',
      render: (value, item) => {
        const threshold = item.reorderLevel || item.reorderPoint || 10;
        const isLow = value <= threshold;
        const isCritical = value <= threshold / 2;

        return (
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${isCritical ? 'text-error' : isLow ? 'text-warning' : 'text-success'}`}>
              {value} units
            </span>
            {isLow && <Badge variant={isCritical ? 'error' : 'warning'} size="sm">Low Stock</Badge>}
          </div>
        );
      }
    },
    {
      key: 'reorderLevel',
      header: 'Reorder Point',
      render: (value) => `${value || 10} units`
    },
    {
      key: 'costPrice',
      header: 'Unit Cost',
      render: (value) => formatCurrency(value || 0)
    },
    {
      key: 'location',
      header: 'Location',
      render: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Not specified'
    },
    {
      key: 'updatedAt',
      header: 'Last Updated',
      render: (value) => value ? formatDate(value) : 'N/A'
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, item) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={Activity}
            onClick={() => openStockModal(item)}
            title="Adjust Stock"
          >
            Stock
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={Edit}
            onClick={() => openEditModal(item)}
            title="Edit Product"
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={Trash2}
            onClick={() => openDeleteModal(item)}
            title="Delete Product"
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  const lowStockCount = getLowStockProducts().length;
  const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.quantity * (item.costPrice || 0)), 0);

  return (
    <Layout title="Spa Product Management" subtitle="Track tester distributions, service product consumption, and inventory">
      <div className="tester-products-page">
        {/* Enhanced Stats */}
        <div className="grid grid-4 mb-xl">
          <StatCard
            title="Total Distributions"
            value={stats?.totalDistributions || 0}
            icon={Droplet}
            color="var(--info)"
          />
          <StatCard
            title="Follow-up Required"
            value={stats?.followUpRequired || 0}
            icon={MessageSquare}
            color="var(--warning)"
          />
          <StatCard
            title="Purchase Intent"
            value={stats?.withPurchaseIntent || 0}
            icon={ShoppingBag}
            color="var(--success)"
          />
          <StatCard
            title="Avg Rating"
            value={stats?.averageRating?.toFixed(1) || 'N/A'}
            icon={Star}
            color="var(--primary-color)"
          />
          <StatCard
            title="Low Stock Items"
            value={lowStockCount}
            icon={AlertTriangle}
            color={lowStockCount > 0 ? "var(--error)" : "var(--success)"}
          />
          <StatCard
            title="Total Products"
            value={inventory.length}
            icon={Package}
            color="var(--info)"
          />
          <StatCard
            title="Inventory Value"
            value={formatCurrency(totalInventoryValue)}
            icon={TrendingUp}
            color="var(--primary-color)"
          />
          <StatCard
            title="Active Clients"
            value={distributions.filter(d => d.customerFeedback?.rating).length}
            icon={Users}
            color="var(--success)"
          />
        </div>

        {/* Tabs and Actions */}
        <Card>
          <div className="flex justify-between items-center mb-md">
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'distributions' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('distributions')}
              >
                Tester Distributions
              </Button>
              <Button
                variant={activeTab === 'consumption' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('consumption')}
              >
                Service Product Consumption
              </Button>
              <Button
                variant={activeTab === 'inventory' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('inventory')}
              >
                Products Inventory
              </Button>
            </div>
            <div className="flex gap-2">
              {(activeTab === 'distributions' || activeTab === 'consumption') && (
                <Button
                  icon={Filter}
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
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

          {/* Filters Panel */}
          {showFilters && (activeTab === 'distributions' || activeTab === 'consumption') && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-md">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-gray-900">Filters</h4>
                <Button size="sm" variant="ghost" icon={X} onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
              <div className="grid grid-4 gap-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date From</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date To</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                {activeTab === 'consumption' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Therapist</label>
                    <input
                      type="text"
                      placeholder="Search by therapist name"
                      value={filters.therapist}
                      onChange={(e) => handleFilterChange('therapist', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}
                {activeTab === 'distributions' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Rating</label>
                      <select
                        value={filters.rating}
                        onChange={(e) => handleFilterChange('rating', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">All Ratings</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4+ Stars</option>
                        <option value="3">3+ Stars</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                      <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">All Status</option>
                        <option value="Distributed">Distributed</option>
                        <option value="Feedback Received">Feedback Received</option>
                        <option value="Follow-up Required">Follow-up Required</option>
                        <option value="Follow-up Completed">Follow-up Completed</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Distributions Tab */}
        {activeTab === 'distributions' && (
          <Card title="Tester Product Distributions" icon={Droplet}>
            <Table
              columns={distributionColumns}
              data={getFilteredDistributions()}
              loading={loading}
              emptyMessage="No tester distributions found"
            />
          </Card>
        )}

        {/* Consumption Tab */}
        {activeTab === 'consumption' && (
          <Card title="Service Product Consumption" icon={Package}>
            <Table
              columns={consumptionColumns}
              data={getFilteredConsumptions()}
              loading={loading}
              emptyMessage="No consumption records found"
            />
          </Card>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <>
            {lowStockCount > 0 && (
              <Card>
                <div className="bg-warning-light border border-warning rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="text-warning mt-0.5" size={20} />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Low Stock Alert</h4>
                    <p className="text-sm text-gray-700">
                      {lowStockCount} product{lowStockCount > 1 ? 's' : ''} running low on stock. Consider reordering soon.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <Card
              title="Tester Products Inventory"
              icon={Package}
              action={
                <Button
                  icon={Plus}
                  variant="primary"
                  onClick={openCreateModal}
                >
                  Add Product
                </Button>
              }
            >
              <Table
                columns={inventoryColumns}
                data={inventory}
                loading={loading}
                emptyMessage="No tester products in inventory"
              />
            </Card>
          </>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedDistribution && (
          <Modal
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedDistribution(null);
            }}
            title="Distribution Details"
          >
            <div className="space-y-4">
              {/* Customer Information */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <h4 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                  Customer Information
                </h4>
                <div className="grid grid-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <p className="text-sm text-gray-900">
                      {`${selectedDistribution.customer?.firstName || ''} ${selectedDistribution.customer?.lastName || ''}`.trim() || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-sm text-gray-900">{selectedDistribution.customer?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-sm text-gray-900">{selectedDistribution.customer?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Distribution Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedDistribution.distributedDate)}</p>
                  </div>
                </div>
              </div>

              {/* Products Distributed */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <h4 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                  Products Distributed
                </h4>
                <div className="space-y-2">
                  {selectedDistribution.products?.map((product, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-900">
                        {product.inventoryItem?.name || product.productName || 'Unnamed Product'}
                      </span>
                      <Badge variant="default">Qty: {product.quantity}</Badge>
                    </div>
                  )) || <p className="text-sm text-gray-500">No products listed</p>}
                </div>
              </div>

              {/* Customer Feedback */}
              {selectedDistribution.customerFeedback && (
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h4 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                    Customer Feedback
                  </h4>
                  <div className="space-y-3">
                    {selectedDistribution.customerFeedback.rating && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                        <p className="text-lg text-warning font-semibold">
                          {getRatingStars(selectedDistribution.customerFeedback.rating)}
                        </p>
                      </div>
                    )}
                    {selectedDistribution.customerFeedback.comments && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                          {selectedDistribution.customerFeedback.comments}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Intent</label>
                      <Badge variant={selectedDistribution.customerFeedback.purchaseIntent ? 'success' : 'error'}>
                        {selectedDistribution.customerFeedback.purchaseIntent ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Therapist Notes */}
              {selectedDistribution.therapistNotes && (
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h4 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                    Therapist Notes & Recommendations
                  </h4>
                  <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded border border-blue-200">
                    {selectedDistribution.therapistNotes}
                  </p>
                </div>
              )}

              {/* Progress Photos */}
              {selectedDistribution.progressPhotos && selectedDistribution.progressPhotos.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h4 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
                    <Image size={18} />
                    Client Progress Photos
                  </h4>
                  <div className="grid grid-2 gap-3">
                    {selectedDistribution.progressPhotos.map((photo, idx) => (
                      <div key={idx} className="border border-gray-300 rounded-lg overflow-hidden">
                        <img
                          src={photo.url}
                          alt={photo.type || 'Progress photo'}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-2 bg-gray-50">
                          <p className="text-xs font-medium text-gray-700">{photo.type || 'Photo'}</p>
                          {photo.date && (
                            <p className="text-xs text-gray-500">{formatDate(photo.date)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up Information */}
              {selectedDistribution.followUp && (
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h4 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                    Follow-up Status
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Required:</span>
                      <Badge variant={selectedDistribution.followUp.required ? 'warning' : 'default'}>
                        {selectedDistribution.followUp.required ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Completed:</span>
                      <Badge variant={selectedDistribution.followUp.completed ? 'success' : 'default'}>
                        {selectedDistribution.followUp.completed ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    {selectedDistribution.followUp.notes && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                          {selectedDistribution.followUp.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Create Product Modal */}
        {showCreateModal && (
          <Modal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title="Create New Tester Product"
          >
            <div className="space-y-4">
              <div className="grid grid-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Code *</label>
                  <input
                    type="text"
                    value={productForm.itemCode}
                    onChange={(e) => setProductForm({ ...productForm, itemCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., TP-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Hydrating Face Cream"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="3"
                  placeholder="Product description..."
                />
              </div>

              <div className="grid grid-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity *</label>
                  <input
                    type="number"
                    value={productForm.quantity}
                    onChange={(e) => setProductForm({ ...productForm, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="units">Units</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="g">Grams (g)</option>
                    <option value="oz">Ounces (oz)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    value={productForm.costPrice}
                    onChange={(e) => setProductForm({ ...productForm, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                  <input
                    type="number"
                    value={productForm.reorderLevel}
                    onChange={(e) => setProductForm({ ...productForm, reorderLevel: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select
                    value={productForm.location}
                    onChange={(e) => setProductForm({ ...productForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="spa">Spa</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="storage">Storage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={productForm.supplier}
                    onChange={(e) => setProductForm({ ...productForm, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Supplier name"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleCreateProduct}>
                  Create Product
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Edit Product Modal */}
        {showEditModal && selectedProduct && (
          <Modal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedProduct(null);
            }}
            title="Edit Product"
          >
            <div className="space-y-4">
              <div className="grid grid-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Code *</label>
                  <input
                    type="text"
                    value={productForm.itemCode}
                    onChange={(e) => setProductForm({ ...productForm, itemCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="3"
                />
              </div>

              <div className="grid grid-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="units">Units</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="g">Grams (g)</option>
                    <option value="oz">Ounces (oz)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    value={productForm.costPrice}
                    onChange={(e) => setProductForm({ ...productForm, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                  <input
                    type="number"
                    value={productForm.reorderLevel}
                    onChange={(e) => setProductForm({ ...productForm, reorderLevel: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select
                    value={productForm.location}
                    onChange={(e) => setProductForm({ ...productForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="spa">Spa</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="storage">Storage</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <input
                  type="text"
                  value={productForm.supplier}
                  onChange={(e) => setProductForm({ ...productForm, supplier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => {
                  setShowEditModal(false);
                  setSelectedProduct(null);
                }}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleEditProduct}>
                  Save Changes
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Delete Product Modal */}
        {showDeleteModal && selectedProduct && (
          <Modal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedProduct(null);
            }}
            title="Delete Product"
          >
            <div className="space-y-4">
              <div className="bg-error-light border border-error rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="text-error mt-0.5" size={20} />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Confirm Deletion</h4>
                  <p className="text-sm text-gray-700">
                    Are you sure you want to delete <strong>{selectedProduct.name}</strong>? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Product Code:</span>
                    <span className="font-medium">{selectedProduct.itemCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Current Stock:</span>
                    <span className="font-medium">{selectedProduct.quantity} {selectedProduct.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Location:</span>
                    <span className="font-medium">{selectedProduct.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedProduct(null);
                }}>
                  Cancel
                </Button>
                <Button variant="error" onClick={handleDeleteProduct}>
                  Delete Product
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Stock Adjustment Modal */}
        {showStockModal && selectedProduct && (
          <Modal
            isOpen={showStockModal}
            onClose={() => {
              setShowStockModal(false);
              setSelectedProduct(null);
              setStockForm({ quantity: 0, type: 'add', reason: '' });
            }}
            title="Adjust Stock Level"
          >
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-900 mb-2">{selectedProduct.name}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Product Code:</span>
                    <span className="font-medium">{selectedProduct.itemCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Current Stock:</span>
                    <span className="font-medium text-lg">{selectedProduct.quantity} {selectedProduct.unit}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type</label>
                <div className="grid grid-2 gap-2">
                  <button
                    onClick={() => setStockForm({ ...stockForm, type: 'add' })}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      stockForm.type === 'add'
                        ? 'border-success bg-success-light text-success font-semibold'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    + Add Stock
                  </button>
                  <button
                    onClick={() => setStockForm({ ...stockForm, type: 'remove' })}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      stockForm.type === 'remove'
                        ? 'border-error bg-error-light text-error font-semibold'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    - Remove Stock
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm({ ...stockForm, quantity: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min="0"
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <textarea
                  value={stockForm.reason}
                  onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="3"
                  placeholder="Reason for adjustment (e.g., Received shipment, Damaged goods, Inventory audit)"
                />
              </div>

              {stockForm.quantity > 0 && (
                <div className="border border-info rounded-lg p-4 bg-info-light">
                  <div className="flex items-start gap-2">
                    <Package className="text-info mt-0.5" size={20} />
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-1">New Stock Level</h5>
                      <p className="text-sm text-gray-700">
                        {stockForm.type === 'add'
                          ? `${selectedProduct.quantity} + ${stockForm.quantity} = ${selectedProduct.quantity + stockForm.quantity} ${selectedProduct.unit}`
                          : `${selectedProduct.quantity} - ${stockForm.quantity} = ${Math.max(0, selectedProduct.quantity - stockForm.quantity)} ${selectedProduct.unit}`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => {
                  setShowStockModal(false);
                  setSelectedProduct(null);
                  setStockForm({ quantity: 0, type: 'add', reason: '' });
                }}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleStockAdjustment}
                  disabled={!stockForm.quantity || !stockForm.reason}
                >
                  Adjust Stock
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
};

export default TesterProducts;
