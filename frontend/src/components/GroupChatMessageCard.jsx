import React, { forwardRef } from 'react';
import { CheckSquare, CornerUpLeft, Edit3, Pin, Trash2 } from 'lucide-react';

function ActionButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

const GroupChatMessageCard = forwardRef(function GroupChatMessageCard(
  {
    senderName,
    senderId,
    timestamp,
    isCurrentUser = false,
    isPinned = false,
    isHighlighted = false,
    canEdit = false,
    canDelete = false,
    canConvertToTask = false,
    onReply,
    onEdit,
    onDelete,
    onTogglePin,
    onConvertToTask,
    showActionsOnHover = true,
    children
  },
  ref
) {
  const hoverActionClasses = showActionsOnHover
    ? 'md:opacity-0 md:pointer-events-none md:translate-y-1 md:group-hover:opacity-100 md:group-hover:pointer-events-auto md:group-hover:translate-y-0 md:group-focus-within:opacity-100 md:group-focus-within:pointer-events-auto md:group-focus-within:translate-y-0'
    : '';

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} px-1`}>
      <div
        ref={ref}
        tabIndex={-1}
        className={`group w-full max-w-[42rem] rounded-2xl border px-4 py-3.5 shadow-sm transition-all duration-200 hover:-translate-y-px hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-200 ${
          isCurrentUser
            ? 'border-blue-200 bg-blue-50/70 shadow-blue-100/80'
            : 'border-slate-200 bg-white shadow-slate-200/80'
        } ${isHighlighted ? 'ring-2 ring-blue-300 shadow-lg shadow-blue-100/90' : ''}`}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold tracking-tight text-slate-900">
                {senderName || 'Group member'}
              </p>
              {senderId ? <span className="text-[11px] font-medium text-slate-400">{senderId}</span> : null}
              {isPinned ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                  <Pin className="h-3 w-3" />
                  Pinned
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[11px] font-medium text-slate-400">{timestamp}</p>
          </div>
        </div>

        <div className="min-w-0">{children}</div>

        <div
          className={`mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 transition-all duration-200 ${hoverActionClasses}`}
        >
          {onReply ? (
            <ActionButton
              onClick={onReply}
              aria-label="Reply to message"
              className="border border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100"
            >
              <CornerUpLeft className="h-3.5 w-3.5" />
              Reply
            </ActionButton>
          ) : null}

          {canEdit && onEdit ? (
            <ActionButton
              onClick={onEdit}
              aria-label="Edit message"
              className="border border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </ActionButton>
          ) : null}

          {canDelete && onDelete ? (
            <ActionButton
              onClick={onDelete}
              aria-label="Delete message"
              className="border border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </ActionButton>
          ) : null}

          {onTogglePin ? (
            <ActionButton
              onClick={onTogglePin}
              aria-label={isPinned ? 'Unpin message' : 'Pin message'}
              className="border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
            >
              <Pin className="h-3.5 w-3.5" />
              {isPinned ? 'Unpin' : 'Pin'}
            </ActionButton>
          ) : null}

          {canConvertToTask && onConvertToTask ? (
            <ActionButton
              onClick={onConvertToTask}
              aria-label="Convert message to task"
              className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              Convert to Task
            </ActionButton>
          ) : null}
        </div>
      </div>
    </div>
  );
});

export default GroupChatMessageCard;
