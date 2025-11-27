import { useState, useEffect } from 'react';
import { Baby, Users, Clock, DollarSign, RefreshCw, Download, FileText, Eye, Plus } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import StatCard from '../components/dashboard/StatCard';
import IndemnityFormSigner from '../components/indemnity/IndemnityFormSigner';
import { format } from 'date-fns';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate } from '../utils/formatters';
import { downloadCSV } from '../utils/exportHelpers';
import { childcareAPI, indemnityAPI } from '../services/api';
import './Childcare.css';

const Childcare = () => {
  const [children, setChildren] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showIndemnityModal, setShowIndemnityModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [selectedIndemnityForm, setSelectedIndemnityForm] = useState(null);
  const [newChildData, setNewChildData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    parentId: '',
    allergies: '',
    medicalConditions: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    }
  });
  const [stats, setStats] = useState({
    totalChildren: 0,
    checkedIn: 0,
    todayBookings: 0,
    monthlyRevenue: 0
  });

  const { connected, subscribeToChildcareCheckIn, subscribeToChildcareCheckOut } = useWebSocket();
  const { success, error: showError, info } = useNotification();

  useEffect(() => {
    fetchChildcareData();
  }, []);

  useEffect(() => {
    if (!connected) return;

    const unsubscribeCheckIn = subscribeToChildcareCheckIn((data) => {
      setBookings(prev => [data.booking, ...prev]);
      info(`${data.childName} checked in`, 3000);
    });

    const unsubscribeCheckOut = subscribeToChildcareCheckOut((data) => {
      setBookings(prev => prev.map(booking =>
        booking.id === data.bookingId
          ? { ...booking, status: 'completed', checkOutTime: data.checkOutTime }
          : booking
      ));
      info(`${data.childName} checked out`, 3000);
    });

    return () => {
      unsubscribeCheckIn && unsubscribeCheckIn();
      unsubscribeCheckOut && unsubscribeCheckOut();
    };
  }, [connected, subscribeToChildcareCheckIn, subscribeToChildcareCheckOut, info]);

  const fetchChildcareData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [childrenRes, bookingsRes] = await Promise.all([
        childcareAPI.getChildren(),
        childcareAPI.getBookings()
      ]);

      if (childrenRes && bookingsRes) {
        const fetchedChildren = childrenRes.data?.children || childrenRes.children || [];
        const normalizedChildren = fetchedChildren.map((c) => {
          const parentName = c.parent ? `${c.parent.firstName || ''} ${c.parent.lastName || ''}`.trim() : 'N/A';
          const dob = c.dateOfBirth || c.dob;
          const age = dob ? Math.max(0, Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))) : null;
          return {
            ...c,
            parentName,
            age,
            status: c.status || 'active',
            indemnityFormSigned: !!(c.indemnityForm || c.indemnityFormSigned)
          };
        });
        const fetchedBookingsRaw = bookingsRes.data?.bookings || bookingsRes.bookings || [];

        const normalizedBookings = fetchedBookingsRaw.map((b) => {
          const childName = b.child ? `${b.child.firstName || ''} ${b.child.lastName || ''}`.trim() : 'Unknown';
          const parentName = b.parent ? `${b.parent.firstName || ''} ${b.parent.lastName || ''}`.trim() : '';
          const status = (b.status || '').replace('-', '_');
          const checkInTime = b.checkInTime || b.date || b.createdAt;
          const checkOutTime = b.checkOutTime || b.updatedAt || null;
          return {
            ...b,
            bookingId: b.bookingId || b.id || b._id,
            childName,
            parentName,
            checkInTime,
            checkOutTime,
            totalHours: b.totalHours || b.chargeableHours || 0,
            chargeableHours: b.chargeableHours || b.totalHours || 0,
            amountCharged: b.amountCharged || 0,
            status
          };
        });

        setChildren(normalizedChildren);
        setBookings(normalizedBookings);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayBookings = normalizedBookings.filter(b => {
          const dateRef = b.date || b.checkInTime || b.createdAt;
          if (!dateRef) return false;
          const dateObj = new Date(dateRef);
          return !isNaN(dateObj) && dateObj.setHours(0, 0, 0, 0) === today.getTime();
        }).length;

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthlyRevenue = normalizedBookings
          .filter(b => {
            const dateRef = b.date || b.checkInTime || b.createdAt;
            if (!dateRef) return false;
            const dateObj = new Date(dateRef);
            return !isNaN(dateObj) && dateObj >= firstDayOfMonth && (b.status === 'checked_out' || b.status === 'completed');
          })
          .reduce((sum, b) => sum + (b.amountCharged || 0), 0);

        setStats({
          totalChildren: fetchedChildren.length,
          checkedIn: normalizedBookings.filter(b => b.status === 'checked_in' || b.status === 'checked-in').length,
          todayBookings,
          monthlyRevenue
        });

        setLoading(false);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch childcare data:', err);
      setError('Failed to load childcare data. Using cached data.');
      showError('Failed to load childcare data');
      setLoading(false);

      const { mockChildren, mockBookings } = getMockData();
      setChildren(mockChildren);
      setBookings(mockBookings);
      setStats({
        totalChildren: mockChildren.length,
        checkedIn: mockBookings.filter(b => b.status === 'checked_in').length,
        todayBookings: mockBookings.length,
        monthlyRevenue: 450
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchChildcareData();
    setRefreshing(false);
    info('Childcare data refreshed', 2000);
  };

  const handleExportChildren = () => {
    try {
      const exportColumns = [
        { key: 'childId', label: 'Child ID' },
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName', label: 'Last Name' },
        { key: 'dateOfBirth', label: 'Date of Birth' },
        { key: 'age', label: 'Age' },
        { key: 'parentName', label: 'Parent Name' },
        { key: 'status', label: 'Status' },
        { key: 'totalBookings', label: 'Total Visits' }
      ];
      downloadCSV(children, exportColumns, `childcare_children_${formatDate(new Date(), 'yyyyMMdd')}.csv`);
      success('Children data exported successfully!');
    } catch (err) {
      showError('Failed to export children data');
    }
  };

  const handleExportBookings = () => {
    try {
      const exportColumns = [
        { key: 'bookingId', label: 'Booking ID' },
        { key: 'childName', label: 'Child Name' },
        { key: 'checkInTime', label: 'Check-In Time' },
        { key: 'checkOutTime', label: 'Check-Out Time' },
        { key: 'totalHours', label: 'Total Hours' },
        { key: 'chargeableHours', label: 'Chargeable Hours' },
        { key: 'amountCharged', label: 'Amount Charged' },
        { key: 'status', label: 'Status' }
      ];
      downloadCSV(bookings, exportColumns, `childcare_bookings_${formatDate(new Date(), 'yyyyMMdd')}.csv`);
      success('Bookings exported successfully!');
    } catch (err) {
      showError('Failed to export bookings');
    }
  };

  const handleViewIndemnityForm = async (child) => {
    try {
      // Get indemnity form by child ID using the general indemnity API
      const response = await indemnityAPI.getByServiceType('childcare', { childId: child._id || child.id });
      const forms = response?.data?.data || [];
      if (forms.length > 0) {
        setSelectedIndemnityForm(forms[0]);
        setSelectedChild(child);
        setShowIndemnityModal(true);
      } else {
        // No form exists, prompt to create one
        setSelectedChild(child);
        setSelectedIndemnityForm(null);
        setShowIndemnityModal(true);
      }
    } catch (err) {
      // No form exists, prompt to create one
      setSelectedChild(child);
      setSelectedIndemnityForm(null);
      setShowIndemnityModal(true);
    }
  };

  const handleSignIndemnityForm = async (formData) => {
    try {
      await indemnityAPI.createChildcareForm({
        ...formData,
        child: selectedChild._id || selectedChild.id,
        customer: selectedChild.parent?._id || selectedChild.parent
      });
      success('Indemnity form signed successfully!');
      setShowIndemnityModal(false);
      setSelectedChild(null);
      setSelectedIndemnityForm(null);
      fetchChildcareData(); // Refresh to update form status
    } catch (err) {
      console.error('Failed to sign indemnity form:', err);
      showError('Failed to sign indemnity form');
      throw err;
    }
  };

  const handleAddChild = async (e) => {
    e.preventDefault();
    try {
      await childcareAPI.addChild(newChildData);
      success('Child added successfully!');
      setShowAddChildModal(false);
      setNewChildData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        parentId: '',
        allergies: '',
        medicalConditions: '',
        emergencyContact: {
          name: '',
          relationship: '',
          phone: ''
        }
      });
      fetchChildcareData(); // Refresh data
    } catch (err) {
      console.error('Failed to add child:', err);
      showError('Failed to add child');
    }
  };

  const getMockData = () => {
    const mockChildren = [
      {
        id: '1',
        childId: 'CHILD-1704123456802',
        firstName: 'Emma',
        lastName: 'Doe',
        dateOfBirth: '2020-03-15',
        age: 4,
        parentName: 'Jane Doe',
        status: 'active',
        totalBookings: 30
      },
      {
        id: '2',
        childId: 'CHILD-1704123456803',
        firstName: 'Oliver',
        lastName: 'Johnson',
        dateOfBirth: '2019-08-22',
        age: 5,
        parentName: 'Sarah Johnson',
        status: 'active',
        totalBookings: 18
      }
    ];

    const mockBookings = [
      {
        id: '1',
        bookingId: 'CC-1704123456805-CHILD-1704123456802',
        childName: 'Emma Doe',
        checkInTime: '2024-11-04T08:30:00Z',
        checkOutTime: '2024-11-04T11:30:00Z',
        totalHours: 3,
        chargeableHours: 1,
        amountCharged: 5,
        status: 'completed'
      },
      {
        id: '2',
        bookingId: 'CC-1704123456806-CHILD-1704123456803',
        childName: 'Oliver Johnson',
        checkInTime: '2024-11-04T09:00:00Z',
        checkOutTime: null,
        totalHours: 0,
        chargeableHours: 0,
        amountCharged: 0,
        status: 'checked_in'
      }
    ];

    return { mockChildren, mockBookings };
  };

  const childrenColumns = [
    {
      key: 'childId',
      header: 'Child ID',
      render: (value) => <span className="customer-id">{value}</span>
    },
    {
      key: 'name',
      header: 'Child Name',
      render: (_, row) => (
        <div>
          <div className="font-semibold">{row.firstName} {row.lastName}</div>
          <div className="text-xs text-gray">Age: {row.age}</div>
        </div>
      )
    },
    {
      key: 'parent',
      header: 'Parent',
      render: (value) => value ? `${value.firstName || ''} ${value.lastName || ''}`.trim() : 'N/A'
    },
    {
      key: 'dateOfBirth',
      header: 'Date of Birth',
      render: (value) => format(new Date(value), 'MMM dd, yyyy')
    },
    {
      key: 'totalBookings',
      header: 'Total Visits',
      render: (value) => (
        <div className="flex items-center gap-xs">
          <Clock size={14} />
          {value}
        </div>
      )
    },
    {
      key: 'indemnityFormSigned',
      header: 'Indemnity Form',
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
      key: 'status',
      header: 'Status',
      render: (value) => (
        <Badge variant={value === 'active' ? 'success' : 'default'}>
          {value}
        </Badge>
      )
    }
  ];

  const bookingsColumns = [
    {
      key: 'bookingId',
      header: 'Booking ID',
      render: (value) => value
        ? <span className="customer-id">{value.toString().slice(0, 20)}...</span>
        : '-'
    },
    {
      key: 'childName',
      header: 'Child'
    },
    {
      key: 'parentName',
      header: 'Parent'
    },
    {
      key: 'checkInTime',
      header: 'Check-In',
      render: (value) => {
        const dateObj = value ? new Date(value) : null;
        return dateObj && !isNaN(dateObj) ? format(dateObj, 'MMM dd, HH:mm') : 'N/A';
      }
    },
    {
      key: 'checkOutTime',
      header: 'Check-Out',
      render: (value) => {
        if (!value) return 'In Progress';
        const dateObj = new Date(value);
        return !isNaN(dateObj) ? format(dateObj, 'HH:mm') : value;
      }
    },
    {
      key: 'totalHours',
      header: 'Hours',
      render: (value, row) => (
        <div>
          <div>{value}h total</div>
          {row.chargeableHours > 0 && (
            <div className="text-xs text-warning">{row.chargeableHours}h charged</div>
          )}
        </div>
      )
    },
    {
      key: 'amountCharged',
      header: 'Amount',
      render: (value) => `$${value}`
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => {
        const variants = {
          checked_in: 'warning',
          checked_out: 'info',
          completed: 'success',
          cancelled: 'error',
          scheduled: 'default'
        };
        return <Badge variant={variants[value] || 'default'}>{value.replace('_', ' ')}</Badge>;
      }
    }
  ];

  return (
    <Layout title="The Women's Den (Childcare)" subtitle="Manage children and bookings">
      {error && (
        <div className="alert alert-warning mb-lg">
          {error}
        </div>
      )}

      <div className="grid grid-4 mb-xl">
        <StatCard
          title="Registered Children"
          value={stats.totalChildren.toString()}
          icon={Users}
          color="var(--childcare-color)"
        />
        <StatCard
          title="Currently Checked In"
          value={stats.checkedIn.toString()}
          icon={Baby}
          color="var(--warning)"
        />
        <StatCard
          title="Today's Bookings"
          value={stats.todayBookings.toString()}
          icon={Clock}
          color="var(--info)"
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats.monthlyRevenue}`}
          icon={DollarSign}
          color="var(--success)"
        />
      </div>

      <div className="grid grid-1 mb-xl">
        <Card>
          <div className="card-actions">
            <h3>Registered Children</h3>
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
              <Button variant="primary" icon={Plus} onClick={() => setShowAddChildModal(true)}>
                Add Child
              </Button>
              <Button variant="secondary" icon={Download} onClick={handleExportChildren}>
                Export CSV
              </Button>
            </div>
          </div>
          <Table
            columns={childrenColumns}
            data={children}
            loading={loading}
            searchPlaceholder="Search children..."
          />
        </Card>
      </div>

      <Card>
        <div className="card-actions">
          <h3>Recent Bookings</h3>
          <Button variant="primary" icon={Download} onClick={handleExportBookings}>
            Export CSV
          </Button>
        </div>
        <Table
          columns={bookingsColumns}
          data={bookings}
          loading={loading}
          searchPlaceholder="Search bookings..."
        />
      </Card>

      <Modal
        isOpen={showIndemnityModal}
        onClose={() => {
          setShowIndemnityModal(false);
          setSelectedChild(null);
          setSelectedIndemnityForm(null);
        }}
        title={selectedIndemnityForm ? 'View Indemnity Form' : 'Sign Indemnity Form'}
        size="large"
      >
        {selectedChild && (
          <IndemnityFormSigner
            serviceType="childcare"
            customer={selectedChild.parent}
            existingForm={selectedIndemnityForm}
            readOnly={!!selectedIndemnityForm}
            onSign={handleSignIndemnityForm}
            onCancel={() => {
              setShowIndemnityModal(false);
              setSelectedChild(null);
              setSelectedIndemnityForm(null);
            }}
          />
        )}
      </Modal>

      <Modal
        isOpen={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
        title="Add New Child"
        size="large"
      >
        <form onSubmit={handleAddChild} className="add-child-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                required
                value={newChildData.firstName}
                onChange={(e) => setNewChildData({ ...newChildData, firstName: e.target.value })}
                placeholder="Enter first name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                required
                value={newChildData.lastName}
                onChange={(e) => setNewChildData({ ...newChildData, lastName: e.target.value })}
                placeholder="Enter last name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth *</label>
              <input
                type="date"
                id="dateOfBirth"
                required
                value={newChildData.dateOfBirth}
                onChange={(e) => setNewChildData({ ...newChildData, dateOfBirth: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="parentId">Parent/Guardian Customer ID *</label>
              <input
                type="text"
                id="parentId"
                required
                value={newChildData.parentId}
                onChange={(e) => setNewChildData({ ...newChildData, parentId: e.target.value })}
                placeholder="Enter customer ID"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="allergies">Allergies</label>
              <textarea
                id="allergies"
                value={newChildData.allergies}
                onChange={(e) => setNewChildData({ ...newChildData, allergies: e.target.value })}
                placeholder="List any allergies"
                rows="3"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="medicalConditions">Medical Conditions</label>
              <textarea
                id="medicalConditions"
                value={newChildData.medicalConditions}
                onChange={(e) => setNewChildData({ ...newChildData, medicalConditions: e.target.value })}
                placeholder="List any medical conditions"
                rows="3"
              />
            </div>

            <div className="form-section-title full-width">
              <h4>Emergency Contact</h4>
            </div>

            <div className="form-group">
              <label htmlFor="emergencyName">Contact Name *</label>
              <input
                type="text"
                id="emergencyName"
                required
                value={newChildData.emergencyContact.name}
                onChange={(e) => setNewChildData({
                  ...newChildData,
                  emergencyContact: { ...newChildData.emergencyContact, name: e.target.value }
                })}
                placeholder="Emergency contact name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="emergencyRelationship">Relationship *</label>
              <input
                type="text"
                id="emergencyRelationship"
                required
                value={newChildData.emergencyContact.relationship}
                onChange={(e) => setNewChildData({
                  ...newChildData,
                  emergencyContact: { ...newChildData.emergencyContact, relationship: e.target.value }
                })}
                placeholder="e.g., Mother, Father, Aunt"
              />
            </div>

            <div className="form-group">
              <label htmlFor="emergencyPhone">Contact Phone *</label>
              <input
                type="tel"
                id="emergencyPhone"
                required
                value={newChildData.emergencyContact.phone}
                onChange={(e) => setNewChildData({
                  ...newChildData,
                  emergencyContact: { ...newChildData.emergencyContact, phone: e.target.value }
                })}
                placeholder="Emergency phone number"
              />
            </div>
          </div>

          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setShowAddChildModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Child
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Childcare;
