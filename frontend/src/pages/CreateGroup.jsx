import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsAPI } from '../services/api';

export default function CreateGroup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    privacy: 'public'
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
      const response = await groupsAPI.create(formData);
      navigate(`/groups/${response.data.group._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="section-title">Create Group</h1>
        <p className="text-gray-600">You will become the first group admin for the new group.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {error && <div className="rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-red-700">{error}</div>}

        <div>
          <label className="mb-2 block text-sm font-medium">Group Name</label>
          <input className="input-field" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Description</label>
          <textarea
            className="input-field min-h-40"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="What is this group for?"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Image URL</label>
          <input
            className="input-field"
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="https://example.com/group-cover.jpg"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Privacy</label>
          <select className="input-field" name="privacy" value={formData.privacy} onChange={handleChange}>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Group'}
          </button>
          <button className="btn-outline" type="button" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
