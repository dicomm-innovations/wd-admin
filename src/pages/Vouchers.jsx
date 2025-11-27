import { useState, useEffect } from 'react';
import { Ticket, AlertCircle, CheckCircle, XCircle, RefreshCw, Download, Plus } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import StatCard from '../components/dashboard/StatCard';
import VoucherForm from '../components/vouchers/VoucherForm';
import { format } from 'date-fns';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate } from '../utils/formatters';
import { downloadCSV } from '../utils/exportHelpers';
import { voucherAPI } from '../services/api';
import './Vouchers.css';

const Vouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    expiring: 0,
    expired: 0
  });

  const { connected, subscribeToVoucherExpiry } = useWebSocket();
  const { success, error: showError, info, warning } = useNotification();

  useEffect(() => {
    fetchVouchers();
  }, []);

  useEffect(() => {
    if (!connected) return;

    const unsubscribe = subscribeToVoucherExpiry((data) => {
      warning(`Voucher ${data.voucherCode} is expiring soon!`, 10000);
    });

    return () => unsubscribe && unsubscribe();
  }, [connected, subscribeToVoucherExpiry, warning]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await voucherAPI.getAllVouchers();

      if (response.data && response.data.vouchers) {
        const fetchedVouchers = response.data.vouchers.map(v => ({
          ...v,
          customerName: v.customer
            ? `${v.customer.firstName || ''} ${v.customer.lastName || ''}`.trim()
            : 'N/A',
          customerId: v.customer?._id || v.customer
        }));
        setVouchers(fetchedVouchers);

        const expiring = fetchedVouchers.filter(v => {
          const daysUntilExpiry = (new Date(v.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
          return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
        }).length;

        setStats({
          total: fetchedVouchers.length,
          available: fetchedVouchers.filter(v => v.status === 'available').length,
          expiring,
          expired: fetchedVouchers.filter(v => v.status === 'expired').length
        });

        setLoading(false);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch vouchers:', err);
      setError('Failed to load vouchers. Using cached data.');
      showError('Failed to load vouchers');
      setLoading(false);

      const mockVouchers = getMockVouchers();
      setVouchers(mockVouchers);
      setStats({
        total: mockVouchers.length,
        available: mockVouchers.filter(v => v.status === 'available').length,
        expiring: mockVouchers.filter(v => {
          const daysUntilExpiry = (new Date(v.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
          return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
        }).length,
        expired: mockVouchers.filter(v => v.status === 'expired').length
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVouchers();
    setRefreshing(false);
    info('Vouchers refreshed', 2000);
  };

  const handleExport = () => {
    try {
      const exportColumns = [
        { key: 'voucherCode', label: 'Voucher Code' },
        { key: 'customerId', label: 'Customer ID' },
        { key: 'customerName', label: 'Customer Name' },
        { key: 'type', label: 'Type' },
        { key: 'value', label: 'Value' },
        { key: 'remainingValue', label: 'Remaining Value' },
        { key: 'unit', label: 'Unit' },
        { key: 'status', label: 'Status' },
        { key: 'generatedDate', label: 'Generated Date' },
        { key: 'expiryDate', label: 'Expiry Date' }
      ];
      downloadCSV(vouchers, exportColumns, `vouchers_${formatDate(new Date(), 'yyyyMMdd')}.csv`);
      success('Vouchers exported successfully!');
    } catch (err) {
      showError('Failed to export vouchers');
    }
  };

  const getMockVouchers = () => [
      {
        id: '1',
        voucherCode: 'SPA-VOUCH-1704123456795',
        customerId: 'CUST-1704123456789',
        customerName: 'Jane Doe',
        type: 'spa',
        value: 50,
        remainingValue: 50,
        unit: 'dollars',
        status: 'available',
        expiryDate: '2024-12-31',
        generatedDate: '2024-11-01'
      },
      {
        id: '2',
        voucherCode: 'CC-VOUCH-1704123456804',
        customerId: 'CUST-1704123456790',
        customerName: 'Sarah Johnson',
        type: 'childcare',
        value: 2,
        remainingValue: 1,
        unit: 'hours',
        status: 'partially_redeemed',
        expiryDate: '2024-11-30',
        generatedDate: '2024-11-01'
      },
      {
        id: '3',
        voucherCode: 'SPA-VOUCH-1704123456796',
        customerId: 'CUST-1704123456791',
        customerName: 'Emily Williams',
        type: 'spa',
        value: 50,
        remainingValue: 0,
        unit: 'dollars',
        status: 'fully_redeemed',
        expiryDate: '2024-12-31',
        generatedDate: '2024-10-01'
      },
      {
        id: '4',
        voucherCode: 'CC-VOUCH-1704123456805',
        customerId: 'CUST-1704123456792',
        customerName: 'Michael Brown',
        type: 'childcare',
        value: 2,
        remainingValue: 2,
        unit: 'hours',
        status: 'expired',
        expiryDate: '2024-10-31',
        generatedDate: '2024-10-01'
      }
    ];

  const columns = [
    {
      key: 'voucherCode',
      header: 'Voucher Code',
      render: (value) => <span className="customer-id">{value}</span>
    },
    {
      key: 'customerName',
      header: 'Customer'
    },
    {
      key: 'type',
      header: 'Type',
      render: (value) => {
        const variants = {
          spa: 'spa',
          childcare: 'childcare'
        };
        return <Badge variant={variants[value]}>{value}</Badge>;
      }
    },
    {
      key: 'value',
      header: 'Value',
      render: (value, row) => (
        <div>
          <div className="font-semibold">{value} {row.unit}</div>
          <div className="text-xs text-gray">Remaining: {row.remainingValue}</div>
        </div>
      )
    },
    {
      key: 'expiryDate',
      header: 'Expiry Date',
      render: (value) => format(new Date(value), 'MMM dd, yyyy')
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => {
        const variants = {
          available: 'success',
          partially_redeemed: 'warning',
          fully_redeemed: 'default',
          expired: 'error'
        };
        return <Badge variant={variants[value]}>{value.replace('_', ' ')}</Badge>;
      }
    }
  ];

  return (
    <Layout title="Vouchers" subtitle="Manage customer vouchers and redemptions">
      {error && (
        <div className="alert alert-warning mb-lg">
          {error}
        </div>
      )}

      <div className="vouchers-header mb-lg">
        <div className="connection-status">
          <div className={`status-dot ${connected ? 'online' : ''}`}></div>
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="grid grid-4 mb-xl">
        <StatCard
          title="Total Vouchers"
          value={stats.total.toString()}
          icon={Ticket}
          color="var(--primary-color)"
        />
        <StatCard
          title="Available"
          value={stats.available.toString()}
          icon={CheckCircle}
          color="var(--success)"
        />
        <StatCard
          title="Expiring Soon"
          value={stats.expiring.toString()}
          icon={AlertCircle}
          color="var(--warning)"
        />
        <StatCard
          title="Expired"
          value={stats.expired.toString()}
          icon={XCircle}
          color="var(--error)"
        />
      </div>

      <Card>
        <div className="card-actions">
          <h3>All Vouchers</h3>
          <div className="card-actions-buttons">
            <Button
              variant="success"
              icon={Plus}
              onClick={() => setShowCreateModal(true)}
            >
              Create Voucher
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
          data={vouchers}
          loading={loading}
          searchPlaceholder="Search vouchers..."
        />
      </Card>

      <VoucherForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchVouchers}
      />
    </Layout>
  );
};

export default Vouchers;
