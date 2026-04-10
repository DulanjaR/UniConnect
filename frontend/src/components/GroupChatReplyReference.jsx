import React from 'react';

export default function GroupChatReplyReference({
  senderName,
  preview,
  onClick,
  className = ''
}) {
  const content = (
    <div className={`rounded-xl border border-blue-100 bg-blue-50/80 px-3 py-2 text-left ${className}`}>
      <p className="border-l-2 border-blue-500 pl-2 text-xs font-bold text-slate-900">
        {senderName || 'Group member'}
      </p>
      <p className="mt-1 border-l-2 border-blue-200 pl-2 text-xs leading-5 text-slate-500 line-clamp-2 break-words">
        {preview || 'Original message'}
      </p>
    </div>
  );

  if (!onClick) {
    return content;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl text-left transition-transform duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      {content}
    </button>
  );
}
