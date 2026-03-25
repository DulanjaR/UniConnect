import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { postsAPI } from '../services/api';
import PostComments from '../components/PostComments';

export default function PostDetails() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await postsAPI.getById(id);
        setPost(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-8">Loading post...</div>;
  }

  if (error || !post) {
    return <div className="max-w-5xl mx-auto px-4 py-8 text-red-700">{error || 'Post not found'}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/" className="text-primary-teal font-semibold hover:underline">
        Back to Feed
      </Link>

      <article className="card mt-4">
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <h1 className="section-title mb-0 flex-1">{post.title}</h1>
          <span className="badge-primary">{post.category}</span>
        </div>

        <div className="text-sm text-gray-500 mb-4">
          Posted by {post.author?.name} on {new Date(post.createdAt).toLocaleString()}
        </div>

        <p className="text-gray-700 whitespace-pre-wrap leading-7">{post.body}</p>

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {post.tags.map((tag) => (
              <span key={tag} className="badge-secondary">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>

      <PostComments post={post} />
    </div>
  );
}
