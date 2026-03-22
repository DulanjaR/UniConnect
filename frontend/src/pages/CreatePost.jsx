import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postsAPI } from '../services/api';

export default function CreatePost() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    tags: '',
    category: 'study'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-light-beige flex items-center justify-center">
        <div className="card text-center">
          <p className="mb-4">Please log in to create a post</p>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const tags = formData.tags.split(',').map(t => t.trim()).filter(t => t);

      await postsAPI.create({
        title: formData.title,
        body: formData.body,
        tags,
        category: formData.category
      });

      setSuccess(true);
      setFormData({ title: '', body: '', tags: '', category: 'study' });

      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-beige py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="section-title">Create a New Post</h1>
        <p className="text-gray-600 mb-8">Share knowledge with your peers and the community.</p>

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            ✓ Post created successfully! Redirecting...
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Tips for calculus exam"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content *</label>
            <textarea
              name="body"
              value={formData.body}
              onChange={handleChange}
              required
              placeholder="Write your post content here..."
              rows="8"
              className="input-field resize-vertical"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input-field"
            >
              <option value="study">Study</option>
              <option value="lost">Lost Item</option>
              <option value="found">Found Item</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., mathematics, exam, tips"
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-2">Add tags to help others find your post</p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Creating...' : 'Create Post'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn-outline flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
