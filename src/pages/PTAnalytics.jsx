import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Users, Target, Calendar, Award, RefreshCw, Download, BarChart3, PieChart } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatCard from '../components/dashboard/StatCard';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate, formatCurrency } from '../utils/formatters';
import { ptAdminAPI } from '../services/api';

const PTAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedTrainer, setSelectedTrainer] = useState('');

  const { success, error: showError, info } = useNotification();

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, selectedTrainer]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };

      if (selectedTrainer) {
        params.trainerId = selectedTrainer;
      }

      const response = await ptAdminAPI.getPTAnalytics(params);

      if (response) {
        setAnalytics(response);
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      showError('Failed to load analytics');
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
    info('Analytics refreshed');
  };

  const handleExport = () => {
    info('Export functionality coming soon');
  };

  if (loading && !analytics) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
        {/* Header with Gradient Background */}
        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-xl)',
          padding: 'var(--spacing-2xl)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)' }}>
                <TrendingUp size={32} />
                PT Analytics
              </h1>
              <p style={{ opacity: 0.9, marginTop: 'var(--spacing-sm)' }}>Comprehensive performance metrics and insights</p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                icon={RefreshCw}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.4)'
                }}
              >
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                icon={Download}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.4)'
                }}
              >
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <Card>
          <Card.Body>
            <div style={{
              background: 'linear-gradient(135deg, #f3e8ff 0%, #fce7f3 50%, #fef3c7 100%)',
              padding: 'var(--spacing-xl)',
              borderRadius: 'var(--radius-xl)',
              border: '2px solid #d8b4fe',
              boxShadow: 'var(--shadow-md)'
            }}>
              <div style={{ display: 'flex', gap: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', color: '#581c87', marginBottom: 'var(--spacing-sm)' }}>Start Date</label>
                  <input
                    type="date"
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-md)',
                      border: '2px solid #d8b4fe',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      backgroundColor: 'white',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', color: '#831843', marginBottom: 'var(--spacing-sm)' }}>End Date</label>
                  <input
                    type="date"
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-md)',
                      border: '2px solid #f9a8d4',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      backgroundColor: 'white',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', color: '#a16207', marginBottom: 'var(--spacing-sm)' }}>Quick Select</label>
                  <select
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-md)',
                      border: '2px solid #fde047',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      backgroundColor: 'white',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    onChange={(e) => {
                      const value = e.target.value;
                      const now = new Date();
                      let start;

                      switch (value) {
                        case 'week':
                          start = new Date(now.setDate(now.getDate() - 7));
                          break;
                        case 'month':
                          start = new Date(now.getFullYear(), now.getMonth(), 1);
                          break;
                        case 'quarter':
                          start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                          break;
                        case 'year':
                          start = new Date(now.getFullYear(), 0, 1);
                          break;
                        default:
                          return;
                      }

                      setDateRange({
                        startDate: start.toISOString().split('T')[0],
                        endDate: new Date().toISOString().split('T')[0]
                      });
                    }}
                  >
                    <option value="">Custom Range</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">This Month</option>
                    <option value="quarter">Last 3 Months</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {analytics && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-4">
              <StatCard
                title="Total Bookings"
                value={analytics.summary.totalBookings}
                icon={Calendar}
                color="var(--info)"
              />
              <StatCard
                title="Total Revenue"
                value={formatCurrency(analytics.summary.totalRevenue)}
                icon={DollarSign}
                color="var(--success)"
              />
              <StatCard
                title="Active Customers"
                value={analytics.summary.activeCustomers}
                icon={Users}
                color="var(--gym-color)"
              />
              <StatCard
                title="Completion Rate"
                value={`${analytics.summary.completionRate}%`}
                icon={Target}
                color="var(--warning)"
              />
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <Card.Header>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <BarChart3 size={18} className="text-purple-600" />
                    Session Breakdown
                  </h3>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-sm font-semibold text-green-900 mb-1">Completed</div>
                      <div className="text-2xl font-bold text-green-600">
                        {analytics.summary.completedSessions}
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-red-50 to-white rounded-xl border border-red-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-sm font-semibold text-red-900 mb-1">Cancelled</div>
                      <div className="text-2xl font-bold text-red-600">
                        {analytics.summary.cancelledSessions}
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-sm font-semibold text-blue-900 mb-1">Avg Session Price</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(analytics.summary.averageSessionPrice)}
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <Card>
                <Card.Header>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign size={18} className="text-green-600" />
                    Revenue Split
                  </h3>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-sm font-semibold text-indigo-900 mb-1">Trainer Commission</div>
                      <div className="text-2xl font-bold text-indigo-600">
                        {formatCurrency(analytics.summary.totalTrainerCommission)}
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-sm font-semibold text-purple-900 mb-1">Gym Share</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(analytics.summary.totalGymShare)}
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-pink-50 to-white rounded-xl border border-pink-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-sm font-semibold text-pink-900 mb-1">Commission Rate</div>
                      <div className="text-2xl font-bold text-pink-600">
                        {((analytics.summary.totalTrainerCommission / analytics.summary.totalRevenue) * 100 || 0).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <Card>
                <Card.Header>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp size={18} className="text-orange-600" />
                    Performance
                  </h3>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-teal-50 to-white rounded-xl border border-teal-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-sm font-semibold text-teal-900 mb-1">Total Sessions</div>
                      <div className="text-2xl font-bold text-teal-600">
                        {analytics.summary.totalBookings}
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-sm font-semibold text-emerald-900 mb-1">Success Rate</div>
                      <div className="text-2xl font-bold text-emerald-600">
                        {analytics.summary.completionRate}%
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-white rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-sm font-semibold text-amber-900 mb-1">Active Clients</div>
                      <div className="text-2xl font-bold text-amber-600">
                        {analytics.summary.activeCustomers}
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>

            {/* Top Trainers */}
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Award size={20} className="text-yellow-500" />
                  Top Performers
                </h3>
                <p className="text-gray-500 text-sm">Best performing trainers in this period</p>
              </Card.Header>
              <Card.Body>
                {analytics.topTrainers && analytics.topTrainers.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topTrainers.map((trainer, index) => (
                      <div
                        key={trainer.trainerId}
                        className="flex items-center justify-between p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                            #{index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-gray-900 text-lg">{trainer.trainerName}</div>
                            <div className="text-sm text-gray-600 font-medium">
                              {trainer.totalSessions} sessions completed
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600 text-xl">
                            {formatCurrency(trainer.totalRevenue)}
                          </div>
                          <div className="text-sm text-gray-600 font-medium">
                            Commission: {formatCurrency(trainer.totalCommission)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No trainer data available for this period</p>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Session Types */}
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <PieChart size={18} className="text-blue-600" />
                  Session Types Breakdown
                </h3>
                <p className="text-gray-500 text-sm">Distribution of session types</p>
              </Card.Header>
              <Card.Body>
                {analytics.sessionTypeBreakdown && analytics.sessionTypeBreakdown.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {analytics.sessionTypeBreakdown.map((type, index) => {
                      const colors = [
                        { bg: 'from-blue-50 to-white', border: 'border-blue-200', text: 'text-blue-900', bar: 'bg-blue-500' },
                        { bg: 'from-green-50 to-white', border: 'border-green-200', text: 'text-green-900', bar: 'bg-green-500' },
                        { bg: 'from-purple-50 to-white', border: 'border-purple-200', text: 'text-purple-900', bar: 'bg-purple-500' },
                        { bg: 'from-pink-50 to-white', border: 'border-pink-200', text: 'text-pink-900', bar: 'bg-pink-500' },
                        { bg: 'from-orange-50 to-white', border: 'border-orange-200', text: 'text-orange-900', bar: 'bg-orange-500' },
                        { bg: 'from-teal-50 to-white', border: 'border-teal-200', text: 'text-teal-900', bar: 'bg-teal-500' }
                      ];
                      const color = colors[index % colors.length];

                      return (
                        <div
                          key={type._id}
                          className={`p-5 bg-gradient-to-br ${color.bg} rounded-xl border ${color.border} shadow-sm hover:shadow-md transition-all`}
                        >
                          <div className={`text-sm font-semibold ${color.text} capitalize mb-2`}>
                            {type._id || 'General'}
                          </div>
                          <div className="font-bold text-gray-900 text-2xl mb-1">{type.count} sessions</div>
                          <div className="text-sm text-gray-600 font-medium mb-3">
                            {formatCurrency(type.revenue)}
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${color.bar} rounded-full transition-all`}
                              style={{
                                width: `${(type.count / analytics.summary.totalBookings) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <PieChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No session type data available</p>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Revenue Timeline */}
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp size={18} className="text-purple-600" />
                  Revenue Over Time
                </h3>
                <p className="text-gray-500 text-sm">Daily revenue and session count</p>
              </Card.Header>
              <Card.Body>
                {analytics.revenueByDay && analytics.revenueByDay.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-gray-600 mb-3 pb-2 border-b-2 border-gray-200">
                      <div>Date</div>
                      <div className="col-span-4">Revenue</div>
                      <div className="col-span-2 text-right">Sessions</div>
                    </div>
                    {analytics.revenueByDay.slice(-14).map((day) => (
                      <div
                        key={day._id}
                        className="grid grid-cols-7 gap-2 items-center py-3 px-2 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 rounded-lg transition-all border border-transparent hover:border-purple-200"
                      >
                        <div className="text-sm font-semibold text-gray-900">
                          {formatDate(day._id, 'MMM dd')}
                        </div>
                        <div className="col-span-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                                style={{
                                  width: `${(day.revenue / Math.max(...analytics.revenueByDay.map(d => d.revenue))) * 100}%`
                                }}
                              />
                            </div>
                            <span className="text-sm font-bold text-gray-900 w-24 text-right">
                              {formatCurrency(day.revenue)}
                            </span>
                          </div>
                        </div>
                        <div className="col-span-2 text-right">
                          <span className="inline-flex items-center justify-center px-3 py-1 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg font-bold text-blue-900">
                            {day.sessions}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No revenue data available for this period</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default PTAnalytics;
