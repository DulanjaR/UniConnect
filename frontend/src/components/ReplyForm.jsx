import React from 'react';
import CommentForm from './CommentForm';

export default function ReplyForm({ onSubmit, onCancel }) {
  return (
    <CommentForm
      compact
      submitLabel="Reply"
      placeholder="Write a reply..."
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
}
