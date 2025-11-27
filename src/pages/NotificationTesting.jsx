import { useState, useEffect } from 'react';
import { Bell, Send, BarChart3, Users, TrendingUp, Activity } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatCard from '../components/dashboard/StatCard';
import { useNotification } from '../contexts/NotificationContext';
import { notificationsAPI, employeeAPI } from '../services/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const NotificationTesting = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const { success, error: showError } = useNotification();

  const [testForm, setTestForm] = useState({
    recipient: '',
    title: 'Test Notification',
    message: 'This is a test notification from the system',
    type: 'info',
    category: 'system',
    priority: 'low'
  });

  const [bulkForm, setBulkForm] = useState({
    recipients: [],
    title: '',
    message: '',
    type: 'info',
    category: 'system',
    priority: 'medium'
  });

  useEffect(() => {
    fetchStats();
    fetchEmployees();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await notificationsAPI.getStats({
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

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getAll({ limit: 100 });
      if (response.data?.employees) {
        setEmployees(response.data.employees);
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  const handleSendTest = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await notificationsAPI.sendTest(testForm);

      if (response.success) {
        success('Test notification sent successfully!');
        // Reset form
        setTestForm({
          recipient: '',
          title: 'Test Notification',
          message: 'This is a test notification from the system',
          type: 'info',
          category: 'system',
          priority: 'low'
        });
        fetchStats(); // Refresh stats
      }
    } catch (err) {
      console.error('Failed to send test notification:', err);
      showError(err.error || 'Failed to send test notification');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSend = async (e) => {
    e.preventDefault();

    if (bulkForm.recipients.length === 0) {
      showError('Please select at least one recipient');
      return;
    }

    if (bulkForm.recipients.length > 100) {
      showError('Maximum 100 recipients allowed');
      return;
    }

    try {
      setLoading(true);
      const response = await notificationsAPI.bulkSend(bulkForm);

      if (response.success) {
        success(`${response.count} notifications sent successfully!`);
        // Reset form
        setBulkForm({
          recipients: [],
          title: '',
          message: '',
          type: 'info',
          category: 'system',
          priority: 'medium'
        });
        fetchStats(); // Refresh stats
      }
    } catch (err) {
      console.error('Failed to bulk send notifications:', err);
      showError(err.error || 'Failed to bulk send notifications');
    } finally {
      setLoading(false);
    }
  };

  const toggleRecipient = (employeeId) => {
    setBulkForm(prev => ({
      ...prev,
      recipients: prev.recipients.includes(employeeId)
        ? prev.recipients.filter(id => id !== employeeId)
        : [...prev.recipients, employeeId]
    }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Layout>
      <div style={{ padding: 'var(--spacing-xl)', maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)', marginBottom: 'var(--spacing-sm)' }}>
            Notification Testing & Management
          </h1>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.9375rem' }}>
            Send test notifications and view system notification statistics
          </p>
        </div>

        {/* Statistics Overview */}
        {stats && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--spacing-xl)',
              marginBottom: 'var(--spacing-2xl)'
            }}>
              <StatCard
                title="Total Notifications"
                value={stats.overview.total}
                icon={Bell}
                trend={null}
                color="primary"
              />
              <StatCard
                title="Read"
                value={stats.overview.read}
                icon={Activity}
                trend={`${stats.overview.readRate}% read rate`}
                color="success"
              />
              <StatCard
                title="Unread"
                value={stats.overview.unread}
                icon={Bell}
                trend={null}
                color="warning"
              />
              <StatCard
                title="Read Rate"
                value={`${stats.overview.readRate}%`}
                icon={TrendingUp}
                trend={null}
                color="info"
              />
            </div>

            {/* Charts */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
              gap: 'var(--spacing-xl)',
              marginBottom: 'var(--spacing-2xl)'
            }}>
              {/* Daily Trend */}
              <Card title="Daily Notification Trend (Last 30 Days)">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" name="Total" />
                    <Line type="monotone" dataKey="read" stroke="#82ca9d" name="Read" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* By Type */}
              <Card title="Notifications by Type">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.byType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry._id}: ${entry.count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="_id"
                    >
                      {stats.byType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* By Category */}
              <Card title="Notifications by Category">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.byCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* By Priority */}
              <Card title="Notifications by Priority">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.byPriority}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#82ca9d" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </>
        )}

        {/* Testing Forms */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: 'var(--spacing-xl)'
        }}>
          {/* Single Test Notification */}
          <Card title="Send Test Notification" icon={Send}>
            <form onSubmit={handleSendTest}>
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--gray-700)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Recipient (Optional - defaults to yourself)
                </label>
                <select
                  value={testForm.recipient}
                  onChange={(e) => setTestForm({ ...testForm, recipient: e.target.value })}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '0.9375rem',
                    transition: 'all var(--transition-base)'
                  }}
                >
                  <option value="">Myself</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} - {emp.role}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--gray-700)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Title
                </label>
                <input
                  type="text"
                  value={testForm.title}
                  onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '0.9375rem',
                    transition: 'all var(--transition-base)'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--gray-700)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Message
                </label>
                <textarea
                  value={testForm.message}
                  onChange={(e) => setTestForm({ ...testForm, message: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '0.9375rem',
                    transition: 'all var(--transition-base)',
                    resize: 'vertical'
                  }}
                  required
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--gray-700)',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    Type
                  </label>
                  <select
                    value={testForm.type}
                    onChange={(e) => setTestForm({ ...testForm, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-md) var(--spacing-lg)',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.9375rem',
                      transition: 'all var(--transition-base)'
                    }}
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--gray-700)',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    Category
                  </label>
                  <select
                    value={testForm.category}
                    onChange={(e) => setTestForm({ ...testForm, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-md) var(--spacing-lg)',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.9375rem',
                      transition: 'all var(--transition-base)'
                    }}
                  >
                    <option value="system">System</option>
                    <option value="membership">Membership</option>
                    <option value="equipment">Equipment</option>
                    <option value="childcare">Childcare</option>
                    <option value="inventory">Inventory</option>
                    <option value="order">Order</option>
                    <option value="payment">Payment</option>
                    <option value="booking">Booking</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--gray-700)',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    Priority
                  </label>
                  <select
                    value={testForm.priority}
                    onChange={(e) => setTestForm({ ...testForm, priority: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-md) var(--spacing-lg)',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.9375rem',
                      transition: 'all var(--transition-base)'
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                loading={loading}
                disabled={loading}
                style={{ width: '100%' }}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Test Notification
              </Button>
            </form>
          </Card>

          {/* Bulk Send */}
          <Card title="Bulk Send Notifications" icon={Users}>
            <form onSubmit={handleBulkSend}>
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--gray-700)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Recipients ({bulkForm.recipients.length}/100)
                </label>
                <div style={{
                  border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius-lg)',
                  maxHeight: '12rem',
                  overflowY: 'auto',
                  padding: 'var(--spacing-sm)'
                }}>
                  {employees.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      color: 'var(--gray-500)',
                      padding: 'var(--spacing-lg) 0'
                    }}>
                      Loading employees...
                    </div>
                  ) : (
                    employees.map(emp => (
                      <label
                        key={emp._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: 'var(--spacing-sm)',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          transition: 'background-color var(--transition-base)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-50)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <input
                          type="checkbox"
                          checked={bulkForm.recipients.includes(emp._id)}
                          onChange={() => toggleRecipient(emp._id)}
                          style={{
                            width: '1rem',
                            height: '1rem',
                            border: '1px solid var(--gray-300)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer'
                          }}
                        />
                        <span style={{ marginLeft: 'var(--spacing-md)', fontSize: '0.875rem' }}>
                          {emp.firstName} {emp.lastName} - <span style={{ color: 'var(--gray-500)' }}>{emp.role}</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--gray-700)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Title
                </label>
                <input
                  type="text"
                  value={bulkForm.title}
                  onChange={(e) => setBulkForm({ ...bulkForm, title: e.target.value })}
                  placeholder="System Announcement"
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '0.9375rem',
                    transition: 'all var(--transition-base)'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--gray-700)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Message
                </label>
                <textarea
                  value={bulkForm.message}
                  onChange={(e) => setBulkForm({ ...bulkForm, message: e.target.value })}
                  rows={3}
                  placeholder="Important system update..."
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '0.9375rem',
                    transition: 'all var(--transition-base)',
                    resize: 'vertical'
                  }}
                  required
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--gray-700)',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    Type
                  </label>
                  <select
                    value={bulkForm.type}
                    onChange={(e) => setBulkForm({ ...bulkForm, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-md) var(--spacing-lg)',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.9375rem',
                      transition: 'all var(--transition-base)'
                    }}
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--gray-700)',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    Category
                  </label>
                  <select
                    value={bulkForm.category}
                    onChange={(e) => setBulkForm({ ...bulkForm, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-md) var(--spacing-lg)',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.9375rem',
                      transition: 'all var(--transition-base)'
                    }}
                  >
                    <option value="system">System</option>
                    <option value="membership">Membership</option>
                    <option value="equipment">Equipment</option>
                    <option value="childcare">Childcare</option>
                    <option value="inventory">Inventory</option>
                    <option value="order">Order</option>
                    <option value="payment">Payment</option>
                    <option value="booking">Booking</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--gray-700)',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    Priority
                  </label>
                  <select
                    value={bulkForm.priority}
                    onChange={(e) => setBulkForm({ ...bulkForm, priority: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-md) var(--spacing-lg)',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.9375rem',
                      transition: 'all var(--transition-base)'
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                loading={loading}
                disabled={loading || bulkForm.recipients.length === 0}
                style={{ width: '100%' }}
              >
                <Users className="w-4 h-4 mr-2" />
                Send to {bulkForm.recipients.length} Recipients
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default NotificationTesting;
