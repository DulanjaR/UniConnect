import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { groupsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function GroupList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [privacy, setPrivacy] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await groupsAPI.getAll({
        search: search || undefined,
        privacy: privacy || undefined,
        limit: 20
      });
      setGroups(response.data.groups || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [search, privacy]);

  const handleJoin = async (groupId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await groupsAPI.join(groupId);
      await fetchGroups();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join group');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="section-title">Groups</h1>
          <p className="text-gray-600">Browse public groups and private communities you belong to.</p>
        </div>
        {user && (
          <Link to="/groups/create" className="btn-primary">
            Create Group
          </Link>
        )}
      </div>

      <div className="card grid gap-4 md:grid-cols-[1fr_220px]">
        <input
          className="input-field"
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search group name or description"
        />
        <select className="input-field" value={privacy} onChange={(event) => setPrivacy(event.target.value)}>
          <option value="">All visible groups</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
      </div>

      {error && <div className="rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-red-700">{error}</div>}

      {loading ? (
        <div className="card text-gray-500">Loading groups...</div>
      ) : groups.length === 0 ? (
        <div className="card text-gray-500">No groups matched your search.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((group) => (
            <div key={group._id} className="card space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-primary-teal">{group.name}</h2>
                  <p className="text-sm text-gray-500">
                    Created by {group.createdBy?.name || 'Unknown'} • {group.memberCount} members
                  </p>
                </div>
                <span className={group.privacy === 'private' ? 'badge-secondary' : 'badge-primary'}>
                  {group.privacy}
                </span>
              </div>

              <p className="text-gray-700">{group.description || 'No description provided.'}</p>

              <div className="flex flex-wrap gap-3">
                <Link to={`/groups/${group._id}`} className="btn-outline">
                  View Details
                </Link>
                {!group.isMember && !group.joinRequestStatus && (
                  <button className="btn-primary" type="button" onClick={() => handleJoin(group._id)}>
                    {group.privacy === 'private' ? 'Request to Join' : 'Join Group'}
                  </button>
                )}
                {group.joinRequestStatus === 'pending' && (
                  <span className="badge-secondary">Join request pending</span>
                )}
                {group.isMember && <span className="badge-primary">You are a member</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
