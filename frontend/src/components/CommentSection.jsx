import React, { useState, useEffect } from 'react';
import { MessageCircle, ThumbsUp, Reply, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CommentSection({ postId, onCommentAdded }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/comments/post/${postId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          postId,
          text: newComment,
          parentCommentId: null
        })
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments([newCommentData, ...comments]);
        setNewComment('');
        if (onCommentAdded) onCommentAdded();
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async (parentCommentId) => {
    if (!replyText.trim()) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          postId,
          text: replyText,
          parentCommentId
        })
      });

      if (response.ok) {
        const newReply = await response.json();
        const updatedComments = comments.map(comment => {
          if (comment._id === parentCommentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newReply]
            };
          }
          return comment;
        });
        setComments(updatedComments);
        setReplyToId(null);
        setReplyText('');
      }
    } catch (error) {
      console.error('Failed to add reply:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setComments(comments.filter(c => c._id !== commentId));
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Update comment likes count
        setComments(comments.map(c => 
          c._id === commentId ? { ...c, likes: Array(data.likes).fill(null) } : c
        ));
      }
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  return (
    <div className="border-t border-gray-200 py-4">
      {/* Comment Input */}
      <div className="px-4 mb-6">
        <form onSubmit={handleAddComment} className="flex gap-3">
          <img
            src={user?.profilePicture || 'https://via.placeholder.com/32'}
            alt="Avatar"
            className="w-8 h-8 rounded-full"
          />
          <div className="flex-1">
            <input
              type="text"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {newComment.trim() && (
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Post
            </button>
          )}
        </form>
      </div>

      {/* Comments List */}
      <div className="px-4 space-y-4">
        {loading ? (
          <div className="text-center text-gray-500 py-4">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center text-gray-500 py-4">No comments yet. Be the first!</div>
        ) : (
          comments.map(comment => (
            <div key={comment._id} className="space-y-2">
              {/* Main Comment */}
              <div className="flex gap-3">
                <img
                  src={comment.author?.profilePicture || 'https://via.placeholder.com/32'}
                  alt={comment.author?.name}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-lg px-3 py-2">
                    <div className="font-semibold text-sm">{comment.author?.name}</div>
                    <div className="text-sm text-gray-800">{comment.text}</div>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-gray-500">
                    <button 
                      onClick={() => handleLikeComment(comment._id)}
                      className="hover:text-blue-600 flex items-center gap-1"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      Like
                    </button>
                    <button 
                      onClick={() => setReplyToId(comment._id)}
                      className="hover:text-blue-600 flex items-center gap-1"
                    >
                      <Reply className="w-3 h-3" />
                      Reply
                    </button>
                    {user?.id === comment.author?._id && (
                      <button 
                        onClick={() => handleDeleteComment(comment._id)}
                        className="hover:text-red-600 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    )}
                    {comment.likes?.length > 0 && (
                      <span className="text-gray-600">{comment.likes.length} likes</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reply Form */}
              {replyToId === comment._id && (
                <div className="ml-12 mb-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddReply(comment._id);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleAddReply(comment._id)}
                    disabled={submitting}
                    className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => setReplyToId(null)}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-12 space-y-2">
                  {comment.replies.map(reply => (
                    <div key={reply._id} className="flex gap-2">
                      <img
                        src={reply.author?.profilePicture || 'https://via.placeholder.com/24'}
                        alt={reply.author?.name}
                        className="w-6 h-6 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded px-2 py-1">
                          <div className="font-semibold text-xs">{reply.author?.name}</div>
                          <div className="text-xs text-gray-800">{reply.text}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
