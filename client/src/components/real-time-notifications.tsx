// Real-time notifications component
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/use-websocket';
import { Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: string;
  read: boolean;
}

export function RealTimeNotifications({ userId }: { userId?: string }) {
  const { isConnected, lastMessage, authenticate } = useWebSocket({
    onMessage: (message) => {
      if (message.type === 'notification') {
        addNotification(message.data);
      } else if (message.type === 'expense_update') {
        handleExpenseUpdate(message.data);
      }
    },
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { toast } = useToast();

  // Add new notification
  const addNotification = (notification: any) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      ...notification,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep only last 50

    // Show toast notification
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'error' ? 'destructive' : 'default',
    });
  };

  // Handle expense updates
  const handleExpenseUpdate = (data: any) => {
    const { action, expense } = data;
    let title = '';
    let message = '';
    let type: 'success' | 'info' | 'warning' = 'info';

    switch (action) {
      case 'created':
        title = 'Expense Added';
        message = `New expense of ₦${expense.amount} for ${expense.merchant}`;
        type = 'success';
        break;
      case 'updated':
        title = 'Expense Updated';
        message = `Expense for ${expense.merchant} has been updated`;
        type = 'info';
        break;
      case 'deleted':
        title = 'Expense Deleted';
        message = `Expense for ${expense.merchant} has been removed`;
        type = 'warning';
        break;
    }

    addNotification({ title, message, type });
  };

  // Authenticate when userId is available
  useEffect(() => {
    if (userId && isConnected) {
      authenticate(userId);
    }
  }, [userId, isConnected, authenticate]);

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        disabled={!isConnected}
      >
        <Bell className={`h-5 w-5 ${isConnected ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {!isConnected && (
          <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-gray-400 rounded-full"></span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
            <div className="flex items-center space-x-2">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Mark all read
                  </button>
                  <button
                    onClick={clearAll}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Clear all
                  </button>
                </>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {notification.title}
                          </p>
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          >
                            <X className="h-3 w-3 text-gray-400" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {formatTime(notification.timestamp)}
                          </span>
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Connection: {isConnected ? 'Connected' : 'Disconnected'}</span>
              <span>{notifications.length} total</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RealTimeNotifications;
