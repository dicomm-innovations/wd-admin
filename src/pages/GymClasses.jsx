import { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, Plus, RefreshCw, Users, Edit2, Trash2, Dumbbell, TrendingUp, Target } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import StatCard from '../components/dashboard/StatCard';
import { gymAPI, employeeAPI } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate, getStatusVariant, formatStatus } from '../utils/formatters';

const defaultFormState = {
  name: '',
  description: '',
  instructorId: '',
  capacity: 10,
  startTime: '',
  endTime: '',
  location: 'Main Studio',
  tags: '',
  status: 'scheduled'
};

const toDateTimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const GymClasses = () => {
  const CLASS_FORM_ID = 'gym-class-form';
  const [classes, setClasses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState(defaultFormState);
  const [selectedClass, setSelectedClass] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [instructorFilter, setInstructorFilter] = useState('all');
  const [stats, setStats] = useState({
    totalClasses: 0,
    upcoming: 0,
    totalCapacity: 0,
    utilization: 0
  });

  const { success, error: showError } = useNotification();

  useEffect(() => {
    fetchClasses();
    fetchInstructors();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await gymAPI.getClasses();
      const gymClasses = response?.classes || [];
      setClasses(gymClasses);
      computeStats(gymClasses);
    } catch (err) {
      console.error('Failed to load classes:', err);
      showError('Failed to load gym classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructors = async () => {
    try {
      const response = await employeeAPI.getAll({ businessUnit: 'gym', limit: 200 });
      setInstructors(response?.employees || []);
    } catch (err) {
      console.error('Failed to load instructors:', err);
      showError('Failed to load instructors');
    }
  };

  const computeStats = (items) => {
    const totalCapacity = items.reduce((sum, item) => sum + (item.capacity || 0), 0);
    const booked = items.reduce((sum, item) => sum + (item.enrolledCount || 0), 0);
    const upcoming = items.filter(item => new Date(item.startTime) > new Date()).length;
    const utilization = totalCapacity > 0 ? Math.round((booked / totalCapacity) * 100) : 0;

    setStats({
      totalClasses: items.length,
      upcoming,
      totalCapacity,
      utilization
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchClasses();
    setRefreshing(false);
  };

  const openCreateModal = () => {
    setSelectedClass(null);
    setFormData(defaultFormState);
    setShowFormModal(true);
  };

  const handleEditClass = (gymClass) => {
    setSelectedClass(gymClass);
    setFormData({
      name: gymClass.name || '',
      description: gymClass.description || '',
      instructorId: gymClass.instructor?._id || gymClass.instructor || '',
      capacity: gymClass.capacity || 0,
      startTime: toDateTimeLocal(gymClass.startTime),
      endTime: toDateTimeLocal(gymClass.endTime),
      location: gymClass.location || '',
      tags: Array.isArray(gymClass.tags) ? gymClass.tags.join(', ') : '',
      status: gymClass.status || 'scheduled'
    });
    setShowFormModal(true);
  };

  const handleDeleteRequest = (gymClass) => {
    setSelectedClass(gymClass);
    setShowDeleteModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        description: formData.description,
        instructorId: formData.instructorId,
        capacity: Number(formData.capacity),
        startTime: formData.startTime ? new Date(formData.startTime).toISOString() : null,
        endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
        location: formData.location,
        status: formData.status,
        tags: formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean)
      };

      if (!payload.instructorId) {
        showError('Please select an instructor');
        setSubmitting(false);
        return;
      }

      if (!payload.startTime || !payload.endTime) {
        showError('Please provide start and end times');
        setSubmitting(false);
        return;
      }

      if (selectedClass?._id) {
        await gymAPI.updateClass(selectedClass._id, payload);
        success('Class updated successfully!');
      } else {
        await gymAPI.createClass(payload);
        success('Class scheduled successfully!');
      }

      setShowFormModal(false);
      setSelectedClass(null);
      setFormData(defaultFormState);
      await fetchClasses();
    } catch (err) {
      console.error('Failed to save class:', err);
      showError(err?.error || err?.message || 'Failed to save class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async () => {
    try {
      if (!selectedClass?._id) return;
      setSubmitting(true);
      await gymAPI.deleteClass(selectedClass._id);
      success('Class deleted successfully');
      setShowDeleteModal(false);
      setSelectedClass(null);
      await fetchClasses();
    } catch (err) {
      console.error('Failed to delete class:', err);
      showError(err?.error || err?.message || 'Failed to delete class');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClasses = useMemo(() => {
    return classes.filter(gymClass => {
      const matchesStatus = statusFilter === 'all' || gymClass.status === statusFilter;
      const instructorId =
        typeof gymClass.instructor === 'object'
          ? gymClass.instructor?._id
          : gymClass.instructor;
      const matchesInstructor = instructorFilter === 'all' || instructorId === instructorFilter;
      return matchesStatus && matchesInstructor;
    });
  }, [classes, statusFilter, instructorFilter]);

  const columns = [
    {
      key: 'name',
      header: 'Class',
      render: (_, gymClass) => (
        <div>
          <div className="font-semibold text-gray-900">{gymClass.name}</div>
          {gymClass.description && (
            <div className="text-sm text-gray-500">{gymClass.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'instructor',
      header: 'Instructor',
      render: (_, gymClass) => (
        <div>
          <div className="font-medium text-gray-900">
            {gymClass.instructor
              ? `${gymClass.instructor.firstName} ${gymClass.instructor.lastName}`
              : 'Unassigned'}
          </div>
          <div className="text-sm text-gray-500">{gymClass.instructor?.position}</div>
        </div>
      )
    },
    {
      key: 'schedule',
      header: 'Schedule',
      render: (_, gymClass) => (
        <div>
          <div className="font-medium text-gray-900">{formatDate(gymClass.startTime, 'EEE, MMM dd')}</div>
          <div className="text-sm text-gray-500">
            {formatDate(gymClass.startTime, 'HH:mm')} - {formatDate(gymClass.endTime, 'HH:mm')}
          </div>
        </div>
      )
    },
    {
      key: 'capacity',
      header: 'Capacity',
      render: (_, gymClass) => (
        <div>
          <div className="font-semibold text-gray-900">
            {gymClass.enrolledCount || 0} / {gymClass.capacity}
          </div>
          <div className="text-xs text-gray-500">Reserved vs total spots</div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, gymClass) => (
        <Badge variant={getStatusVariant(gymClass.status)} size="sm">
          {formatStatus(gymClass.status)}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, gymClass) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditClass(gymClass);
            }}
            className="p-2 text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteRequest(gymClass);
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
        {/* Header with Gradient Background */}
        <div style={{
          background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-xl)',
          padding: 'var(--spacing-2xl)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)' }}>
                <Dumbbell size={32} />
                Gym Classes
              </h1>
              <p style={{ opacity: 0.9, marginTop: 'var(--spacing-sm)' }}>Manage group sessions, instructors, and capacity</p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
              <Button
                variant="outline"
                icon={RefreshCw}
                onClick={handleRefresh}
                loading={refreshing}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.4)'
                }}
              >
                Refresh
              </Button>
              <Button
                icon={Plus}
                onClick={openCreateModal}
                style={{
                  backgroundColor: 'white',
                  color: '#ec4899',
                  fontWeight: '600',
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                Schedule Class
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-4">
          <StatCard
            title="Total Classes"
            value={stats.totalClasses}
            icon={Calendar}
            color="var(--gym-color)"
            loading={loading}
          />
          <StatCard
            title="Upcoming"
            value={stats.upcoming}
            icon={Clock}
            color="var(--primary-color)"
            loading={loading}
          />
          <StatCard
            title="Total Capacity"
            value={stats.totalCapacity}
            icon={Users}
            color="var(--info)"
            loading={loading}
          />
          <StatCard
            title="Utilization"
            value={`${stats.utilization}%`}
            icon={TrendingUp}
            color="var(--success)"
            loading={loading}
          />
        </div>

        <Card>
          <Card.Header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Scheduled Classes</h2>
              <p className="text-gray-500 text-sm">Filter by status or instructor to drill down</p>
            </div>
          </Card.Header>

          {/* Filters Section - Enhanced */}
          <div style={{ padding: '0 var(--spacing-xl) var(--spacing-lg)' }}>
            <div style={{
              background: 'linear-gradient(135deg, #fce7f3 0%, #e9d5ff 50%, #e0e7ff 100%)',
              padding: 'var(--spacing-xl)',
              borderRadius: 'var(--radius-xl)',
              border: '2px solid #f9a8d4',
              boxShadow: 'var(--shadow-md)'
            }}>
              <div style={{ display: 'flex', gap: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', fontSize: '0.875rem', fontWeight: 'bold', color: '#831843', marginBottom: 'var(--spacing-sm)' }}>
                    <Target size={16} />
                    Status Filter
                  </label>
                  <select
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
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">🎯 All statuses</option>
                    <option value="scheduled">📅 Scheduled</option>
                    <option value="completed">✅ Completed</option>
                    <option value="cancelled">❌ Cancelled</option>
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', fontSize: '0.875rem', fontWeight: 'bold', color: '#581c87', marginBottom: 'var(--spacing-sm)' }}>
                    <Users size={16} />
                    Instructor Filter
                  </label>
                  <select
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
                    value={instructorFilter}
                    onChange={(e) => setInstructorFilter(e.target.value)}
                  >
                    <option value="all">👥 All instructors</option>
                    {instructors.map((instructor) => (
                      <option key={instructor._id} value={instructor._id}>
                        {instructor.firstName} {instructor.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <Card.Body>
            <Table
              columns={columns}
              data={filteredClasses}
              loading={loading}
              emptyMessage={loading ? 'Loading classes...' : 'No classes scheduled'}
            />
          </Card.Body>
        </Card>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelectedClass(null);
        }}
        title={selectedClass ? 'Edit Class' : 'Schedule Class'}
        size="large"
      >
        <form id={CLASS_FORM_ID} onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)', maxHeight: '70vh', overflowY: 'auto', paddingRight: 'var(--spacing-sm)' }}>
            {/* Basic Info Section - Enhanced */}
            <div style={{
              background: 'linear-gradient(135deg, #fce7f3 0%, #fce7f3 50%, white 100%)',
              padding: 'var(--spacing-xl)',
              borderRadius: 'var(--radius-xl)',
              border: '2px solid #f9a8d4',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <h3 style={{ fontWeight: 'bold', color: '#831843', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', fontSize: '1.125rem' }}>
                <Dumbbell size={20} color="#ec4899" />
                Class Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Class Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g., HIIT Bootcamp"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Instructor <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="instructorId"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all font-medium"
                    value={formData.instructorId}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select instructor</option>
                    {instructors.map((instructor) => (
                      <option key={instructor._id} value={instructor._id}>
                        {instructor.firstName} {instructor.lastName} ({instructor.position || 'Trainer'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Add class focus, required experience, etc."
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Schedule Section - Enhanced */}
            <div style={{
              background: 'linear-gradient(135deg, #e9d5ff 0%, #ede9fe 50%, white 100%)',
              padding: 'var(--spacing-xl)',
              borderRadius: 'var(--radius-xl)',
              border: '2px solid #d8b4fe',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <h3 style={{ fontWeight: 'bold', color: '#581c87', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', fontSize: '1.125rem' }}>
                <Clock size={20} color="#8b5cf6" />
                Schedule & Timing
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    value={formData.startTime}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    value={formData.endTime}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Details Section - Enhanced */}
            <div style={{
              background: 'linear-gradient(135deg, #dbeafe 0%, #e0f2fe 50%, white 100%)',
              padding: 'var(--spacing-xl)',
              borderRadius: 'var(--radius-xl)',
              border: '2px solid #93c5fd',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <h3 style={{ fontWeight: 'bold', color: '#1e3a8a', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', fontSize: '1.125rem' }}>
                <Target size={20} color="#3b82f6" />
                Class Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Capacity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    name="capacity"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                    value={formData.capacity}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData.location}
                    onChange={handleFormChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                    value={formData.status}
                    onChange={handleFormChange}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={formData.tags}
                  onChange={handleFormChange}
                  placeholder="Strength, Endurance, Mobility"
                />
                <p className="text-xs text-gray-500 mt-2">Separate tags with commas</p>
              </div>
            </div>
          </div>

          {/* Action Buttons - Enhanced */}
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)', paddingTop: 'var(--spacing-xl)', borderTop: '2px solid var(--gray-300)' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowFormModal(false);
                setSelectedClass(null);
              }}
              style={{ flex: 1, fontWeight: 'bold', borderWidth: '2px', boxShadow: 'var(--shadow-md)' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              style={{
                flex: 1,
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6, #6366f1)',
                color: 'white',
                boxShadow: 'var(--shadow-xl)'
              }}
            >
              {selectedClass ? '💾 Update Class' : '✨ Create Class'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedClass(null);
        }}
        title="Remove Class"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-gray-900">{selectedClass?.name}</span>? This action cannot be
            undone.
          </p>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedClass(null);
              }}
              className="flex-1 font-semibold"
            >
              Cancel
            </Button>
            <Button
              variant="error"
              onClick={handleDeleteClass}
              loading={submitting}
              className="flex-1 font-semibold"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default GymClasses;
