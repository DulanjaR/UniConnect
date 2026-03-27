import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

export default function GroupModal({ isOpen, onClose, onGroupCreated }) {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [itNumbers, setItNumbers] = useState(['']);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddMemberField = () => {
    setItNumbers([...itNumbers, '']);
  };

  const handleRemoveMemberField = (index) => {
    setItNumbers(itNumbers.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index, value) => {
    const newItNumbers = [...itNumbers];
    newItNumbers[index] = value;
    setItNumbers(newItNumbers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    if (itNumbers.filter(it => it.trim()).length === 0) {
      setError('At least one IT number is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: groupName.trim(),
          description: description.trim(),
          memberITNumbers: itNumbers.filter(it => it.trim()),
          isPrivate
        })
      });

      if (response.ok) {
        const group = await response.json();
        setGroupName('');
        setDescription('');
        setItNumbers(['']);
        setIsPrivate(false);
        onClose();
        if (onGroupCreated) onGroupCreated(group);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create group');
      }
    } catch (error) {
      setError('Error creating group: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">Create Group</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., CS Year 2 Study Group"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the group purpose..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="3"
            />
          </div>

          {/* Member IT Numbers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Members (by IT Number) *
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {itNumbers.map((itNumber, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={itNumber}
                    onChange={(e) => handleMemberChange(index, e.target.value)}
                    placeholder="e.g., IT001234"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  {itNumbers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMemberField(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddMemberField}
              className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add More Members
            </button>
          </div>

          {/* Privacy */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="isPrivate" className="text-sm text-gray-700">
              Private group (only members can see)
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
