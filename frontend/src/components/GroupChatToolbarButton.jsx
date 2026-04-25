import React from 'react';

const variantClasses = {
  secondary:
    'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900',
  primary:
    'border border-blue-600 bg-blue-600 text-white hover:border-blue-700 hover:bg-blue-700 shadow-sm shadow-blue-200/80'
};

export default function GroupChatToolbarButton({
  children,
  className = '',
  variant = 'secondary',
  ...props
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${variantClasses[variant] || variantClasses.secondary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
