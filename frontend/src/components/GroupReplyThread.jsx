import React, { useState } from 'react';
import { groupsAPI } from '../services/api';
import GroupMessageComposer from './GroupMessageComposer';
import { GROUP_REPLY_MAX_LENGTH } from '../utils/groupValidation';

export default function GroupReplyThread({
  groupId,
  message,
  currentUser,
  canInteract,
  canModerate,
  onRefresh
}) {
  const [showComposer, setShowComposer] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [error, setError] = useState('');

  const handleCreateReply = async (content) => {
    await groupsAPI.createReply(groupId, message._id, { content });
    setShowComposer(false);
    setError('');
    await onRefresh();
  };

  const handleLikeReply = async (replyId) => {
    try {
      await groupsAPI.likeReply(groupId, message._id, replyId);
      setError('');
      await onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to like reply');
    }
  };

  const handleUpdateReply = async (replyId, content) => {
    await groupsAPI.updateReply(groupId, message._id, replyId, { content });
    setEditingReplyId(null);
    setError('');
    await onRefresh();
  };

  const handleDeleteReply = async (replyId) => {
    try {
      await groupsAPI.deleteReply(groupId, message._id, replyId);
      setError('');
      await onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete reply');
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-primary-teal">Replies</h4>
        {canInteract && (
          <button className="text-sm font-semibold text-primary-teal hover:underline" type="button" onClick={() => setShowComposer((value) => !value)}>
            {showComposer ? 'Hide Reply Box' : 'Reply'}
          </button>
        )}
      </div>

      {error && <div className="rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-red-700">{error}</div>}

      {showComposer && canInteract && (
        <GroupMessageComposer
          compact
          submitLabel="Post Reply"
          placeholder="Reply to this message..."
          fieldLabel="Reply"
          maxLength={GROUP_REPLY_MAX_LENGTH}
          onSubmit={handleCreateReply}
          onCancel={() => setShowComposer(false)}
        />
      )}

      {message.replies?.length ? (
        <div className="space-y-3">
          {message.replies.map((reply) => {
            const canManageReply = currentUser?.id === reply.user?._id || canModerate;

            return (
              <div key={reply._id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-primary-teal">{reply.user?.name || 'Unknown user'}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(reply.createdAt).toLocaleString()}
                  </span>
                </div>

                {editingReplyId === reply._id ? (
                  <GroupMessageComposer
                    compact
                    initialValue={reply.content}
                    submitLabel="Save Reply"
                    fieldLabel="Reply"
                    maxLength={GROUP_REPLY_MAX_LENGTH}
                    onSubmit={(content) => handleUpdateReply(reply._id, content)}
                    onCancel={() => setEditingReplyId(null)}
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-gray-700">{reply.content}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  {canInteract && (
                    <button
                      className="font-semibold text-primary-teal hover:underline"
                      type="button"
                      onClick={() => handleLikeReply(reply._id)}
                    >
                      {reply.likedByCurrentUser ? 'Unlike' : 'Like'} ({reply.likeCount})
                    </button>
                  )}
                  {canManageReply && editingReplyId !== reply._id && (
                    <button
                      className="font-semibold text-primary-teal hover:underline"
                      type="button"
                      onClick={() => setEditingReplyId(reply._id)}
                    >
                      Edit
                    </button>
                  )}
                  {canManageReply && (
                    <button
                      className="font-semibold text-red-700 hover:underline"
                      type="button"
                      onClick={() => handleDeleteReply(reply._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No replies yet.</p>
      )}
    </div>
  );
}
