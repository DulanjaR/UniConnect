import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const apiClient = axios.create({
  baseURL: API_URL
});

export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (data) => apiClient.put('/auth/profile', data)
};

// Posts API
export const postsAPI = {
  getAll: (params) => apiClient.get('/posts', { params }),
  getFeed: (params) => apiClient.get('/posts/feed', { params }),
  getById: (id) => apiClient.get(`/posts/${id}`),
  getByAuthor: (authorId) => apiClient.get(`/posts/author/${authorId}`),
  create: (data) => apiClient.post('/posts', data),
  update: (id, data) => apiClient.put(`/posts/${id}`, data),
  delete: (id) => apiClient.delete(`/posts/${id}`),
  like: (id) => apiClient.post(`/posts/${id}/like`)
};

// Comments API
export const commentsAPI = {
  getByPost: (postId, params) => apiClient.get(`/comments/post/${postId}`, { params }),
  create: (data) => apiClient.post('/comments', data),
  update: (id, data) => apiClient.put(`/comments/${id}`, data),
  delete: (id) => apiClient.delete(`/comments/${id}`),
  like: (id) => apiClient.post(`/comments/${id}/like`),
  unlike: (id) => apiClient.post(`/comments/${id}/unlike`),
  reply: (id, data) => apiClient.post(`/comments/${id}/reply`, data),
  toggleTop: (id, data) => apiClient.patch(`/comments/${id}/top`, data),
  togglePin: (id, data) => apiClient.patch(`/comments/${id}/pin`, data),
  report: (id, data) => apiClient.post(`/comments/${id}/report`, data)
};

export const notificationsAPI = {
  getAll: () => apiClient.get('/notifications'),
  markRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch('/notifications/read-all')
};

// Lost Items API
export const lostItemsAPI = {
  getAll: (params) => apiClient.get('/lost-items', { params }),
  getById: (id) => apiClient.get(`/lost-items/${id}`),
  create: (data) => apiClient.post('/lost-items', data),
  update: (id, data) => apiClient.put(`/lost-items/${id}`, data),
  delete: (id) => apiClient.delete(`/lost-items/${id}`),
  resolve: (id, data) => apiClient.post(`/lost-items/${id}/resolve`, data),
  addComment: (id, data) => apiClient.post(`/lost-items/${id}/comment`, data),
  flag: (id, data) => apiClient.post(`/lost-items/${id}/flag`, data)
};

export const groupsAPI = {
  getAll: (params) => apiClient.get('/groups', { params }),
  getMine: () => apiClient.get('/groups/mine'),
  getById: (id) => apiClient.get(`/groups/${id}`),
  create: (data) => apiClient.post('/groups', data),
  update: (id, data) => apiClient.put(`/groups/${id}`, data),
  delete: (id) => apiClient.delete(`/groups/${id}`),
  join: (id) => apiClient.post(`/groups/${id}/join`),
  leave: (id) => apiClient.post(`/groups/${id}/leave`),
  getMembers: (id) => apiClient.get(`/groups/${id}/members`),
  addMember: (id, data) => apiClient.post(`/groups/${id}/members`, data),
  removeMember: (id, userId) => apiClient.delete(`/groups/${id}/members/${userId}`),
  updateMemberRole: (id, userId, data) => apiClient.patch(`/groups/${id}/members/${userId}/role`, data),
  getJoinRequests: (id) => apiClient.get(`/groups/${id}/join-requests`),
  reviewJoinRequest: (id, requestId, data) =>
    apiClient.patch(`/groups/${id}/join-requests/${requestId}`, data),
  getMessages: (id, params) => apiClient.get(`/groups/${id}/messages`, { params }),
  getMessage: (id, messageId) => apiClient.get(`/groups/${id}/messages/${messageId}`),
  createMessage: (id, data) => apiClient.post(`/groups/${id}/messages`, data),
  updateMessage: (id, messageId, data) => apiClient.put(`/groups/${id}/messages/${messageId}`, data),
  deleteMessage: (id, messageId) => apiClient.delete(`/groups/${id}/messages/${messageId}`),
  likeMessage: (id, messageId) => apiClient.post(`/groups/${id}/messages/${messageId}/like`),
  createReply: (id, messageId, data) => apiClient.post(`/groups/${id}/messages/${messageId}/replies`, data),
  updateReply: (id, messageId, replyId, data) =>
    apiClient.put(`/groups/${id}/messages/${messageId}/replies/${replyId}`, data),
  deleteReply: (id, messageId, replyId) =>
    apiClient.delete(`/groups/${id}/messages/${messageId}/replies/${replyId}`),
  likeReply: (id, messageId, replyId) =>
    apiClient.post(`/groups/${id}/messages/${messageId}/replies/${replyId}/like`)
};

// Admin API
export const adminAPI = {
  getDashboardStats: () => apiClient.get('/admin/dashboard/stats'),
  getActivityReport: (params) => apiClient.get('/admin/activity-report', { params }),
  getAllPosts: (params) => apiClient.get('/admin/posts', { params }),
  getAllComments: (params) => apiClient.get('/admin/comments', { params }),
  updateCommentStatus: (id, data) => apiClient.patch(`/admin/comments/${id}/status`, data),
  deleteComment: (id) => apiClient.delete(`/admin/comments/${id}`),
  getCommentReports: (params) => apiClient.get('/admin/comments/reports', { params }),
  reviewComment: (id, data) => apiClient.patch(`/admin/comments/${id}/review`, data),
  getAllLostItems: (params) => apiClient.get('/admin/lost-items', { params }),
  getAllUsers: (params) => apiClient.get('/admin/users', { params }),
  getAdminLogs: (params) => apiClient.get('/admin/logs', { params }),
  suspendUser: (userId, data) => apiClient.post(`/admin/users/${userId}/suspend`, data),
  restoreUser: (userId) => apiClient.post(`/admin/users/${userId}/restore`),
  updateUserCommentModeration: (userId, data) =>
    apiClient.patch(`/admin/users/${userId}/comment-moderation`, data),
  getAllGroups: (params) => apiClient.get('/admin/groups', { params }),
  deleteGroup: (id, data) => apiClient.delete(`/admin/groups/${id}`, { data })
};
