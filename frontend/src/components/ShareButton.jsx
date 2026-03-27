import React, { useState, useEffect } from 'react';
import { Share2, X } from 'lucide-react';

export default function ShareButton({ postId, postTitle }) {
  const [isOpen, setIsOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [caption, setCaption] = useState('');
  const [sharing, setSharing] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && groups.length === 0) {
      fetchGroups();
    }
  }, [isOpen]);

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
      }
    } catch (error) {
      setError('Failed to load groups: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();

    if (!selectedGroup) {
      setError('Please select a group');
      return;
    }

    try {
      setSharing(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      const response = await fetch('/api/shares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          postId,
          groupId: selectedGroup,
          caption: caption.trim()
        })
      });

      if (response.ok) {
        setSuccess('Post shared successfully!');
        setSelectedGroup('');
        setCaption('');
        setTimeout(() => {
          setIsOpen(false);
          setSuccess('');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to share post');
      }
    } catch (error) {
      setError('Error sharing post: ' + error.message);
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      {/* Share Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Share2 className="w-5 h-5" />
        <span className="text-sm font-medium">Share</span>
      </button>

      {/* Share Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold">Share Post</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleShare} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-100 text-green-700 rounded text-sm">
                  {success}
                </div>
              )}

              {/* Post Title Preview */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Sharing post:</p>
                <p className="text-sm font-medium text-gray-800 truncate">{postTitle}</p>
              </div>

              {/* Group Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Group *
                </label>
                {loading ? (
                  <div className="text-center text-gray-500 py-4">Loading groups...</div>
                ) : groups.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    <p className="text-sm mb-2">No groups yet</p>
                    <p className="text-xs">Create a group first to share posts</p>
                  </div>
                ) : (
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a group...</option>
                    {groups.map(group => (
                      <option key={group._id} value={group._id}>
                        {group.name} ({group.members?.length || 0} members)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add a Caption (Optional)
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a message for your group..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="3"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sharing || !selectedGroup}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  {sharing ? 'Sharing...' : 'Share Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
