// ============================================================
// ListingDesk Pro — Notification Center Component
// View notifications, manage preferences, request permissions
// ============================================================

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../../components/ui';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationPreferences,
  updateEmailPreference,
  updatePushPreference,
  requestPushPermission,
  getPushPermissionStatus,
  type Notification,
  type NotificationType
} from '../../services/notifications';

export function NotificationCenter() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences'>('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState(getNotificationPreferences());
  const [pushPermission, setPushPermission] = useState(getPushPermissionStatus());

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = () => {
    setNotifications(getNotifications({ limit: 50 }));
    setUnreadCount(getUnreadCount());
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    loadNotifications();
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
    loadNotifications();
  };

  const handleRequestPushPermission = async () => {
    const granted = await requestPushPermission();
    setPushPermission(granted ? 'granted' : 'denied');
  };

  const handleToggleEmailPref = (type: NotificationType) => {
    updateEmailPreference(type, !preferences.email[type]);
    setPreferences(getNotificationPreferences());
  };

  const handleTogglePushPref = (type: NotificationType) => {
    updatePushPreference(type, !preferences.push[type]);
    setPreferences(getNotificationPreferences());
  };

  const getNotificationIcon = (type: NotificationType): string => {
    switch (type) {
      case 'listing_published': return '✅';
      case 'listing_failed': return '❌';
      case 'order_received': return '📦';
      case 'order_shipped': return '🚚';
      case 'inventory_low': return '⚠️';
      case 'price_change': return '💰';
      case 'system_alert': return '🔔';
      default: return '📬';
    }
  };

  const getNotificationColor = (type: NotificationType): string => {
    switch (type) {
      case 'listing_published': return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'listing_failed': return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'order_received': return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      case 'order_shipped': return 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800';
      case 'inventory_low': return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'price_change': return 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800';
      case 'system_alert': return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
      default: return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  const notificationTypes: NotificationType[] = [
    'listing_published',
    'listing_failed',
    'order_received',
    'order_shipped',
    'inventory_low',
    'price_change',
    'system_alert',
  ];

  const formatNotificationType = (type: NotificationType): string => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Notification Center
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'notifications'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Notifications {unreadCount > 0 && (
            <Badge variant="danger" className="ml-2">{unreadCount}</Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'preferences'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Preferences
        </button>
      </div>

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="mb-4"
            >
              Mark All as Read
            </Button>
          )}

          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border ${getNotificationColor(notification.type)} ${
                    !notification.read ? 'ring-2 ring-indigo-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={notification.read ? 'default' : 'info'}>
                              {notification.read ? 'Read' : 'Unread'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(notification.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              Mark Read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(notification.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          {/* Push Notifications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Push Notifications
              </h4>
              {pushPermission !== 'granted' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRequestPushPermission}
                >
                  Enable Push
                </Button>
              )}
            </div>
            {pushPermission === 'granted' ? (
              <Badge variant="success">Enabled</Badge>
            ) : pushPermission === 'denied' ? (
              <Badge variant="danger">Blocked</Badge>
            ) : (
              <Badge variant="default">Not Enabled</Badge>
            )}
            <div className="space-y-2 mt-3">
              {notificationTypes.map((type) => (
                <div key={type} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {getNotificationIcon(type)} {formatNotificationType(type)}
                  </span>
                  <button
                    onClick={() => handleTogglePushPref(type)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.push[type] ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.push[type] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Email Notifications */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Email Notifications
            </h4>
            <div className="space-y-2">
              {notificationTypes.map((type) => (
                <div key={type} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {getNotificationIcon(type)} {formatNotificationType(type)}
                  </span>
                  <button
                    onClick={() => handleToggleEmailPref(type)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.email[type] ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.email[type] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
