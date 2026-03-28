import React, { useState, useEffect } from 'react';
import { ThumbsUp, MessageCircle, Eye } from 'lucide-react';

export default function PostEngagement({ postId, post, onCommentClick, onShareClick }) {
  const [engagement, setEngagement] = useState({
    likes: 0,
    comments: 0,
    views: 0,
    hasUserLiked: false,
    topLikers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEngagement();
  }, [postId]);

  const fetchEngagement = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/comments/engagement/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setEngagement(data);
      }
    } catch (error) {
      console.error('Failed to fetch engagement:', error);
      // Fallback to post data
      if (post) {
        setEngagement({
          likes: post.likes?.length || 0,
          comments: post.commentCount || 0,
          views: post.views || 0,
          shares: post.shares?.length || 0,
          topLikers: []
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-3 px-4 border-t border-gray-200 text-gray-500 text-sm">Loading...</div>;
  }

  return (
    <div className="py-3 px-4 border-t border-gray-200 flex items-center justify-between text-sm">
      {/* Engagement Stats */}
      <div className="flex gap-6 text-gray-600 text-xs">
        {/* Likes */}
        <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
          <ThumbsUp className="w-4 h-4" />
          <span>{engagement.likes} {engagement.likes === 1 ? 'Like' : 'Likes'}</span>
        </div>

        {/* Comments */}
        <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
          <MessageCircle className="w-4 h-4" />
          <span>{engagement.comments} {engagement.comments === 1 ? 'Comment' : 'Comments'}</span>
        </div>

        {/* Views */}
        <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
          <Eye className="w-4 h-4" />
          <span>{engagement.views} {engagement.views === 1 ? 'View' : 'Views'}</span>
        </div>
      </div>

      {/* Top Likers Preview */}
      {engagement.topLikers && engagement.topLikers.length > 0 && (
        <div className="text-xs text-gray-500">
          Liked by {engagement.topLikers[0]?.name}
          {engagement.topLikers.length > 1 && ` and ${engagement.likes - 1} others`}
        </div>
      )}
    </div>
  );
}
