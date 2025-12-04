import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Employees from './pages/Employees';
import Gym from './pages/Gym';
import GuestPasses from './pages/GuestPasses';
import Spa from './pages/Spa';
import Manufacturing from './pages/Manufacturing';
import Childcare from './pages/Childcare';
import Marketing from './pages/Marketing';
import Vouchers from './pages/Vouchers';
import IndemnityForms from './pages/IndemnityForms';
import Accounting from './pages/Accounting';
import Kiosk from './pages/Kiosk';
import Leaderboard from './pages/Leaderboard';
import Inventory from './pages/Inventory';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import EquipmentRental from './pages/EquipmentRental';
import Suppliers from './pages/Suppliers';
import Analytics from './pages/Analytics';
import RecipeBuilder from './pages/RecipeBuilder';
import AuditLogs from './pages/AuditLogs';
import TesterProducts from './pages/TesterProducts';
import InterBusinessSales from './pages/InterBusinessSales';
import ManualVoucherGeneration from './pages/ManualVoucherGeneration';
import NotificationTesting from './pages/NotificationTesting';
import SMSMonitoring from './pages/SMSMonitoring';
import TherapistSchedules from './pages/TherapistSchedules';
import TreatmentManagement from './pages/TreatmentManagement';
import PTTrainers from './pages/PTTrainers';
import PTSessions from './pages/PTSessions';
import PTAnalytics from './pages/PTAnalytics';
import TrainerSchedule from './pages/TrainerSchedule';
import Adverts from './pages/Adverts';
import GymClasses from './pages/GymClasses';
import Referrals from './pages/Referrals';
import ReferralAnalytics from './pages/ReferralAnalytics';
import IncentivePrograms from './pages/IncentivePrograms';
import ProgressTracking from './pages/ProgressTracking';
import Payments from './pages/Payments';
import RevenueDashboard from './pages/RevenueDashboard';
import CustomerAccounts from './pages/CustomerAccounts';
import './styles/index.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <Customers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <Employees />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gym"
        element={
          <ProtectedRoute>
            <Gym />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gym/classes"
        element={
          <ProtectedRoute>
            <GymClasses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guest-passes"
        element={
          <ProtectedRoute>
            <GuestPasses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/spa"
        element={
          <ProtectedRoute>
            <Spa />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manufacturing"
        element={
          <ProtectedRoute>
            <Manufacturing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/childcare"
        element={
          <ProtectedRoute>
            <Childcare />
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketing"
        element={
          <ProtectedRoute>
            <Marketing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vouchers"
        element={
          <ProtectedRoute>
            <Vouchers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/indemnity-forms"
        element={
          <ProtectedRoute>
            <IndemnityForms />
          </ProtectedRoute>
        }
      />
      <Route
        path="/accounting"
        element={
          <ProtectedRoute>
            <Accounting />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kiosk"
        element={
          <ProtectedRoute>
            <Kiosk />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <Inventory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/equipment-rental"
        element={
          <ProtectedRoute>
            <EquipmentRental />
          </ProtectedRoute>
        }
      />
      <Route
        path="/suppliers"
        element={
          <ProtectedRoute>
            <Suppliers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recipes"
        element={
          <ProtectedRoute>
            <RecipeBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute>
            <AuditLogs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tester-products"
        element={
          <ProtectedRoute>
            <TesterProducts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inter-business-sales"
        element={
          <ProtectedRoute>
            <InterBusinessSales />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manual-voucher-generation"
        element={
          <ProtectedRoute>
            <ManualVoucherGeneration />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notification-testing"
        element={
          <ProtectedRoute>
            <NotificationTesting />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sms-monitoring"
        element={
          <ProtectedRoute>
            <SMSMonitoring />
          </ProtectedRoute>
        }
      />
      <Route
        path="/therapist-schedules"
        element={
          <ProtectedRoute>
            <TherapistSchedules />
          </ProtectedRoute>
        }
      />
      <Route
        path="/treatment-management"
        element={
          <ProtectedRoute>
            <TreatmentManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pt/trainers"
        element={
          <ProtectedRoute>
            <PTTrainers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pt/sessions"
        element={
          <ProtectedRoute>
            <PTSessions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pt/analytics"
        element={
          <ProtectedRoute>
            <PTAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/schedule"
        element={
          <ProtectedRoute>
            <TrainerSchedule />
          </ProtectedRoute>
        }
      />
      <Route
        path="/referrals"
        element={
          <ProtectedRoute>
            <Referrals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/referrals/analytics"
        element={
          <ProtectedRoute>
            <ReferralAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/referrals/incentives"
        element={
          <ProtectedRoute>
            <IncentivePrograms />
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress-tracking"
        element={
          <ProtectedRoute>
            <ProgressTracking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/adverts"
        element={
          <ProtectedRoute>
            <Adverts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <Payments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/revenue"
        element={
          <ProtectedRoute>
            <RevenueDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer-accounts"
        element={
          <ProtectedRoute>
            <CustomerAccounts />
          </ProtectedRoute>
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <WebSocketProvider>
            <AppRoutes />
          </WebSocketProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
