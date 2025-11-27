import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { notificationsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const { error: showError, success } = useNotification();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getNotifications({ limit: 20 });
      setNotifications(response.data || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      showError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(notifications.map(n =>
        n._id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
      showError('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      showError('Failed to mark all notifications as read');
    }
  };

  const handleDelete = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await notificationsAPI.delete(notificationId);
      const notification = notifications.find(n => n._id === notificationId);
      setNotifications(notifications.filter(n => n._id !== notificationId));
      if (!notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      success('Notification deleted');
    } catch (err) {
      console.error('Failed to delete notification:', err);
      showError('Failed to delete notification');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete all read notifications?')) {
      return;
    }

    try {
      await notificationsAPI.deleteAllRead();
      setNotifications(notifications.filter(n => !n.read));
      success('Read notifications cleared');
    } catch (err) {
      console.error('Failed to clear notifications:', err);
      showError('Failed to clear notifications');
    }
  };

  const getNotificationIcon = (type) => {
    const iconClass = `notification-icon notification-icon-${type}`;
    return (
      <div className={iconClass}>
        <Bell size={16} />
      </div>
    );
  };

  const getTimeAgo = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <button
        className="topbar-icon-btn notification-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown-menu">
          {/* Header */}
          <div className="notification-dropdown-header">
            <div>
              <h3 className="notification-dropdown-title">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs text-gray-600">{unreadCount} unread</span>
              )}
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="notification-action-btn"
                  title="Mark all as read"
                >
                  <CheckCheck size={16} />
                </button>
              )}
              {notifications.some(n => n.read) && (
                <button
                  onClick={handleClearAll}
                  className="notification-action-btn"
                  title="Clear read notifications"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="notification-action-btn"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="notification-dropdown-list">
            {loading ? (
              <div className="notification-empty">
                <div className="spinner"></div>
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={48} className="text-gray-300" />
                <p>No notifications yet</p>
                <span className="text-xs text-gray-500">You're all caught up!</span>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${!notification.read ? 'notification-item-unread' : ''}`}
                  onClick={() => {
                    if (!notification.read) {
                      handleMarkAsRead(notification._id, { stopPropagation: () => {} });
                    }
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl;
                    }
                  }}
                >
                  {getNotificationIcon(notification.type)}

                  <div className="notification-content">
                    <div className="notification-header-row">
                      <h4 className="notification-title">{notification.title}</h4>
                      {!notification.read && (
                        <div className="notification-unread-dot" />
                      )}
                    </div>

                    <p className="notification-message">{notification.message}</p>

                    <div className="notification-footer">
                      <span className="notification-time">{getTimeAgo(notification.createdAt)}</span>
                      {notification.category && (
                        <span className="notification-category">{notification.category}</span>
                      )}
                    </div>

                    {notification.actionUrl && (
                      <div className="notification-action">
                        <ExternalLink size={12} />
                        <span>{notification.actionLabel || 'View details'}</span>
                      </div>
                    )}
                  </div>

                  <div className="notification-actions">
                    {!notification.read && (
                      <button
                        onClick={(e) => handleMarkAsRead(notification._id, e)}
                        className="notification-action-btn"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(notification._id, e)}
                      className="notification-action-btn notification-delete-btn"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notification-dropdown-footer">
              <button
                className="notification-view-all-btn"
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to notifications page if you have one
                  // window.location.href = '/notifications';
                }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
