import React, { useEffect, useState } from 'react';
import { getApiErrorDetails, validateContent } from '../utils/groupValidation';

export default function GroupMessageComposer({
  onSubmit,
  submitLabel = 'Post Message',
  placeholder = 'Write something to the group...',
  initialValue = '',
  maxLength = 1000,
  fieldLabel = 'Message',
  compact = false,
  disabled = false,
  onCancel
}) {
  const [content, setContent] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setContent(initialValue);
    setError('');
  }, [initialValue]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateContent(content, {
      label: fieldLabel,
      maxLength
    });
    if (validationMessage) {
      setError(validationMessage);
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
      const { message, errors } = getApiErrorDetails(err);
      setError(errors.content || message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const characterCount = content.trim().length;

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-3' : 'card space-y-4'}>
      {error && <div className="rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-red-700">{error}</div>}
      <textarea
        className={`input-field ${compact ? 'min-h-24' : 'min-h-32'}`}
        value={content}
        onChange={(event) => {
          setContent(event.target.value);
          setError('');
        }}
        placeholder={placeholder}
        disabled={disabled || submitting}
      />
      <div className={`text-right text-xs ${characterCount > maxLength ? 'text-red-600' : 'text-gray-500'}`}>
        {characterCount}/{maxLength}
      </div>
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
