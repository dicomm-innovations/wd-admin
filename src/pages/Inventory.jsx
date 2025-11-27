import { useState, useEffect } from 'react';
import { Package2, AlertTriangle, TrendingDown, BarChart3, RefreshCw, Download, Plus, Edit, Trash2 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import StatCard from '../components/dashboard/StatCard';
import ImageUpload from '../components/common/ImageUpload';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatCurrency } from '../utils/formatters';
import { downloadCSV, inventoryExportColumns } from '../utils/exportHelpers';
import { inventoryAPI } from '../services/api';
import './Inventory.css';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'raw_material',
    quantity: 0,
    reorderLevel: 10,
    costPrice: 0,
    sellingPrice: 0,
    location: 'manufacturing',
    supplier: '',
    supplierBatch: ''
  });

  // Image upload state for create modal
  const [pendingImages, setPendingImages] = useState([]);

  const { subscribeToInventoryLowStock, connected } = useWebSocket();
  const { success, error: showError, warning, info } = useNotification();

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    if (!connected) return;

    const unsubscribe = subscribeToInventoryLowStock((data) => {
      warning(`Low stock alert: ${data.itemName} (${data.quantity} ${data.unit} remaining)`, 8000);
    });

    return () => unsubscribe && unsubscribe();
  }, [connected, subscribeToInventoryLowStock, warning]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await inventoryAPI.getItems();

      if (response && response.items) {
        const fetchedItems = response.items;
        setItems(fetchedItems);

        const totalValue = fetchedItems.reduce((sum, item) =>
          sum + (item.quantity * item.costPrice), 0
        );

        setStats({
          total: fetchedItems.length,
          lowStock: fetchedItems.filter(i => i.status === 'low_stock').length,
          outOfStock: fetchedItems.filter(i => i.status === 'out_of_stock').length,
          totalValue
        });

        setLoading(false);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
      setError('Failed to load inventory. Using cached data.');
      showError('Failed to load inventory');
      setLoading(false);

      const mockItems = [
      {
        id: '1',
        itemCode: 'INV-1704123456809',
        name: 'Argan Oil',
        category: 'raw_material',
        quantity: 950,
        reorderLevel: 200,
        unit: 'ml',
        costPrice: 0.80,
        sellingPrice: 1.50,
        location: 'spa',
        status: 'in_stock'
      },
      {
        id: '2',
        itemCode: 'INV-1704123456810',
        name: 'Rose Essential Oil',
        category: 'raw_material',
        quantity: 150,
        reorderLevel: 200,
        unit: 'ml',
        costPrice: 0.90,
        sellingPrice: 1.80,
        location: 'manufacturing',
        status: 'low_stock'
      },
      {
        id: '3',
        itemCode: 'INV-1704123456811',
        name: 'Protein Powder',
        category: 'finished_product',
        quantity: 0,
        reorderLevel: 50,
        unit: 'kg',
        costPrice: 15.00,
        sellingPrice: 25.00,
        location: 'gym',
        status: 'out_of_stock'
      }
    ];

      setItems(mockItems);
      setStats({
        total: mockItems.length,
        lowStock: mockItems.filter(i => i.status === 'low_stock').length,
        outOfStock: mockItems.filter(i => i.status === 'out_of_stock').length,
        totalValue: mockItems.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0)
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInventory();
    setRefreshing(false);
    info('Inventory refreshed', 2000);
  };

  const handleExport = () => {
    try {
      downloadCSV(items, inventoryExportColumns, `inventory_${Date.now()}.csv`);
      success('Inventory exported successfully!');
    } catch (err) {
      showError('Failed to export inventory');
    }
  };

  // CRUD HANDLERS
  const handleCreateClick = () => {
    setFormData({
      name: '',
      description: '',
      category: 'raw_material',
      quantity: 0,
      reorderLevel: 10,
      costPrice: 0,
      sellingPrice: 0,
      location: 'manufacturing',
      supplier: '',
      supplierBatch: ''
    });
    setPendingImages([]);
    setShowCreateModal(true);
  };

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      category: item.category || 'raw_material',
      quantity: item.quantity || 0,
      reorderLevel: item.reorderLevel || 10,
      costPrice: item.costPrice || 0,
      sellingPrice: item.sellingPrice || 0,
      location: item.location || 'manufacturing',
      supplier: item.supplier || '',
      supplierBatch: item.supplierBatch || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  // Pending image handlers (for create modal - before item is saved)
  const handlePendingImageAdd = async (files) => {
    // Store files as temporary preview URLs
    const imagePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            file: file,
            url: reader.result,
            _id: Date.now() + Math.random(), // Temporary ID
            isPrimary: pendingImages.length === 0
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const newImages = await Promise.all(imagePromises);
    setPendingImages(prev => [...prev, ...newImages]);
  };

  const handlePendingImageDelete = (imageId) => {
    setPendingImages(prev => {
      const filtered = prev.filter(img => img._id !== imageId);
      // If we deleted the primary image, make the first one primary
      if (filtered.length > 0 && !filtered.some(img => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const handlePendingImageSetPrimary = (imageId) => {
    setPendingImages(prev => prev.map(img => ({
      ...img,
      isPrimary: img._id === imageId
    })));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      setSubmitting(true);

      // Create the item first
      const response = await inventoryAPI.createItem(formData);
      const createdItem = response.item;

      // If there are pending images, upload them
      if (pendingImages.length > 0) {
        const imageFormData = new FormData();
        pendingImages.forEach(img => {
          imageFormData.append('images', img.file);
        });

        await inventoryAPI.uploadImages(createdItem._id || createdItem.id, imageFormData);
      }

      success('Inventory item created successfully!');
      setShowCreateModal(false);
      setPendingImages([]);
      fetchInventory();
    } catch (err) {
      showError(`Failed to create item: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem || !formData.name) return;

    try {
      setSubmitting(true);
      await inventoryAPI.updateItem(selectedItem._id || selectedItem.id, formData);
      success('Inventory item updated successfully!');
      setShowEditModal(false);
      fetchInventory();
    } catch (err) {
      showError(`Failed to update item: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Image upload handlers
  const handleImageUpload = async (files) => {
    if (!selectedItem) return;

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      await inventoryAPI.uploadImages(selectedItem._id || selectedItem.id, formData);
      success('Images uploaded successfully!');

      // Refresh the item to get updated images
      const updatedItem = await inventoryAPI.getItem(selectedItem._id || selectedItem.id);
      setSelectedItem(updatedItem.item);
      fetchInventory();
    } catch (err) {
      showError(`Failed to upload images: ${err.message || 'Unknown error'}`);
      throw err;
    }
  };

  const handleImageDelete = async (imageId) => {
    if (!selectedItem) return;

    try {
      await inventoryAPI.deleteImage(selectedItem._id || selectedItem.id, imageId);
      success('Image deleted successfully!');

      // Refresh the item to get updated images
      const updatedItem = await inventoryAPI.getItem(selectedItem._id || selectedItem.id);
      setSelectedItem(updatedItem.item);
      fetchInventory();
    } catch (err) {
      showError(`Failed to delete image: ${err.message || 'Unknown error'}`);
    }
  };

  const handleSetPrimaryImage = async (imageId) => {
    if (!selectedItem) return;

    try {
      await inventoryAPI.setPrimaryImage(selectedItem._id || selectedItem.id, imageId);
      success('Primary image updated!');

      // Refresh the item to get updated images
      const updatedItem = await inventoryAPI.getItem(selectedItem._id || selectedItem.id);
      setSelectedItem(updatedItem.item);
      fetchInventory();
    } catch (err) {
      showError(`Failed to set primary image: ${err.message || 'Unknown error'}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;

    try {
      setSubmitting(true);
      await inventoryAPI.deleteItem(selectedItem._id || selectedItem.id);
      success('Inventory item deleted successfully!');
      setShowDeleteModal(false);
      fetchInventory();
    } catch (err) {
      showError(`Failed to delete item: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'image',
      header: 'Image',
      render: (_, item) => {
        const primaryImage = item.images?.find(img => img.isPrimary)?.url || item.images?.[0]?.url;
        return (
          <div className="product-thumbnail">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={item.name}
                className="thumbnail-image"
              />
            ) : (
              <div className="thumbnail-placeholder">
                <Package2 size={20} />
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'itemCode',
      header: 'Item Code',
      render: (value) => <span className="customer-id">{value}</span>
    },
    {
      key: 'name',
      header: 'Item Name'
    },
    {
      key: 'category',
      header: 'Category',
      render: (value) => (
        <Badge variant="default">{value.replace('_', ' ')}</Badge>
      )
    },
    {
      key: 'quantity',
      header: 'Stock',
      render: (value, row) => (
        <span className={row.status === 'out_of_stock' ? 'text-error font-bold' : row.status === 'low_stock' ? 'text-warning font-bold' : ''}>
          {value} {row.unit}
        </span>
      )
    },
    {
      key: 'reorderLevel',
      header: 'Reorder Level',
      render: (value, row) => `${value} ${row.unit}`
    },
    {
      key: 'costPrice',
      header: 'Cost Price',
      render: (value) => `$${value.toFixed(2)}`
    },
    {
      key: 'location',
      header: 'Location',
      render: (value) => <Badge variant={value}>{value}</Badge>
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <Badge variant={value === 'in_stock' ? 'success' : value === 'low_stock' ? 'warning' : 'error'}>
          {value.replace('_', ' ')}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, item) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Edit}
            onClick={() => handleEditClick(item)}
          >
            Edit
          </Button>
          <Button
            variant="error"
            size="sm"
            icon={Trash2}
            onClick={() => handleDeleteClick(item)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <Layout title="Inventory" subtitle="Track stock levels and manage inventory">
      {error && (
        <div className="alert alert-warning mb-lg">
          {error}
        </div>
      )}

      <div className="inventory-header mb-lg">
        <div className="flex gap-md">
          <Button
            variant="primary"
            icon={Plus}
            onClick={handleCreateClick}
          >
            Create Item
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
        {connected && (
          <span className="connection-status">
            <span className="status-dot online"></span>
            Real-time stock alerts active
          </span>
        )}
      </div>

      <div className="grid grid-4 mb-xl">
        <StatCard
          title="Total Items"
          value={stats.total.toString()}
          icon={Package2}
          color="var(--primary-color)"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStock.toString()}
          icon={AlertTriangle}
          color="var(--warning)"
        />
        <StatCard
          title="Out of Stock"
          value={stats.outOfStock.toString()}
          icon={TrendingDown}
          color="var(--error)"
        />
        <StatCard
          title="Total Inventory Value"
          value={formatCurrency(stats.totalValue)}
          icon={BarChart3}
          color="var(--success)"
        />
      </div>

      <Card>
        <div className="card-actions">
          <h3>All Inventory Items</h3>
          <Button variant="primary" icon={Download} onClick={handleExport}>
            Export CSV
          </Button>
        </div>
        <Table
          columns={columns}
          data={items}
          loading={loading}
          searchPlaceholder="Search inventory..."
        />
      </Card>

      {/* Create Item Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Inventory Item"
        size="large"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="form-label">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              required
              placeholder="Enter item name"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              rows={3}
              placeholder="Enter item description"
              className="form-input"
            />
          </div>

          <div className="grid grid-2 gap-md">
            <div>
              <label className="form-label">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                required
                className="form-input"
              >
                <option value="raw_material">Raw Material</option>
                <option value="finished_product">Finished Product</option>
                <option value="spa_product">Spa Product</option>
                <option value="tester_product">Tester Product</option>
              </select>
            </div>
            <div>
              <label className="form-label">
                Location <span className="text-red-500">*</span>
              </label>
              <select
                name="location"
                value={formData.location}
                onChange={handleFormChange}
                required
                className="form-input"
              >
                <option value="manufacturing">Manufacturing</option>
                <option value="spa">Spa</option>
                <option value="shared">Shared</option>
              </select>
            </div>
          </div>

          <div className="grid grid-2 gap-md">
            <div>
              <label className="form-label">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleFormChange}
                required
                min="0"
                step="0.01"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">
                Reorder Level <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="reorderLevel"
                value={formData.reorderLevel}
                onChange={handleFormChange}
                required
                min="0"
                step="0.01"
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-2 gap-md">
            <div>
              <label className="form-label">Cost Price ($)</label>
              <input
                type="number"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleFormChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Selling Price ($)</label>
              <input
                type="number"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleFormChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-2 gap-md">
            <div>
              <label className="form-label">Supplier</label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleFormChange}
                placeholder="Enter supplier name"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Supplier Batch</label>
              <input
                type="text"
                name="supplierBatch"
                value={formData.supplierBatch}
                onChange={handleFormChange}
                placeholder="Enter batch number"
                className="form-input"
              />
            </div>
          </div>

          {/* Product Images Section for Create */}
          {formData.category !== 'raw_material' && (
            <div className="border-t pt-4">
              <label className="form-label mb-3">Product Images (Optional)</label>
              <p className="text-sm text-gray-500 mb-3">You can add images now or after creating the item</p>
              <ImageUpload
                images={pendingImages}
                onUpload={handlePendingImageAdd}
                onDelete={handlePendingImageDelete}
                onSetPrimary={handlePendingImageSetPrimary}
                maxImages={5}
                disabled={submitting}
              />
            </div>
          )}

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
              icon={Plus}
            >
              Create Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Inventory Item"
        size="large"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {selectedItem && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-blue-900">Item Code: {selectedItem.itemCode}</h4>
            </div>
          )}

          <div>
            <label className="form-label">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              required
              placeholder="Enter item name"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              rows={3}
              placeholder="Enter item description"
              className="form-input"
            />
          </div>

          <div className="grid grid-2 gap-md">
            <div>
              <label className="form-label">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                required
                className="form-input"
              >
                <option value="raw_material">Raw Material</option>
                <option value="finished_product">Finished Product</option>
                <option value="spa_product">Spa Product</option>
                <option value="tester_product">Tester Product</option>
              </select>
            </div>
            <div>
              <label className="form-label">
                Location <span className="text-red-500">*</span>
              </label>
              <select
                name="location"
                value={formData.location}
                onChange={handleFormChange}
                required
                className="form-input"
              >
                <option value="manufacturing">Manufacturing</option>
                <option value="spa">Spa</option>
                <option value="shared">Shared</option>
              </select>
            </div>
          </div>

          <div className="grid grid-2 gap-md">
            <div>
              <label className="form-label">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleFormChange}
                required
                min="0"
                step="0.01"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">
                Reorder Level <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="reorderLevel"
                value={formData.reorderLevel}
                onChange={handleFormChange}
                required
                min="0"
                step="0.01"
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-2 gap-md">
            <div>
              <label className="form-label">Cost Price ($)</label>
              <input
                type="number"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleFormChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Selling Price ($)</label>
              <input
                type="number"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleFormChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-2 gap-md">
            <div>
              <label className="form-label">Supplier</label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleFormChange}
                placeholder="Enter supplier name"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Supplier Batch</label>
              <input
                type="text"
                name="supplierBatch"
                value={formData.supplierBatch}
                onChange={handleFormChange}
                placeholder="Enter batch number"
                className="form-input"
              />
            </div>
          </div>

          {/* Product Images Section */}
          {selectedItem && formData.category !== 'raw_material' && (
            <div className="border-t pt-4">
              <label className="form-label mb-3">Product Images</label>
              <ImageUpload
                images={selectedItem.images || []}
                onUpload={handleImageUpload}
                onDelete={handleImageDelete}
                onSetPrimary={handleSetPrimaryImage}
                maxImages={5}
                disabled={submitting}
              />
            </div>
          )}

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
              icon={Edit}
            >
              Update Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Item Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Item"
        size="small"
      >
        <div className="space-y-4">
          {selectedItem && (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-800">
                Are you sure you want to delete <strong>{selectedItem.name}</strong>? This action cannot be undone.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="error"
              loading={submitting}
              onClick={handleDeleteConfirm}
              icon={Trash2}
            >
              Delete Item
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Inventory;
