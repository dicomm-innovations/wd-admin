import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, CreditCard, Calendar, Download, RefreshCw, PieChart as PieChartIcon } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import StatCard from '../components/dashboard/StatCard';
import Button from '../components/common/Button';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useNotification } from '../contexts/NotificationContext';
import { formatCurrency } from '../utils/formatters';
import { downloadCSV } from '../utils/exportHelpers';
import { revenueAPI } from '../services/api';
import './RevenueDashboard.css';

const RevenueDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [businessUnit, setBusinessUnit] = useState('');
  const [revenueData, setRevenueData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [paymentMethodsData, setPaymentMethodsData] = useState([]);
  const [topCustomersData, setTopCustomersData] = useState([]);
  const [businessUnitData, setBusinessUnitData] = useState([]);
  const [forecastData, setForecastData] = useState(null);

  const { error: showError, success } = useNotification();

  useEffect(() => {
    fetchRevenueData();
  }, [period, businessUnit]);

  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
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

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  };

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const dateRange = getDateRange();

      const params = {
        ...dateRange,
        ...(businessUnit && { businessUnit })
      };

      // Fetch forecast separately with error handling
      let forecastRes = { success: false };
      try {
        forecastRes = await revenueAPI.getForecast({ ...(businessUnit && { businessUnit }), monthsAhead: 3 });
      } catch (forecastError) {
        console.log('Forecast unavailable:', forecastError.message || 'Insufficient data');
      }

      // Fetch all other data in parallel
      const [
        comprehensiveRes,
        trendRes,
        paymentMethodsRes,
        topCustomersRes,
        businessUnitRes
      ] = await Promise.all([
        revenueAPI.getComprehensive(params),
        revenueAPI.getTrend({ ...params, interval: period === 'year' ? 'month' : 'day' }),
        revenueAPI.getPaymentMethods(params),
        revenueAPI.getTopCustomers({ ...params, limit: 10 }),
        businessUnit ? Promise.resolve({ success: false }) : revenueAPI.getByBusinessUnit(dateRange)
      ]);

      if (comprehensiveRes.success) {
        setRevenueData(comprehensiveRes.data);
      }

      if (trendRes.success) {
        // Format trend data for charts
        const formattedTrend = trendRes.data.data.map(item => ({
          date: formatTrendDate(item._id, period),
          revenue: item.totalRevenue,
          count: item.paymentCount,
          average: item.averagePayment
        }));
        setTrendData(formattedTrend);
      }

      if (paymentMethodsRes.success) {
        setPaymentMethodsData(paymentMethodsRes.data.breakdown);
      }

      if (topCustomersRes.success) {
        setTopCustomersData(topCustomersRes.data.topCustomers);
      }

      if (businessUnitRes.success) {
        setBusinessUnitData(businessUnitRes.data.breakdown);
      }

      if (forecastRes.success) {
        setForecastData(forecastRes.data);
      } else {
        // Silently handle forecast errors (e.g., insufficient data)
        console.log('Forecast unavailable:', forecastRes.message || 'Insufficient data');
        setForecastData(null);
      }
    } catch (err) {
      showError(err.message || 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const formatTrendDate = (dateObj, interval) => {
    if (interval === 'year') {
      return `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}`;
    } else if (interval === 'month' || interval === 'week') {
      return `${dateObj.month}/${dateObj.day}`;
    }
    return `${dateObj.month}/${dateObj.day}`;
  };

  const handleExportRevenue = () => {
    if (!revenueData) return;

    const csvData = [{
      'Period': period,
      'Start Date': format(new Date(getDateRange().startDate), 'yyyy-MM-dd'),
      'End Date': format(new Date(getDateRange().endDate), 'yyyy-MM-dd'),
      'Business Unit': businessUnit || 'All',
      'Total Revenue': revenueData.revenue.totalRevenue,
      'Cash Payments': revenueData.revenue.cashPayments.total,
      'Inventory Sales': revenueData.revenue.inventorySales.total,
      'Total Expenses': revenueData.expenses.total,
      'Net Profit': revenueData.summary.netProfit,
      'Profit Margin %': revenueData.summary.profitMarginPercentage
    }];

    downloadCSV(csvData, `revenue-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    success('Revenue report exported successfully');
  };

  const COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#6366F1'];

  return (
    <Layout>
      <div className="revenue-dashboard">
        {/* Header */}
        <div className="revenue-header">
          <div className="revenue-header-content">
            <h1>Revenue Dashboard</h1>
            <p>Comprehensive revenue analytics and insights</p>
          </div>
          <div className="revenue-header-actions">
            <Button variant="outline" onClick={fetchRevenueData}>
              <RefreshCw style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExportRevenue}>
              <Download style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-xl)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.75rem' }}>
                Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: '0.95rem', background: 'var(--white)' }}
              >
                <option value="week">Last 7 Days</option>
                <option value="month">This Month</option>
                <option value="quarter">Last 3 Months</option>
                <option value="year">This Year</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.75rem' }}>
                Business Unit
              </label>
              <select
                value={businessUnit}
                onChange={(e) => setBusinessUnit(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', fontSize: '0.95rem', background: 'var(--white)' }}
              >
                <option value="">All Business Units</option>
                <option value="gym">Gym</option>
                <option value="spa">Spa</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="childcare">Childcare</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="revenue-loading">
            <div className="revenue-loading-spinner" style={{ width: '48px', height: '48px', border: '4px solid var(--gray-200)', borderTop: '4px solid var(--primary-color)', borderRadius: '50%' }}></div>
          </div>
        ) : revenueData ? (
          <>
            {/* Summary Cards */}
            <div className="revenue-summary-cards" style={{ marginBottom: 'var(--spacing-2xl)' }}>
              <StatCard
                title="Total Revenue"
                value={formatCurrency(revenueData.revenue.totalRevenue)}
                icon={DollarSign}
                color="green"
                trend={{
                  value: revenueData.summary.profitMarginPercentage,
                  isPositive: revenueData.summary.profitMarginPercentage > 0,
                  label: 'Profit Margin'
                }}
              />
              <StatCard
                title="Net Profit"
                value={formatCurrency(revenueData.summary.netProfit)}
                icon={TrendingUp}
                color="purple"
              />
              <StatCard
                title="Total Expenses"
                value={formatCurrency(revenueData.expenses.total)}
                icon={CreditCard}
                color="red"
              />
              <StatCard
                title="Cash Payments"
                value={formatCurrency(revenueData.revenue.cashPayments.total)}
                icon={DollarSign}
                color="blue"
              />
            </div>

            {/* Revenue Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-xl)', marginBottom: 'var(--spacing-2xl)' }}>
              {/* Revenue Sources */}
              <Card>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 'var(--spacing-xl)' }}>Revenue Sources</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-lg)', background: 'rgba(139, 92, 246, 0.1)', borderRadius: 'var(--radius-lg)' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Cash Payments</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#8B5CF6', marginBottom: '0.5rem' }}>
                        {formatCurrency(revenueData.revenue.cashPayments.total)}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                        {revenueData.revenue.cashPayments.count} payments
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Average</div>
                      <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                        {formatCurrency(revenueData.revenue.cashPayments.average)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-lg)', background: 'var(--success-light)', borderRadius: 'var(--radius-lg)' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Inventory Sales</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--success)', marginBottom: '0.5rem' }}>
                        {formatCurrency(revenueData.revenue.inventorySales.total)}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                        {revenueData.revenue.inventorySales.count} sales
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>Average</div>
                      <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                        {formatCurrency(revenueData.revenue.inventorySales.average)}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Profit Summary */}
              <Card>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 'var(--spacing-xl)' }}>Profit Analysis</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--gray-200)' }}>
                    <span style={{ color: 'var(--gray-600)', fontSize: '0.9375rem' }}>Gross Revenue</span>
                    <span style={{ fontWeight: '600', fontSize: '0.9375rem' }}>
                      {formatCurrency(revenueData.summary.grossRevenue)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--gray-200)', color: 'var(--error)' }}>
                    <span style={{ fontSize: '0.9375rem' }}>Total Expenses</span>
                    <span style={{ fontWeight: '600', fontSize: '0.9375rem' }}>
                      -{formatCurrency(revenueData.summary.totalExpenses)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--gray-200)', fontWeight: '700', fontSize: '1.25rem', color: 'var(--success)' }}>
                    <span>Net Profit</span>
                    <span>{formatCurrency(revenueData.summary.netProfit)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}>
                    <span style={{ color: 'var(--gray-600)', fontSize: '0.9375rem' }}>Profit Margin</span>
                    <span style={{ fontWeight: '600', color: '#8B5CF6', fontSize: '0.9375rem' }}>
                      {revenueData.summary.profitMarginPercentage}%
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Revenue Trend Chart */}
            {trendData.length > 0 && (
              <Card style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-xl)' }}>Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" style={{ fontSize: '0.875rem' }} />
                    <YAxis style={{ fontSize: '0.875rem' }} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      labelStyle={{ color: '#000' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      name="Revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="average"
                      stroke="#10B981"
                      strokeWidth={3}
                      name="Average Payment"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Payment Methods & Business Units */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 'var(--spacing-xl)', marginBottom: 'var(--spacing-2xl)' }}>
              {/* Payment Methods Breakdown */}
              {paymentMethodsData.length > 0 && (
                <Card>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-xl)' }}>Payment Methods</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={paymentMethodsData}
                        dataKey="totalRevenue"
                        nameKey="paymentMethod"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        label={(entry) => `${entry.paymentMethod}: ${entry.percentage}%`}
                      >
                        {paymentMethodsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {paymentMethodsData.map((method, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem', padding: 'var(--spacing-sm) 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                          <div
                            style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>{method.paymentMethod.replace('_', ' ')}</span>
                        </div>
                        <span style={{ fontWeight: '600' }}>
                          {formatCurrency(method.totalRevenue)} ({method.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Business Unit Breakdown */}
              {businessUnitData.length > 0 && (
                <Card>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-xl)' }}>Revenue by Business Unit</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={businessUnitData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" style={{ fontSize: '0.875rem' }} />
                      <YAxis style={{ fontSize: '0.875rem' }} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="totalRevenue" fill="#8B5CF6" name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>

            {/* Top Customers */}
            {topCustomersData.length > 0 && (
              <Card style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-xl)' }}>Top Customers</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 var(--spacing-xs)' }}>
                    <thead style={{ background: 'var(--gray-50)' }}>
                      <tr>
                        <th style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Rank
                        </th>
                        <th style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Customer
                        </th>
                        <th style={{ padding: '1rem 1.25rem', textAlign: 'right', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Total Spent
                        </th>
                        <th style={{ padding: '1rem 1.25rem', textAlign: 'right', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Payments
                        </th>
                        <th style={{ padding: '1rem 1.25rem', textAlign: 'right', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Average
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCustomersData.map((customer, index) => (
                        <tr key={customer._id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                          <td style={{ padding: '1.125rem 1.25rem', fontSize: '0.9375rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                            #{index + 1}
                          </td>
                          <td style={{ padding: '1.125rem 1.25rem' }}>
                            <div style={{ fontWeight: '600', fontSize: '0.9375rem', marginBottom: '0.25rem', color: 'var(--gray-900)' }}>
                              {customer.firstName} {customer.lastName}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>{customer.email}</div>
                          </td>
                          <td style={{ padding: '1.125rem 1.25rem', textAlign: 'right', fontWeight: '700', fontSize: '0.9375rem', color: 'var(--success)' }}>
                            {formatCurrency(customer.totalSpent)}
                          </td>
                          <td style={{ padding: '1.125rem 1.25rem', textAlign: 'right', fontSize: '0.9375rem', fontWeight: '500' }}>{customer.paymentCount}</td>
                          <td style={{ padding: '1.125rem 1.25rem', textAlign: 'right', fontSize: '0.9375rem', fontWeight: '600' }}>
                            {formatCurrency(customer.averagePayment)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Revenue Forecast */}
            {forecastData && forecastData.forecast && (
              <Card>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-xl)' }}>
                  Revenue Forecast (Next 3 Months)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--spacing-lg)', background: 'var(--info-light)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                      <TrendingUp style={{ width: '24px', height: '24px', color: 'var(--info)' }} />
                      <span style={{ fontWeight: '600', fontSize: '0.9375rem' }}>Trend</span>
                    </div>
                    <span style={{ textTransform: 'capitalize', fontWeight: '700', fontSize: '1rem', color: 'var(--info)' }}>
                      {forecastData.trend}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-lg)' }}>
                    {forecastData.forecast.map((forecast, index) => (
                      <div key={index} style={{ padding: 'var(--spacing-lg)', background: 'rgba(139, 92, 246, 0.1)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', fontWeight: '500', marginBottom: 'var(--spacing-sm)' }}>
                          {forecast.year}-{String(forecast.month).padStart(2, '0')}
                        </div>
                        <div style={{ fontSize: '1.375rem', fontWeight: '700', color: '#8B5CF6', marginBottom: 'var(--spacing-sm)' }}>
                          {formatCurrency(forecast.forecastedRevenue)}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', textTransform: 'capitalize' }}>
                          {forecast.confidence} confidence
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--gray-700)', marginTop: 'var(--spacing-md)', fontWeight: '500', padding: 'var(--spacing-md)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                    Average Monthly Revenue: <span style={{ fontWeight: '700', color: 'var(--gray-900)' }}>{formatCurrency(forecastData.averageMonthlyRevenue)}</span>
                  </div>
                </div>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <div className="revenue-empty">
              <DollarSign style={{ width: '64px', height: '64px', color: 'var(--gray-400)', margin: '0 auto var(--spacing-lg)' }} />
              <p style={{ color: 'var(--gray-600)' }}>No revenue data available for the selected period</p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default RevenueDashboard;
