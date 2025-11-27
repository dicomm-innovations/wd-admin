import { useState, useEffect } from 'react';
import { Sparkles, Users, Calendar, DollarSign, TrendingUp, RefreshCw, Download } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import StatCard from '../components/dashboard/StatCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate, formatCurrency } from '../utils/formatters';
import { downloadCSV } from '../utils/exportHelpers';
import { spaAPI } from '../services/api';
import './Spa.css';

const Spa = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    todayBookings: 0,
    monthlyRevenue: 0,
    avgRating: 0
  });

  const { connected, subscribeToBookingStatus } = useWebSocket();
  const { success, error: showError, info } = useNotification();

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (!connected) return;

    const unsubscribe = subscribeToBookingStatus((data) => {
      setBookings(prev => prev.map(booking =>
        booking.id === data.bookingId
          ? { ...booking, status: data.status }
          : booking
      ));
      info(`Booking ${data.bookingId} status updated to ${data.status}`, 3000);
    });

    return () => unsubscribe && unsubscribe();
  }, [connected, subscribeToBookingStatus, info]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await spaAPI.getBookings();
      console.log('Spa API response:', response); // Debug log

      if (response && Array.isArray(response.bookings)) {
        const fetchedBookings = response.bookings;
        setBookings(fetchedBookings);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayBookings = fetchedBookings.filter(b =>
          new Date(b.bookingDate).setHours(0, 0, 0, 0) === today.getTime()
        ).length;

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthlyRevenue = fetchedBookings
          .filter(b => new Date(b.bookingDate) >= firstDayOfMonth && b.status === 'completed')
          .reduce((sum, b) => sum + (b.finalPrice || 0), 0);

        setStats({
          totalBookings: fetchedBookings.length,
          todayBookings,
          monthlyRevenue,
          avgRating: 4.8
        });

        setLoading(false);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch spa bookings:', err);
      setError('Failed to load spa bookings. Using cached data.');
      showError('Failed to load spa bookings');
      setLoading(false);

      const mockBookings = getMockBookings();
      setBookings(mockBookings);
      setStats({
        totalBookings: mockBookings.length,
        todayBookings: 5,
        monthlyRevenue: 20100,
        avgRating: 4.8
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
    info('Spa bookings refreshed', 2000);
  };

  const handleExport = () => {
    try {
      const exportColumns = [
        { key: 'bookingId', label: 'Booking ID' },
        { key: 'customerName', label: 'Customer' },
        { key: 'services', label: 'Services', render: (val) => val.join(', ') },
        { key: 'therapistName', label: 'Therapist' },
        { key: 'bookingDate', label: 'Date & Time' },
        { key: 'totalPrice', label: 'Total Price' },
        { key: 'voucherDiscount', label: 'Voucher Discount' },
        { key: 'finalPrice', label: 'Final Price' },
        { key: 'status', label: 'Status' }
      ];
      downloadCSV(bookings, exportColumns, `spa_bookings_${formatDate(new Date(), 'yyyyMMdd')}.csv`);
      success('Spa bookings exported successfully!');
    } catch (err) {
      showError('Failed to export spa bookings');
    }
  };

  const getMockBookings = () => [
    {
      id: '1',
      bookingId: 'SPA-1704123456796-CUST-1704123456789',
      customerName: 'Jane Doe',
      services: ['Deep Tissue Massage', 'Facial Treatment'],
      therapistName: 'Maria Garcia',
      bookingDate: '2024-11-05T14:00:00Z',
      totalPrice: 90,
      voucherDiscount: 50,
      finalPrice: 40,
      status: 'scheduled'
    },
    {
      id: '2',
      bookingId: 'SPA-1704123456797-CUST-1704123456790',
      customerName: 'Sarah Johnson',
      services: ['Aromatherapy Massage'],
      therapistName: 'Lisa Chen',
      bookingDate: '2024-11-04T10:00:00Z',
      totalPrice: 60,
      voucherDiscount: 0,
      finalPrice: 60,
      status: 'completed'
    }
  ];

  const columns = [
    {
      key: 'bookingId',
      header: 'Booking ID',
      render: (value) => <span className="customer-id">{value}</span>
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (value, row) => {
        const customer = row.customer || {};
        const name = value || `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
        const email = customer.email || row.customerEmail;
        return (
          <div>
            <div className="font-medium">{name || 'Unknown Customer'}</div>
            {email && <div className="text-xs text-gray-500">{email}</div>}
          </div>
        );
      }
    },
    {
      key: 'services',
      header: 'Services',
      render: (value) => {
        if (!value) return 'N/A';
        const servicesArray = Array.isArray(value)
          ? value
          : value.map
            ? value
            : [];
        return (
          <div className="flex flex-col gap-xs">
            {servicesArray.map((service, i) => {
              if (typeof service === 'string') {
                return <span key={i} className="text-sm">{service}</span>;
              }
              if (service && typeof service === 'object') {
                const label = service.serviceName || service.name || service.serviceType || `Service ${i + 1}`;
                return <span key={service._id || i} className="text-sm">{label}</span>;
              }
              return null;
            })}
          </div>
        );
      }
    },
    {
      key: 'therapistName',
      header: 'Therapist',
      render: (value, row) => {
        const therapist = row.services?.[0]?.therapist || row.therapist || {};
        const name = value || `${therapist.firstName || ''} ${therapist.lastName || ''}`.trim();
        const position = therapist.position || therapist.specialization;
        return (
          <div>
            <div className="font-medium">{name || 'Unassigned'}</div>
            {position && <div className="text-xs text-gray-500">{position}</div>}
          </div>
        );
      }
    },
    {
      key: 'bookingDate',
      header: 'Date & Time',
      render: (value) => format(new Date(value), 'MMM dd, yyyy HH:mm')
    },
    {
      key: 'finalPrice',
      header: 'Final Price',
      render: (value, row) => {
        const price = value ?? row.finalPrice ?? row.totalPrice ?? row.totalAmount ?? 0;
        const discount = row.voucherDiscount || 0;
        return (
          <div>
            <div className="font-semibold">{formatCurrency(price)}</div>
            {discount > 0 && (
              <div className="text-xs text-success">
                -{formatCurrency(discount)} voucher
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => {
        const variants = {
          scheduled: 'info',
          in_progress: 'warning',
          completed: 'success',
          cancelled: 'error'
        };
        return <Badge variant={variants[value]}>{value.replace('_', ' ')}</Badge>;
      }
    }
  ];

  const revenueData = [
    { month: 'Jun', revenue: 12000 },
    { month: 'Jul', revenue: 14500 },
    { month: 'Aug', revenue: 13800 },
    { month: 'Sep', revenue: 16200 },
    { month: 'Oct', revenue: 18500 },
    { month: 'Nov', revenue: 20100 }
  ];

  return (
    <Layout title="The Olive Room (Spa)" subtitle="Manage spa bookings and therapist schedules">
      {error && (
        <div className="alert alert-warning mb-lg">
          {error}
        </div>
      )}

      <div className="spa-header mb-lg">
        <div className="connection-status">
          <div className={`status-dot ${connected ? 'online' : ''}`}></div>
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="grid grid-4 mb-xl">
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings.toString()}
          icon={Calendar}
          color="var(--spa-color)"
        />
        <StatCard
          title="Today's Bookings"
          value={stats.todayBookings.toString()}
          icon={Sparkles}
          color="var(--primary-color)"
          trend="up"
          trendValue="15"
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats.monthlyRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="var(--success)"
          trend="up"
          trendValue="8.6"
        />
        <StatCard
          title="Avg Rating"
          value={stats.avgRating.toFixed(1)}
          icon={TrendingUp}
          color="var(--accent-gold-dark)"
        />
      </div>

      <div className="grid grid-1 mb-xl">
        <Card title="Monthly Revenue Trend" subtitle="Last 6 months">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
              <XAxis dataKey="month" stroke="var(--gray-400)" />
              <YAxis stroke="var(--gray-400)" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--spa-color)"
                strokeWidth={3}
                dot={{ fill: 'var(--spa-color)', r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <div className="card-actions">
          <h3>All Spa Bookings</h3>
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
            <Button variant="primary" icon={Download} onClick={handleExport}>
              Export CSV
            </Button>
          </div>
        </div>
        <Table
          columns={columns}
          data={bookings}
          loading={loading}
          searchPlaceholder="Search bookings..."
        />
      </Card>
    </Layout>
  );
};

export default Spa;
