import { useState, useEffect } from 'react';
import { Package, TrendingUp, DollarSign, AlertCircle, RefreshCw, Download, Plus, Edit, Trash2 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import StatCard from '../components/dashboard/StatCard';
import BatchForm from '../components/manufacturing/BatchForm';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate } from '../utils/formatters';
import { downloadCSV } from '../utils/exportHelpers';
import { manufacturingAPI } from '../services/api';
import './Manufacturing.css';

const Manufacturing = () => {
  const [batches, setbatches] = useState([]);
  const [customOrders, setCustomOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [stats, setStats] = useState({
    totalBatches: 0,
    inProgress: 0,
    monthlyProduction: 0,
    customOrders: 0
  });

  const { success, error: showError, info } = useNotification();

  useEffect(() => {
    fetchManufacturingData();
  }, []);

  const fetchManufacturingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [batchesRes, ordersRes] = await Promise.all([
        manufacturingAPI.getBatches(),
        manufacturingAPI.getCustomOrders()
      ]);

      if (batchesRes && ordersRes) {
        const fetchedBatches = batchesRes.batches || [];
        const fetchedOrders = ordersRes.orders || [];

        setbatches(fetchedBatches);
        setCustomOrders(fetchedOrders);

        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyProduction = fetchedBatches
          .filter(b => new Date(b.startDate) >= firstDayOfMonth && b.status === 'completed')
          .reduce((sum, b) => sum + (b.quantityProduced || 0), 0);

        setStats({
          totalBatches: fetchedBatches.length,
          inProgress: fetchedBatches.filter(b => b.status === 'in_progress').length,
          monthlyProduction,
          customOrders: fetchedOrders.length
        });

        setLoading(false);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch manufacturing data:', err);
      setError('Failed to load manufacturing data. Using cached data.');
      showError('Failed to load manufacturing data');
      setLoading(false);

      const { mockBatches, mockOrders } = getMockData();
      setbatches(mockBatches);
      setCustomOrders(mockOrders);
      setStats({
        totalBatches: mockBatches.length,
        inProgress: mockBatches.filter(b => b.status === 'in_progress').length,
        monthlyProduction: 530,
        customOrders: mockOrders.length
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchManufacturingData();
    setRefreshing(false);
    info('Manufacturing data refreshed', 2000);
  };

  const handleExport = () => {
    try {
      const exportColumns = [
        { key: 'batchNumber', label: 'Batch Number' },
        { key: 'productName', label: 'Product' },
        { key: 'quantityPlanned', label: 'Qty Planned' },
        { key: 'quantityProduced', label: 'Qty Produced' },
        { key: 'costPerUnit', label: 'Cost/Unit' },
        { key: 'startDate', label: 'Start Date' },
        { key: 'completionDate', label: 'Completion Date' },
        { key: 'status', label: 'Status' }
      ];
      downloadCSV(batches, exportColumns, `manufacturing_batches_${formatDate(new Date(), 'yyyyMMdd')}.csv`);
      success('Manufacturing data exported successfully!');
    } catch (err) {
      showError('Failed to export manufacturing data');
    }
  };

  const handleCreateBatch = () => {
    setEditingBatch(null);
    setShowBatchForm(true);
  };

  const handleEditBatch = (batch) => {
    setEditingBatch(batch);
    setShowBatchForm(true);
  };

  const handleDeleteBatch = async (batch) => {
    if (batch.status !== 'planned') {
      showError('Only planned batches can be deleted');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete batch ${batch.batchNumber}?`)) {
      return;
    }

    try {
      await manufacturingAPI.deleteBatch(batch._id || batch.id);
      success('Batch deleted successfully!');
      fetchManufacturingData();
    } catch (err) {
      showError(err.error || 'Failed to delete batch');
    }
  };

  const handleFormClose = () => {
    setShowBatchForm(false);
    setEditingBatch(null);
  };

  const getMockData = () => {
    const mockBatches = [
      {
        id: '1',
        batchNumber: 'BATCH-1704123456798',
        productName: 'Lavender Body Butter',
        quantityPlanned: 50,
        quantityProduced: 48,
        status: 'completed',
        startDate: '2024-10-15',
        completionDate: '2024-10-16',
        costPerUnit: 3.56
      },
      {
        id: '2',
        batchNumber: 'BATCH-1704123456799',
        productName: 'Rose Essential Oil',
        quantityPlanned: 30,
        quantityProduced: 0,
        status: 'in_progress',
        startDate: '2024-11-03',
        completionDate: null,
        costPerUnit: 0
      }
    ];

    const mockOrders = [
      {
        id: '1',
        orderNumber: 'CO-1704123456799',
        customerName: 'Luxury Hotels Group',
        productName: 'Custom Branded Body Butter',
        quantity: 100,
        unitPrice: 8,
        totalValue: 800,
        depositPaid: true,
        status: 'confirmed'
      }
    ];

    return { mockBatches, mockOrders };
  };

  const batchColumns = [
    {
      key: 'batchNumber',
      header: 'Batch Number',
      render: (value) => <span className="customer-id">{value}</span>
    },
    {
      key: 'productName',
      header: 'Product'
    },
    {
      key: 'quantityProduced',
      header: 'Quantity',
      render: (value, row) => `${value}/${row.quantityPlanned} units`
    },
    {
      key: 'costPerUnit',
      header: 'Cost/Unit',
      render: (value) => value > 0 ? `$${value.toFixed(2)}` : 'N/A'
    },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (value) => format(new Date(value), 'MMM dd, yyyy')
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => {
        const variants = {
          planned: 'default',
          in_progress: 'warning',
          completed: 'success'
        };
        return <Badge variant={variants[value]}>{value.replace('_', ' ')}</Badge>;
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {row.status === 'planned' && (
            <>
              <button
                className="icon-button"
                onClick={() => handleEditBatch(row)}
                title="Edit batch"
              >
                <Edit size={16} />
              </button>
              <button
                className="icon-button icon-button-danger"
                onClick={() => handleDeleteBatch(row)}
                title="Delete batch"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
          {row.status !== 'planned' && (
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              No actions
            </span>
          )}
        </div>
      )
    }
  ];

  const productionData = [
    { month: 'Jun', units: 420 },
    { month: 'Jul', units: 380 },
    { month: 'Aug', units: 510 },
    { month: 'Sep', units: 460 },
    { month: 'Oct', units: 590 },
    { month: 'Nov', units: 530 }
  ];

  return (
    <Layout title="The Edit Collection" subtitle="Manufacturing and product management">
      {error && (
        <div className="alert alert-warning mb-lg">
          {error}
        </div>
      )}

      <div className="grid grid-4 mb-xl">
        <StatCard
          title="Total Batches"
          value={stats.totalBatches.toString()}
          icon={Package}
          color="var(--manufacturing-color)"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress.toString()}
          icon={TrendingUp}
          color="var(--warning)"
        />
        <StatCard
          title="Monthly Production"
          value={stats.monthlyProduction.toString()}
          icon={AlertCircle}
          color="var(--success)"
          trend="down"
          trendValue="10.2"
        />
        <StatCard
          title="Custom Orders"
          value={stats.customOrders.toString()}
          icon={DollarSign}
          color="var(--info)"
        />
      </div>

      <div className="grid grid-1 mb-xl">
        <Card title="Monthly Production" subtitle="Units produced per month">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={productionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
              <XAxis dataKey="month" stroke="var(--gray-400)" />
              <YAxis stroke="var(--gray-400)" />
              <Tooltip />
              <Bar dataKey="units" fill="var(--manufacturing-color)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <div className="card-actions">
          <h3>Production Batches</h3>
          <div className="card-actions-buttons">
            <Button
              variant="success"
              icon={Plus}
              onClick={handleCreateBatch}
            >
              Create Batch
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
          columns={batchColumns}
          data={batches}
          loading={loading}
          searchPlaceholder="Search batches..."
        />
      </Card>

      <BatchForm
        isOpen={showBatchForm}
        onClose={handleFormClose}
        onSuccess={fetchManufacturingData}
        batch={editingBatch}
      />
    </Layout>
  );
};

export default Manufacturing;
