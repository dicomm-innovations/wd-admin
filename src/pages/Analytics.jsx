import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Package, Award, Calendar, RefreshCw, ArrowUp, ArrowDown, Activity, ShoppingCart, UserCheck, Briefcase } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatCard from '../components/dashboard/StatCard';
import { useNotification } from '../contexts/NotificationContext';
import { formatCurrency } from '../utils/formatters';
import { analyticsAPI } from '../services/api';
import './Analytics.css';

const COLORS = ['#14b8a6', '#f97316', '#8b5cf6', '#ec4899', '#6366f1'];
const BU_COLORS = {
  gym: '#14b8a6',
  spa: '#f97316',
  manufacturing: '#8b5cf6',
  childcare: '#ec4899',
  marketing: '#6366f1'
};

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('executive');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [executiveData, setExecutiveData] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { error: showError, info } = useNotification();

  useEffect(() => {
    // Set default date range (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
  }, []);

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchAllData();
    }
  }, [dateRange]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const params = { startDate: dateRange.startDate, endDate: dateRange.endDate };

      const [exec, fin, inv, cust, emp] = await Promise.all([
        analyticsAPI.getExecutiveDashboard(params),
        analyticsAPI.getFinancialReports(params),
        analyticsAPI.getInventoryReports(params),
        analyticsAPI.getCustomerAnalytics(params),
        analyticsAPI.getEmployeePerformance(params)
      ]);

      if (exec) setExecutiveData(exec.data || exec);
      if (fin) setFinancialData(fin.data || fin);
      if (inv) setInventoryData(inv.data || inv);
      if (cust) setCustomerData(cust.data || cust);
      if (emp) setEmployeeData(emp.data || emp);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      showError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    info('Analytics refreshed');
  };

  const tabs = [
    { id: 'executive', label: 'Executive', icon: BarChart3 },
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'customer', label: 'Customer', icon: Users },
    { id: 'employee', label: 'Employee', icon: Award }
  ];

  if (loading && !executiveData) {
    return (
      <Layout title="Analytics & Reports" subtitle="Comprehensive business intelligence">
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Analytics & Reports" subtitle="Comprehensive business intelligence across all units">
      <div className="analytics-page">
        {/* Date Range and Actions */}
        <Card>
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <Calendar size={20} className="text-gray-500" />
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="input-field"
              />
              <span>to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="input-field"
              />
            </div>
            <Button
              icon={RefreshCw}
              variant="outline"
              onClick={handleRefresh}
              loading={refreshing}
            >
              Refresh
            </Button>
          </div>
        </Card>

        {/* Tabs */}
        <Card>
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={activeTab === id ? 'primary' : 'outline'}
                icon={Icon}
                onClick={() => setActiveTab(id)}
              >
                {label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Tab Content */}
        {activeTab === 'executive' && executiveData && <ExecutiveDashboard data={executiveData} />}
        {activeTab === 'financial' && financialData && <FinancialReports data={financialData} />}
        {activeTab === 'inventory' && inventoryData && <InventoryReports data={inventoryData} />}
        {activeTab === 'customer' && customerData && <CustomerAnalytics data={customerData} />}
        {activeTab === 'employee' && employeeData && <EmployeePerformance data={employeeData} />}
      </div>
    </Layout>
  );
};

