import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Sparkles,
  Package,
  Baby,
  Megaphone,
  Ticket,
  Package2,
  DollarSign,
  Monitor,
  TrendingUp,
  MessageSquare,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  UserPlus,
  FileText,
  Dumbbell as Equipment,
  Truck,
  BarChart3,
  Beaker,
  Shield,
  Droplet,
  ArrowRightLeft,
  Bell,
  TestTube,
  Calendar,
  Flower2,
  UserCheck,
  Gift,
  Activity,
  CreditCard,
  Wallet,
  PieChart
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.png';
import './Sidebar.css';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout, isSuperAdmin, hasBusinessUnit } = useAuth();

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/',
      show: true
    },
    {
      icon: Users,
      label: 'Customers',
      path: '/customers',
      show: true
    },
    {
      icon: UserCog,
      label: 'Employees',
      path: '/employees',
      show: isSuperAdmin
    },
    {
      divider: true,
      label: 'Business Units',
      show: true
    },
    {
      icon: Dumbbell,
      label: 'The Ring (Gym)',
      path: '/gym',
      show: isSuperAdmin || hasBusinessUnit('gym'),
      color: 'var(--gym-color)'
    },
    {
      icon: UserPlus,
      label: 'Guest Passes',
      path: '/guest-passes',
      show: isSuperAdmin || hasBusinessUnit('gym'),
      color: 'var(--gym-color)'
    },
    {
      icon: Calendar,
      label: 'Classes',
      path: '/gym/classes',
      show: isSuperAdmin || hasBusinessUnit('gym'),
      color: 'var(--gym-color)'
    },
    {
      icon: UserCheck,
      label: 'PT Trainers',
      path: '/pt/trainers',
      show: isSuperAdmin || hasBusinessUnit('gym'),
      color: 'var(--gym-color)'
    },
    {
      icon: Calendar,
      label: 'PT Sessions',
      path: '/pt/sessions',
      show: isSuperAdmin || hasBusinessUnit('gym'),
      color: 'var(--gym-color)'
    },
    {
      icon: Calendar,
      label: 'Trainer Schedule',
      path: '/schedule',
      show: isSuperAdmin || hasBusinessUnit('gym') || hasBusinessUnit('spa'),
      color: 'var(--primary-color)'
    },
    {
      icon: BarChart3,
      label: 'PT Analytics',
      path: '/pt/analytics',
      show: isSuperAdmin || hasBusinessUnit('gym'),
      color: 'var(--gym-color)'
    },
    {
      icon: Sparkles,
      label: 'The Olive Room',
      path: '/spa',
      show: isSuperAdmin || hasBusinessUnit('spa'),
      color: 'var(--spa-color)'
    },
    {
      icon: Flower2,
      label: 'Treatments',
      path: '/treatment-management',
      show: isSuperAdmin || hasBusinessUnit('spa'),
      color: 'var(--spa-color)'
    },
    {
      icon: Calendar,
      label: 'Therapist Schedules',
      path: '/therapist-schedules',
      show: isSuperAdmin || hasBusinessUnit('spa'),
      color: 'var(--spa-color)'
    },
    {
      icon: Activity,
      label: 'Progress Tracking',
      path: '/progress-tracking',
      show: true,
      color: 'var(--primary-color)'
    },
    {
      icon: Package,
      label: 'The Edit Collection',
      path: '/manufacturing',
      show: isSuperAdmin || hasBusinessUnit('manufacturing'),
      color: 'var(--manufacturing-color)'
    },
    {
      icon: Baby,
      label: 'Childcare',
      path: '/childcare',
      show: isSuperAdmin || hasBusinessUnit('childcare'),
      color: 'var(--childcare-color)'
    },
    {
      icon: Megaphone,
      label: 'Marketing',
      path: '/marketing',
      show: isSuperAdmin || hasBusinessUnit('marketing'),
      color: 'var(--marketing-color)'
    },
    {
      divider: true,
      label: 'Operations',
      show: true
    },
    {
      icon: Ticket,
      label: 'Vouchers',
      path: '/vouchers',
      show: true
    },
    {
      icon: Gift,
      label: 'Referrals',
      path: '/referrals',
      show: true
    },
    {
      icon: TrendingUp,
      label: 'Referral Analytics',
      path: '/referrals/analytics',
      show: isSuperAdmin
    },
    {
      icon: Gift,
      label: 'Incentive Programs',
      path: '/referrals/incentives',
      show: isSuperAdmin
    },
    {
      icon: TestTube,
      label: 'Manual Vouchers',
      path: '/manual-voucher-generation',
      show: isSuperAdmin
    },
    {
      icon: Package2,
      label: 'Inventory',
      path: '/inventory',
      show: true
    },
    {
      icon: Truck,
      label: 'Suppliers',
      path: '/suppliers',
      show: isSuperAdmin
    },
    {
      icon: ArrowRightLeft,
      label: 'Inter-BU Sales',
      path: '/inter-business-sales',
      show: isSuperAdmin
    },
    {
      icon: Equipment,
      label: 'Equipment Rental',
      path: '/equipment-rental',
      show: isSuperAdmin || hasBusinessUnit('gym')
    },
    {
      icon: Droplet,
      label: 'Tester Products',
      path: '/tester-products',
      show: isSuperAdmin || hasBusinessUnit('spa')
    },
    {
      icon: Beaker,
      label: 'Recipe Builder',
      path: '/recipes',
      show: isSuperAdmin || hasBusinessUnit('manufacturing')
    },
    {
      icon: FileText,
      label: 'Indemnity Forms',
      path: '/indemnity-forms',
      show: isSuperAdmin
    },
    {
      divider: true,
      label: 'Payments & Revenue',
      show: true
    },
    {
      icon: CreditCard,
      label: 'Payments',
      path: '/payments',
      show: true,
      color: 'var(--success-color)'
    },
    {
      icon: PieChart,
      label: 'Revenue Dashboard',
      path: '/revenue',
      show: isSuperAdmin,
      color: 'var(--success-color)'
    },
    {
      icon: Wallet,
      label: 'Customer Accounts',
      path: '/customer-accounts',
      show: true,
      color: 'var(--success-color)'
    },
    {
      icon: DollarSign,
      label: 'Accounting',
      path: '/accounting',
      show: isSuperAdmin
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      path: '/analytics',
      show: isSuperAdmin
    },
    {
      icon: Shield,
      label: 'Audit Logs',
      path: '/audit-logs',
      show: isSuperAdmin
    },
    {
      divider: true,
      label: 'Admin Tools',
      show: isSuperAdmin
    },
    {
      icon: Bell,
      label: 'Notification Testing',
      path: '/notification-testing',
      show: isSuperAdmin
    },
    {
      icon: MessageSquare,
      label: 'SMS Monitoring',
      path: '/sms-monitoring',
      show: isSuperAdmin
    },
    {
      icon: Monitor,
      label: 'Kiosk System',
      path: '/kiosk',
      show: isSuperAdmin
    },
    {
      icon: TrendingUp,
      label: 'Leaderboard',
      path: '/leaderboard',
      show: true
    },
    {
      icon: MessageSquare,
      label: 'Chat',
      path: '/chat',
      show: true
    },
    {
      divider: true,
      label: 'Settings',
      show: true
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/settings',
      show: true
    }
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-header">
        <img src={logo} alt="Women's Den" className="sidebar-logo" />
        {!collapsed && (
          <div className="sidebar-brand">
            <h2>Women's Den</h2>
            <p>Admin Dashboard</p>
          </div>
        )}
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
        {!collapsed && (
          <div className="user-info">
            <p className="user-name">{user?.firstName} {user?.lastName}</p>
            <p className="user-role">{user?.role?.replace('_', ' ')}</p>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item, index) => {
          if (!item.show) return null;

          if (item.divider) {
            return (
              <div key={`divider-${index}`} className="sidebar-divider">
                {!collapsed && <span>{item.label}</span>}
              </div>
            );
          }

          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive(item.path) ? 'sidebar-item-active' : ''}`}
              title={collapsed ? item.label : ''}
              onClick={(e) => {
                // Prevent scroll to top by using preventScrollReset
                e.currentTarget.blur();
              }}
            >
              <Icon size={20} style={item.color ? { color: item.color } : {}} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-item sidebar-logout" onClick={logout}>
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
