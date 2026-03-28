import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

export default function AddMemberModal({ isOpen, onClose, group, onMemberAdded }) {
  const [itNumber, setItNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(null);
  const suggestionTimeoutRef = useRef(null);

  const fetchSuggestions = async (value) => {
    if (value.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/users/search-by-it?itNumber=${encodeURIComponent(value)}`);
      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };

  const handleItNumberChange = (value) => {
    setItNumber(value);
    setActiveSuggestionIndex(null);

    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    suggestionTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSuggestionSelect = (user) => {
    setItNumber(user.itNumber);
    setSuggestions([]);
    setActiveSuggestionIndex(null);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    
    if (!itNumber.trim()) {
      setError('Please enter an IT number');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/groups/${group._id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ itNumber: itNumber.trim() })
      });

      if (response.ok) {
        const updatedGroup = await response.json();
        setItNumber('');
        setSuggestions([]);
        onClose();
        if (onMemberAdded) onMemberAdded(updatedGroup);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to add member');
      }
    } catch (error) {
      setError('Error adding member: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">Add Member to {group.name}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleAddMember} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {/* IT Number Input */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IT Number *
            </label>
            <input
              type="text"
              value={itNumber}
              onChange={(e) => handleItNumberChange(e.target.value)}
              placeholder="e.g., IT001234"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                {suggestions.map((user, idx) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => handleSuggestionSelect(user)}
                    onMouseEnter={() => setActiveSuggestionIndex(idx)}
                    onMouseLeave={() => setActiveSuggestionIndex(null)}
                    className={`w-full text-left px-4 py-2 flex items-center justify-between ${
                      activeSuggestionIndex === idx
                        ? 'bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{user.itNumber}</div>
                      <div className="text-xs text-gray-500">{user.name}</div>
                      {user.academicYear && (
                        <div className="text-xs text-gray-400">
                          Year {user.academicYear} Sem {user.semester}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
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
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
