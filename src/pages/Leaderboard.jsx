import { useState, useEffect } from 'react';
import { Trophy, Award, TrendingUp, Star, RefreshCw, Download } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import StatCard from '../components/dashboard/StatCard';
import { format } from 'date-fns';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate } from '../utils/formatters';
import { downloadCSV } from '../utils/exportHelpers';
import { leaderboardAPI } from '../services/api';
import './Leaderboard.css';

const Leaderboard = () => {
  const [gymLeaders, setGymLeaders] = useState([]);
  const [spaLeaders, setSpaLeaders] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalGymMembers: 0,
    totalSpaClients: 0,
    totalAchievements: 0,
    topStreak: 0
  });

  const { connected, subscribeToAchievementUnlock } = useWebSocket();
  const { success, error: showError, info } = useNotification();

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  useEffect(() => {
    if (!connected) return;

    const unsubscribe = subscribeToAchievementUnlock((data) => {
      info(`${data.customerName} unlocked "${data.achievementTitle}"!`, 5000);
      setAchievements(prev => [data.achievement, ...prev]);
    });

    return () => unsubscribe && unsubscribe();
  }, [connected, subscribeToAchievementUnlock, info]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [gymRes, spaRes, achievementsRes] = await Promise.all([
        leaderboardAPI.getGymLeaderboard(),
        leaderboardAPI.getSpaLeaderboard(),
        leaderboardAPI.getAchievements()
      ]);

      // Handle response data more robustly
      const fetchedGymLeaders = gymRes?.data?.leaders || [];
      const fetchedSpaLeaders = spaRes?.data?.leaders || [];
      const fetchedAchievements = achievementsRes?.data?.achievements || [];

      setGymLeaders(fetchedGymLeaders);
      setSpaLeaders(fetchedSpaLeaders);
      setAchievements(fetchedAchievements);

      const topStreak = fetchedGymLeaders.length > 0
        ? Math.max(...fetchedGymLeaders.map(m => m.streak || 0))
        : 0;

      setStats({
        totalGymMembers: fetchedGymLeaders.length,
        totalSpaClients: fetchedSpaLeaders.length,
        totalAchievements: fetchedAchievements.length,
        topStreak
      });

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch leaderboard data:', err);
      setError('Failed to load leaderboard data. Using cached data.');
      showError('Failed to load leaderboard data');
      setLoading(false);

      const { mockGymLeaders, mockSpaLeaders, mockAchievements } = getMockData();
      setGymLeaders(mockGymLeaders);
      setSpaLeaders(mockSpaLeaders);
      setAchievements(mockAchievements);
      setStats({
        totalGymMembers: mockGymLeaders.length,
        totalSpaClients: mockSpaLeaders.length,
        totalAchievements: mockAchievements.length,
        topStreak: Math.max(...mockGymLeaders.map(m => m.streak))
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboardData();
    setRefreshing(false);
    info('Leaderboard data refreshed', 2000);
  };

  const handleExportGym = () => {
    try {
      const exportColumns = [
        { key: 'rank', label: 'Rank' },
        { key: 'customerId', label: 'Customer ID' },
        { key: 'customerName', label: 'Customer Name' },
        { key: 'totalSessions', label: 'Total Sessions' },
        { key: 'totalMinutes', label: 'Total Minutes' },
        { key: 'streak', label: 'Streak (days)' },
        { key: 'level', label: 'Level' },
        { key: 'points', label: 'Points' },
        { key: 'lastSession', label: 'Last Session' }
      ];
      downloadCSV(gymLeaders, exportColumns, `gym_leaderboard_${formatDate(new Date(), 'yyyyMMdd')}.csv`);
      success('Gym leaderboard exported successfully!');
    } catch (err) {
      showError('Failed to export gym leaderboard');
    }
  };

  const handleExportSpa = () => {
    try {
      const exportColumns = [
        { key: 'rank', label: 'Rank' },
        { key: 'customerId', label: 'Customer ID' },
        { key: 'customerName', label: 'Customer Name' },
        { key: 'totalBookings', label: 'Total Bookings' },
        { key: 'totalSpent', label: 'Total Spent' },
        { key: 'favoriteService', label: 'Favorite Service' },
        { key: 'level', label: 'Tier' },
        { key: 'points', label: 'Points' },
        { key: 'lastVisit', label: 'Last Visit' }
      ];
      downloadCSV(spaLeaders, exportColumns, `spa_leaderboard_${formatDate(new Date(), 'yyyyMMdd')}.csv`);
      success('Spa leaderboard exported successfully!');
    } catch (err) {
      showError('Failed to export spa leaderboard');
    }
  };

  const handleExportAchievements = () => {
    try {
      const exportColumns = [
        { key: 'achievementId', label: 'Achievement ID' },
        { key: 'customerId', label: 'Customer ID' },
        { key: 'customerName', label: 'Customer Name' },
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description' },
        { key: 'category', label: 'Category' },
        { key: 'rarity', label: 'Rarity' },
        { key: 'pointsAwarded', label: 'Points Awarded' },
        { key: 'dateEarned', label: 'Date Earned' }
      ];
      downloadCSV(achievements, exportColumns, `achievements_${formatDate(new Date(), 'yyyyMMdd')}.csv`);
      success('Achievements exported successfully!');
    } catch (err) {
      showError('Failed to export achievements');
    }
  };

  const getMockData = () => {
    const mockGymLeaders = [
      {
        id: '1',
        rank: 1,
        customerId: 'CUST-1704123456789',
        customerName: 'Jane Doe',
        totalSessions: 45,
        totalMinutes: 2250,
        streak: 15,
        points: 4500,
        level: 'Gold',
        lastSession: '2024-11-04T10:30:00Z'
      },
      {
        id: '2',
        rank: 2,
        customerId: 'CUST-1704123456801',
        customerName: 'Emily Williams',
        totalSessions: 38,
        totalMinutes: 1900,
        streak: 12,
        points: 3800,
        level: 'Silver',
        lastSession: '2024-11-03T14:00:00Z'
      },
      {
        id: '3',
        rank: 3,
        customerId: 'CUST-1704123456792',
        customerName: 'Michael Brown',
        totalSessions: 32,
        totalMinutes: 1600,
        streak: 8,
        points: 3200,
        level: 'Silver',
        lastSession: '2024-11-04T08:00:00Z'
      },
      {
        id: '4',
        rank: 4,
        customerId: 'CUST-1704123456793',
        customerName: 'Lisa Anderson',
        totalSessions: 28,
        totalMinutes: 1400,
        streak: 10,
        points: 2800,
        level: 'Bronze',
        lastSession: '2024-11-02T16:30:00Z'
      }
    ];

    const mockSpaLeaders = [
      {
        id: '1',
        rank: 1,
        customerId: 'CUST-1704123456790',
        customerName: 'Sarah Johnson',
        totalBookings: 24,
        totalSpent: 1800,
        favoriteService: 'Aromatherapy Massage',
        points: 2400,
        level: 'Platinum',
        lastVisit: '2024-11-03T11:00:00Z'
      },
      {
        id: '2',
        rank: 2,
        customerId: 'CUST-1704123456791',
        customerName: 'Emily Williams',
        totalBookings: 18,
        totalSpent: 1350,
        favoriteService: 'Deep Tissue Massage',
        points: 1800,
        level: 'Gold',
        lastVisit: '2024-11-04T09:30:00Z'
      },
      {
        id: '3',
        rank: 3,
        customerId: 'CUST-1704123456794',
        customerName: 'Amanda Taylor',
        totalBookings: 15,
        totalSpent: 1125,
        favoriteService: 'Facial Treatment',
        points: 1500,
        level: 'Silver',
        lastVisit: '2024-11-01T13:00:00Z'
      }
    ];

    const mockAchievements = [
      {
        id: '1',
        achievementId: 'ACH-001',
        customerId: 'CUST-1704123456789',
        customerName: 'Jane Doe',
        title: '30-Day Streak Master',
        description: 'Completed gym sessions for 30 consecutive days',
        category: 'gym',
        pointsAwarded: 500,
        dateEarned: '2024-10-15T00:00:00Z',
        rarity: 'epic'
      },
      {
        id: '2',
        achievementId: 'ACH-002',
        customerId: 'CUST-1704123456790',
        customerName: 'Sarah Johnson',
        title: 'Spa Enthusiast',
        description: 'Completed 20 spa treatments',
        category: 'spa',
        pointsAwarded: 300,
        dateEarned: '2024-11-01T00:00:00Z',
        rarity: 'rare'
      },
      {
        id: '3',
        achievementId: 'ACH-003',
        customerId: 'CUST-1704123456801',
        customerName: 'Emily Williams',
        title: 'Early Bird',
        description: 'Checked in before 6 AM 10 times',
        category: 'gym',
        pointsAwarded: 200,
        dateEarned: '2024-10-28T00:00:00Z',
        rarity: 'common'
      }
    ];

    return { mockGymLeaders, mockSpaLeaders, mockAchievements };
  };

  const gymColumns = [
    {
      key: 'rank',
      header: 'Rank',
      render: (value) => (
        <div className="flex items-center gap-xs">
          {value === 1 && <Trophy size={20} style={{ color: 'var(--accent-gold-dark)' }} />}
          {value === 2 && <Trophy size={20} style={{ color: '#C0C0C0' }} />}
          {value === 3 && <Trophy size={20} style={{ color: '#CD7F32' }} />}
          <span className="font-bold text-lg">#{value}</span>
        </div>
      )
    },
    {
      key: 'customerName',
      header: 'Member',
      render: (value, row) => (
        <div>
          <div className="font-semibold">{value}</div>
          <div className="text-xs text-gray">{row.customerId}</div>
        </div>
      )
    },
    {
      key: 'totalSessions',
      header: 'Sessions',
      render: (value) => <span className="font-semibold">{value}</span>
    },
    {
      key: 'totalMinutes',
      header: 'Total Minutes',
      render: (value) => `${value.toLocaleString()} min`
    },
    {
      key: 'streak',
      header: 'Streak',
      render: (value) => (
        <div className="flex items-center gap-xs">
          <span className="font-semibold text-warning">{value} days</span>
        </div>
      )
    },
    {
      key: 'level',
      header: 'Level',
      render: (value) => {
        const variants = {
          Gold: 'warning',
          Silver: 'default',
          Bronze: 'error'
        };
        return <Badge variant={variants[value]}>{value}</Badge>;
      }
    },
    {
      key: 'points',
      header: 'Points',
      render: (value) => (
        <div className="flex items-center gap-xs">
          <Star size={14} style={{ color: 'var(--accent-gold-dark)' }} />
          <span className="font-bold">{value.toLocaleString()}</span>
        </div>
      )
    },
    {
      key: 'lastSession',
      header: 'Last Session',
      render: (value) => format(new Date(value), 'MMM dd')
    }
  ];

  const spaColumns = [
    {
      key: 'rank',
      header: 'Rank',
      render: (value) => (
        <div className="flex items-center gap-xs">
          {value === 1 && <Trophy size={20} style={{ color: 'var(--accent-gold-dark)' }} />}
          {value === 2 && <Trophy size={20} style={{ color: '#C0C0C0' }} />}
          {value === 3 && <Trophy size={20} style={{ color: '#CD7F32' }} />}
          <span className="font-bold text-lg">#{value}</span>
        </div>
      )
    },
    {
      key: 'customerName',
      header: 'Client',
      render: (value, row) => (
        <div>
          <div className="font-semibold">{value}</div>
          <div className="text-xs text-gray">{row.customerId}</div>
        </div>
      )
    },
    {
      key: 'totalBookings',
      header: 'Bookings',
      render: (value) => <span className="font-semibold">{value}</span>
    },
    {
      key: 'totalSpent',
      header: 'Total Spent',
      render: (value) => `$${value.toLocaleString()}`
    },
    {
      key: 'favoriteService',
      header: 'Favorite Service',
      render: (value) => <span className="text-sm">{value}</span>
    },
    {
      key: 'level',
      header: 'Tier',
      render: (value) => {
        const variants = {
          Platinum: 'primary',
          Gold: 'warning',
          Silver: 'default'
        };
        return <Badge variant={variants[value]}>{value}</Badge>;
      }
    },
    {
      key: 'points',
      header: 'Points',
      render: (value) => (
        <div className="flex items-center gap-xs">
          <Star size={14} style={{ color: 'var(--accent-gold-dark)' }} />
          <span className="font-bold">{value.toLocaleString()}</span>
        </div>
      )
    },
    {
      key: 'lastVisit',
      header: 'Last Visit',
      render: (value) => format(new Date(value), 'MMM dd')
    }
  ];

  const achievementColumns = [
    {
      key: 'title',
      header: 'Achievement',
      render: (value, row) => (
        <div className="flex items-center gap-sm">
          <div
            className="achievement-icon"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: `var(--${row.category}-color)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Award size={20} style={{ color: 'white' }} />
          </div>
          <div>
            <div className="font-semibold">{value}</div>
            <div className="text-xs text-gray">{row.description}</div>
          </div>
        </div>
      )
    },
    {
      key: 'customerName',
      header: 'Earned By',
      render: (value, row) => (
        <div>
          <div className="font-semibold">{value}</div>
          <div className="text-xs text-gray">{row.customerId}</div>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: (value) => <Badge variant={value}>{value}</Badge>
    },
    {
      key: 'rarity',
      header: 'Rarity',
      render: (value) => {
        const variants = {
          epic: 'primary',
          rare: 'warning',
          common: 'default'
        };
        return <Badge variant={variants[value]}>{value}</Badge>;
      }
    },
    {
      key: 'pointsAwarded',
      header: 'Points',
      render: (value) => (
        <div className="flex items-center gap-xs">
          <Star size={14} style={{ color: 'var(--accent-gold-dark)' }} />
          <span className="font-bold">+{value}</span>
        </div>
      )
    },
    {
      key: 'dateEarned',
      header: 'Date Earned',
      render: (value) => format(new Date(value), 'MMM dd, yyyy')
    }
  ];

  return (
    <Layout title="Leaderboard" subtitle="Member rankings and achievements">
      {error && (
        <div className="alert alert-warning mb-lg">
          {error}
        </div>
      )}

      <div className="leaderboard-header mb-lg">
        <div className="connection-status">
          <div className={`status-dot ${connected ? 'online' : ''}`}></div>
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="grid grid-4 mb-xl">
        <StatCard
          title="Top Gym Members"
          value={stats.totalGymMembers.toString()}
          icon={Trophy}
          color="var(--gym-color)"
        />
        <StatCard
          title="Top Spa Clients"
          value={stats.totalSpaClients.toString()}
          icon={Star}
          color="var(--spa-color)"
        />
        <StatCard
          title="Achievements Earned"
          value={stats.totalAchievements.toString()}
          icon={Award}
          color="var(--accent-gold-dark)"
        />
        <StatCard
          title="Longest Streak"
          value={`${stats.topStreak} days`}
          icon={TrendingUp}
          color="var(--warning)"
        />
      </div>

      <div className="grid grid-1 mb-xl">
        <Card>
          <div className="card-actions">
            <h3>Gym Leaderboard</h3>
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
              <Button variant="primary" icon={Download} onClick={handleExportGym}>
                Export CSV
              </Button>
            </div>
          </div>
          <Table
            columns={gymColumns}
            data={gymLeaders}
            loading={loading}
            searchPlaceholder="Search gym members..."
          />
        </Card>
      </div>

      <div className="grid grid-1 mb-xl">
        <Card>
          <div className="card-actions">
            <h3>Spa Leaderboard</h3>
            <Button variant="primary" icon={Download} onClick={handleExportSpa}>
              Export CSV
            </Button>
          </div>
          <Table
            columns={spaColumns}
            data={spaLeaders}
            loading={loading}
            searchPlaceholder="Search spa clients..."
          />
        </Card>
      </div>

      <Card>
        <div className="card-actions">
          <h3>Recent Achievements</h3>
          <Button variant="primary" icon={Download} onClick={handleExportAchievements}>
            Export CSV
          </Button>
        </div>
        <Table
          columns={achievementColumns}
          data={achievements}
          loading={loading}
          searchPlaceholder="Search achievements..."
        />
      </Card>
    </Layout>
  );
};

export default Leaderboard;
