import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postsAPI } from '../services/api';

export default function CreatePost() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Predefined tags for SLIIT
  const availableTags = [
    'SLIIT Computing',
    'SLIIT Engineering',
    'Study Materials',
    'Lecture Notes',
    'Assignment Help',
    'Exam Tips',
    'Project Ideas',
    'Placement Ready',
    'Campus Life',
    'Internship'
  ];

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    tags: [],
    category: 'study',
    images: [] // Changed to array for multiple images
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]); // Array of previews
  const [validationErrors, setValidationErrors] = useState({});

  if (!user) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center relative">
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
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTagChange = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
    if (validationErrors.tags) {
      setValidationErrors(prev => ({ ...prev, tags: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters';
    } else if (formData.title.trim().length > 100) {
      errors.title = 'Title must not exceed 100 characters';
    }

    if (!formData.body.trim()) {
      errors.body = 'Content is required';
    } else if (formData.body.trim().length < 20) {
      errors.body = 'Content must be at least 20 characters';
    }

    if (formData.tags.length === 0) {
      errors.tags = 'Please select at least one tag';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, { preview: reader.result, file: null, url: null }]
        }));
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (index) => {
    if (!formData.images[index]) {
      setError('Image not found');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const response = await postsAPI.uploadImage(selectedFile);
      // Update the specific image with the uploaded URL
      const newImages = [...formData.images];
      newImages[index] = { ...newImages[index], url: response.data.imageUrl };
      setFormData(prev => ({ ...prev, images: newImages }));
      setSelectedFile(null);
    } catch (err) {
      setError('Failed to upload image: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      setError('Please fix the errors above');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get uploaded image URLs (filter out images that are still being uploaded)
      const uploadedImages = formData.images
        .filter(img => img.url)
        .map(img => img.url);

      await postsAPI.create({
        title: formData.title,
        body: formData.body,
        tags: formData.tags,
        category: formData.category,
        images: uploadedImages, // Send array of image URLs
        year: user?.academicYear,
        semester: user?.semester
      });

      setSuccess(true);
      setFormData({ title: '', body: '', tags: [], category: 'study', images: [] });
      setImagePreviews([]);
      setSelectedFile(null);
      setValidationErrors({});

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
    <div className="min-h-screen bg-vibrant-gradient py-8 relative">
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
          {Object.keys(validationErrors).length > 0 && (
            <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
              <p className="text-red-700 font-semibold mb-2">Please fix the following errors:</p>
              <ul className="list-disc list-inside text-red-600 text-sm">
                {validationErrors.title && <li>{validationErrors.title}</li>}
                {validationErrors.body && <li>{validationErrors.body}</li>}
                {validationErrors.tags && <li>{validationErrors.tags}</li>}
              </ul>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Tips for calculus exam"
              className={`input-field ${validationErrors.title ? 'border-2 border-red-500 bg-red-50' : ''}`}
            />
            {validationErrors.title && (
              <p className="text-red-600 text-sm mt-1 font-medium">⚠️ {validationErrors.title}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content *</label>
            <textarea
              name="body"
              value={formData.body}
              onChange={handleChange}
              placeholder="Write your post content here..."
              rows="8"
              className={`input-field resize-vertical ${validationErrors.body ? 'border-2 border-red-500 bg-red-50' : ''}`}
            />
            {validationErrors.body && (
              <p className="text-red-600 text-sm mt-1 font-medium">⚠️ {validationErrors.body}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">{formData.body.length}/5000 characters</p>
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
            </select>
            <p className="text-xs text-gray-500 mt-2">Use the Lost & Found section for lost or found items</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Tags (Select at least one) *</label>
            <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded ${validationErrors.tags ? 'bg-red-50 border-2 border-red-500' : 'border border-gray-300'}`}>
              {availableTags.map(tag => (
                <label key={tag} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 rounded">
                  <input
                    type="checkbox"
                    checked={formData.tags.includes(tag)}
                    onChange={() => handleTagChange(tag)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">{tag}</span>
                </label>
              ))}
            </div>
            {validationErrors.tags && (
              <p className="text-red-600 text-sm mt-2 font-medium">⚠️ {validationErrors.tags}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">Selected: {formData.tags.length > 0 ? formData.tags.join(', ') : 'None'}</p>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <label className="block text-sm font-medium mb-4">Images (Optional)</label>
            
            {formData.images.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium mb-4">Added Images ({formData.images.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={img.preview} 
                        alt={`preview ${index}`} 
                        className="w-full aspect-square object-cover rounded border border-gray-300" 
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded flex items-center justify-center opacity-0 hover:opacity-100 transition">
                        {img.url ? (
                          <span className="text-white text-sm font-medium">✓ Uploaded</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => uploadImage(index)}
                            disabled={uploading}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-gray-500"
                          >
                            {uploading ? 'Uploading...' : 'Upload'}
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-2">Supported formats: JPEG, PNG, GIF, WebP (Max 5MB each). You can add multiple images.</p>
            </div>
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
