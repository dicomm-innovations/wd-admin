import { useState, useEffect } from 'react';
import { Calendar, Clock, UserCheck, UserX, Plus, Edit, CheckCircle, XCircle } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import { useNotification } from '../contexts/NotificationContext';
import { therapistScheduleAPI } from '../services/api';
import { formatDate } from '../utils/formatters';

const TherapistSchedules = () => {
  const [loading, setLoading] = useState(false);
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);
  const { success, error: showError } = useNotification();

  const [timeOffForm, setTimeOffForm] = useState({
    startDate: '',
    endDate: '',
    reason: 'vacation',
    notes: ''
  });

  useEffect(() => {
    fetchTherapists();
  }, []);

  const fetchTherapists = async () => {
    try {
      const response = await therapistScheduleAPI.getAllTherapists();
      if (response.success) {
        setTherapists(response.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch therapists:', err);
      showError('Failed to load therapists');
    }
  };

  const fetchSchedule = async (therapistId) => {
    try {
      setLoading(true);
      const response = await therapistScheduleAPI.getAllSchedules({
        therapistId,
        active: true
      });

      if (response.success && response.data.schedules.length > 0) {
        const activeSchedule = response.data.schedules[0];
        setSchedule(activeSchedule);
        setTimeOffRequests(activeSchedule.timeOff || []);
      } else {
        setSchedule(null);
        setTimeOffRequests([]);
      }
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
      showError('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTherapist = (therapist) => {
    setSelectedTherapist(therapist);
    if (therapist.hasActiveSchedule) {
      fetchSchedule(therapist._id);
    } else {
      setSchedule(null);
      setTimeOffRequests([]);
    }
  };

  const handleCreateDefaultSchedule = async () => {
    if (!selectedTherapist) return;

    try {
      setLoading(true);
      const response = await therapistScheduleAPI.createSchedule({
        therapistId: selectedTherapist._id
      });

      if (response.success) {
        success('Default schedule created successfully!');
        fetchTherapists();
        fetchSchedule(selectedTherapist._id);
      }
    } catch (err) {
      console.error('Failed to create schedule:', err);
      showError(err.error || 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTimeOff = async (e) => {
    e.preventDefault();

    if (!selectedTherapist) return;

    try {
      setLoading(true);
      const response = await therapistScheduleAPI.addTimeOff(
        selectedTherapist._id,
        timeOffForm
      );

      if (response.success) {
        success('Time off request added successfully!');
        setShowTimeOffModal(false);
        setTimeOffForm({
          startDate: '',
          endDate: '',
          reason: 'vacation',
          notes: ''
        });
        fetchSchedule(selectedTherapist._id);
      }
    } catch (err) {
      console.error('Failed to add time off:', err);
      showError(err.error || 'Failed to add time off');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTimeOff = async (scheduleId, timeOffId) => {
    try {
      setLoading(true);
      const response = await therapistScheduleAPI.updateTimeOffStatus(
        scheduleId,
        timeOffId,
        { status: 'approved' }
      );

      if (response.success) {
        success('Time off request approved!');
        fetchSchedule(selectedTherapist._id);
      }
    } catch (err) {
      console.error('Failed to approve time off:', err);
      showError(err.error || 'Failed to approve time off');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectTimeOff = async (scheduleId, timeOffId) => {
    try {
      setLoading(true);
      const response = await therapistScheduleAPI.updateTimeOffStatus(
        scheduleId,
        timeOffId,
        { status: 'rejected' }
      );

      if (response.success) {
        success('Time off request rejected');
        fetchSchedule(selectedTherapist._id);
      }
    } catch (err) {
      console.error('Failed to reject time off:', err);
      showError(err.error || 'Failed to reject time off');
    } finally {
      setLoading(false);
    }
  };

  const getDaySchedule = (dayOfWeek) => {
    if (!schedule || !schedule.weeklySchedule) return null;
    return schedule.weeklySchedule.find(day => day.dayOfWeek === dayOfWeek);
  };

  const renderWeeklySchedule = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {days.map(day => {
          const daySchedule = getDaySchedule(day);

          return (
            <div
              key={day}
              className={`p-4 border rounded-lg ${
                daySchedule?.isWorkingDay
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{day}</h4>
                <Badge variant={daySchedule?.isWorkingDay ? 'success' : 'default'}>
                  {daySchedule?.isWorkingDay ? 'Working' : 'Off'}
                </Badge>
              </div>

              {daySchedule?.isWorkingDay && daySchedule.slots && (
                <>
                  <div className="text-sm text-gray-600 mb-2">
                    {daySchedule.slots.length} time slots
                  </div>

                  <div className="space-y-1">
                    {daySchedule.slots.slice(0, 3).map((slot, idx) => (
                      <div key={idx} className="text-xs bg-white px-2 py-1 rounded">
                        {slot.startTime} - {slot.endTime}
                      </div>
                    ))}
                    {daySchedule.slots.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{daySchedule.slots.length - 3} more slots
                      </div>
                    )}
                  </div>

                  {daySchedule.breaks && daySchedule.breaks.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <div className="text-xs text-gray-600">Breaks:</div>
                      {daySchedule.breaks.map((brk, idx) => (
                        <div key={idx} className="text-xs text-gray-700">
                          {brk.startTime} - {brk.endTime} ({brk.reason})
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const therapistColumns = [
    {
      key: 'name',
      label: 'Therapist',
      render: (_, therapist) => (
        <div>
          <div className="font-medium">{therapist.firstName} {therapist.lastName}</div>
          <div className="text-sm text-gray-500">{therapist.email}</div>
        </div>
      )
    },
    {
      key: 'specializations',
      label: 'Specializations',
      render: (value, therapist) => (
        value && value.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {value.map((spec, idx) => (
              <Badge key={idx} variant="info">{spec}</Badge>
            ))}
          </div>
        ) : 'N/A'
      )
    },
    {
      key: 'hasActiveSchedule',
      label: 'Schedule Status',
      render: (value, therapist) => (
        <Badge variant={value ? 'success' : 'warning'}>
          {value ? 'Scheduled' : 'No Schedule'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, therapist) => (
        <Button
          size="sm"
          onClick={() => handleSelectTherapist(therapist)}
          variant="outline"
        >
          View Schedule
        </Button>
      )
    }
  ];

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Therapist Schedule Management
          </h1>
          <p className="text-gray-600">
            Manage therapist schedules, availability, and time off requests
          </p>
        </div>

        {/* Therapists List */}
        <div className="mb-6">
          <Card title="All Therapists" icon={UserCheck}>
            <Table
              data={therapists}
              columns={therapistColumns}
            />
          </Card>
        </div>

        {/* Selected Therapist Details */}
        {selectedTherapist && (
          <div className="space-y-6">
            <Card
              title={`${selectedTherapist.firstName} ${selectedTherapist.lastName}'s Schedule`}
              icon={Calendar}
            >
              {!schedule ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    No active schedule found for this therapist
                  </p>
                  <Button onClick={handleCreateDefaultSchedule} loading={loading}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Default Schedule
                  </Button>
                </div>
              ) : (
                <>
                  {/* Schedule Settings */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-3">Schedule Settings</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Appointment Duration</div>
                        <div className="font-medium">{schedule.settings?.appointmentDuration || 60} mins</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Buffer Time</div>
                        <div className="font-medium">{schedule.settings?.bufferTime || 15} mins</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Max Appointments/Day</div>
                        <div className="font-medium">{schedule.settings?.maxAppointmentsPerDay || 8}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Effective From</div>
                        <div className="font-medium">{formatDate(schedule.effectiveFrom)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Schedule */}
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">Weekly Schedule</h4>
                    {renderWeeklySchedule()}
                  </div>
                </>
              )}
            </Card>

            {/* Time Off Requests */}
            {schedule && (
              <Card
                title="Time Off Requests"
                icon={Calendar}
                action={
                  <Button
                    size="sm"
                    onClick={() => setShowTimeOffModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Request Time Off
                  </Button>
                }
              >
                {timeOffRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No time off requests
                  </div>
                ) : (
                  <div className="space-y-3">
                    {timeOffRequests.map((timeOff, idx) => (
                      <div
                        key={timeOff._id || idx}
                        className={`p-4 border rounded-lg ${
                          timeOff.status === 'approved'
                            ? 'border-green-200 bg-green-50'
                            : timeOff.status === 'rejected'
                            ? 'border-red-200 bg-red-50'
                            : 'border-yellow-200 bg-yellow-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant={
                                  timeOff.status === 'approved'
                                    ? 'success'
                                    : timeOff.status === 'rejected'
                                    ? 'error'
                                    : 'warning'
                                }
                              >
                                {timeOff.status}
                              </Badge>
                              <Badge variant="info">{timeOff.reason}</Badge>
                            </div>

                            <div className="text-sm text-gray-900 mb-1">
                              <strong>From:</strong> {formatDate(timeOff.startDate)}
                            </div>
                            <div className="text-sm text-gray-900 mb-1">
                              <strong>To:</strong> {formatDate(timeOff.endDate)}
                            </div>

                            {timeOff.notes && (
                              <div className="text-sm text-gray-700 mt-2">
                                <strong>Notes:</strong> {timeOff.notes}
                              </div>
                            )}
                          </div>

                          {timeOff.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleApproveTimeOff(schedule._id, timeOff._id)}
                                loading={loading}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="error"
                                onClick={() => handleRejectTimeOff(schedule._id, timeOff._id)}
                                loading={loading}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {/* Time Off Request Modal */}
        <Modal
          isOpen={showTimeOffModal}
          onClose={() => setShowTimeOffModal(false)}
          title="Request Time Off"
        >
          <form onSubmit={handleAddTimeOff}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={timeOffForm.startDate}
                onChange={(e) => setTimeOffForm({ ...timeOffForm, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={timeOffForm.endDate}
                onChange={(e) => setTimeOffForm({ ...timeOffForm, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason
              </label>
              <select
                value={timeOffForm.reason}
                onChange={(e) => setTimeOffForm({ ...timeOffForm, reason: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="vacation">Vacation</option>
                <option value="sick_leave">Sick Leave</option>
                <option value="training">Training</option>
                <option value="personal">Personal</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={timeOffForm.notes}
                onChange={(e) => setTimeOffForm({ ...timeOffForm, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" loading={loading} className="flex-1">
                Submit Request
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTimeOffModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default TherapistSchedules;
