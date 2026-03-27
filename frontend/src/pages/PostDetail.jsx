import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PostEngagement from '../components/PostEngagement';
import CommentSection from '../components/CommentSection';
import ShareButton from '../components/ShareButton';
import { postsAPI } from '../services/api';

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await postsAPI.getById(postId);
      if (response.data) {
        setPost(response.data);
        setIsLiked(response.data.likes?.some(like => like._id === user?.id) || false);
      }
    } catch (err) {
      setError('Failed to load post');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      await postsAPI.like(postId);
      setIsLiked(!isLiked);
      fetchPost();
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-red-600 mb-4">{error || 'Post not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Feed
        </button>

        {/* Post Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Post Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
                <p className="text-sm text-gray-600 mt-2">
                  by {post.author?.name} • {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {post.category}
              </span>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {post.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Post Image */}
          {post.imageUrl && (
            <div className="px-6 py-4">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Post Content */}
          <div className="px-6 py-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{post.body}</p>
            </div>
          </div>

          {/* Engagement Stats */}
          <PostEngagement postId={postId} post={post} />

          {/* Action Buttons */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isLiked
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              {isLiked ? 'Liked' : 'Like'}
            </button>

            <ShareButton postId={postId} postTitle={post.title} />

            {user?.id === post.author?._id && (
              <button
                onClick={() => navigate(`/post/${postId}/edit`)}
                className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Edit Post
              </button>
            )}
          </div>

          {/* Comments Section */}
          <CommentSection postId={postId} onCommentAdded={fetchPost} />
        </div>
      </div>
    </div>
  );
}
