import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { ptAdminAPI, gymAPI } from '../services/api';
import { formatDateTime } from '../utils/formatters';
import { Calendar, Clock, Users, RefreshCw, Eye } from 'lucide-react';

const TrainerSchedule = () => {
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [trainerEvents, setTrainerEvents] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [unit, setUnit] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().slice(0, 10),
    end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  });
  const [waitlistView, setWaitlistView] = useState({ event: null, list: [] });

  useEffect(() => {
    loadTrainers();
  }, []);

  useEffect(() => {
    if (selectedTrainer) {
      loadTrainerSchedule();
    }
  }, [selectedTrainer, dateRange]);

  useEffect(() => {
    loadCalendar();
  }, [unit, dateRange]);

  const loadTrainers = async () => {
    const res = await ptAdminAPI.getTrainersWithStats();
    setTrainers(res?.trainers || []);
    if (res?.trainers?.length && !selectedTrainer) {
      setSelectedTrainer(res.trainers[0]._id);
    }
  };

  const loadTrainerSchedule = async () => {
    try {
      setLoading(true);
      const res = await ptAdminAPI.getTrainerSchedule(selectedTrainer, {
        startDate: dateRange.start,
        endDate: dateRange.end
      });
      setTrainerEvents(res?.events || []);
    } finally {
      setLoading(false);
    }
  };

  const loadCalendar = async () => {
    try {
      setCalendarLoading(true);
      const res = await ptAdminAPI.getCalendar({
        startDate: dateRange.start,
        endDate: dateRange.end,
        unit: unit === 'all' ? undefined : unit
      });
      setCalendarEvents(res?.events || []);
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleViewWaitlist = async (event) => {
    if (event.type !== 'class') return;
    const res = await gymAPI.getClassWaitlist(event.id);
    setWaitlistView({ event, list: res?.waitingList || [] });
  };

  const groupedTrainer = useMemo(() => {
    return trainerEvents.reduce((acc, evt) => {
      const day = new Date(evt.start || evt.classDate || evt.bookingDate).toDateString();
      acc[day] = acc[day] || [];
      acc[day].push(evt);
      return acc;
    }, {});
  }, [trainerEvents]);

  const filteredCalendar = calendarEvents.filter(evt => unit === 'all' || evt.type === unit || (unit === 'gym' && evt.type === 'class'));

  return (
    <Layout title="Trainer Schedule" subtitle="View trainer plans and cross-unit calendar">
      <div className="grid grid-2 gap-lg">
        <Card>
          <div className="flex justify-between items-center mb-md">
            <div>
              <h3 className="text-lg font-semibold">Per-Trainer Calendar</h3>
              <p className="text-gray-500 text-sm">PT sessions, classes, and spa bookings tied to the trainer</p>
            </div>
            <Button icon={RefreshCw} variant="secondary" size="sm" onClick={loadTrainerSchedule} loading={loading}>
              Refresh
            </Button>
          </div>

          <div className="grid grid-2 gap-md mb-md">
            <div>
              <label className="form-label">Trainer</label>
              <select
                value={selectedTrainer}
                onChange={(e) => setSelectedTrainer(e.target.value)}
                className="form-input"
              >
                {trainers.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.firstName} {t.lastName} ({t.position})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-2 gap-sm">
              <div>
                <label className="form-label">Start</label>
                <input
                  type="date"
                  className="form-input"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">End</label>
                <input
                  type="date"
                  className="form-input"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-md">Loading schedule...</div>
          ) : (
            <div className="space-y-md">
              {Object.keys(groupedTrainer).length === 0 && (
                <div className="text-gray-500 text-sm">No events in range.</div>
              )}
              {Object.entries(groupedTrainer).map(([day, events]) => (
                <div key={day} className="border rounded-lg p-md bg-gray-50">
                  <div className="font-semibold mb-sm">{day}</div>
                  <div className="space-y-sm">
                    {events.map((evt, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-sm rounded-md shadow-sm">
                        <div className="flex items-center gap-sm">
                          <Badge variant={evt.type === 'pt' ? 'primary' : evt.type === 'class' ? 'secondary' : 'info'}>
                            {evt.type?.toUpperCase()}
                          </Badge>
                          <div>
                            <div className="font-medium">{evt.title || 'Event'}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock size={12} /> {formatDateTime(evt.start)} - {formatDateTime(evt.end)}
                            </div>
                          </div>
                        </div>
                        {evt.type === 'class' && (
                          <Button size="sm" variant="outline" icon={Eye} onClick={() => handleViewWaitlist(evt)}>
                            Waitlist
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-md">
            <div>
              <h3 className="text-lg font-semibold">Business Unit Calendar</h3>
              <p className="text-gray-500 text-sm">All scheduled services by unit</p>
            </div>
            <Button icon={RefreshCw} variant="secondary" size="sm" onClick={loadCalendar} loading={calendarLoading}>
              Refresh
            </Button>
          </div>

          <div className="grid grid-3 gap-md mb-md">
            <div>
              <label className="form-label">Unit</label>
              <select
                className="form-input"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                <option value="all">All</option>
                <option value="gym">Gym / PT</option>
                <option value="spa">Spa</option>
              </select>
            </div>
            <div>
              <label className="form-label">Start</label>
              <input
                type="date"
                className="form-input"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">End</label>
              <input
                type="date"
                className="form-input"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>

          {calendarLoading ? (
            <div className="text-center text-gray-500 py-md">Loading calendar...</div>
          ) : (
            <div className="space-y-sm">
              {filteredCalendar.length === 0 && (
                <div className="text-gray-500 text-sm">No events in range.</div>
              )}
              {filteredCalendar.map((evt, idx) => (
                <div key={idx} className="flex items-center justify-between border rounded-lg p-sm">
                  <div className="flex items-center gap-sm">
                    <Calendar size={16} className="text-gray-500" />
                    <div>
                      <div className="font-medium">{evt.title}</div>
                      <div className="text-xs text-gray-500">{formatDateTime(evt.start)} - {formatDateTime(evt.end)}</div>
                    </div>
                  </div>
                  {evt.type === 'class' && (
                    <div className="flex items-center gap-xs">
                      <Badge variant="secondary">Class</Badge>
                      <Button size="sm" variant="outline" onClick={() => handleViewWaitlist(evt)}>
                        Waitlist
                      </Button>
                    </div>
                  )}
                  {evt.type === 'pt' && <Badge variant="primary">PT</Badge>}
                  {evt.type === 'spa' && <Badge variant="info">Spa</Badge>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {waitlistView.event && (
        <Card className="mt-lg">
          <div className="flex justify-between items-center mb-sm">
            <div>
              <h4 className="font-semibold">Waitlist - {waitlistView.event.title}</h4>
              <p className="text-sm text-gray-500">{formatDateTime(waitlistView.event.start)}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setWaitlistView({ event: null, list: [] })}>
              Close
            </Button>
          </div>
          {waitlistView.list.length === 0 ? (
            <div className="text-gray-500 text-sm">No one is waiting.</div>
          ) : (
            <div className="space-y-sm">
              {waitlistView.list.map((entry, idx) => (
                <div key={idx} className="flex justify-between items-center border rounded-lg p-sm bg-gray-50">
                  <div className="flex items-center gap-sm">
                    <Users size={16} className="text-gray-500" />
                    <div>
                      <div className="font-medium">{entry.customer?.firstName} {entry.customer?.lastName}</div>
                      <div className="text-xs text-gray-500">Joined: {formatDateTime(entry.addedAt)}</div>
                    </div>
                  </div>
                  <Badge variant="warning">Waiting</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </Layout>
  );
};

export default TrainerSchedule;
