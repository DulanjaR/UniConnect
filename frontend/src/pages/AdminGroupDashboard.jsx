import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';

export default function AdminGroupDashboard() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getAllGroups({
        search: search || undefined,
        limit: 30
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
  }, [search]);

  const handleDelete = async (groupId) => {
    try {
      await adminAPI.deleteGroup(groupId, { reason: 'Removed by system admin' });
      await fetchGroups();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete group');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Admin Group Dashboard</h1>
        <p className="text-gray-600">System-wide oversight of all groups, creators, privacy settings, membership size, and feed activity.</p>
      </div>

      <div className="card">
        <input
          className="input-field"
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search groups"
        />
      </div>

      {error && <div className="rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-red-700">{error}</div>}

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-gray-500">Loading groups...</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 pr-4">Group</th>
                <th className="py-3 pr-4">Creator</th>
                <th className="py-3 pr-4">Privacy</th>
                <th className="py-3 pr-4">Members</th>
                <th className="py-3 pr-4">Messages</th>
                <th className="py-3 pr-4">Pending Requests</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group._id} className="border-b border-gray-100 align-top">
                  <td className="py-3 pr-4">
                    <div className="font-semibold text-primary-teal">{group.name}</div>
                    <div className="max-w-sm text-xs text-gray-500">{group.description || 'No description provided.'}</div>
                  </td>
                  <td className="py-3 pr-4">{group.createdBy?.name || 'Unknown'}</td>
                  <td className="py-3 pr-4 capitalize">{group.privacy}</td>
                  <td className="py-3 pr-4">{group.memberCount}</td>
                  <td className="py-3 pr-4">{group.messageCount || 0}</td>
                  <td className="py-3 pr-4">{group.pendingJoinRequests}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/groups/${group._id}`} className="btn-outline !px-3 !py-1">
                        View
                      </Link>
                      <button
                        className="btn-outline !px-3 !py-1 border-red-600 text-red-700 hover:bg-red-700 hover:text-white"
                        type="button"
                        onClick={() => handleDelete(group._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
