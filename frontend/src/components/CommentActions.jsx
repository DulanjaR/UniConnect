import React from 'react';

export default function CommentActions({
  canEdit,
  canDelete,
  canReply,
  canModerateTop,
  canModeratePin,
  isTopComment,
  isPinned,
  isLiked,
  likeCount,
  onLike,
  onReply,
  onEdit,
  onDelete,
  onTopToggle,
  onPinToggle,
  onReport
}) {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <button type="button" onClick={onLike} className="text-primary-teal font-semibold hover:underline">
        {isLiked ? 'Unlike' : 'Like'} ({likeCount})
      </button>
      {canReply && (
        <button type="button" onClick={onReply} className="text-primary-teal font-semibold hover:underline">
          Reply
        </button>
      )}
      {canEdit && (
        <button type="button" onClick={onEdit} className="text-primary-teal font-semibold hover:underline">
          Edit
        </button>
      )}
      {canDelete && (
        <button type="button" onClick={onDelete} className="text-red-700 font-semibold hover:underline">
          Delete
        </button>
      )}
      {canModerateTop && (
        <button type="button" onClick={onTopToggle} className="text-primary-teal font-semibold hover:underline">
          {isTopComment ? 'Remove Top' : 'Mark Top'}
        </button>
      )}
      {canModeratePin && (
        <button type="button" onClick={onPinToggle} className="text-primary-teal font-semibold hover:underline">
          {isPinned ? 'Unpin' : 'Pin'}
        </button>
      )}
      {onReport && (
        <button type="button" onClick={onReport} className="text-gray-600 font-semibold hover:underline">
          Report
        </button>
      )}
    </div>
  );
}
