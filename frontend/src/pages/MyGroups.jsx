import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { groupsAPI } from '../services/api';

export default function MyGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoading(true);
        const response = await groupsAPI.getMine();
        setGroups(response.data.groups || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load your groups');
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="section-title">My Groups</h1>
          <p className="text-gray-600">All groups where you are a member or group admin.</p>
        </div>
        <Link to="/groups/create" className="btn-primary">
          Create Group
        </Link>
      </div>

      {error && <div className="rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-red-700">{error}</div>}

      {loading ? (
        <div className="card text-gray-500">Loading your groups...</div>
      ) : groups.length === 0 ? (
        <div className="card text-gray-500">You have not joined any groups yet.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((group) => (
            <Link key={group._id} to={`/groups/${group._id}`} className="card block hover:border-primary-teal">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-primary-teal">{group.name}</h2>
                <span className="badge-primary">{group.currentUserRole || 'member'}</span>
              </div>
              <p className="mb-3 text-gray-700">{group.description || 'No description provided.'}</p>
              <div className="text-sm text-gray-500">
                {group.memberCount} members • {group.privacy}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
