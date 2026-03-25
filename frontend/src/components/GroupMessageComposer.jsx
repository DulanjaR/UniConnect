import React, { useEffect, useState } from 'react';

export default function GroupMessageComposer({
  onSubmit,
  submitLabel = 'Post Message',
  placeholder = 'Write something to the group...',
  initialValue = '',
  compact = false,
  disabled = false,
  onCancel
}) {
  const [content, setContent] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setContent(initialValue);
  }, [initialValue]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onSubmit(content.trim());
      if (!initialValue) {
        setContent('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-3' : 'card space-y-4'}>
      {error && <div className="rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-red-700">{error}</div>}
      <textarea
        className={`input-field ${compact ? 'min-h-24' : 'min-h-32'}`}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={placeholder}
        disabled={disabled || submitting}
      />
      <div className="flex flex-wrap gap-3">
        <button className="btn-primary" type="submit" disabled={disabled || submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button className="btn-outline" type="button" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
