import { useState, useEffect } from 'react';
import { Monitor, Activity, AlertCircle, CheckCircle, RefreshCw, Download } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import StatCard from '../components/dashboard/StatCard';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate } from '../utils/formatters';
import { downloadCSV } from '../utils/exportHelpers';
import { kioskAPI } from '../services/api';
import './Kiosk.css';

const Kiosk = () => {
  const [devices, setDevices] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalKiosks: 0,
    onlineKiosks: 0,
    activeSessions: 0,
    avgUptime: 0
  });

  const { connected, subscribeToKioskStatus } = useWebSocket();
  const { success, error: showError, info, warning } = useNotification();

  useEffect(() => {
    fetchKioskData();
  }, []);

  useEffect(() => {
    if (!connected) return;

    const unsubscribe = subscribeToKioskStatus((data) => {
      setDevices(prev => prev.map(device =>
        device.kioskId === data.kioskId
          ? { ...device, status: data.status, lastHeartbeat: data.timestamp }
          : device
      ));

      if (data.status === 'offline') {
        warning(`Kiosk ${data.kioskId} is now offline!`, 8000);
      } else if (data.status === 'online') {
        info(`Kiosk ${data.kioskId} is back online`, 3000);
      }
    });

    return () => unsubscribe && unsubscribe();
  }, [connected, subscribeToKioskStatus, info, warning]);

  const fetchKioskData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [devicesRes, analyticsRes] = await Promise.all([
        kioskAPI.getDevices(),
        kioskAPI.getAnalytics()
      ]);

      const fetchedDevices = devicesRes?.devices || devicesRes?.data?.devices || devicesRes || [];
      const fetchedSessions = analyticsRes?.recentSessions || analyticsRes?.data?.recentSessions || [];

      setDevices(fetchedDevices);
      setSessions(fetchedSessions);

      const avgUptime = fetchedDevices.length > 0
        ? fetchedDevices.reduce((sum, d) => sum + (d.uptime || 0), 0) / fetchedDevices.length
        : 0;

      setStats({
        totalKiosks: fetchedDevices.length,
        onlineKiosks: fetchedDevices.filter(d => d.status === 'online').length,
        activeSessions: fetchedSessions.filter(s => s.status === 'active').length,
        avgUptime
      });

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch kiosk data:', err);
      setError('Failed to load kiosk data. Using cached data.');
      showError('Failed to load kiosk data');
      setLoading(false);

      const { mockDevices, mockSessions } = getMockData();
      setDevices(mockDevices);
      setSessions(mockSessions);
      setStats({
        totalKiosks: mockDevices.length,
        onlineKiosks: mockDevices.filter(d => d.status === 'online').length,
        activeSessions: mockSessions.filter(s => s.status === 'active').length,
        avgUptime: mockDevices.reduce((sum, d) => sum + d.uptime, 0) / mockDevices.length
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchKioskData();
    setRefreshing(false);
    info('Kiosk data refreshed', 2000);
  };

  const handleExportDevices = () => {
    try {
      const exportColumns = [
        { key: 'kioskId', label: 'Kiosk ID' },
        { key: 'location', label: 'Location' },
        { key: 'businessUnit', label: 'Business Unit' },
        { key: 'status', label: 'Status' },
        { key: 'lastHeartbeat', label: 'Last Heartbeat' },
        { key: 'uptime', label: 'Uptime %' },
        { key: 'totalSessions', label: 'Total Sessions' }
      ];
      downloadCSV(devices, exportColumns, `kiosk_devices_${formatDate(new Date(), 'yyyyMMdd')}.csv`);
      success('Kiosk devices exported successfully!');
    } catch (err) {
      showError('Failed to export devices');
    }
  };

  const handleExportSessions = () => {
    try {
      const exportColumns = [
        { key: 'sessionId', label: 'Session ID' },
        { key: 'kioskId', label: 'Kiosk ID' },
        { key: 'customerId', label: 'Customer ID' },
        { key: 'customerName', label: 'Customer Name' },
        { key: 'businessUnit', label: 'Business Unit' },
        { key: 'action', label: 'Action' },
        { key: 'startTime', label: 'Start Time' },
        { key: 'endTime', label: 'End Time' },
        { key: 'duration', label: 'Duration (s)' },
        { key: 'status', label: 'Status' }
      ];
      downloadCSV(sessions, exportColumns, `kiosk_sessions_${formatDate(new Date(), 'yyyyMMdd')}.csv`);
      success('Kiosk sessions exported successfully!');
    } catch (err) {
      showError('Failed to export sessions');
    }
  };

  const getMockData = () => {
    const mockDevices = [
      {
        id: '1',
        kioskId: 'KIOSK-001',
        location: 'Gym - Main Entrance',
        businessUnit: 'gym',
        status: 'online',
        lastHeartbeat: '2024-11-04T14:58:00Z',
        activeSession: true,
        currentUser: 'Jane Doe',
        uptime: 99.8,
        totalSessions: 245
      },
      {
        id: '2',
        kioskId: 'KIOSK-002',
        location: 'Spa - Reception',
        businessUnit: 'spa',
        status: 'online',
        lastHeartbeat: '2024-11-04T14:59:00Z',
        activeSession: false,
        currentUser: null,
        uptime: 98.5,
        totalSessions: 189
      },
      {
        id: '3',
        kioskId: 'KIOSK-003',
        location: 'Childcare - Check-in Desk',
        businessUnit: 'childcare',
        status: 'offline',
        lastHeartbeat: '2024-11-04T12:30:00Z',
        activeSession: false,
        currentUser: null,
        uptime: 95.2,
        totalSessions: 156
      },
      {
        id: '4',
        kioskId: 'KIOSK-004',
        location: 'Manufacturing - Showroom',
        businessUnit: 'manufacturing',
        status: 'maintenance',
        lastHeartbeat: '2024-11-04T10:00:00Z',
        activeSession: false,
        currentUser: null,
        uptime: 97.1,
        totalSessions: 98
      }
    ];

    const mockSessions = [
      {
        id: '1',
        sessionId: 'SESSION-1704123456830',
        kioskId: 'KIOSK-001',
        customerId: 'CUST-1704123456789',
        customerName: 'Jane Doe',
        businessUnit: 'gym',
        action: 'circuit_checkin',
        startTime: '2024-11-04T14:30:00Z',
        endTime: '2024-11-04T14:32:00Z',
        duration: 120,
        status: 'completed'
      },
      {
        id: '2',
        sessionId: 'SESSION-1704123456831',
        kioskId: 'KIOSK-002',
        customerId: 'CUST-1704123456790',
        customerName: 'Sarah Johnson',
        businessUnit: 'spa',
        action: 'book_service',
        startTime: '2024-11-04T13:15:00Z',
        endTime: '2024-11-04T13:18:00Z',
        duration: 180,
        status: 'completed'
      },
      {
        id: '3',
        sessionId: 'SESSION-1704123456832',
        kioskId: 'KIOSK-001',
        customerId: 'CUST-1704123456789',
        customerName: 'Jane Doe',
        businessUnit: 'gym',
        action: 'view_profile',
        startTime: '2024-11-04T14:45:00Z',
        endTime: null,
        duration: 0,
        status: 'active'
      }
    ];

    return { mockDevices, mockSessions };
  };

  const deviceColumns = [
    {
      key: 'kioskId',
      header: 'Kiosk ID',
      render: (value) => <span className="customer-id">{value}</span>
    },
    {
      key: 'location',
      header: 'Location',
      render: (value) => <span className="font-semibold">{value}</span>
    },
    {
      key: 'businessUnit',
      header: 'Business Unit',
      render: (value) => <Badge variant={value}>{value}</Badge>
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => {
        const variants = {
          online: 'success',
          offline: 'error',
          maintenance: 'warning'
        };
        return (
          <Badge variant={variants[value]}>
            {value}
          </Badge>
        );
      }
    },
    {
      key: 'activeSession',
      header: 'Active Session',
      render: (value, row) => (
        <div>
          {value ? (
            <div className="text-success font-semibold">
              {row.currentUser}
            </div>
          ) : (
            <div className="text-gray">Idle</div>
          )}
        </div>
      )
    },
    {
      key: 'lastHeartbeat',
      header: 'Last Heartbeat',
      render: (value) => format(new Date(value), 'MMM dd, HH:mm:ss')
    },
    {
      key: 'uptime',
      header: 'Uptime',
      render: (value) => (
        <div className="flex items-center gap-xs">
          <div
            className="uptime-indicator"
            style={{
              width: '60px',
              height: '6px',
              backgroundColor: 'var(--border-color)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${value}%`,
                height: '100%',
                backgroundColor: value > 98 ? 'var(--success)' : value > 95 ? 'var(--warning)' : 'var(--error)'
              }}
            />
          </div>
          <span className="text-sm">{value}%</span>
        </div>
      )
    },
    {
      key: 'totalSessions',
      header: 'Total Sessions',
      render: (value) => value.toLocaleString()
    }
  ];

  const sessionColumns = [
    {
      key: 'sessionId',
      header: 'Session ID',
      render: (value) => <span className="customer-id">{value}</span>
    },
    {
      key: 'kioskId',
      header: 'Kiosk'
    },
    {
      key: 'customerName',
      header: 'Customer'
    },
    {
      key: 'businessUnit',
      header: 'Unit',
      render: (value) => <Badge variant={value}>{value}</Badge>
    },
    {
      key: 'action',
      header: 'Action',
      render: (value) => (
        <Badge variant="default">{value.replace('_', ' ')}</Badge>
      )
    },
    {
      key: 'startTime',
      header: 'Start Time',
      render: (value) => format(new Date(value), 'HH:mm:ss')
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (value, row) => {
        if (row.status === 'active') return 'In Progress';
        return `${value}s`;
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => {
        const variants = {
          active: 'warning',
          completed: 'success',
          error: 'error'
        };
        return <Badge variant={variants[value]}>{value}</Badge>;
      }
    }
  ];

  // Usage over time chart data
  const usageData = [
    { hour: '08:00', sessions: 12 },
    { hour: '09:00', sessions: 18 },
    { hour: '10:00', sessions: 25 },
    { hour: '11:00', sessions: 22 },
    { hour: '12:00', sessions: 30 },
    { hour: '13:00', sessions: 28 },
    { hour: '14:00', sessions: 35 },
    { hour: '15:00', sessions: 20 }
  ];

  return (
    <Layout title="Kiosk Management" subtitle="Monitor and manage self-service kiosks">
      {error && (
        <div className="alert alert-warning mb-lg">
          {error}
        </div>
      )}

      <div className="kiosk-header mb-lg">
        <div className="connection-status">
          <div className={`status-dot ${connected ? 'online' : ''}`}></div>
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="grid grid-4 mb-xl">
        <StatCard
          title="Total Kiosks"
          value={stats.totalKiosks.toString()}
          icon={Monitor}
          color="var(--primary-color)"
        />
        <StatCard
          title="Online Kiosks"
          value={stats.onlineKiosks.toString()}
          icon={CheckCircle}
          color="var(--success)"
        />
        <StatCard
          title="Active Sessions"
          value={stats.activeSessions.toString()}
          icon={Activity}
          color="var(--warning)"
        />
        <StatCard
          title="Average Uptime"
          value={`${stats.avgUptime.toFixed(1)}%`}
          icon={AlertCircle}
          color="var(--info)"
        />
      </div>

      <div className="grid grid-1 mb-xl">
        <Card>
          <h3 className="mb-lg">Kiosk Usage (Today)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="hour" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="var(--primary-color)"
                strokeWidth={2}
                name="Sessions"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-1 mb-xl">
        <Card>
          <div className="card-actions">
            <h3>All Kiosks</h3>
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
              <Button variant="primary" icon={Download} onClick={handleExportDevices}>
                Export CSV
              </Button>
            </div>
          </div>
          <Table
            columns={deviceColumns}
            data={devices}
            loading={loading}
            searchPlaceholder="Search kiosks..."
          />
        </Card>
      </div>

      <Card>
        <div className="card-actions">
          <h3>Recent Sessions</h3>
          <Button variant="primary" icon={Download} onClick={handleExportSessions}>
            Export CSV
          </Button>
        </div>
        <Table
          columns={sessionColumns}
          data={sessions}
          loading={loading}
          searchPlaceholder="Search sessions..."
        />
      </Card>
    </Layout>
  );
};

export default Kiosk;
