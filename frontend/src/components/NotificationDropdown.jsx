import React from 'react';
import { Link } from 'react-router-dom';

export default function NotificationDropdown({ notifications, onItemClick, onMarkAllRead }) {
  const getNotificationLink = (notification) => {
    if (notification.group?._id) {
      return `/groups/${notification.group._id}`;
    }

    if (notification.post?._id) {
      return `/post/${notification.post._id}`;
    }

    return '/';
  };

  return (
    <div className="absolute right-0 mt-3 w-96 card p-0 overflow-hidden z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-primary-teal">Notifications</h3>
        <button type="button" onClick={onMarkAllRead} className="text-sm text-primary-teal hover:underline">
          Mark all read
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">No notifications yet.</div>
        ) : (
          notifications.map((notification) => (
            <Link
              key={notification._id}
              to={getNotificationLink(notification)}
              onClick={() => onItemClick(notification)}
              className={`block px-4 py-3 border-b border-gray-100 hover:bg-light-beige ${notification.isRead ? '' : 'bg-accent-beige/40'}`}
            >
              <div className="text-sm text-gray-800">{notification.message}</div>
              <div className="text-xs text-gray-500 mt-1">
                {notification.sender?.name || 'Someone'} • {new Date(notification.createdAt).toLocaleString()}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
