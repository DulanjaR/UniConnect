import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postsAPI } from '../services/api';

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Year/Semester filtering
  const [selectedYear, setSelectedYear] = useState(user?.academicYear || '');
  const [selectedSemester, setSelectedSemester] = useState(user?.semester || '');
  const [showOtherYears, setShowOtherYears] = useState(false);

  // Available year/semester combinations (1-4 years, 1-2 semesters)
  const years = [1, 2, 3, 4];
  const semesters = [1, 2];

  useEffect(() => {
    fetchPosts();
  }, [category, page, search, selectedYear, selectedSemester]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError('');

      const params = { page, limit: 10 };
      if (category) params.category = category;
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

  const handleYearSemesterChange = (year, semester) => {
    setSelectedYear(year);
    setSelectedSemester(semester);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-light-beige">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="section-title">Academic Feed</h1>
          <p className="text-gray-600">Connect with students, share knowledge, and find resources</p>
        </div>

        {/* Year/Semester Filter - At the top */}
        <div className="card mb-6 bg-white border-l-4 border-primary-teal">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Filter by Year & Semester</h3>
            <button
              onClick={() => setShowOtherYears(!showOtherYears)}
              className="text-sm text-primary-teal hover:text-secondary-teal font-semibold"
            >
              {showOtherYears ? '▼ Hide other years' : '▶ Show other years'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {years.map(year => (
              semesters.map(semester => (
                <button
                  key={`${year}-${semester}`}
                  onClick={() => handleYearSemesterChange(year, semester)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedYear === year && selectedSemester === semester
                      ? 'bg-primary-teal text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  } ${year > 2 && !showOtherYears ? 'hidden md:block' : ''}`}
                >
                  Year {year} Sem {semester}
                </button>
              ))
            ))}
          </div>

          <div className="mt-3 text-xs text-gray-500">
            {user && (
              <p>📍 Your year/semester: Year {user.academicYear} Semester {user.semester}</p>
            )}
          </div>
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
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="input-field"
              >
                <option value="">All Categories</option>
                <option value="study">Study</option>
                <option value="lost">Lost Items</option>
                <option value="found">Found Items</option>
              </select>
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
              <Link key={post._id} to={`/post/${post._id}`} className="block">
                <div className="card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h2 className="text-xl font-bold text-primary-teal hover:text-secondary-teal">
                        {post.title}
                      </h2>
                      <p className="text-sm text-gray-500">
                        by {post.author?.name} • {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="badge-primary">{post.category}</span>
                  </div>

                  {post.imageUrl && (
                    <div className="mb-4">
                      <img 
                        src={post.imageUrl} 
                        alt={post.title}
                        className="w-full h-48 object-cover rounded-lg"
                      />
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

                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <div className="flex gap-4">
                      <span>👁 {post.views} views</span>
                      <span>❤️ {post.likes?.length || 0} likes</span>
                    </div>
                    {user && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleLike(post._id);
                        }}
                        className="text-primary-teal hover:text-secondary-teal font-semibold"
                      >
                        Like
                      </button>
                    )}
                  </div>
                </div>
              </Link>
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
