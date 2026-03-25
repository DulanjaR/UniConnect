import React, { useEffect, useState } from 'react';
import { notificationsAPI } from '../services/api';
import NotificationDropdown from './NotificationDropdown';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    const response = await notificationsAPI.getAll();
    setNotifications(response.data.notifications);
    setUnreadCount(response.data.unreadCount);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleToggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      await fetchNotifications();
    }
  };

  const handleItemClick = async (notification) => {
    if (!notification.isRead) {
      await notificationsAPI.markRead(notification._id);
      await fetchNotifications();
    }
    setOpen(false);
  };

  const handleMarkAllRead = async () => {
    await notificationsAPI.markAllRead();
    await fetchNotifications();
  };

  return (
    <div className="relative">
      <button type="button" onClick={handleToggle} className="relative hover:text-accent-beige transition">
        Notifications
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-3 min-w-5 h-5 rounded-full bg-accent-beige text-primary-teal text-xs font-bold flex items-center justify-center px-1">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <NotificationDropdown
          notifications={notifications}
          onItemClick={handleItemClick}
          onMarkAllRead={handleMarkAllRead}
        />
      )}
    </div>
  );
}
