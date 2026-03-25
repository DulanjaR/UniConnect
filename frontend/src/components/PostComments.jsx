import React, { useEffect, useState } from 'react';
import { commentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import CommentSortBar from './CommentSortBar';

export default function PostComments({ post }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [sort, setSort] = useState('default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await commentsAPI.getByPost(post._id, { sort });
      setComments(response.data.comments);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [post._id, sort]);

  const handleCreateComment = async (text) => {
    await commentsAPI.create({ postId: post._id, text });
    await fetchComments();
  };

  return (
    <section className="mt-8 space-y-4">
      <CommentSortBar sort={sort} onChange={setSort} />

      {user ? (
        <CommentForm onSubmit={handleCreateComment} submitLabel="Add Comment" />
      ) : (
        <div className="card text-gray-600">Log in to join the discussion.</div>
      )}

      {error && <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      {loading ? (
        <div className="card text-gray-500">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="card text-gray-500">No comments yet. Start the discussion.</div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              currentUser={user}
              postAuthorId={post.author?._id}
              isAdmin={user?.role === 'admin'}
              onRefresh={fetchComments}
            />
          ))}
        </div>
      )}
    </section>
  );
}
