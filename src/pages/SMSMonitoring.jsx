import { useState, useEffect } from 'react';
import { MessageSquare, DollarSign, TrendingUp, AlertCircle, Send, Filter, CheckCircle, XCircle } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Table from '../components/common/Table';
import StatCard from '../components/dashboard/StatCard';
import { useNotification } from '../contexts/NotificationContext';
import { smsMonitoringAPI } from '../services/api';
import { formatDate, formatCurrency } from '../utils/formatters';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SMSMonitoring = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [config, setConfig] = useState(null);
  const [failures, setFailures] = useState([]);
  const [costAnalysis, setCostAnalysis] = useState(null);
  const { success, error: showError } = useNotification();

  const [filters, setFilters] = useState({
    status: '',
    provider: '',
    messageType: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20
  });

  const [testSMS, setTestSMS] = useState({
    phone: '',
    message: 'Test message from Women\'s Den - SMS Service is working!'
  });

  useEffect(() => {
    fetchStats();
    fetchConfig();
    fetchLogs();
    fetchFailures();
    fetchCostAnalysis();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await smsMonitoringAPI.getStats({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      });
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await smsMonitoringAPI.getConfig();
      if (response.success) {
        setConfig(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await smsMonitoringAPI.getLogs(filters);
      if (response.success) {
        setLogs(response.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  const fetchFailures = async () => {
    try {
      const response = await smsMonitoringAPI.getFailures({ limit: 10 });
      if (response.success) {
        setFailures(response.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch failures:', err);
    }
  };

  const fetchCostAnalysis = async () => {
    try {
      const response = await smsMonitoringAPI.getCostAnalysis({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      });
      if (response.success) {
        setCostAnalysis(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch cost analysis:', err);
    }
  };

  const handleSendTest = async (e) => {
    e.preventDefault();

    if (!testSMS.phone) {
      showError('Please enter a phone number');
      return;
    }

    try {
      setLoading(true);
      const response = await smsMonitoringAPI.sendTest(testSMS);

      if (response.success) {
        success('Test SMS sent successfully!');
        setTestSMS({
          phone: '',
          message: 'Test message from Women\'s Den - SMS Service is working!'
        });
        fetchLogs();
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to send test SMS:', err);
      showError(err.error || 'Failed to send test SMS');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const applyFilters = () => {
    fetchLogs();
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      provider: '',
      messageType: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 20
    });
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'sent': return 'info';
      case 'failed': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const logColumns = [
    {
      key: 'logId',
      label: 'Log ID',
      render: (log) => <span className="font-mono text-xs">{log.logId}</span>
    },
    {
      key: 'recipient',
      label: 'Recipient',
      render: (log) => (
        <div>
          <div className="font-medium">{log.recipient.name || 'N/A'}</div>
          <div className="text-xs text-gray-500">{log.recipient.phone}</div>
        </div>
      )
    },
    {
      key: 'message',
      label: 'Message',
      render: (log) => (
        <div className="max-w-xs truncate" title={log.message}>
          {log.message}
        </div>
      )
    },
    {
      key: 'provider',
      label: 'Provider',
      render: (log) => (
        <Badge variant="info">{log.provider}</Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (log) => (
        <Badge variant={getStatusBadgeVariant(log.status)}>
          {log.status}
        </Badge>
      )
    },
    {
      key: 'cost',
      label: 'Cost',
      render: (log) => (
        <span className="text-sm">{formatCurrency(log.cost)}</span>
      )
    },
    {
      key: 'sentAt',
      label: 'Sent At',
      render: (log) => log.sentAt ? formatDate(log.sentAt) : 'N/A'
    }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SMS Service Monitoring
          </h1>
          <p className="text-gray-600">
            Track SMS delivery, costs, and service health
          </p>
        </div>

        {/* Service Config */}
        {config && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">SMS Service Status</h3>
                <p className="text-sm text-blue-700">
                  Provider: <strong>{config.provider}</strong> |
                  Status: <strong>{config.enabled ? 'Enabled' : 'Disabled'}</strong> |
                  Configured: <strong>{config.providerConfigured ? 'Yes' : 'No'}</strong>
                </p>
              </div>
              {!config.enabled && (
                <Badge variant="warning">SMS Disabled</Badge>
              )}
            </div>
          </div>
        )}

        {/* Statistics Overview */}
        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <StatCard
                title="Total Sent"
                value={stats.overview.totalSent}
                icon={MessageSquare}
                trend={null}
                color="primary"
              />
              <StatCard
                title="Delivered"
                value={stats.overview.totalDelivered}
                icon={CheckCircle}
                trend={`${stats.overview.deliveryRate}% delivery rate`}
                color="success"
              />
              <StatCard
                title="Failed"
                value={stats.overview.totalFailed}
                icon={XCircle}
                trend={`${stats.overview.failureRate}% failure rate`}
                color="error"
              />
              <StatCard
                title="Total Cost"
                value={`$${stats.overview.totalCost}`}
                icon={DollarSign}
                trend={null}
                color="warning"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Daily Trend */}
              <Card title="Daily SMS Trend (Last 30 Days)">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" name="Total" />
                    <Line type="monotone" dataKey="delivered" stroke="#82ca9d" name="Delivered" />
                    <Line type="monotone" dataKey="failed" stroke="#ff6b6b" name="Failed" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Provider Breakdown */}
              <Card title="SMS by Provider">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.providerBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="Total" />
                    <Bar dataKey="delivered" fill="#82ca9d" name="Delivered" />
                    <Bar dataKey="failed" fill="#ff6b6b" name="Failed" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* By Message Type */}
              <Card title="SMS by Message Type">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.typeBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry._id}: ${entry.count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="_id"
                    >
                      {stats.typeBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Cost Analysis */}
              {costAnalysis && costAnalysis.breakdown && (
                <Card title="Cost Analysis by Provider">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={costAnalysis.breakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id.provider" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="totalCost" fill="#ffa726" name="Total Cost" />
                      <Bar dataKey="avgCost" fill="#66bb6a" name="Avg Cost" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>
          </>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Test SMS Form */}
          <Card title="Send Test SMS" icon={Send}>
            <form onSubmit={handleSendTest}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={testSMS.phone}
                  onChange={(e) => setTestSMS({ ...testSMS, phone: e.target.value })}
                  placeholder="+263771234567"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={testSMS.message}
                  onChange={(e) => setTestSMS({ ...testSMS, message: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <Button
                type="submit"
                loading={loading}
                disabled={loading}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Test SMS
              </Button>
            </form>
          </Card>

          {/* Recent Failures */}
          <div className="lg:col-span-2">
            <Card title="Recent Failures" icon={AlertCircle}>
              {failures.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No recent failures
                </div>
              ) : (
                <div className="space-y-3">
                  {failures.map(failure => (
                    <div key={failure._id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-red-900">{failure.recipient.phone}</div>
                          <div className="text-xs text-red-700">{failure.logId}</div>
                        </div>
                        <Badge variant="error">{failure.provider}</Badge>
                      </div>
                      <div className="text-sm text-red-800 mb-1">
                        {failure.message}
                      </div>
                      {failure.errorMessage && (
                        <div className="text-xs text-red-600 mt-2 p-2 bg-red-100 rounded">
                          Error: {failure.errorMessage}
                        </div>
                      )}
                      <div className="text-xs text-red-600 mt-2">
                        {formatDate(failure.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Filters */}
        <Card title="SMS Logs" icon={Filter}>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="queued">Queued</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={filters.provider}
              onChange={(e) => handleFilterChange('provider', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Providers</option>
              <option value="twilio">Twilio</option>
              <option value="africastalking">Africa's Talking</option>
              <option value="test">Test</option>
            </select>

            <select
              value={filters.messageType}
              onChange={(e) => handleFilterChange('messageType', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="promotional">Promotional</option>
              <option value="transactional">Transactional</option>
              <option value="otp">OTP</option>
              <option value="notification">Notification</option>
              <option value="alert">Alert</option>
            </select>

            <Button onClick={applyFilters} variant="primary">
              Apply Filters
            </Button>

            <Button onClick={clearFilters} variant="outline">
              Clear
            </Button>
          </div>

          <Table
            data={logs}
            columns={logColumns}
          />
        </Card>
      </div>
    </Layout>
  );
};

export default SMSMonitoring;
