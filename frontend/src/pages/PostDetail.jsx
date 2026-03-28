import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, Eye, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
  const [selectedImage, setSelectedImage] = useState(null);

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
    if (!post) return;

    // Store original state for rollback
    const originalPost = JSON.parse(JSON.stringify(post));
    const originalIsLiked = isLiked;

    // Optimistic update
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);

    const updatedPost = { ...post };
    if (newIsLiked) {
      // Add like
      updatedPost.likes = [...(updatedPost.likes || []), { _id: user?.id }];
    } else {
      // Remove like
      updatedPost.likes = updatedPost.likes?.filter(like => like._id !== user?.id) || [];
    }
    setPost(updatedPost);

    try {
      await postsAPI.like(postId);
    } catch (err) {
      // Rollback on error
      setPost(originalPost);
      setIsLiked(originalIsLiked);
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
      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <img 
              src={selectedImage} 
              alt="Full view"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition text-2xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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

          {/* Post Images */}
          {post.images && post.images.length > 0 && (
            <div className="px-6 py-4">
              {post.images.length === 1 ? (
                <img
                  src={post.images[0]}
                  alt={post.title}
                  onClick={() => setSelectedImage(post.images[0])}
                  className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {post.images.map((img, idx) => (
                    <div 
                      key={idx} 
                      className="relative overflow-hidden rounded-lg bg-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedImage(img)}
                    >
                      <img 
                        src={img} 
                        alt={`${post.title} ${idx}`}
                        className="w-full aspect-square object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Simple Stats Line */}
          <div className="px-6 py-3 border-b border-gray-200 flex gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="font-medium">Likes {post.likes?.length || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Views {post.views || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4 text-blue-500" />
              <span className="font-medium">Comments {post.commentCount || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Share2 className="w-4 h-4 text-green-500" />
              <span className="font-medium">Shares {post.shares?.length || 0}</span>
            </div>
          </div>

          {/* Post Content */}
          <div className="px-6 py-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{post.body}</p>
            </div>
          </div>

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
          </div>

          {/* Comments Section */}
          <CommentSection postId={postId} onCommentAdded={fetchPost} />
        </div>
      </div>
    </div>
  );
}
