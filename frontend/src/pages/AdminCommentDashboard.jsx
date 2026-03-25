import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';

export default function AdminCommentDashboard() {
  const [comments, setComments] = useState([]);
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [commentsResponse, reportsResponse] = await Promise.all([
        adminAPI.getAllComments({ status, search, limit: 20 }),
        adminAPI.getCommentReports({ limit: 20 })
      ]);

      setComments(commentsResponse.data.comments);
      setReports(reportsResponse.data.reports);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load moderation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [status, search]);

  const handleStatusUpdate = async (commentId, nextStatus) => {
    await adminAPI.updateCommentStatus(commentId, { status: nextStatus });
    await fetchData();
  };

  const handleDelete = async (commentId) => {
    await adminAPI.deleteComment(commentId);
    await fetchData();
  };

  const handleSuspendUser = async (userId) => {
    await adminAPI.updateUserCommentModeration(userId, { suspend: true });
    await fetchData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="section-title">Admin Comment Dashboard</h1>
        <p className="text-gray-600">Review discussion quality, reported comments, and repeat abuse.</p>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search comments..."
            className="input-field"
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="reported">Reported</option>
            <option value="flagged">Flagged</option>
            <option value="hidden">Hidden</option>
            <option value="deleted">Deleted</option>
          </select>
          <button type="button" onClick={fetchData} className="btn-primary">
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      <section className="card overflow-x-auto">
        <h2 className="text-xl font-bold text-primary-teal mb-4">Comments</h2>
        {loading ? (
          <p className="text-gray-500">Loading comments...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="py-3 pr-4">Comment</th>
                <th className="py-3 pr-4">Author</th>
                <th className="py-3 pr-4">Post</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Reports</th>
                <th className="py-3 pr-4">Created</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((comment) => (
                <tr key={comment._id} className="border-b border-gray-100 align-top">
                  <td className="py-3 pr-4 max-w-md text-gray-700">{comment.text}</td>
                  <td className="py-3 pr-4">{comment.author?.name}</td>
                  <td className="py-3 pr-4">{comment.post?.title}</td>
                  <td className="py-3 pr-4 capitalize">{comment.status}</td>
                  <td className="py-3 pr-4">{comment.reportCount || 0}</td>
                  <td className="py-3 pr-4">{new Date(comment.createdAt).toLocaleDateString()}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="btn-outline !px-3 !py-1" onClick={() => handleStatusUpdate(comment._id, 'hidden')}>
                        Hide
                      </button>
                      <button type="button" className="btn-outline !px-3 !py-1" onClick={() => handleStatusUpdate(comment._id, 'flagged')}>
                        Flag
                      </button>
                      <button type="button" className="btn-outline !px-3 !py-1" onClick={() => handleStatusUpdate(comment._id, 'active')}>
                        Restore
                      </button>
                      <button type="button" className="btn-outline !px-3 !py-1" onClick={() => handleDelete(comment._id)}>
                        Delete
                      </button>
                      {comment.author?._id && (
                        <button type="button" className="btn-outline !px-3 !py-1" onClick={() => handleSuspendUser(comment.author._id)}>
                          Suspend User
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card overflow-x-auto">
        <h2 className="text-xl font-bold text-primary-teal mb-4">Recent Reports</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200">
              <th className="py-3 pr-4">Reason</th>
              <th className="py-3 pr-4">Comment</th>
              <th className="py-3 pr-4">Reported By</th>
              <th className="py-3 pr-4">Author</th>
              <th className="py-3 pr-4">Post</th>
              <th className="py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report._id} className="border-b border-gray-100">
                <td className="py-3 pr-4 capitalize">{report.reason}</td>
                <td className="py-3 pr-4">{report.comment?.text}</td>
                <td className="py-3 pr-4">{report.reportedBy?.name}</td>
                <td className="py-3 pr-4">{report.comment?.author?.name}</td>
                <td className="py-3 pr-4">{report.comment?.post?.title}</td>
                <td className="py-3">{new Date(report.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
