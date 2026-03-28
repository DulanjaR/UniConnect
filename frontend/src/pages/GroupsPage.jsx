import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Trash2, UserPlus } from 'lucide-react';
import GroupModal from '../components/GroupModal';
import AddMemberModal from '../components/AddMemberModal';

export default function GroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/groups', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      } else {
        setError('Failed to load groups');
      }
    } catch (error) {
      setError('Error loading groups: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Delete this group? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setGroups(groups.filter(g => g._id !== groupId));
      } else {
        setError('Failed to delete group');
      }
    } catch (error) {
      setError('Error deleting group: ' + error.message);
    }
  };

  const handleGroupCreated = (newGroup) => {
    setGroups([newGroup, ...groups]);
  };

  const handleMemberAdded = (updatedGroup) => {
    setGroups(groups.map(g => g._id === updatedGroup._id ? updatedGroup : g));
    setSelectedGroup(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Groups</h1>
            <p className="text-gray-600 mt-1">Create and manage your study groups</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Group
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">✕</button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading groups...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No Groups Yet</h2>
            <p className="text-gray-600 mb-6">Create your first group to start sharing posts with your classmates</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Your First Group
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {groups.map(group => (
              <div key={group._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                {/* Group Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{group.description || 'No description'}</p>
                    </div>
                    {group.isPrivate && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                        Private
                      </span>
                    )}
                  </div>
                </div>

                {/* Members */}
                <div className="p-6 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-gray-600" />
                      <h4 className="font-medium text-gray-900">
                        Members ({group.members?.length || 0})
                      </h4>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {group.members?.map(member => (
                        <div key={member.userId} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium text-gray-900">{member.userId?.name}</p>
                            <p className="text-xs text-gray-600">{member.itNumber}</p>
                          </div>
                          {member.userId?.email && (
                            <span className="text-xs text-gray-500">{member.userId.email}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={() => setSelectedGroup(group)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 font-medium text-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Member
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group._id)}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-medium text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Group Create Modal */}
      <GroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={selectedGroup !== null}
        onClose={() => setSelectedGroup(null)}
        group={selectedGroup}
        onMemberAdded={handleMemberAdded}
      />
    </div>
  );
}
