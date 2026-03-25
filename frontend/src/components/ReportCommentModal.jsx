import React, { useState } from 'react';

const reasons = ['spam', 'offensive', 'irrelevant', 'harassment'];

export default function ReportCommentModal({ onClose, onSubmit }) {
  const [reason, setReason] = useState('spam');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await onSubmit({ reason, description });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to report comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="card w-full max-w-lg">
        <h3 className="section-title text-2xl">Report Comment</h3>
        {error && <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Reason</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="input-field">
              {reasons.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Details</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              className="input-field resize-vertical"
              placeholder="Add extra context for the admin team"
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
            <button type="button" onClick={onClose} className="btn-outline">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
