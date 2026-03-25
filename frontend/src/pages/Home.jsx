import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { groupsAPI, postsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadHome = async () => {
      try {
        setLoading(true);
        setError('');
        const [groupsResponse, postsResponse] = await Promise.all([
          groupsAPI.getAll({ limit: 4 }),
          postsAPI.getAll({ limit: 5 })
        ]);
        setGroups(groupsResponse.data.groups || []);
        setPosts(postsResponse.data.posts || []);
      } catch (err) {
        setError('Failed to load dashboard content');
      } finally {
        setLoading(false);
      }
    };

    loadHome();
  }, []);

  return (
    <div className="space-y-10">
      <section className="card bg-gradient-to-r from-primary-teal to-secondary-teal text-white">
        <div className="max-w-3xl space-y-4">
          <span className="badge-secondary">Updated Concept: Group + Admin Management</span>
          <h1 className="text-4xl font-bold">Build campus communities, not just discussion threads.</h1>
          <p className="text-white/85">
            UniConnect now supports group creation, private/public memberships, group admins, and
            system-wide group moderation from one platform.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/groups" className="btn-secondary">
              Explore Groups
            </Link>
            {user ? (
              <>
                <Link to="/groups/create" className="btn-outline border-white text-white hover:bg-white hover:text-primary-teal">
                  Create Group
                </Link>
                <Link to="/groups/my" className="btn-outline border-white text-white hover:bg-white hover:text-primary-teal">
                  My Groups
                </Link>
              </>
            ) : (
              <Link to="/register" className="btn-outline border-white text-white hover:bg-white hover:text-primary-teal">
                Join UniConnect
              </Link>
            )}
          </div>
        </div>
      </section>

      {error && <div className="rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-red-700">{error}</div>}

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-title text-2xl">Featured Groups</h2>
              <p className="text-sm text-gray-600">Public and member-access groups across campus.</p>
            </div>
            <Link to="/groups" className="text-primary-teal font-semibold hover:underline">
              View all
            </Link>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading groups...</p>
          ) : groups.length === 0 ? (
            <p className="text-gray-500">No groups available yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {groups.map((group) => (
                <Link key={group._id} to={`/groups/${group._id}`} className="rounded-xl border border-gray-200 p-4 hover:border-primary-teal">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-primary-teal">{group.name}</h3>
                    <span className={group.privacy === 'private' ? 'badge-secondary' : 'badge-primary'}>
                      {group.privacy}
                    </span>
                  </div>
                  <p className="mb-3 text-sm text-gray-600">
                    {group.description || 'No description yet.'}
                  </p>
                  <div className="text-sm text-gray-500">
                    {group.memberCount} members • Created by {group.createdBy?.name || 'Unknown'}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-title text-2xl">Recent Posts</h2>
              <p className="text-sm text-gray-600">Existing discussion flow remains available.</p>
            </div>
            {user && (
              <Link to="/create" className="btn-primary">
                New Post
              </Link>
            )}
          </div>

          {loading ? (
            <p className="text-gray-500">Loading posts...</p>
          ) : posts.length === 0 ? (
            <p className="text-gray-500">No posts yet.</p>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <Link key={post._id} to={`/post/${post._id}`} className="block rounded-xl border border-gray-200 p-4 hover:border-primary-teal">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-primary-teal">{post.title}</h3>
                    <span className="badge-primary">{post.category}</span>
                  </div>
                  <p className="mb-2 text-sm text-gray-600">{post.body}</p>
                  <div className="text-xs text-gray-500">
                    {post.likes?.length || 0} likes • {post.views || 0} views
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
