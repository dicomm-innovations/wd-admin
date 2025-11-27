import { useState, useEffect } from 'react';
import { Dumbbell, Users, Activity, Calendar, RefreshCw, Ticket, FileText, Eye, Plus, Search } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatCard from '../components/dashboard/StatCard';
import Modal from '../components/common/Modal';
import IndemnityFormSigner from '../components/indemnity/IndemnityFormSigner';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate } from '../utils/formatters';
import { format } from 'date-fns';
import { gymAPI, indemnityAPI, customerAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Gym.css';

const Gym = () => {
  const [memberships, setMemberships] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [weeklyData, setWeeklyData] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inQueue: 0,
    sessionsToday: 0
  });

  // Guest pass modal states
  const [showGuestPassModal, setShowGuestPassModal] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [guestPassData, setGuestPassData] = useState({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    validDate: new Date().toISOString().split('T')[0],
    restrictions: {
      gymOnly: true,
      noClasses: false,
      timeLimit: null
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [generatedPass, setGeneratedPass] = useState(null);

  // Indemnity form modal states
  const [showIndemnityModal, setShowIndemnityModal] = useState(false);
  const [selectedMembershipForIndemnity, setSelectedMembershipForIndemnity] = useState(null);
  const [selectedIndemnityForm, setSelectedIndemnityForm] = useState(null);

  // Create membership modal states
  const [showCreateMembershipModal, setShowCreateMembershipModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [membershipFormData, setMembershipFormData] = useState({
    type: 'standard',
    startDate: new Date().toISOString().split('T')[0]
  });

  const { subscribeToCircuitQueue, connected } = useWebSocket();
  const { success, error: showError, info } = useNotification();

  useEffect(() => {
    fetchGymData();
  }, []);

  useEffect(() => {
    if (!connected) return;

    const unsubscribe = subscribeToCircuitQueue((data) => {
      if (!data) return;

      const formattedQueue = (data.queue || []).map((item, idx) => ({
        ...item,
        position: item.position || idx + 1,
        customerName: item.customer ? `${item.customer.firstName || ''} ${item.customer.lastName || ''}`.trim() : 'Unknown',
        sessionId: item.sessionId,
        joinedAt: item.scheduledStartTime || item.joinedAt || new Date(),
        estimatedWait: item.estimatedWaitMinutes || item.estimatedWait || 0,
        status: 'queued'
      }));

      setQueue(formattedQueue);
      setStats(prev => ({
        ...prev,
        inQueue: data.queueLength || formattedQueue.length
      }));
      info('Circuit queue updated', 2000);
    });

    return () => unsubscribe && unsubscribe();
  }, [connected, subscribeToCircuitQueue, info]);

  const fetchGymData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [membershipsRes, circuitStatsRes] = await Promise.all([
        gymAPI.getMemberships({ status: 'active' }).catch(() => ({ memberships: [] })),
        gymAPI.getCircuitStats().catch(() => ({ data: null }))
      ]);

      if (membershipsRes?.memberships) {
        setMemberships(membershipsRes.memberships);
        setStats((prev) => ({
          ...prev,
          total: membershipsRes.memberships.length,
          active: membershipsRes.memberships.filter(m => m.status === 'active').length
        }));
      }

      if (circuitStatsRes?.data) {
        const { queueStatus, weeklySessions, sessionsToday } = circuitStatsRes.data;
        const formattedQueue = (queueStatus?.queue || []).map((item, idx) => ({
          ...item,
          position: item.position || idx + 1,
          customerName: item.customer ? `${item.customer.firstName || ''} ${item.customer.lastName || ''}`.trim() : 'Unknown',
          sessionId: item.sessionId,
          joinedAt: item.scheduledStartTime || item.joinedAt || new Date(),
          estimatedWait: item.estimatedWaitMinutes || item.estimatedWait || 0,
          status: 'queued'
        }));

        setQueue(formattedQueue);
        setWeeklyData(weeklySessions || []);
        setStats((prev) => ({
          ...prev,
          inQueue: queueStatus?.queueLength || formattedQueue.length,
          sessionsToday: sessionsToday || 0
        }));
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch gym data:', err);
      setError('Failed to load gym data. Using cached data.');
      showError('Failed to load gym data');
      setLoading(false);

      const mockMemberships = [
      {
        id: '1',
        membershipId: 'GYM-1704123456791',
        customerName: 'Jane Doe',
        type: 'premium',
        status: 'active',
        startDate: '2024-01-15',
        nextBillingDate: '2024-12-15',
        monthlyFee: 50,
        circuitSessions: 28
      },
      {
        id: '2',
        membershipId: 'GYM-1704123456792',
        customerName: 'Sarah Johnson',
        type: 'standard',
        status: 'active',
        startDate: '2024-02-20',
        nextBillingDate: '2024-12-20',
        monthlyFee: 35,
        circuitSessions: 15
      }
    ];

    const mockQueue = [
      {
        position: 1,
        customerName: 'Emily Williams',
        sessionId: 'CS-1704123456792',
        status: 'queued',
        joinedAt: new Date().toISOString(),
        estimatedWait: 5
      },
      {
        position: 2,
        customerName: 'Michael Brown',
        sessionId: 'CS-1704123456793',
        status: 'queued',
        joinedAt: new Date().toISOString(),
        estimatedWait: 15
      }
    ];

      setMemberships(mockMemberships);
      setQueue(mockQueue);
      setStats({
        total: mockMemberships.length,
        active: mockMemberships.filter(m => m.status === 'active').length,
        inQueue: mockQueue.length,
        sessionsToday: 0
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGymData();
    setRefreshing(false);
    info('Gym data refreshed', 2000);
  };

  const handleGenerateGuestPass = (membership) => {
    setSelectedMembership(membership);
    setGeneratedPass(null);
    setGuestPassData({
      guestName: '',
      guestPhone: '',
      guestEmail: '',
      validDate: new Date().toISOString().split('T')[0],
      restrictions: {
        gymOnly: true,
        noClasses: false,
        timeLimit: null
      }
    });
    setShowGuestPassModal(true);
  };

  const handleGuestPassFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('restrictions.')) {
      const restrictionKey = name.split('.')[1];
      setGuestPassData(prev => ({
        ...prev,
        restrictions: {
          ...prev.restrictions,
          [restrictionKey]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setGuestPassData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmitGuestPass = async (e) => {
    e.preventDefault();
    if (!selectedMembership || !guestPassData.guestName.trim()) return;

    try {
      setSubmitting(true);
      const response = await gymAPI.createGuestPass({
        membershipId: selectedMembership._id || selectedMembership.id,
        guestDetails: guestPassData
      });

      if (response.success) {
        setGeneratedPass(response.guestPass);
        success('Guest pass generated successfully!');
      }
    } catch (err) {
      showError(`Failed to generate guest pass: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseGuestPassModal = () => {
    setShowGuestPassModal(false);
    setSelectedMembership(null);
    setGeneratedPass(null);
  };

  const getCustomerId = (membership) => {
    const customerRef =
      membership?.customerDetails ||
      membership?.customer ||
      membership?.customerInfo ||
      membership?.customerData;

    if (typeof customerRef === 'string') return customerRef;
    if (customerRef?._id) return customerRef._id;
    if (customerRef?.id) return customerRef.id;
    if (customerRef?.customerId) return customerRef.customerId;

    if (typeof membership?.customer === 'string') return membership.customer;
    if (membership?.customerId) return membership.customerId;
    if (membership?.memberId) return membership.memberId;

    return '';
  };

  const handleViewIndemnityForm = async (membership) => {
    try {
      // Try to get existing indemnity form for the customer
      const response = await indemnityAPI.getByCustomer(getCustomerId(membership), {
        serviceType: 'gym',
        membershipId: membership._id || membership.id
      });

      const forms = response?.data?.data || [];
      if (forms.length > 0) {
        setSelectedIndemnityForm(forms[0]); // Get the most recent one
      } else {
        setSelectedIndemnityForm(null);
      }

      setSelectedMembershipForIndemnity(membership);
      setShowIndemnityModal(true);
    } catch (err) {
      // No form exists, prompt to create one
      setSelectedMembershipForIndemnity(membership);
      setSelectedIndemnityForm(null);
      setShowIndemnityModal(true);
    }
  };

  const handleSignIndemnityForm = async (formData) => {
    try {
      await indemnityAPI.createGymForm({
        ...formData,
        customer: getCustomerId(selectedMembershipForIndemnity),
        membership: selectedMembershipForIndemnity._id || selectedMembershipForIndemnity.id
      });

      success('Gym indemnity form signed successfully!');
      setShowIndemnityModal(false);
      setSelectedMembershipForIndemnity(null);
      setSelectedIndemnityForm(null);
      fetchGymData(); // Refresh to update form status
    } catch (err) {
      console.error('Failed to sign indemnity form:', err);
      showError('Failed to sign indemnity form');
      throw err;
    }
  };

  // Search for customers
  const handleCustomerSearch = async (query) => {
    setCustomerSearch(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await customerAPI.getAll({
        search: query,
        limit: 10
      });

      setSearchResults(response.customers || []);
    } catch (err) {
      console.error('Failed to search customers:', err);
      showError('Failed to search customers');
    }
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(`${customer.firstName} ${customer.lastName} (${customer.email})`);
    setSearchResults([]);
  };

  const handleOpenCreateMembership = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setSearchResults([]);
    setMembershipFormData({
      type: 'standard',
      startDate: new Date().toISOString().split('T')[0]
    });
    setShowCreateMembershipModal(true);
  };

  const handleSubmitMembership = async (e) => {
    e.preventDefault();

    if (!selectedCustomer) {
      showError('Please select a customer');
      return;
    }

    try {
      setSubmitting(true);
      const response = await gymAPI.createMembership({
        customerId: selectedCustomer._id,
        type: membershipFormData.type,
        startDate: membershipFormData.startDate
      });

      if (response.success) {
        success('Membership created successfully!');
        setShowCreateMembershipModal(false);
        fetchGymData();
      } else {
        showError(response.error || 'Failed to create membership');
      }
    } catch (err) {
      console.error('Failed to create membership:', err);
      showError(err.message || 'Failed to create membership');
    } finally {
      setSubmitting(false);
    }
  };

  const membershipColumns = [
    {
      key: 'membershipId',
      header: 'Membership ID',
      render: (value) => <span className="customer-id">{value}</span>
    },
    {
      key: 'customerName',
      header: 'Customer'
    },
    {
      key: 'type',
      header: 'Type',
      render: (value) => (
        <Badge variant={value === 'premium' ? 'primary' : 'default'}>
          {value}
        </Badge>
      )
    },
    {
      key: 'monthlyFee',
      header: 'Monthly Fee',
      render: (value) => `$${value || 0}`
    },
    {
      key: 'circuitSessions',
      header: 'Circuit Sessions',
      render: (value) => (
        <div className="flex items-center gap-xs">
          <Activity size={14} />
          {value || 0}
        </div>
      )
    },
    {
      key: 'nextBillingDate',
      header: 'Next Billing',
      render: (value) => value ? formatDate(value) : 'N/A'
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <Badge variant={value === 'active' ? 'success' : 'error'}>
          {value}
        </Badge>
      )
    },
    {
      key: 'indemnityFormSigned',
      header: 'Liability Waiver',
      render: (value, row) => (
        <div className="flex items-center gap-xs">
          {value ? (
            <Badge variant="success">Signed</Badge>
          ) : (
            <Badge variant="warning">Not Signed</Badge>
          )}
          <Button
            variant="secondary"
            size="small"
            icon={value ? Eye : FileText}
            onClick={() => handleViewIndemnityForm(row)}
          >
            {value ? 'View' : 'Sign'}
          </Button>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, membership) => (
        <button
          onClick={() => handleGenerateGuestPass(membership)}
          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          title="Generate Guest Pass"
        >
          <Ticket size={16} />
          Guest Pass
        </button>
      )
    }
  ];

  const queueColumns = [
    {
      key: 'position',
      header: '#',
      width: '60px',
      render: (value) => <span className="font-bold text-primary">{value}</span>
    },
    {
      key: 'customerName',
      header: 'Customer'
    },
    {
      key: 'sessionId',
      header: 'Session ID',
      render: (value) => <span className="customer-id">{value}</span>
    },
    {
      key: 'joinedAt',
      header: 'Joined',
      render: (value) => format(new Date(value), 'HH:mm')
    },
    {
      key: 'estimatedWait',
      header: 'Est. Wait',
      render: (value) => `${value} min`
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <Badge variant="warning">{value}</Badge>
      )
    }
  ];

  return (
    <Layout title="The Ring (Gym)" subtitle="Manage memberships and circuit training">
      {error && (
        <div className="alert alert-warning mb-lg">
          {error}
        </div>
      )}

      <div className="gym-header mb-lg">
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            variant="primary"
            icon={Plus}
            onClick={handleOpenCreateMembership}
          >
            Create Membership
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
        </div>
        {connected && (
          <span className="connection-status">
            <span className="status-dot online"></span>
            Real-time queue updates active
          </span>
        )}
      </div>

      <div className="grid grid-4 mb-xl">
        <StatCard
          title="Active Memberships"
          value={stats.active.toString()}
          icon={Users}
          color="var(--gym-color)"
          trend="up"
          trendValue="8"
        />
        <StatCard
          title="Total Members"
          value={stats.total.toString()}
          icon={Dumbbell}
          color="var(--primary-color)"
        />
        <StatCard
          title="Queue Length"
          value={stats.inQueue.toString()}
          icon={Activity}
          color="var(--warning)"
        />
        <StatCard
          title="Today's Sessions"
          value={stats.sessionsToday.toString()}
          icon={Calendar}
          color="var(--success)"
        />
      </div>

      <div className="grid grid-2 mb-xl">
        <Card title="Weekly Circuit Sessions" subtitle="Last 7 days">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
              <XAxis dataKey="day" stroke="var(--gray-400)" />
              <YAxis stroke="var(--gray-400)" />
              <Tooltip />
              <Bar dataKey="sessions" fill="var(--gym-color)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Circuit Queue" subtitle="Real-time queue status">
          <Table
            columns={queueColumns}
            data={queue}
            loading={loading}
            searchable={false}
            pagination={false}
            emptyMessage="No one in queue"
          />
        </Card>
      </div>

      <Card>
        <div className="card-actions">
          <h3>All Memberships</h3>
        </div>
        <Table
          columns={membershipColumns}
          data={memberships}
          loading={loading}
          searchPlaceholder="Search memberships..."
        />
      </Card>

      {/* Guest Pass Modal */}
      {showGuestPassModal && selectedMembership && (
        <Modal
          isOpen={showGuestPassModal}
          onClose={handleCloseGuestPassModal}
          title="Generate Guest Pass"
        >
          {!generatedPass ? (
            <form onSubmit={handleSubmitGuestPass} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Membership Details</h4>
                <div className="text-sm text-blue-800">
                  <div><span className="font-medium">Member:</span> {selectedMembership.customerName}</div>
                  <div><span className="font-medium">Membership:</span> {selectedMembership.membershipId}</div>
                  <div><span className="font-medium">Type:</span> {selectedMembership.type}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guest Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="guestName"
                    value={guestPassData.guestName}
                    onChange={handleGuestPassFormChange}
                    required
                    placeholder="Enter guest's full name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guest Phone
                  </label>
                  <input
                    type="tel"
                    name="guestPhone"
                    value={guestPassData.guestPhone}
                    onChange={handleGuestPassFormChange}
                    placeholder="Guest phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guest Email
                  </label>
                  <input
                    type="email"
                    name="guestEmail"
                    value={guestPassData.guestEmail}
                    onChange={handleGuestPassFormChange}
                    placeholder="Guest email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="validDate"
                    value={guestPassData.validDate}
                    onChange={handleGuestPassFormChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Access Restrictions</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="restrictions.gymOnly"
                      checked={guestPassData.restrictions.gymOnly}
                      onChange={handleGuestPassFormChange}
                      className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                    />
                    <span className="text-sm text-gray-700">Gym access only (no spa)</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="restrictions.noClasses"
                      checked={guestPassData.restrictions.noClasses}
                      onChange={handleGuestPassFormChange}
                      className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                    />
                    <span className="text-sm text-gray-700">No class access</span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time Limit (hours)
                    </label>
                    <input
                      type="number"
                      name="restrictions.timeLimit"
                      value={guestPassData.restrictions.timeLimit || ''}
                      onChange={handleGuestPassFormChange}
                      min="1"
                      max="24"
                      placeholder="Leave empty for no limit"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseGuestPassModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !guestPassData.guestName.trim()}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Ticket size={16} />
                  {submitting ? 'Generating...' : 'Generate Guest Pass'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Guest Pass Generated Successfully!</h4>
                <div className="space-y-2 text-sm text-green-800">
                  <div><span className="font-medium">Pass ID:</span> {generatedPass.passId}</div>
                  <div><span className="font-medium">Guest:</span> {generatedPass.guestName}</div>
                  <div><span className="font-medium">Valid Date:</span> {formatDate(generatedPass.validDate)}</div>
                  <div><span className="font-medium">Status:</span> {generatedPass.status}</div>
                </div>
              </div>

              {generatedPass.qrCode && (
                <div className="text-center">
                  <h4 className="font-medium text-gray-900 mb-3">QR Code</h4>
                  <img
                    src={generatedPass.qrCode}
                    alt="Guest Pass QR Code"
                    className="mx-auto border border-gray-200 rounded-lg p-2"
                    style={{ maxWidth: '200px' }}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Guest can use this QR code to check in
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={handleCloseGuestPassModal}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Indemnity Form Modal */}
      <Modal
        isOpen={showIndemnityModal}
        onClose={() => {
          setShowIndemnityModal(false);
          setSelectedMembershipForIndemnity(null);
          setSelectedIndemnityForm(null);
        }}
        title={selectedIndemnityForm ? 'View Liability Waiver' : 'Sign Liability Waiver'}
        size="large"
      >
        {selectedMembershipForIndemnity && (
          <IndemnityFormSigner
            serviceType="gym"
            customer={selectedMembershipForIndemnity.customerDetails || {
              _id: selectedMembershipForIndemnity.customer || selectedMembershipForIndemnity.customerId,
              firstName: selectedMembershipForIndemnity.customerName?.split(' ')[0] || 'Member',
              lastName: selectedMembershipForIndemnity.customerName?.split(' ').slice(1).join(' ') || ''
            }}
            existingForm={selectedIndemnityForm}
            readOnly={!!selectedIndemnityForm}
            onSign={handleSignIndemnityForm}
            onCancel={() => {
              setShowIndemnityModal(false);
              setSelectedMembershipForIndemnity(null);
              setSelectedIndemnityForm(null);
            }}
          />
        )}
      </Modal>

      {/* Create Membership Modal */}
      <Modal
        isOpen={showCreateMembershipModal}
        onClose={() => setShowCreateMembershipModal(false)}
        title="Create New Membership"
        size="medium"
      >
        <form onSubmit={handleSubmitMembership} className="space-y-6">
          {/* Customer Search Section */}
          <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200">
            <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users size={16} className="text-pink-600" />
              Select Customer <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => handleCustomerSearch(e.target.value)}
                placeholder="Type to search by name, email, or phone..."
                className="w-full px-4 py-3 pr-10 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all shadow-sm"
              />
              <Search className="absolute right-3 top-3.5 text-gray-400" size={20} />
            </div>

            {searchResults.length > 0 && (
              <div className="mt-3 border-2 border-gray-200 rounded-xl max-h-56 overflow-y-auto bg-white shadow-lg">
                {searchResults.map((customer) => (
                  <button
                    key={customer._id}
                    type="button"
                    onClick={() => handleSelectCustomer(customer)}
                    className="w-full px-4 py-3 text-left hover:bg-pink-50 border-b border-gray-100 last:border-b-0 transition-colors group"
                  >
                    <div className="font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">
                      {customer.firstName} {customer.lastName}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {customer.email} {customer.phoneNumber && <span className="text-gray-400">• {customer.phoneNumber}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedCustomer && (
              <div className="mt-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                      {selectedCustomer.firstName?.charAt(0)}{selectedCustomer.lastName?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-green-900 text-base">
                        {selectedCustomer.firstName} {selectedCustomer.lastName}
                      </div>
                      <div className="text-sm text-green-700">{selectedCustomer.email}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerSearch('');
                    }}
                    className="text-green-600 hover:text-green-800 hover:bg-green-100 rounded-full p-1 transition-colors"
                    title="Remove selection"
                  >
                    <span className="text-xl leading-none">×</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Membership Type Section */}
          <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-xl border border-purple-200">
            <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Dumbbell size={16} className="text-pink-600" />
              Membership Type <span className="text-red-500">*</span>
            </label>
            <select
              value={membershipFormData.type}
              onChange={(e) => setMembershipFormData({ ...membershipFormData, type: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all shadow-sm font-medium text-gray-900 bg-white"
            >
              <option value="standard">💪 Standard - $35/month</option>
              <option value="premium">⭐ Premium - $50/month</option>
            </select>
          </div>

          {/* Start Date Section */}
          <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-200">
            <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-pink-600" />
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={membershipFormData.startDate}
              onChange={(e) => setMembershipFormData({ ...membershipFormData, startDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all shadow-sm font-medium text-gray-900 bg-white"
            />
          </div>

          {/* Benefits Section */}
          <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 border-2 border-pink-200 rounded-xl p-5 shadow-sm">
            <h4 className="font-bold text-pink-900 mb-3 flex items-center gap-2 text-base">
              <Activity size={18} className="text-pink-600" />
              What's Included
            </h4>
            <ul className="space-y-2.5">
              {membershipFormData.type === 'premium' ? (
                <>
                  <li className="flex items-center gap-3 text-sm text-gray-800 bg-white/60 rounded-lg px-3 py-2">
                    <span className="text-green-500 font-bold text-lg">✓</span>
                    <span className="font-medium">Unlimited gym access</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-800 bg-white/60 rounded-lg px-3 py-2">
                    <span className="text-green-500 font-bold text-lg">✓</span>
                    <span className="font-medium">Unlimited circuit training sessions</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-800 bg-white/60 rounded-lg px-3 py-2">
                    <span className="text-green-500 font-bold text-lg">✓</span>
                    <span className="font-medium">Guest pass privileges</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-800 bg-white/60 rounded-lg px-3 py-2">
                    <span className="text-green-500 font-bold text-lg">✓</span>
                    <span className="font-medium">Priority booking for classes</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-3 text-sm text-gray-800 bg-white/60 rounded-lg px-3 py-2">
                    <span className="text-green-500 font-bold text-lg">✓</span>
                    <span className="font-medium">Unlimited gym access</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-800 bg-white/60 rounded-lg px-3 py-2">
                    <span className="text-green-500 font-bold text-lg">✓</span>
                    <span className="font-medium">Circuit training access</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-800 bg-white/60 rounded-lg px-3 py-2">
                    <span className="text-green-500 font-bold text-lg">✓</span>
                    <span className="font-medium">Guest pass privileges (limited)</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
            <button
              type="button"
              onClick={() => setShowCreateMembershipModal(false)}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedCustomer}
              className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-xl hover:from-pink-700 hover:to-pink-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold transition-all shadow-md hover:shadow-lg"
            >
              <Plus size={18} />
              {submitting ? 'Creating...' : 'Create Membership'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Gym;
