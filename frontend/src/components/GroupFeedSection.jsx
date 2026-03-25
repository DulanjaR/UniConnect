import React, { useEffect, useState } from 'react';
import { groupsAPI } from '../services/api';
import GroupMessageCard from './GroupMessageCard';
import GroupMessageComposer from './GroupMessageComposer';
import { GROUP_MESSAGE_MAX_LENGTH } from '../utils/groupValidation';

export default function GroupFeedSection({ group, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canInteract = Boolean(group?.isMember);
  const canModerate = currentUser?.role === 'admin' || group?.currentUserRole === 'group_admin';

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await groupsAPI.getMessages(group._id, { limit: 20 });
      setMessages(response.data.messages || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load group messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!group?._id) {
      return;
    }

    loadMessages();
  }, [group?._id, currentUser?.id]);

  const handleCreateMessage = async (content) => {
    await groupsAPI.createMessage(group._id, { content });
    await loadMessages();
  };

  return (
    <section className="space-y-5">
      <div className="card space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="section-title text-2xl">Group Feed</h2>
            <p className="text-sm text-gray-600">
              Members can post updates, like messages, and reply in threads inside this group.
            </p>
          </div>
          <div className="text-sm text-gray-500">{group.messageCount || 0} messages</div>
        </div>

        {canInteract ? (
          <GroupMessageComposer
            onSubmit={handleCreateMessage}
            submitLabel="Post to Group"
            fieldLabel="Message"
            maxLength={GROUP_MESSAGE_MAX_LENGTH}
          />
        ) : (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            {currentUser?.role === 'admin'
              ? 'System admins can moderate this feed, but only group members can post, like, or reply.'
              : 'Join this group to post messages, like other posts, and reply in the thread.'}
          </div>
        )}
      </div>

      {error && <div className="rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-red-700">{error}</div>}

      {loading ? (
        <div className="card text-gray-500">Loading group messages...</div>
      ) : messages.length === 0 ? (
        <div className="card text-gray-500">No messages yet. Start the group conversation.</div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <GroupMessageCard
              key={message._id}
              groupId={group._id}
              message={message}
              currentUser={currentUser}
              canInteract={canInteract}
              canModerate={canModerate}
              onRefresh={loadMessages}
            />
          ))}
        </div>
      )}
    </section>
  );
}
