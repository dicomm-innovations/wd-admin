import { useState } from 'react';
import { User, Lock, Bell, Shield, Palette, Database } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import './Settings.css';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Profile settings state
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    position: user?.position || ''
  });

  // Password settings state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    circuitQueue: true,
    lowInventory: true,
    employeeAlerts: true,
    settlementReports: true
  });

  // System settings state
  const [systemSettings, setSystemSettings] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'Africa/Harare',
    dateFormat: 'YYYY-MM-DD',
    currency: 'USD'
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'system', label: 'System', icon: Database }
  ];

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // TODO: Replace with actual API call
      // await employeeAPI.updateProfile(user.id, profileData);
      setTimeout(() => {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setLoading(false);
      }, 1000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      setLoading(false);
      return;
    }

    try {
      // TODO: Replace with actual API call
      // await employeeAPI.changePassword(user.id, passwordData);
      setTimeout(() => {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setLoading(false);
      }, 1000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to change password' });
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // TODO: Replace with actual API call
      setTimeout(() => {
        setMessage({ type: 'success', text: 'Notification settings updated!' });
        setLoading(false);
      }, 1000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update settings' });
      setLoading(false);
    }
  };

  const handleSystemUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // TODO: Replace with actual API call
      setTimeout(() => {
        setMessage({ type: 'success', text: 'System settings updated!' });
        setLoading(false);
      }, 1000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update settings' });
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="settings-page">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your account settings and preferences</p>
        </div>

        {message.text && (
          <div className={`settings-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="settings-container">
          <div className="settings-sidebar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMessage({ type: '', text: '' });
                  }}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="settings-content">
            {activeTab === 'profile' && (
              <Card title="Profile Information">
                <form onSubmit={handleProfileUpdate}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Position</label>
                      <input
                        type="text"
                        value={profileData.position}
                        onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Business Unit</label>
                      <input
                        type="text"
                        value={user?.businessUnit || ''}
                        disabled
                        className="disabled"
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <Button type="submit" loading={loading}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {activeTab === 'password' && (
              <Card title="Change Password">
                <form onSubmit={handlePasswordChange}>
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      minLength={8}
                    />
                    <small>Password must be at least 8 characters long</small>
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <Button type="submit" loading={loading}>
                      Change Password
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card title="Notification Preferences">
                <form onSubmit={handleNotificationUpdate}>
                  <div className="notification-section">
                    <h3>Notification Channels</h3>
                    <div className="toggle-group">
                      <label className="toggle-item">
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailNotifications}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                        />
                        <span>Email Notifications</span>
                      </label>
                      <label className="toggle-item">
                        <input
                          type="checkbox"
                          checked={notificationSettings.smsNotifications}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, smsNotifications: e.target.checked })}
                        />
                        <span>SMS Notifications</span>
                      </label>
                      <label className="toggle-item">
                        <input
                          type="checkbox"
                          checked={notificationSettings.pushNotifications}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, pushNotifications: e.target.checked })}
                        />
                        <span>Push Notifications</span>
                      </label>
                    </div>
                  </div>

                  <div className="notification-section">
                    <h3>Alert Types</h3>
                    <div className="toggle-group">
                      <label className="toggle-item">
                        <input
                          type="checkbox"
                          checked={notificationSettings.circuitQueue}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, circuitQueue: e.target.checked })}
                        />
                        <span>Circuit Queue Updates</span>
                      </label>
                      <label className="toggle-item">
                        <input
                          type="checkbox"
                          checked={notificationSettings.lowInventory}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, lowInventory: e.target.checked })}
                        />
                        <span>Low Inventory Alerts</span>
                      </label>
                      <label className="toggle-item">
                        <input
                          type="checkbox"
                          checked={notificationSettings.employeeAlerts}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, employeeAlerts: e.target.checked })}
                        />
                        <span>Employee Alerts</span>
                      </label>
                      <label className="toggle-item">
                        <input
                          type="checkbox"
                          checked={notificationSettings.settlementReports}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, settlementReports: e.target.checked })}
                        />
                        <span>Settlement Reports</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-actions">
                    <Button type="submit" loading={loading}>
                      Save Preferences
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card title="Security Settings">
                <div className="security-info">
                  <div className="info-item">
                    <h4>Two-Factor Authentication</h4>
                    <p>Add an extra layer of security to your account</p>
                    <Button variant="secondary">Enable 2FA</Button>
                  </div>
                  <div className="info-item">
                    <h4>Active Sessions</h4>
                    <p>Manage devices where you're currently logged in</p>
                    <Button variant="secondary">View Sessions</Button>
                  </div>
                  <div className="info-item">
                    <h4>Login History</h4>
                    <p>Review your recent login activity</p>
                    <Button variant="secondary">View History</Button>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'appearance' && (
              <Card title="Appearance Settings">
                <form onSubmit={handleSystemUpdate}>
                  <div className="form-group">
                    <label>Theme</label>
                    <select
                      value={systemSettings.theme}
                      onChange={(e) => setSystemSettings({ ...systemSettings, theme: e.target.value })}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                  <div className="form-actions">
                    <Button type="submit" loading={loading}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {activeTab === 'system' && (
              <Card title="System Settings">
                <form onSubmit={handleSystemUpdate}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Language</label>
                      <select
                        value={systemSettings.language}
                        onChange={(e) => setSystemSettings({ ...systemSettings, language: e.target.value })}
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Timezone</label>
                      <select
                        value={systemSettings.timezone}
                        onChange={(e) => setSystemSettings({ ...systemSettings, timezone: e.target.value })}
                      >
                        <option value="Africa/Harare">Africa/Harare</option>
                        <option value="Africa/Johannesburg">Africa/Johannesburg</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Date Format</label>
                      <select
                        value={systemSettings.dateFormat}
                        onChange={(e) => setSystemSettings({ ...systemSettings, dateFormat: e.target.value })}
                      >
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Currency</label>
                      <select
                        value={systemSettings.currency}
                        onChange={(e) => setSystemSettings({ ...systemSettings, currency: e.target.value })}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="ZWL">ZWL (Z$)</option>
                        <option value="ZAR">ZAR (R)</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-actions">
                    <Button type="submit" loading={loading}>
                      Save Settings
                    </Button>
                  </div>
                </form>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
