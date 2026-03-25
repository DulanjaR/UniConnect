import React, { useState } from 'react';
import { groupsAPI } from '../services/api';
import GroupMessageComposer from './GroupMessageComposer';
import GroupReplyThread from './GroupReplyThread';
import { GROUP_MESSAGE_MAX_LENGTH } from '../utils/groupValidation';

export default function GroupMessageCard({
  groupId,
  message,
  currentUser,
  canInteract,
  canModerate,
  onRefresh
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  const isOwner = currentUser?.id === message.user?._id;
  const canManageMessage = isOwner || canModerate;

  const handleLike = async () => {
    try {
      await groupsAPI.likeMessage(groupId, message._id);
      setError('');
      await onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to like message');
    }
  };

  const handleUpdate = async (content) => {
    await groupsAPI.updateMessage(groupId, message._id, { content });
    setEditing(false);
    setError('');
    await onRefresh();
  };

  const handleDelete = async () => {
    try {
      await groupsAPI.deleteMessage(groupId, message._id);
      setError('');
      await onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete message');
    }
  };

  return (
    <article className="card space-y-4">
      {error && <div className="rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-red-700">{error}</div>}

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-primary-teal">{message.user?.name || 'Unknown user'}</span>
        <span className="text-xs text-gray-500">{new Date(message.createdAt).toLocaleString()}</span>
      </div>

      {editing ? (
        <GroupMessageComposer
          initialValue={message.content}
          submitLabel="Save Message"
          fieldLabel="Message"
          maxLength={GROUP_MESSAGE_MAX_LENGTH}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <p className="whitespace-pre-wrap text-gray-700">{message.content}</p>

          {message.attachments?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {message.attachments.map((attachment) => (
                <a
                  key={attachment}
                  className="text-sm font-semibold text-primary-teal hover:underline"
                  href={attachment}
                  target="_blank"
                  rel="noreferrer"
                >
                  Attachment
                </a>
              ))}
            </div>
          )}
        </>
      )}

      <div className="flex flex-wrap gap-4 text-sm">
        {canInteract ? (
          <button className="font-semibold text-primary-teal hover:underline" type="button" onClick={handleLike}>
            {message.likedByCurrentUser ? 'Unlike' : 'Like'} ({message.likeCount})
          </button>
        ) : (
          <span className="text-gray-500">Likes: {message.likeCount}</span>
        )}
        <button className="font-semibold text-primary-teal hover:underline" type="button" onClick={() => setShowReplies((value) => !value)}>
          {showReplies ? 'Hide Replies' : `Replies (${message.replyCount})`}
        </button>
        {canManageMessage && !editing && (
          <button className="font-semibold text-primary-teal hover:underline" type="button" onClick={() => setEditing(true)}>
            Edit
          </button>
        )}
        {canManageMessage && (
          <button className="font-semibold text-red-700 hover:underline" type="button" onClick={handleDelete}>
            Delete
          </button>
        )}
      </div>

      {showReplies && (
        <GroupReplyThread
          groupId={groupId}
          message={message}
          currentUser={currentUser}
          canInteract={canInteract}
          canModerate={canModerate}
          onRefresh={onRefresh}
        />
      )}
    </article>
  );
}
