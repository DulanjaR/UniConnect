import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';

export default function CreatePost() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    tags: '',
    category: 'study'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await postsAPI.create({
        ...formData,
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="section-title">Create Post</h1>
        <p className="text-gray-600">Academic posts and community discussions still work alongside groups.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {error && <div className="rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-red-700">{error}</div>}

        <div>
          <label className="mb-2 block text-sm font-medium">Title</label>
          <input className="input-field" name="title" value={formData.title} onChange={handleChange} required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Content</label>
          <textarea
            className="input-field min-h-40"
            name="body"
            value={formData.body}
            onChange={handleChange}
            required
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Category</label>
            <select className="input-field" name="category" value={formData.category} onChange={handleChange}>
              <option value="study">Study</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Tags</label>
            <input
              className="input-field"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="mern, exam, lab"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Publish Post'}
          </button>
          <button className="btn-outline" type="button" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
