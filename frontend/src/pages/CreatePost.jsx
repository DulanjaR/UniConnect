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
    category: 'study',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) {
      setError('Please select an image');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const response = await postsAPI.uploadImage(selectedImage);
      setFormData(prev => ({ ...prev, imageUrl: response.data.imageUrl }));
      setSelectedImage(null);
      setImagePreview('');
    } catch (err) {
      setError('Failed to upload image: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    setSelectedImage(null);
    setImagePreview('');
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
        category: formData.category,
        imageUrl: formData.imageUrl,
        year: user?.academicYear,
        semester: user?.semester
      });

      setSuccess(true);
      setFormData({ title: '', body: '', tags: '', category: 'study', imageUrl: '' });
      setImagePreview('');

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

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <label className="block text-sm font-medium mb-4">Image (Optional)</label>
            
            {formData.imageUrl ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <img src={formData.imageUrl} alt="preview" className="max-w-xs h-48 object-cover rounded" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-green-600">✓ Image uploaded successfully</p>
              </div>
            ) : (
              <div className="space-y-4">
                {imagePreview && (
                  <div className="mb-4">
                    <img src={imagePreview} alt="preview" className="max-w-xs h-48 object-cover rounded" />
                  </div>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                
                {selectedImage && (
                  <button
                    type="button"
                    onClick={uploadImage}
                    disabled={uploading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </button>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">Supported formats: JPEG, PNG, GIF, WebP (Max 5MB)</p>
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
