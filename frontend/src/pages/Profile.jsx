import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Eye, MoreVertical, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { postsAPI, authAPI } from '../services/api';
import axios from 'axios';

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editingPostData, setEditingPostData] = useState({
    title: '',
    body: '',
    tags: ''
  });

  const [editData, setEditData] = useState({
    name: '',
    bio: '',
    university: '',
    academicYear: '',
    semester: '',
    phone: '',
    profilePicture: ''
  });

  const isOwnProfile = !userId || userId === currentUser?.id;

  useEffect(() => {
    fetchProfile();
  }, [userId, currentUser?.id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');

      let profileData;
      if (isOwnProfile) {
        // Get logged-in user's profile
        console.log('Fetching own profile...');
        const response = await authAPI.getProfile();
        profileData = response.data;
        console.log('Profile data:', profileData);
      } else {
        // Get other user's profile
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        console.log('Fetching user profile:', userId);
        const response = await axios.get(`${apiUrl}/users/${userId}`);
        profileData = response.data;
      }

      if (!profileData) {
        setError('No profile data received');
        return;
      }

      setProfile(profileData);
      setEditData({
        name: profileData.name || '',
        bio: profileData.bio || '',
        university: profileData.university || '',
        academicYear: profileData.academicYear || '',
        semester: profileData.semester || '',
        phone: profileData.phone || '',
        profilePicture: profileData.profilePicture || ''
      });

      // Fetch user's posts
      console.log('Fetching posts for author:', profileData._id);
      const postsResponse = await postsAPI.getByAuthor(profileData._id);
      console.log('Posts response:', postsResponse);
      
      // Handle nested posts structure from API
      const postsData = postsResponse.data?.posts || postsResponse.data || [];
      setPosts(postsData);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Failed to load profile: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await postsAPI.delete(postId);
      // Remove post from state
      setPosts(posts.filter(p => p._id !== postId));
      setOpenMenuId(null);
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Failed to delete post: ' + (err.response?.data?.message || err.message));
    }
  };

  const startEditingPost = (post, e) => {
    e.stopPropagation();
    setEditingPostId(post._id);
    setEditingPostData({
      title: post.title,
      body: post.body,
      tags: post.tags?.join(', ') || ''
    });
    setOpenMenuId(null);
  };

  const savePostChanges = async (postId) => {
    try {
      const tags = editingPostData.tags.split(',').map(t => t.trim()).filter(t => t);
      
      const response = await postsAPI.update(postId, {
        title: editingPostData.title,
        body: editingPostData.body,
        tags
      });

      // Update post in list
      setPosts(posts.map(p => p._id === postId ? response.data : p));
      setEditingPostId(null);
    } catch (err) {
      console.error('Error updating post:', err);
      setError('Failed to update post: ' + (err.response?.data?.message || err.message));
    }
  };

  const cancelEditingPost = () => {
    setEditingPostId(null);
    setEditingPostData({ title: '', body: '', tags: '' });
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      
      console.log('Uploading profile picture...', { apiUrl, hasToken: !!token });
      
      const response = await axios.post(
        `${apiUrl}/posts/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Upload response:', response.data);
      
      if (response.data.imageUrl) {
        setEditData(prev => ({
          ...prev,
          profilePicture: response.data.imageUrl
        }));
        console.log('Profile picture updated');
      } else {
        setError('No image URL returned from server');
      }
    } catch (err) {
      console.error('Upload error:', err.response || err);
      setError('Failed to upload profile picture: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const response = await authAPI.updateProfile(editData);
      setProfile(response.data);
      setIsEditing(false);
      window.location.reload();
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    }
  };

  if (isOwnProfile && !currentUser) {
    return (
      <div className="min-h-screen bg-light-beige flex items-center justify-center">
        <div className="card text-center">
          <p className="text-gray-500 mb-4">Please log in to view your profile</p>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-light-beige flex items-center justify-center">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-light-beige flex items-center justify-center">
        <div className="card text-center">
          <p className="text-gray-500 mb-4">Profile not found</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-beige py-8">
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

      <div className="max-w-4xl mx-auto px-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Profile Header Card */}
        <div className="card mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <img
                  src={editData.profilePicture || 'https://via.placeholder.com/150?text=Profile'}
                  alt={profile.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary-teal"
                />
                {isOwnProfile && isEditing && (
                  <label className="absolute bottom-0 right-0 bg-primary-teal text-white rounded-full p-2 cursor-pointer hover:bg-secondary-teal">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                    📷
                  </label>
                )}
              </div>
              {isOwnProfile && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary mt-4"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="md:col-span-2">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={editData.name}
                      onChange={handleEditChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bio</label>
                    <textarea
                      name="bio"
                      value={editData.bio}
                      onChange={handleEditChange}
                      placeholder="Tell us about yourself..."
                      rows="3"
                      className="input-field resize-vertical"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">University</label>
                      <input
                        type="text"
                        name="university"
                        value={editData.university}
                        onChange={handleEditChange}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <input
                        type="text"
                        name="phone"
                        value={editData.phone}
                        onChange={handleEditChange}
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Year</label>
                      <input
                        type="number"
                        name="academicYear"
                        value={editData.academicYear}
                        onChange={handleEditChange}
                        min="1"
                        max="4"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Semester</label>
                      <input
                        type="number"
                        name="semester"
                        value={editData.semester}
                        onChange={handleEditChange}
                        min="1"
                        max="8"
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={handleSaveProfile} className="btn-primary flex-1">
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditData({
                          name: profile.name,
                          bio: profile.bio || '',
                          university: profile.university || '',
                          academicYear: profile.academicYear || '',
                          semester: profile.semester || '',
                          phone: profile.phone || ''
                        });
                      }}
                      className="btn-outline flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-3xl font-bold text-primary-teal mb-2">{profile.name}</h1>
                  <p className="text-gray-600 mb-4">{profile.email}</p>
                  {profile.bio && (
                    <p className="text-gray-700 mb-4 italic">{profile.bio}</p>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {profile.university && (
                      <div>
                        <span className="font-medium text-gray-600">University:</span>
                        <p className="text-gray-800">{profile.university}</p>
                      </div>
                    )}
                    {profile.academicYear && (
                      <div>
                        <span className="font-medium text-gray-600">Year:</span>
                        <p className="text-gray-800">Year {profile.academicYear}</p>
                      </div>
                    )}
                    {profile.semester && (
                      <div>
                        <span className="font-medium text-gray-600">Semester:</span>
                        <p className="text-gray-800">Semester {profile.semester}</p>
                      </div>
                    )}
                    {profile.phone && (
                      <div>
                        <span className="font-medium text-gray-600">Phone:</span>
                        <p className="text-gray-800">{profile.phone}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Member since {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="section-title">
              {isOwnProfile ? 'Your Posts' : `${profile.name}'s Posts`}
            </h2>
            {isOwnProfile && (
              <button 
                onClick={() => navigate('/create')}
                className="btn-primary"
              >
                + New Post
              </button>
            )}
          </div>

          {posts.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500">
                {isOwnProfile ? 'No posts yet. Create your first post!' : 'No posts from this user yet.'}
              </p>
              {isOwnProfile && (
                <button onClick={() => navigate('/create')} className="btn-primary mt-4">
                  Create Post
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map(post => (
                <div key={post._id}>
                  {editingPostId === post._id ? (
                    // Edit mode
                    <div className="card space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Title</label>
                        <input
                          type="text"
                          value={editingPostData.title}
                          onChange={(e) => setEditingPostData({...editingPostData, title: e.target.value})}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Content</label>
                        <textarea
                          value={editingPostData.body}
                          onChange={(e) => setEditingPostData({...editingPostData, body: e.target.value})}
                          rows="6"
                          className="input-field resize-vertical"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                        <input
                          type="text"
                          value={editingPostData.tags}
                          onChange={(e) => setEditingPostData({...editingPostData, tags: e.target.value})}
                          className="input-field"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => savePostChanges(post._id)}
                          className="btn-primary flex-1"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={cancelEditingPost}
                          className="btn-outline flex-1"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div
                      className="card hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => navigate(`/post/${post._id}`)}
                    >
                      <div className="flex justify-between items-start mb-3 relative">
                        <div>
                          <h3 className="text-xl font-bold text-primary-teal">
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="badge-primary">{post.category}</span>
                          {isOwnProfile && (
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === post._id ? null : post._id);
                                }}
                                className="p-2 hover:bg-gray-100 rounded transition"
                                title="More options"
                              >
                                <MoreVertical className="w-5 h-5 text-gray-600" />
                              </button>
                              
                              {openMenuId === post._id && (
                                <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded shadow-lg z-10">
                                  <button
                                    onClick={(e) => startEditingPost(post, e)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => handleDeletePost(post._id, e)}
                                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {post.images && post.images.length > 0 && (
                        <div className="mb-4">
                          {post.images.length === 1 ? (
                            <img
                              src={post.images[0]}
                              alt={post.title}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(post.images[0]);
                              }}
                              className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            />
                          ) : (
                            <div className="grid grid-cols-2 gap-2 max-h-48">
                              {post.images.slice(0, 4).map((img, idx) => (
                                <div 
                                  key={idx} 
                                  className="relative overflow-hidden rounded-lg bg-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImage(img);
                                  }}
                                >
                                  <img 
                                    src={img} 
                                    alt={`${post.title} ${idx}`}
                                    className="w-full h-24 object-cover"
                                  />
                                  {idx === 3 && post.images.length > 4 && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                      <span className="text-white font-semibold">+{post.images.length - 4}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Simple Stats Line */}
                          <div className="flex gap-4 text-xs text-gray-600 pt-3 border-t mt-3">
                            <div className="flex items-center gap-1">
                              <Heart className="w-3 h-3 text-red-500" />
                              <span>Likes {post.likes?.length || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3 text-gray-500" />
                              <span>Views {post.views || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3 text-blue-500" />
                              <span>Comments {post.commentCount || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Share2 className="w-3 h-3 text-green-500" />
                              <span>Shares 0</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="text-gray-700 mb-4 line-clamp-3">{post.body}</p>

                      <div className="flex gap-2 mb-4">
                        {post.tags?.map(tag => (
                          <span key={tag} className="badge-secondary">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
