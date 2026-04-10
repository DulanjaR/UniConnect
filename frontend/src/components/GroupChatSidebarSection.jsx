import React from 'react';

export default function GroupChatSidebarSection({ icon, title, children, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 ${className}`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
          {icon}
        </div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      {children}
    </section>
  );
}
