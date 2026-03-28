import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Eye, Heart, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { postsAPI } from '../services/api';

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Year/Semester filtering
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  // Available year/semester combinations (1-4 years, 1-2 semesters)
  const years = [1, 2, 3, 4];
  const semesters = [1, 2];

  useEffect(() => {
    fetchPosts();
  }, [page, search, selectedYear, selectedSemester]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError('');

      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (selectedYear && selectedSemester) {
        params.year = selectedYear;
        params.semester = selectedSemester;
      }

      const response = await postsAPI.getAll(params);
      setPosts(response.data.posts);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      setError('Failed to load posts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await postsAPI.like(postId);
      fetchPosts();
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleShare = async (postId) => {
    try {
      await postsAPI.share(postId);
      fetchPosts();
    } catch (err) {
      console.error('Error sharing post:', err);
    }
  };

  return (
    <div className="min-h-screen bg-light-beige">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="section-title">Academic Feed</h1>
          <p className="text-gray-600">Connect with students, share knowledge, and find resources</p>
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search posts..."
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Year & Semester</label>
              <div className="flex gap-2">
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(Number(e.target.value));
                    setPage(1);
                  }}
                  className="input-field flex-1"
                >
                  <option value="">All Years</option>
                  {years.map(year => (
                    <option key={year} value={year}>Year {year}</option>
                  ))}
                </select>
                <select
                  value={selectedSemester}
                  onChange={(e) => {
                    setSelectedSemester(Number(e.target.value));
                    setPage(1);
                  }}
                  className="input-field flex-1"
                >
                  <option value="">All Semesters</option>
                  {semesters.map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>
            </div>

            {user && (
              <div className="flex items-end">
                <Link
                  to="/create"
                  className="btn-primary w-full text-center"
                >
                  New Post
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Posts List */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500">No posts found. Be the first to create one!</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post._id} className="card hover:shadow-lg transition-shadow">
                <Link to={`/post/${post._id}`} className="block hover:no-underline">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-primary-teal hover:text-secondary-teal">
                        {post.title}
                      </h2>
                      <p className="text-sm text-gray-500">
                        by {post.author?.name} • {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="badge-primary ml-3">{post.category}</span>
                  </div>

                  {post.images && post.images.length > 0 && (
                    <div className="mb-4">
                      {post.images.length === 1 ? (
                        <img 
                          src={post.images[0]} 
                          alt={post.title}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                      ) : (
                        <div className="grid grid-cols-2 gap-2 max-h-64">
                          {post.images.slice(0, 4).map((img, idx) => (
                            <div key={idx} className="relative overflow-hidden rounded-lg bg-gray-200">
                              <img 
                                src={img} 
                                alt={`${post.title} ${idx}`}
                                className="w-full h-32 object-cover"
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

                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags?.map(tag => (
                      <span key={tag} className="badge-secondary">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </Link>

                {/* Like and Share buttons - below everything */}
                {user && (
                  <div className="flex gap-2 border-t pt-3">
                    <button
                      onClick={() => handleLike(post._id)}
                      className="text-primary-teal hover:text-secondary-teal font-semibold px-3 py-2 hover:bg-teal-50 rounded transition-colors"
                    >
                      <Heart className="w-4 h-4 inline mr-1" />
                      Like
                    </button>
                    <button
                      onClick={() => handleShare(post._id)}
                      className="text-primary-teal hover:text-secondary-teal font-semibold px-3 py-2 hover:bg-teal-50 rounded transition-colors"
                    >
                      <Share2 className="w-4 h-4 inline mr-1" />
                      Share
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {page > 1 && (
              <button
                onClick={() => setPage(page - 1)}
                className="btn-outline"
              >
                Previous
              </button>
            )}

            <span className="flex items-center px-4">
              Page {page} of {totalPages}
            </span>

            {page < totalPages && (
              <button
                onClick={() => setPage(page + 1)}
                className="btn-outline"
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
