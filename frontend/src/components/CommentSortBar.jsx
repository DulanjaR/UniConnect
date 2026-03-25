import React from 'react';

export default function CommentSortBar({ sort, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      <h3 className="text-xl font-bold text-primary-teal">Discussion</h3>
      <select value={sort} onChange={(e) => onChange(e.target.value)} className="input-field max-w-xs">
        <option value="default">Pinned / Top First</option>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="liked">Most Liked</option>
      </select>
    </div>
  );
}