const ExecutiveDashboard = ({ data }) => {
  const revenueData = data.revenue?.byBusinessUnit?.map(bu => ({
    name: bu._id,
    revenue: bu.totalRevenue,
    transactions: bu.transactionCount,
    avgTransaction: bu.averageTransaction
  })) || [];

  // Prepare trend data for line chart
  const trendData = data.revenue?.trend ?
    Object.values(
      data.revenue.trend.reduce((acc, item) => {
        const date = item._id.date;
        if (!acc[date]) {
          acc[date] = { date, total: 0 };
        }
        acc[date][item._id.businessUnit] = item.revenue;
        acc[date].total += item.revenue;
        return acc;
      }, {})
    ).sort((a, b) => a.date.localeCompare(b.date))
    : [];

  const growth = data.revenue?.growth;
  const hasGrowth = growth && growth.growth !== undefined;

  return (
    <div className="space-y-4">
      {/* Key Metrics with Growth */}
      <div className="stats-grid">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(data.revenue?.total || 0)}
          icon={DollarSign}
          color="var(--success-color)"
          trend={hasGrowth ? {
            value: `${growth.growth > 0 ? '+' : ''}${growth.growth}%`,
            isPositive: growth.growth >= 0
          } : null}
        />
        <StatCard
          title="Total Customers"
          value={data.customers?.totalCustomers || 0}
          icon={Users}
          color="var(--info-color)"
          subtitle={`${data.customers?.newCustomers || 0} new customers`}
        />
        <StatCard
          title="Active Memberships"
          value={data.memberships?.total || 0}
          icon={TrendingUp}
          color="var(--warning-color)"
        />
        <StatCard
          title="Inventory Value"
          value={formatCurrency(data.inventory?.totalValue || 0)}
          icon={Package}
          color="var(--primary-color)"
          subtitle={`${data.inventory?.totalItems || 0} items in stock`}
        />
      </div>

      {/* Business Unit Performance Cards */}
      {data.businessUnitPerformance && data.businessUnitPerformance.length > 0 && (
        <>
          <div className="chart-title">
            <Briefcase size={24} />
            Business Unit Performance
          </div>
          <div className="bu-performance-grid">
            {data.businessUnitPerformance.map((bu) => (
              <div key={bu.businessUnit} className={`bu-performance-card ${bu.businessUnit}`}>
                <div className="bu-card-header">
                  <div className="bu-card-title">
                    <div className="bu-icon">{bu.businessUnit.substring(0, 2).toUpperCase()}</div>
                    {bu.businessUnit}
                  </div>
                </div>
                <div className="bu-metrics">
                  <div className="bu-metric">
                    <div className="bu-metric-label">Revenue</div>
                    <div className="bu-metric-value revenue">{formatCurrency(bu.revenue)}</div>
                  </div>
                  <div className="bu-metric">
                    <div className="bu-metric-label">Transactions</div>
                    <div className="bu-metric-value transactions">{bu.transactions}</div>
                  </div>
                  <div className="bu-metric">
                    <div className="bu-metric-label">Customers</div>
                    <div className="bu-metric-value customers">{bu.uniqueCustomers}</div>
                  </div>
                  <div className="bu-metric">
                    <div className="bu-metric-label">Employees</div>
                    <div className="bu-metric-value employees">{bu.activeEmployees}</div>
                  </div>
                  <div className="bu-metric">
                    <div className="bu-metric-label">Avg Transaction</div>
                    <div className="bu-metric-value">{formatCurrency(bu.averageTransaction)}</div>
                  </div>
                  <div className="bu-metric">
                    <div className="bu-metric-label">Rev/Employee</div>
                    <div className="bu-metric-value">{formatCurrency(bu.revenuePerEmployee)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Revenue by Business Unit - Bar Chart */}
      <Card title="Revenue by Business Unit" icon={BarChart3}>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#6b7280' }}
              style={{ textTransform: 'capitalize' }}
            />
            <YAxis tick={{ fill: '#6b7280' }} />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar dataKey="revenue" fill="#14b8a6" radius={[8, 8, 0, 0]}>
              {revenueData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Revenue Trend - Area Chart */}
      {trendData.length > 0 && (
        <Card title="Revenue Trend Over Time" icon={Activity}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fill: '#6b7280' }} />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#14b8a6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
};

const FinancialReports = ({ data }) => {
  const pl = data.profitAndLoss;

  const revenueBreakdown = pl?.revenue?.byBusinessUnit?.map(bu => ({
    name: bu._id,
    revenue: bu.revenue,
    transactions: bu.transactions
  })) || [];

  const isProfitable = (pl?.netProfit || 0) > 0;

  return (
    <div className="space-y-4">
      {/* Financial Overview Cards */}
      <div className="financial-metrics">
        <div className="financial-metric-card revenue">
          <div className="bu-metric">
            <div className="bu-metric-label">Total Revenue</div>
            <div className="bu-metric-value" style={{ color: '#059669', fontSize: '1.75rem' }}>
              {formatCurrency(pl?.revenue?.total || 0)}
            </div>
          </div>
        </div>
        <div className="financial-metric-card expenses">
          <div className="bu-metric">
            <div className="bu-metric-label">Total Expenses</div>
            <div className="bu-metric-value" style={{ color: '#dc2626', fontSize: '1.75rem' }}>
              {formatCurrency(pl?.expenses?.total || 0)}
            </div>
          </div>
        </div>
        <div className="financial-metric-card profit">
          <div className="bu-metric">
            <div className="bu-metric-label">Net Profit</div>
            <div className="bu-metric-value" style={{ color: isProfitable ? '#059669' : '#dc2626', fontSize: '1.75rem' }}>
              {formatCurrency(pl?.netProfit || 0)}
            </div>
          </div>
        </div>
        <div className="financial-metric-card margin">
          <div className="bu-metric">
            <div className="bu-metric-label">Profit Margin</div>
            <div className="bu-metric-value" style={{ color: '#0284c7', fontSize: '1.75rem' }}>
              {pl?.profitMargin || 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      <Card title="Expense Breakdown" icon={DollarSign}>
        <div className="revenue-breakdown">
          <div className="revenue-item">
            <div>
              <div className="revenue-item-name">Stock Purchases</div>
              <div className="text-sm text-gray-500">Inventory procurement costs</div>
            </div>
            <div className="bu-metric-value" style={{ color: '#dc2626' }}>
              {formatCurrency(pl?.expenses?.stockPurchases || 0)}
            </div>
          </div>
          <div className="revenue-item">
            <div>
              <div className="revenue-item-name">Commissions Paid</div>
              <div className="text-sm text-gray-500">Employee commission payments</div>
            </div>
            <div className="bu-metric-value" style={{ color: '#dc2626' }}>
              {formatCurrency(pl?.expenses?.commissions || 0)}
            </div>
          </div>
        </div>
      </Card>

      {/* Revenue by Business Unit */}
      <Card title="Revenue by Business Unit" icon={BarChart3}>
        <div className="revenue-breakdown">
          {pl?.revenue?.byBusinessUnit?.map((bu, idx) => (
            <div key={idx} className="revenue-item">
              <div>
                <div className="revenue-item-name">{bu._id}</div>
                <div className="text-sm text-gray-500">{bu.transactions} transactions</div>
              </div>
              <div className="revenue-item-amount">{formatCurrency(bu.revenue)}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Revenue vs Expenses Chart */}
      <Card title="Revenue & Expenses Comparison" icon={TrendingUp}>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={revenueBreakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#6b7280' }}
              style={{ textTransform: 'capitalize' }}
            />
            <YAxis tick={{ fill: '#6b7280' }} />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar dataKey="revenue" fill="#059669" radius={[8, 8, 0, 0]} name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

const InventoryReports = ({ data }) => {
  const valuationData = data.valuation?.map(v => ({
    name: v._id,
    value: v.totalValue,
    items: v.itemCount,
    quantity: v.totalQuantity
  })) || [];

  const totalValue = valuationData.reduce((sum, v) => sum + v.value, 0);

  return (
    <div className="space-y-4">
      {/* Inventory Alerts */}
      <div className="inventory-alerts">
        <div className="alert-card warning">
          <div className="alert-card-header">
            <div className="alert-icon">
              <Package size={20} />
            </div>
            <div>
              <div className="bu-metric-label">Low Stock Items</div>
              <div className="bu-metric-value" style={{ color: '#f59e0b', fontSize: '2rem' }}>
                {data.alerts?.lowStock || 0}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600">Items below reorder level</p>
        </div>

        <div className="alert-card danger">
          <div className="alert-card-header">
            <div className="alert-icon">
              <Package size={20} />
            </div>
            <div>
              <div className="bu-metric-label">Out of Stock</div>
              <div className="bu-metric-value" style={{ color: '#ef4444', fontSize: '2rem' }}>
                {data.alerts?.outOfStock || 0}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600">Items with zero quantity</p>
        </div>

        <div className="alert-card" style={{ borderColor: '#14b8a6' }}>
          <div className="alert-card-header">
            <div className="alert-icon" style={{ background: '#14b8a6' }}>
              <DollarSign size={20} />
            </div>
            <div>
              <div className="bu-metric-label">Total Value</div>
              <div className="bu-metric-value" style={{ color: '#14b8a6', fontSize: '2rem' }}>
                {formatCurrency(totalValue)}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600">Total inventory valuation</p>
        </div>
      </div>

      {/* Stock Valuation by Business Unit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Stock Valuation Distribution" icon={Package}>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={valuationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {valuationData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Inventory Breakdown by Unit" icon={BarChart3}>
          <div className="revenue-breakdown">
            {valuationData.map((bu, idx) => (
              <div key={idx} className="revenue-item">
                <div>
                  <div className="revenue-item-name">{bu.name}</div>
                  <div className="text-sm text-gray-500">{bu.items} items • {bu.quantity} units</div>
                </div>
                <div className="revenue-item-amount">{formatCurrency(bu.value)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Low Stock Items List */}
      {data.alerts?.lowStockItems && data.alerts.lowStockItems.length > 0 && (
        <Card title="Low Stock Items" icon={Package}>
          <div className="top-list">
            {data.alerts.lowStockItems.slice(0, 10).map((item, idx) => (
              <div key={idx} className="top-list-item">
                <div className="top-list-item-info">
                  <div className="top-list-item-name">{item.name}</div>
                  <div className="top-list-item-meta">
                    {item.itemCode} • {item.businessUnit}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Current / Reorder</div>
                  <div className="font-bold text-orange-600">
                    {item.quantity} / {item.reorderLevel}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

const CustomerAnalytics = ({ data }) => {
  const customersByBU = data.byBusinessUnit?.map(bu => ({
    name: bu._id,
    customers: bu.customerCount,
    spent: bu.totalSpent,
    avgSpent: bu.averageSpent
  })) || [];

  return (
    <div className="space-y-4">
      {/* Customer Overview */}
      <div className="stats-grid">
        <StatCard
          title="Total Customers"
          value={data.overview?.totalCustomers || 0}
          icon={Users}
          color="var(--info-color)"
        />
        <StatCard
          title="Average LTV"
          value={formatCurrency(data.overview?.averageLTV || 0)}
          icon={DollarSign}
          color="var(--success-color)"
          subtitle="Customer lifetime value"
        />
        <StatCard
          title="New Customers"
          value={data.newCustomers || 0}
          icon={TrendingUp}
          color="var(--primary-color)"
          subtitle="In selected period"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(data.overview?.totalRevenue || 0)}
          icon={DollarSign}
          color="var(--warning-color)"
        />
      </div>

      {/* Customers by Business Unit */}
      <Card title="Customers by Business Unit" icon={Users}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={customersByBU}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#6b7280' }}
              style={{ textTransform: 'capitalize' }}
            />
            <YAxis tick={{ fill: '#6b7280' }} />
            <Tooltip
              formatter={(value, name) => {
                if (name === 'spent' || name === 'avgSpent') return formatCurrency(value);
                return value;
              }}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar dataKey="customers" fill="#6366f1" radius={[8, 8, 0, 0]} name="Customers" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Top Customers */}
      <Card title="Top 10 Customers by Spending" icon={Award}>
        <div className="top-list">
          {data.topCustomers?.slice(0, 10).map((customer, idx) => (
            <div key={idx} className="top-list-item">
              <div className="flex items-center gap-3">
                <div className="top-list-item-rank">{idx + 1}</div>
                <div className="top-list-item-info">
                  <div className="top-list-item-name">
                    {customer.firstName} {customer.lastName}
                  </div>
                  <div className="top-list-item-meta">
                    {customer.email} • {customer.loyaltyPoints} pts
                  </div>
                </div>
              </div>
              <div className="top-list-item-value">{formatCurrency(customer.totalSpent)}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Loyalty Points Distribution */}
      {data.loyaltyDistribution && data.loyaltyDistribution.length > 0 && (
        <Card title="Loyalty Points Distribution" icon={Award}>
          <div className="customer-segments">
            {data.loyaltyDistribution.map((segment, idx) => (
              <div key={idx} className="segment-card">
                <div className="segment-count">{segment.count}</div>
                <div className="segment-label">
                  {typeof segment._id === 'number' ? `${segment._id}+ points` : segment._id}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Avg Spent: {formatCurrency(segment.averageSpent || 0)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

const EmployeePerformance = ({ data }) => {
  const employeesByBU = data.byBusinessUnit?.map(bu => ({
    name: bu._id,
    count: bu.count,
    commissions: bu.totalCommissions,
    avgCommission: bu.averageCommission
  })) || [];

  return (
    <div className="space-y-4">
      {/* Employee Overview by Business Unit */}
      <Card title="Employees by Business Unit" icon={Briefcase}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={employeesByBU}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#6b7280' }}
              style={{ textTransform: 'capitalize' }}
            />
            <YAxis tick={{ fill: '#6b7280' }} />
            <Tooltip
              formatter={(value, name) => {
                if (name === 'commissions' || name === 'avgCommission') return formatCurrency(value);
                return value;
              }}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar dataKey="count" fill="#ea580c" radius={[8, 8, 0, 0]} name="Employee Count" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Earners */}
        <Card title="Top Earners (Commissions)" icon={Award}>
          <div className="top-list">
            {data.topEarners?.slice(0, 10).map((emp, idx) => (
              <div key={idx} className="top-list-item">
                <div className="flex items-center gap-3">
                  <div className="top-list-item-rank">{idx + 1}</div>
                  <div className="top-list-item-info">
                    <div className="top-list-item-name">
                      {emp.employee?.firstName} {emp.employee?.lastName}
                    </div>
                    <div className="top-list-item-meta">
                      {emp.employee?.businessUnit} • {emp.commissionCount} commissions
                    </div>
                  </div>
                </div>
                <div>
                  <div className="top-list-item-value">{formatCurrency(emp.totalCommissions)}</div>
                  <div className="text-xs text-gray-500 text-right">
                    Paid: {formatCurrency(emp.paidCommissions || 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Performers */}
        <Card title="Top Performers (Transaction Value)" icon={TrendingUp}>
          <div className="top-list">
            {data.productivity?.slice(0, 10).map((emp, idx) => (
              <div key={idx} className="top-list-item">
                <div className="flex items-center gap-3">
                  <div className="top-list-item-rank">{idx + 1}</div>
                  <div className="top-list-item-info">
                    <div className="top-list-item-name">
                      {emp.employee?.firstName} {emp.employee?.lastName}
                    </div>
                    <div className="top-list-item-meta">
                      {emp.employee?.businessUnit} • {emp.transactionCount} transactions
                    </div>
                  </div>
                </div>
                <div>
                  <div className="top-list-item-value">{formatCurrency(emp.totalValue)}</div>
                  <div className="text-xs text-gray-500 text-right">
                    Avg: {formatCurrency(emp.totalValue / emp.transactionCount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Commission Summary by Business Unit */}
      <Card title="Commission Summary by Business Unit" icon={DollarSign}>
        <div className="revenue-breakdown">
          {employeesByBU.map((bu, idx) => (
            <div key={idx} className="revenue-item">
              <div>
                <div className="revenue-item-name">{bu.name}</div>
                <div className="text-sm text-gray-500">
                  {bu.count} employees • Avg: {formatCurrency(bu.avgCommission || 0)}
                </div>
              </div>
              <div className="revenue-item-amount">{formatCurrency(bu.commissions)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
