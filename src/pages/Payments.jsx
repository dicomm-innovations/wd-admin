import { useState, useEffect } from 'react';
import { DollarSign, Receipt, CreditCard, Plus, Search, Filter, Download, Mail, Eye, RefreshCw, TrendingUp } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import StatCard from '../components/dashboard/StatCard';
import PaymentEntryForm from '../components/payments/PaymentEntryForm';
import PaymentDetailModal from '../components/payments/PaymentDetailModal';
import { format } from 'date-fns';
import { useNotification } from '../contexts/NotificationContext';
import { formatCurrency } from '../utils/formatters';
import { downloadCSV } from '../utils/exportHelpers';
import { paymentRecordsAPI } from '../services/api';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [filters, setFilters] = useState({
    businessUnit: '',
    status: '',
    paymentMethod: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const { success, error: showError } = useNotification();

  useEffect(() => {
    fetchPayments();
  }, [filters, pagination.page]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      const response = await paymentRecordsAPI.getAll(params);

      if (response.success) {
        setPayments(response.data.payments);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }));
      }
    } catch (err) {
      showError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await paymentRecordsAPI.getSummary({
        startDate: filters.startDate,
        endDate: filters.endDate,
        businessUnit: filters.businessUnit
      });

      if (response.success) {
        setSummary(response.data);
      }
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [filters.startDate, filters.endDate, filters.businessUnit]);

  const handlePaymentCreated = () => {
    setShowPaymentModal(false);
    fetchPayments();
    fetchSummary();
    success('Payment recorded successfully');
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowDetailModal(true);
  };

  const handleEmailReceipt = async (paymentId) => {
    try {
      await paymentRecordsAPI.emailReceipt(paymentId);
      success('Receipt sent successfully');
    } catch (err) {
      showError(err.message || 'Failed to send receipt');
    }
  };

  const handleDownloadReceipt = async (paymentId, receiptNumber) => {
    try {
      const response = await paymentRecordsAPI.downloadReceipt(paymentId);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt-${receiptNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      success('Receipt downloaded successfully');
    } catch (err) {
      showError(err.message || 'Failed to download receipt');
    }
  };

  const handleExportCSV = () => {
    const csvData = payments.map(payment => ({
      'Payment Number': payment.paymentNumber,
      'Receipt Number': payment.receiptNumber || '-',
      'Date': format(new Date(payment.paymentDate), 'yyyy-MM-dd'),
      'Customer': `${payment.customer?.firstName} ${payment.customer?.lastName}`,
      'Business Unit': payment.businessUnit.toUpperCase(),
      'Description': payment.description,
      'Amount': payment.totalAmount,
      'Payment Method': payment.paymentMethod,
      'Status': payment.status.toUpperCase()
    }));

    downloadCSV(csvData, `payments-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    success('Payments exported successfully');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { variant: 'success', label: 'Completed' },
      pending: { variant: 'warning', label: 'Pending' },
      cancelled: { variant: 'gray', label: 'Cancelled' },
      refunded: { variant: 'danger', label: 'Refunded' },
      partially_refunded: { variant: 'warning', label: 'Partially Refunded' }
    };

    const config = statusConfig[status] || { variant: 'gray', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentMethodBadge = (method) => {
    const methodConfig = {
      cash: { variant: 'success', label: 'Cash', icon: DollarSign },
      card: { variant: 'info', label: 'Card', icon: CreditCard },
      bank_transfer: { variant: 'primary', label: 'Bank Transfer', icon: TrendingUp },
      mobile_money: { variant: 'warning', label: 'Mobile Money', icon: DollarSign },
      account_balance: { variant: 'secondary', label: 'Account Balance', icon: Receipt },
      split: { variant: 'info', label: 'Split Payment', icon: CreditCard }
    };

    const config = methodConfig[method] || { variant: 'gray', label: method };
    return (
      <div className="flex items-center gap-1">
        {config.icon && <config.icon className="w-4 h-4" />}
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>
    );
  };

  const columns = [
    {
      header: 'Payment #',
      accessor: 'paymentNumber',
      cell: (row) => (
        <div>
          <div className="font-medium">{row.paymentNumber}</div>
          {row.receiptNumber && (
            <div className="text-xs text-gray-500">{row.receiptNumber}</div>
          )}
        </div>
      )
    },
    {
      header: 'Date',
      accessor: 'paymentDate',
      cell: (row) => format(new Date(row.paymentDate), 'MMM dd, yyyy HH:mm')
    },
    {
      header: 'Customer',
      accessor: 'customer',
      cell: (row) => (
        <div>
          <div className="font-medium">
            {row.customer?.firstName} {row.customer?.lastName}
          </div>
          {row.customer?.email && (
            <div className="text-xs text-gray-500">{row.customer.email}</div>
          )}
        </div>
      )
    },
    {
      header: 'Description',
      accessor: 'description',
      cell: (row) => (
        <div className="max-w-xs truncate" title={row.description}>
          {row.description}
        </div>
      )
    },
    {
      header: 'Business Unit',
      accessor: 'businessUnit',
      cell: (row) => (
        <Badge variant="secondary">
          {row.businessUnit.replace('_', ' ').toUpperCase()}
        </Badge>
      )
    },
    {
      header: 'Amount',
      accessor: 'totalAmount',
      cell: (row) => (
        <div className="font-semibold text-green-600">
          {formatCurrency(row.totalAmount)}
        </div>
      )
    },
    {
      header: 'Payment Method',
      accessor: 'paymentMethod',
      cell: (row) => getPaymentMethodBadge(row.paymentMethod)
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => getStatusBadge(row.status)
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewPayment(row)}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {row.receiptGenerated && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEmailReceipt(row._id)}
                title="Email Receipt"
              >
                <Mail className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownloadReceipt(row._id, row.receiptNumber)}
                title="Download Receipt"
              >
                <Download className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600 mt-1">
              Manage cash payments and receipts
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={payments.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => setShowPaymentModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-4 mb-xl">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(summary.totalRevenue)}
              icon={DollarSign}
              trend={{ value: 0, isPositive: true }}
              color="green"
            />
            <StatCard
              title="Total Payments"
              value={summary.totalPayments}
              icon={Receipt}
              color="blue"
            />
            <StatCard
              title="Average Payment"
              value={formatCurrency(summary.averagePayment)}
              icon={TrendingUp}
              color="purple"
            />
            <StatCard
              title="Total Refunds"
              value={formatCurrency(summary.totalRefunds)}
              icon={CreditCard}
              color="red"
            />
          </div>
        )}

        {/* Filters */}
        <Card>
          <div className="grid grid-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Unit
              </label>
              <select
                value={filters.businessUnit}
                onChange={(e) => setFilters({ ...filters, businessUnit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Units</option>
                <option value="gym">Gym</option>
                <option value="spa">Spa</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="childcare">Childcare</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="account_balance">Account Balance</option>
                <option value="split">Split Payment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setFilters({
                    businessUnit: '',
                    status: '',
                    paymentMethod: '',
                    startDate: '',
                    endDate: '',
                    search: ''
                  });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </Card>

        {/* Payments Table */}
        <Card>
          <Table
            columns={columns}
            data={payments}
            loading={loading}
            emptyMessage="No payments found"
          />

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} payments
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Payment Entry Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment"
        size="xl"
      >
        <PaymentEntryForm
          onSuccess={handlePaymentCreated}
          onCancel={() => setShowPaymentModal(false)}
        />
      </Modal>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <PaymentDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          payment={selectedPayment}
          onEmailReceipt={handleEmailReceipt}
          onDownloadReceipt={handleDownloadReceipt}
        />
      )}
    </Layout>
  );
};

export default Payments;
