import React, { useState } from 'react';
import { commentsAPI } from '../services/api';
import ReplyForm from './ReplyForm';
import CommentForm from './CommentForm';
import CommentActions from './CommentActions';
import ReportCommentModal from './ReportCommentModal';

export default function CommentItem({
  comment,
  currentUser,
  postAuthorId,
  isAdmin,
  level = 0,
  onRefresh
}) {
  const [showReply, setShowReply] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const isOwner = currentUser?.id === comment.author?._id;
  const canTop = currentUser?.id === postAuthorId;
  const canPin = isAdmin || currentUser?.id === postAuthorId;
  const hasLiked = comment.likes?.includes?.(currentUser?.id);

  const handleReply = async (text) => {
    await commentsAPI.reply(comment._id, { postId: comment.post, text });
    setShowReply(false);
    onRefresh();
  };

  const handleEdit = async (text) => {
    await commentsAPI.update(comment._id, { text });
    setEditing(false);
    onRefresh();
  };

  const handleDelete = async () => {
    await commentsAPI.delete(comment._id);
    onRefresh();
  };

  const handleLike = async () => {
    if (!currentUser) {
      return;
    }

    if (hasLiked) {
      await commentsAPI.unlike(comment._id);
    } else {
      await commentsAPI.like(comment._id);
    }
    onRefresh();
  };

  const handleTopToggle = async () => {
    await commentsAPI.toggleTop(comment._id, {
      postId: comment.post,
      isTopComment: !comment.isAcceptedAnswer
    });
    onRefresh();
  };

  const handlePinToggle = async () => {
    await commentsAPI.togglePin(comment._id, { isPinned: !comment.isPinned });
    onRefresh();
  };

  const handleReport = async (payload) => {
    await commentsAPI.report(comment._id, payload);
    onRefresh();
  };

  return (
    <div className={`border rounded-xl p-4 bg-white ${level > 0 ? 'ml-6 border-l-4 border-l-accent-beige' : 'border-gray-200'} ${comment.isPinned ? 'ring-1 ring-primary-teal' : ''}`}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="font-semibold text-primary-teal">{comment.author?.name || 'Unknown user'}</span>
        <span className="text-sm text-gray-500">
          {new Date(comment.createdAt).toLocaleString()}
        </span>
        {comment.editedAt && <span className="text-xs text-gray-400">edited</span>}
        {comment.isPinned && <span className="badge-secondary">Pinned</span>}
        {comment.isAcceptedAnswer && <span className="badge-primary">Top Comment</span>}
        {comment.status === 'flagged' && <span className="badge-secondary">Flagged</span>}
        {comment.status === 'reported' && <span className="badge-secondary">Reported</span>}
      </div>

      {editing ? (
        <CommentForm
          compact
          initialValue={comment.text}
          submitLabel="Save"
          onSubmit={handleEdit}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <p className="text-gray-700 whitespace-pre-wrap mb-3">{comment.text}</p>
      )}

      <CommentActions
        canEdit={isOwner}
        canDelete={isOwner || isAdmin}
        canReply={Boolean(currentUser)}
        canModerateTop={canTop}
        canModeratePin={canPin}
        isTopComment={comment.isAcceptedAnswer}
        isPinned={comment.isPinned}
        isLiked={Boolean(hasLiked)}
        likeCount={comment.likes?.length || 0}
        onLike={handleLike}
        onReply={() => setShowReply((value) => !value)}
        onEdit={() => setEditing(true)}
        onDelete={handleDelete}
        onTopToggle={handleTopToggle}
        onPinToggle={handlePinToggle}
        onReport={!isOwner && currentUser ? () => setShowReport(true) : null}
      />

      {showReply && (
        <div className="mt-4">
          <ReplyForm onSubmit={handleReply} onCancel={() => setShowReply(false)} />
        </div>
      )}

      {comment.replies?.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              currentUser={currentUser}
              postAuthorId={postAuthorId}
              isAdmin={isAdmin}
              level={level + 1}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}

      {showReport && (
        <ReportCommentModal onClose={() => setShowReport(false)} onSubmit={handleReport} />
      )}
    </div>
  );
}
