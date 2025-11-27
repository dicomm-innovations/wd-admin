import { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingUp, ArrowRightLeft, FileText, RefreshCw, Download, TrendingDown, CreditCard, AlertCircle, PieChart as PieChartIcon, Plus } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import StatCard from '../components/dashboard/StatCard';
import ExpenseForm from '../components/accounting/ExpenseForm';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate, formatCurrency } from '../utils/formatters';
import { downloadCSV } from '../utils/exportHelpers';
import { accountingAPI } from '../services/api';
import './Accounting.css';

const Accounting = () => {
  const [settlements, setSettlements] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseLoading, setExpenseLoading] = useState(false);

  const { connected, subscribeToSettlementNotification } = useWebSocket();
  const { success, error: showError, info } = useNotification();

  useEffect(() => {
    fetchAccountingData();
  }, [selectedPeriod]);

  useEffect(() => {
    if (!connected) return;

    const unsubscribe = subscribeToSettlementNotification((data) => {
      info(`Settlement ${data.settlementId} status: ${data.status}`, 5000);
      setSettlements(prev => prev.map(s =>
        s.id === data.settlementId
          ? { ...s, status: data.status, settledDate: data.settledDate }
          : s
      ));
    });

    return () => unsubscribe && unsubscribe();
  }, [connected, subscribeToSettlementNotification, info]);

  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        endDate = new Date();
        break;
      case 'month':
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
        break;
      case 'quarter':
        startDate = subMonths(new Date(), 3);
        endDate = new Date();
        break;
      case 'year':
        startDate = new Date(new Date().getFullYear(), 0, 1);
        endDate = new Date();
        break;
      default:
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
    }

    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  };

  const fetchAccountingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const dateRange = getDateRange();

      const [settlementsRes, ledgerRes, expensesRes, summaryRes] = await Promise.all([
        accountingAPI.getSettlements(),
        accountingAPI.getLedger(),
        accountingAPI.getExpenses(dateRange),
        accountingAPI.getFinancialSummary(dateRange)
      ]);

      if (settlementsRes && ledgerRes && expensesRes && summaryRes) {
        setSettlements(settlementsRes.settlements || settlementsRes.data?.settlements || []);
        setTransactions(ledgerRes.entries || ledgerRes.data?.entries || []);
        setExpenses(expensesRes.expenses || expensesRes.data?.expenses || []);
        setFinancialSummary(summaryRes.summary || summaryRes.data?.summary || summaryRes || {});
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch accounting data:', err);
      setError('Failed to load accounting data');
      showError('Failed to load accounting data');
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAccountingData();
    setRefreshing(false);
    success('Accounting data refreshed');
  };

  const handleExportSettlements = () => {
    try {
      const exportColumns = [
        { key: 'settlementId', label: 'Settlement ID' },
        { key: 'fromUnit', label: 'From Unit' },
        { key: 'toUnit', label: 'To Unit' },
        { key: 'amount', label: 'Amount' },
        { key: 'reason', label: 'Reason' },
        { key: 'status', label: 'Status' },
        { key: 'createdDate', label: 'Created Date' }
      ];
      downloadCSV(settlements, exportColumns, `settlements_${formatDate(new Date(), 'yyyyMMdd')}.csv`);
      success('Settlements exported successfully!');
    } catch (err) {
      showError('Failed to export settlements');
    }
  };

  const handleExportTransactions = () => {
    try {
      const exportColumns = [
        { key: 'transactionId', label: 'Transaction ID' },
        { key: 'businessUnit', label: 'Business Unit' },
        { key: 'amount', label: 'Amount' },
        { key: 'description', label: 'Description' },
        { key: 'date', label: 'Date' }
      ];
      downloadCSV(transactions, exportColumns, `transactions_${formatDate(new Date(), 'yyyyMMdd')}.csv`);
      success('Transactions exported successfully!');
    } catch (err) {
      showError('Failed to export transactions');
    }
  };

  const handleExportExpenses = () => {
    try {
      const exportColumns = [
        { key: 'expenseId', label: 'Expense ID' },
        { key: 'category', label: 'Category' },
        { key: 'businessUnit', label: 'Business Unit' },
        { key: 'amount', label: 'Amount' },
        { key: 'description', label: 'Description' },
        { key: 'status', label: 'Status' },
        { key: 'createdAt', label: 'Date' }
      ];
      downloadCSV(expenses, exportColumns, `expenses_${formatDate(new Date(), 'yyyyMMdd')}.csv`);
      success('Expenses exported successfully!');
    } catch (err) {
      showError('Failed to export expenses');
    }
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setShowExpenseModal(true);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setShowExpenseModal(true);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await accountingAPI.deleteExpense(expenseId);
      success('Expense deleted successfully');
      fetchAccountingData();
    } catch (err) {
      console.error('Failed to delete expense:', err);
      showError('Failed to delete expense');
    }
  };

  const handleExpenseSubmit = async (formData) => {
    try {
      setExpenseLoading(true);

      if (editingExpense) {
        await accountingAPI.updateExpense(editingExpense._id, formData);
        success('Expense updated successfully');
      } else {
        await accountingAPI.createExpense(formData);
        success('Expense added successfully');
      }

      setShowExpenseModal(false);
      setEditingExpense(null);
      fetchAccountingData();
    } catch (err) {
      console.error('Failed to save expense:', err);
      showError(err.response?.data?.error || 'Failed to save expense');
    } finally {
      setExpenseLoading(false);
    }
  };

  // Calculate monthly revenue trend for chart
  const monthlyRevenueData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const revenue = transactions
        .filter(t => {
          const txDate = new Date(t.createdAt);
          return txDate >= monthStart && txDate <= monthEnd;
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      months.push({
        month: format(date, 'MMM yyyy'),
        revenue: revenue
      });
    }
    return months;
  }, [transactions]);

  // Prepare chart data for revenue by unit
  const revenueChartData = useMemo(() => {
    if (!financialSummary || !financialSummary.revenueByUnit) return [];
    return Object.entries(financialSummary.revenueByUnit).map(([unit, revenue]) => ({
      name: unit.charAt(0).toUpperCase() + unit.slice(1),
      revenue: revenue
    }));
  }, [financialSummary]);

  // Prepare chart data for expenses by category
  const expenseChartData = useMemo(() => {
    if (!financialSummary || !financialSummary.expensesByCategory) return [];
    return Object.entries(financialSummary.expensesByCategory).map(([category, amount]) => ({
      name: category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      amount: amount
    }));
  }, [financialSummary]);

  const COLORS = ['#8B4789', '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const settlementColumns = [
    {
      key: 'settlementNumber',
      header: 'Settlement ID',
      render: (value) => <span className="customer-id">{value}</span>
    },
    {
      key: 'fromBusiness',
      header: 'From',
      render: (value) => <Badge variant={value}>{value}</Badge>
    },
    {
      key: 'toBusiness',
      header: 'To',
      render: (value) => <Badge variant={value}>{value}</Badge>
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (value) => <span className="font-semibold">{formatCurrency(value)}</span>
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (value) => format(new Date(value), 'MMM dd, yyyy')
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => {
        const variants = {
          completed: 'success',
          pending: 'warning',
          rejected: 'error'
        };
        return <Badge variant={variants[value]}>{value}</Badge>;
      }
    }
  ];

  const transactionColumns = [
    {
      key: 'transactionType',
      header: 'Type',
      render: (value) => <Badge variant="default">{value || 'Transaction'}</Badge>
    },
    {
      key: 'fromBusiness',
      header: 'From Unit',
      render: (value) => <Badge variant={value}>{value}</Badge>
    },
    {
      key: 'toBusiness',
      header: 'To Unit',
      render: (value) => <Badge variant={value}>{value}</Badge>
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (value) => <span className="font-semibold">{formatCurrency(value)}</span>
    },
    {
      key: 'description',
      header: 'Description',
      render: (value) => (
        <div className="text-sm" style={{ maxWidth: '250px' }}>
          {value || 'N/A'}
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (value) => format(new Date(value), 'MMM dd, HH:mm')
    }
  ];

  const expenseColumns = [
    {
      key: 'expenseId',
      header: 'Expense ID',
      render: (value) => <span className="customer-id">{value}</span>
    },
    {
      key: 'category',
      header: 'Category',
      render: (value) => (
        <Badge variant="default">
          {value.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
        </Badge>
      )
    },
    {
      key: 'businessUnit',
      header: 'Business Unit',
      render: (value) => <Badge variant={value}>{value}</Badge>
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (value) => <span className="font-semibold">{formatCurrency(value)}</span>
    },
    {
      key: 'description',
      header: 'Description',
      render: (value) => (
        <div className="text-sm" style={{ maxWidth: '200px' }}>
          {value}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => {
        const variants = {
          paid: 'success',
          pending: 'warning',
          overdue: 'error',
          cancelled: 'error'
        };
        return <Badge variant={variants[value]}>{value}</Badge>;
      }
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (value) => format(new Date(value), 'MMM dd, yyyy')
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditExpense(row)}
          >
            Edit
          </Button>
          <Button
            variant="error"
            size="sm"
            onClick={() => handleDeleteExpense(row._id)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <Layout title="Accounting & Finance" subtitle="Comprehensive financial management dashboard">
      {error && (
        <div className="alert alert-warning mb-lg">
          {error}
        </div>
      )}

      <div className="accounting-header mb-lg">
        <div className="flex justify-between items-center">
          <div className="connection-status">
            <div className={`status-dot ${connected ? 'online' : ''}`}></div>
            {connected ? 'Connected' : 'Disconnected'}
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedPeriod === 'week' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('week')}
            >
              Week
            </Button>
            <Button
              variant={selectedPeriod === 'month' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('month')}
            >
              Month
            </Button>
            <Button
              variant={selectedPeriod === 'quarter' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('quarter')}
            >
              Quarter
            </Button>
            <Button
              variant={selectedPeriod === 'year' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('year')}
            >
              Year
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Financial Stats */}
      <div className="grid grid-4 mb-xl">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(financialSummary?.totalRevenue || 0)}
          icon={DollarSign}
          color="var(--success)"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(financialSummary?.totalExpenses || 0)}
          icon={TrendingDown}
          color="var(--error)"
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(financialSummary?.netProfit || 0)}
          icon={TrendingUp}
          color={financialSummary?.netProfit >= 0 ? 'var(--success)' : 'var(--error)'}
        />
        <StatCard
          title="Profit Margin"
          value={`${financialSummary?.profitMargin || 0}%`}
          icon={PieChartIcon}
          color="var(--primary-color)"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-4 mb-xl">
        <StatCard
          title="Pending Expenses"
          value={formatCurrency(financialSummary?.pendingExpenses || 0)}
          icon={AlertCircle}
          color="var(--warning)"
        />
        <StatCard
          title="Pending Settlements"
          value={settlements.filter(s => s.status === 'pending').length}
          icon={ArrowRightLeft}
          color="var(--warning)"
        />
        <StatCard
          title="Completed Transactions"
          value={transactions.length}
          icon={FileText}
          color="var(--info)"
        />
        <StatCard
          title="Total Expenses Count"
          value={expenses.length}
          icon={CreditCard}
          color="var(--secondary)"
        />
      </div>

      {/* Profit & Loss Report */}
      <Card className="mb-xl">
        <h3 className="mb-lg">Profit & Loss Statement</h3>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-2 pb-2 border-b">
                <span className="font-semibold text-gray-700">Revenue</span>
                <span className="font-bold text-green-600">{formatCurrency(financialSummary?.totalRevenue || 0)}</span>
              </div>
              <div className="pl-4 space-y-1">
                {Object.entries(financialSummary?.revenueByUnit || {}).map(([unit, amount]) => (
                  <div key={unit} className="flex justify-between text-sm">
                    <span className="text-gray-600">{unit.charAt(0).toUpperCase() + unit.slice(1)}</span>
                    <span className="text-gray-800">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2 pb-2 border-b">
                <span className="font-semibold text-gray-700">Expenses</span>
                <span className="font-bold text-red-600">{formatCurrency(financialSummary?.totalExpenses || 0)}</span>
              </div>
              <div className="pl-4 space-y-1">
                {Object.entries(financialSummary?.expensesByCategory || {}).map(([category, amount]) => (
                  <div key={category} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </span>
                    <span className="text-gray-800">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t-2 border-gray-300">
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg text-gray-900">Net Profit</span>
              <span className={`font-bold text-xl ${financialSummary?.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(financialSummary?.netProfit || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-600">Profit Margin</span>
              <span className={`text-sm font-semibold ${financialSummary?.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {financialSummary?.profitMargin || 0}%
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Revenue Analytics Charts */}
      <div className="grid grid-2 mb-xl gap-4">
        <Card>
          <h3 className="mb-lg">Revenue by Business Unit</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)'
                }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="var(--primary-color)" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="mb-lg">Expenses by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {expenseChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card className="mb-xl">
        <h3 className="mb-lg">Revenue Trend (Last 6 Months)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyRevenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="month" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)'
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#8B4789" strokeWidth={2} name="Revenue ($)" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Expenses Table */}
      <Card className="mb-xl">
        <div className="card-actions">
          <h3>Expense Management</h3>
          <div className="card-actions-buttons">
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={handleRefresh}
              loading={refreshing}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button variant="primary" icon={Download} onClick={handleExportExpenses}>
              Export CSV
            </Button>
            <Button variant="primary" icon={Plus} onClick={handleAddExpense}>
              Add Expense
            </Button>
          </div>
        </div>
        <Table
          columns={expenseColumns}
          data={expenses}
          loading={loading}
          searchPlaceholder="Search expenses..."
        />
      </Card>

      {/* Inter-Business Settlements */}
      <Card className="mb-xl">
        <div className="card-actions">
          <h3>Inter-Business Settlements</h3>
          <div className="card-actions-buttons">
            <Button variant="primary" icon={Download} onClick={handleExportSettlements}>
              Export CSV
            </Button>
          </div>
        </div>
        <Table
          columns={settlementColumns}
          data={settlements}
          loading={loading}
          searchPlaceholder="Search settlements..."
        />
      </Card>

      {/* Recent Transactions */}
      <Card>
        <div className="card-actions">
          <h3>Recent Ledger Entries</h3>
          <Button variant="primary" icon={Download} onClick={handleExportTransactions}>
            Export CSV
          </Button>
        </div>
        <Table
          columns={transactionColumns}
          data={transactions}
          loading={loading}
          searchPlaceholder="Search transactions..."
        />
      </Card>

      {/* Expense Modal */}
      <Modal
        isOpen={showExpenseModal}
        onClose={() => {
          setShowExpenseModal(false);
          setEditingExpense(null);
        }}
        title={editingExpense ? 'Edit Expense' : 'Add New Expense'}
        size="lg"
      >
        <ExpenseForm
          expense={editingExpense}
          onSubmit={handleExpenseSubmit}
          onCancel={() => {
            setShowExpenseModal(false);
            setEditingExpense(null);
          }}
          loading={expenseLoading}
        />
      </Modal>
    </Layout>
  );
};

export default Accounting;
