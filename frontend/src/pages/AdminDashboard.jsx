import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BarChart3, Users, Mail, AlertCircle, Download, Eye, Check, X, Lock, Unlock, Trash2, Edit2, Eye as EyeIcon } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminDashboard() {
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('stats');
  const [resolvedClaimsMap, setResolvedClaimsMap] = useState({});
  
  // Stats
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Users
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  
  // Lost Items
  const [lostItems, setLostItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsTotal, setItemsTotal] = useState(0);
  const [itemFilter, setItemFilter] = useState('');
  
  // Claims
  const [claims, setClaims] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsPage, setClaimsPage] = useState(1);
  const [claimsTotal, setClaimsTotal] = useState(0);
  const [claimsStatusFilter, setClaimsStatusFilter] = useState('pending');
  
  // Groups
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsPage, setGroupsPage] = useState(1);
  const [groupsTotal, setGroupsTotal] = useState(0);
  const [groupSearch, setGroupSearch] = useState('');
  
  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  
  // Form states
  const [userFormData, setUserFormData] = useState({});
  const [claimAction, setClaimAction] = useState('');
  
  // Notifications
  const [notification, setNotification] = useState('');

  // Check if user is admin
  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Fetch stats
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await axios.get(`${API_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch users
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [usersPage, userSearch, activeTab]);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await axios.get(`${API_URL}/admin/users`, {
        params: { page: usersPage, limit: 10, search: userSearch },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(res.data.users);
      setUsersTotal(res.data.pagination.total);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch lost items
  useEffect(() => {
    if (activeTab === 'items') {
      fetchLostItems();
    }
  }, [itemsPage, itemFilter, activeTab]);

  const fetchLostItems = async () => {
    try {
      setItemsLoading(true);
      const res = await axios.get(`${API_URL}/admin/lost-items`, {
        params: { page: itemsPage, limit: 10, status: itemFilter || undefined },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setLostItems(res.data.items);
      setItemsTotal(res.data.pagination.total);
    } catch (err) {
      console.error('Error fetching lost items:', err);
    } finally {
      setItemsLoading(false);
    }
  };

  useEffect(() => {
  if (activeTab === 'items' && lostItems.length > 0) {
    fetchResolvedClaims();
  }
}, [lostItems, activeTab]);

const fetchResolvedClaims = async () => {
  try {
    const resolvedItems = lostItems.filter((item) => item.status === 'resolved');

    if (resolvedItems.length === 0) {
      setResolvedClaimsMap({});
      return;
    }

    const results = await Promise.all(
      resolvedItems.map(async (item) => {
        try {
          const res = await axios.get(`${API_URL}/claims/item/${item._id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          return { itemId: item._id, claim: res.data };
        } catch (err) {
          return { itemId: item._id, claim: null };
        }
      })
    );

    const mappedClaims = {};
    results.forEach(({ itemId, claim }) => {
      mappedClaims[itemId] = claim;
    });

    setResolvedClaimsMap(mappedClaims);
  } catch (err) {
    console.error('Error fetching resolved claims:', err);
  }
};

  // Fetch claims
  useEffect(() => {
    if (activeTab === 'claims') {
      fetchClaims();
    }
  }, [claimsPage, claimsStatusFilter, activeTab]);

  const fetchClaims = async () => {
    try {
      setClaimsLoading(true);
      const params = { page: claimsPage, limit: 10 };
      if (claimsStatusFilter) {
        params.status = claimsStatusFilter;
      }
      const res = await axios.get(`${API_URL}/claims`, {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setClaims(res.data.claims || res.data);
      if (res.data.pagination) {
        setClaimsTotal(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Error fetching claims:', err);
      setClaims([]);
    } finally {
      setClaimsLoading(false);
    }
  };

  // Fetch groups
  useEffect(() => {
    if (activeTab === 'groups') {
      fetchGroups();
    }
  }, [groupsPage, groupSearch, activeTab]);

  const fetchGroups = async () => {
    try {
      setGroupsLoading(true);
      const res = await axios.get(`${API_URL}/admin/groups`, {
        params: { page: groupsPage, limit: 10, search: groupSearch },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setGroups(res.data.groups);
      setGroupsTotal(res.data.pagination.total);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  };

  // Edit user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserFormData({
      fullName: user.name,
      email: user.email,
      role: user.role || 'student'
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    try {
      await axios.put(`${API_URL}/admin/users/${selectedUser._id}`, userFormData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotification('User updated successfully');
      setShowUserModal(false);
      fetchUsers();
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      setNotification('Error updating user: ' + err.response?.data?.message);
    }
  };

  // Suspend/Restore user
  const handleToggleSuspend = async (userId, isActive) => {
    try {
      if (isActive) {
        await axios.post(`${API_URL}/admin/users/${userId}/suspend`, 
          { reason: 'Admin suspension' },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setNotification('User suspended');
      } else {
        await axios.post(`${API_URL}/admin/users/${userId}/restore`, {},
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setNotification('User restored');
      }
      fetchUsers();
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      setNotification('Error: ' + err.response?.data?.message);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`${API_URL}/admin/users/${userId}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        setNotification('User deleted');
        fetchUsers();
        setTimeout(() => setNotification(''), 3000);
      } catch (err) {
        setNotification('Error: ' + err.response?.data?.message);
      }
    }
  };

  // Handle claim appeal
  const handleClaimAction = (claim, action) => {
    setSelectedClaim(claim);
    setClaimAction(action);
    setShowClaimModal(true);
  };

  const handleProcessClaim = async () => {
    try {
      await axios.put(`${API_URL}/claims/${selectedClaim._id}`, 
        { status: claimAction },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setNotification(`Claim ${claimAction}`);
      setShowClaimModal(false);
      fetchClaims();
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      setNotification('Error: ' + err.response?.data?.message);
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    const element = document.getElementById('stats-content');
    try {
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('admin-stats.pdf');
      setNotification('PDF exported successfully');
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      setNotification('Error exporting PDF');
    }
  };

  const getClaimStatusStyle = (status) => {
  if (status === "approved") return "bg-green-100 text-green-700 border border-green-200";
  if (status === "rejected") return "bg-red-100 text-red-700 border border-red-200";
  return "bg-yellow-100 text-yellow-700 border border-yellow-200";
};

const getItemTypeStyle = (type) => {
  if (type === "found") return "bg-green-100 text-green-700 border border-green-200";
  return "bg-red-100 text-red-700 border border-red-200";
};

const getItemStatusStyle = (status) => {
  if (status === "resolved") return "bg-purple-100 text-purple-700 border border-purple-200";
  if (status === "removed") return "bg-red-100 text-red-700 border border-red-200";
  return "bg-blue-100 text-blue-700 border border-blue-200";
};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-teal text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-slate-200 mt-1 font-medium">Welcome, {currentUser?.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 mx-6 mt-4 rounded">
          {notification}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {[
              { id: 'stats', label: 'Dashboard', icon: '📊' },
              { id: 'users', label: 'Users', icon: '👥' },
              { id: 'items', label: 'Lost Items', icon: '📦' },
              { id: 'groups', label: 'Groups', icon: '👨‍👩‍👧‍👦' },
              { id: 'claims', label: 'Claims Appeal', icon: '🔔' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-4 font-semibold border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-primary-teal text-primary-teal'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard Stats */}
        {activeTab === 'stats' && (
          <div id="stats-content">
            {loadingStats ? (
              <p className="text-center py-8">Loading...</p>
            ) : stats ? (
              <div>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                  {[
                    { label: 'Total Users', value: stats.users, icon: '👥', color: 'bg-blue-500' },
                    { label: 'Total Posts', value: stats.posts, icon: '📝', color: 'bg-green-500' },
                    { label: 'Total Groups', value: stats.groups || 0, icon: '👨‍👩‍👧‍👦', color: 'bg-indigo-500' },
                    { label: 'Lost Items', value: stats.lostItems?.lost || 0, icon: '🔍', color: 'bg-orange-500' },
                    { label: 'Found Items', value: stats.lostItems?.found || 0, icon: '✅', color: 'bg-purple-500' },
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                        </div>
                        <div className={`${stat.color} text-white p-3 rounded-lg text-2xl`}>
                          {stat.icon}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Lost & Found Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Resolved Items</span>
                        <span className="font-bold text-green-600">{stats.lostItems?.resolved || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Flagged Items</span>
                        <span className="font-bold text-red-600">{stats.lostItems?.flagged || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Comments</span>
                        <span className="font-bold text-blue-600">{stats.comments || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                    <button
                      onClick={exportToPDF}
                      className="w-full flex items-center justify-center px-4 py-2 bg-primary-teal text-white rounded-lg hover:bg-opacity-90 transition"
                    >
                      <Download size={20} className="mr-2" />
                      Export as PDF
                    </button>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">System Info</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Admin Name:</strong> {currentUser?.name}</p>
                      <p><strong>Email:</strong> {currentUser?.email}</p>
                      <p><strong>Last Updated:</strong> {new Date().toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                {stats.recentActivity && stats.recentActivity.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {stats.recentActivity.slice(0, 5).map((activity, idx) => (
                        <div key={idx} className="flex items-center justify-between border-b pb-3">
                          <div>
                            <p className="font-medium text-gray-900">{activity.action}</p>
                            <p className="text-sm text-gray-500">{new Date(activity.createdAt).toLocaleString()}</p>
                          </div>
                          <span className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full">
                            {activity.admin?.name || 'System'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500">Unable to load statistics</p>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUsersPage(1); }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {usersLoading ? (
              <p className="text-center py-8">Loading...</p>
            ) : users.length > 0 ? (
              <div>
                <div className="bg-white shadow overflow-hidden rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              user.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleToggleSuspend(user._id, user.isActive)}
                                className={`${user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                title={user.isActive ? 'Suspend' : 'Restore'}
                              >
                                {user.isActive ? <Lock size={18} /> : <Unlock size={18} />}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="mt-6 flex justify-center space-x-2">
                  <button
                    onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                    disabled={usersPage === 1}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">{usersPage} / {Math.ceil(usersTotal / 10)}</span>
                  <button
                    onClick={() => setUsersPage(p => p + 1)}
                    disabled={usersPage >= Math.ceil(usersTotal / 10)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No users found</p>
            )}
          </div>
        )}

        {/* Lost Items Tab */}
        {activeTab === 'items' && (
  <div>
    <div className="mb-6 flex space-x-4">
      <select
        value={itemFilter}
        onChange={(e) => {
          setItemFilter(e.target.value);
          setItemsPage(1);
        }}
        className="px-4 py-2 border border-gray-300 rounded-lg"
      >
        <option value="">All Items</option>
        <option value="active">Active</option>
        <option value="resolved">Resolved</option>
        <option value="removed">Removed</option>
      </select>
    </div>

    {itemsLoading ? (
      <p className="text-center py-8">Loading...</p>
    ) : lostItems.length > 0 ? (
      <div className="space-y-5">
        {lostItems.map((item) => {
          const collectorClaim = resolvedClaimsMap[item._id];

          return (
            <div
              key={item._id}
              className="bg-white rounded-[28px] shadow-sm border border-slate-200 hover:shadow-md transition p-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Image */}
                <div className="lg:col-span-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 h-full flex items-center justify-center">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        onClick={() => setPreviewImage(item.images[0])}
                        className="w-full h-56 object-contain rounded-xl cursor-pointer hover:scale-105 transition"
                      />
                    ) : (
                      <div className="text-slate-400 text-sm">No Image</div>
                    )}
                  </div>
                </div>

                {/* Main details */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-2xl font-bold text-slate-800 break-words">
                        {item.title}
                      </h3>
                      <p className="text-slate-600 mt-2 break-words">
                        {item.description}
                      </p>
                    </div>

                    {item.flagged && (
                      <div className="bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded-full text-sm font-semibold">
                        ⚠️ Flagged
                      </div>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                        Type
                      </p>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getItemTypeStyle(
                          item.itemType
                        )}`}
                      >
                        {item.itemType}
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                        Status
                      </p>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getItemStatusStyle(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                        Category
                      </p>
                      <p className="text-base font-semibold text-slate-800 capitalize">
                        {item.category}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                        Reporter
                      </p>
                      <p className="text-base font-semibold text-slate-800">
                        {item.reporter?.name || 'N/A'}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                        Location
                      </p>
                      <p className="text-base font-semibold text-slate-800 break-words">
                        {item.location || 'N/A'}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                        Date of Incident
                      </p>
                      <p className="text-base font-semibold text-slate-800">
                        {item.dateOfIncident
                          ? new Date(item.dateOfIncident).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {item.status === 'resolved' && collectorClaim && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-4">
                      <h4 className="text-lg font-bold text-green-700 mb-3">
                        Collector Details
                      </h4>

                      <div className="grid sm:grid-cols-2 gap-4 text-slate-700">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                            Name
                          </p>
                          <p className="font-medium">{collectorClaim.name || 'N/A'}</p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                            Student ID
                          </p>
                          <p className="font-medium">{collectorClaim.studentId || 'N/A'}</p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                            Email
                          </p>
                          <p className="font-medium break-words">
                            {collectorClaim.email || 'N/A'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                            Claim Status
                          </p>
                          <p className="font-medium capitalize">
                            {collectorClaim.status || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {collectorClaim.idCardImage && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-slate-700 mb-2">
                            Student ID Card Photo
                          </p>
                          <div className="rounded-2xl border border-green-200 bg-white p-3 w-fit shadow-sm">
                            <img
                              src={collectorClaim.idCardImage}
                              alt="Student ID Card"
                              onClick={() => setPreviewImage(collectorClaim.idCardImage)}
                              className="w-56 h-36 object-contain rounded-xl bg-slate-50 cursor-pointer hover:scale-105 transition"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Extra admin info */}
                <div className="lg:col-span-3">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-5 text-white h-full">
                    <h4 className="text-lg font-bold mb-4">Admin View</h4>

                    <div className="space-y-3 text-sm text-slate-200">
                      <p>
                        <span className="font-semibold text-white">Comments:</span>{' '}
                        {item.comments?.length || 0}
                      </p>
                      <p>
                        <span className="font-semibold text-white">Views:</span>{' '}
                        {item.views || 0}
                      </p>
                      <p>
                        <span className="font-semibold text-white">Flagged:</span>{' '}
                        {item.flagged ? 'Yes' : 'No'}
                      </p>
                      {item.flagReason && (
                        <p className="break-words">
                          <span className="font-semibold text-white">Flag Reason:</span>{' '}
                          {item.flagReason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div className="mt-6 flex justify-center space-x-2">
          <button
            onClick={() => setItemsPage((p) => Math.max(1, p - 1))}
            disabled={itemsPage === 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">{itemsPage} / {Math.ceil(itemsTotal / 10)}</span>
          <button
            onClick={() => setItemsPage((p) => p + 1)}
            disabled={itemsPage >= Math.ceil(itemsTotal / 10)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    ) : (
      <p className="text-center text-gray-500 py-8">No lost items found</p>
    )}
  </div>
)}

        {/* Claims Tab */}
        {activeTab === 'claims' && (
  <div>
    <div className="mb-6 flex space-x-4">
      <select
        value={claimsStatusFilter}
        onChange={(e) => {
          setClaimsStatusFilter(e.target.value);
          setClaimsPage(1);
        }}
        className="px-4 py-2 border border-gray-300 rounded-lg"
      >
        <option value="">All Claims</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>

    {claimsLoading ? (
      <p className="text-center py-8">Loading...</p>
    ) : claims.length > 0 ? (
      <div className="space-y-6">
        {claims.map((claim) => (
          <div
            key={claim._id}
            className="bg-white rounded-[28px] shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 overflow-hidden"
          >
            <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/70">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Claim Review</h3>
                  <p className="text-sm text-slate-500">
                    Submitted by {claim.name}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit px-3 py-1 rounded-full text-sm font-semibold ${getClaimStatusStyle(
                    claim.status
                  )}`}
                >
                  {claim.status}
                </span>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Claimant Details */}
              <div className="xl:col-span-4 bg-slate-50 rounded-2xl border border-slate-200 p-5">
                <h4 className="text-lg font-bold text-slate-800 mb-4">
                  Claimant Details
                </h4>

                <div className="space-y-3 text-slate-700">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Name
                    </span>
                    <span className="text-base font-medium">{claim.name}</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Student ID
                    </span>
                    <span className="text-base font-medium">{claim.studentId}</span>
                  </div>

                  <div className="flex flex-col break-all">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Claim Email
                    </span>
                    <span className="text-base font-medium">{claim.email}</span>
                  </div>

                  {claim.userId?.name && (
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        User Account
                      </span>
                      <span className="text-base font-medium">{claim.userId.name}</span>
                    </div>
                  )}

                  {claim.userId?.email && (
                    <div className="flex flex-col break-all">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Account Email
                      </span>
                      <span className="text-base font-medium">{claim.userId.email}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <p className="text-sm font-semibold text-slate-700 mb-3">
                    Student ID Card
                  </p>

                  {claim.idCardImage ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 w-fit shadow-sm">
                      <img
                        src={claim.idCardImage}
                        alt="ID Card"
                        onClick={() => setPreviewImage(claim.idCardImage)}
                        className="w-56 h-36 object-contain rounded-xl bg-slate-50 cursor-pointer hover:scale-105 transition"
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-400 text-sm text-center">
                      No ID card uploaded
                    </div>
                  )}
                </div>
              </div>

              {/* Claimed Item */}
              <div className="xl:col-span-4 bg-slate-50 rounded-2xl border border-slate-200 p-5">
                <h4 className="text-lg font-bold text-slate-800 mb-4">
                  Claimed Item
                </h4>

                {claim.itemId ? (
                  <div className="space-y-4">
                    <div className="space-y-3 text-slate-700">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Title
                        </span>
                        <span className="text-base font-medium">
                          {claim.itemId.title}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Description
                        </span>
                        <span className="text-base font-medium break-words">
                          {claim.itemId.description || "N/A"}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Location
                        </span>
                        <span className="text-base font-medium">
                          {claim.itemId.location || "N/A"}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Category
                        </span>
                        <span className="text-base font-medium capitalize">
                          {claim.itemId.category || "N/A"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex w-fit px-3 py-1 rounded-full text-sm font-semibold ${getItemTypeStyle(
                            claim.itemId.itemType
                          )}`}
                        >
                          {claim.itemId.itemType}
                        </span>

                        <span
                          className={`inline-flex w-fit px-3 py-1 rounded-full text-sm font-semibold ${getItemStatusStyle(
                            claim.itemId.status
                          )}`}
                        >
                          {claim.itemId.status}
                        </span>
                      </div>
                    </div>

                    {claim.itemId.images && claim.itemId.images.length > 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-3 w-fit shadow-sm">
                        <img
                          src={claim.itemId.images[0]}
                          alt="Claimed item"
                          onClick={() => setPreviewImage(claim.itemId.images[0])}
                          className="w-56 h-40 object-contain rounded-xl bg-slate-50 cursor-pointer hover:scale-105 transition"
                        />
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-400 text-sm text-center">
                        No item image
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-400 text-sm text-center">
                    Item details not available
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="xl:col-span-4 flex flex-col">
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-5 text-white h-full flex flex-col justify-between">
                  <div>
                    <h4 className="text-lg font-bold mb-3">Actions</h4>
                    <p className="text-sm text-slate-200 leading-6">
                      Review the claimant information, compare the uploaded ID card
                      with the claimed item details, and then decide whether to
                      approve or reject the request.
                    </p>
                  </div>

                  <div className="mt-8">
                    {claim.status === "pending" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
                        <button
                          onClick={() => handleClaimAction(claim, "approved")}
                          className="w-full px-5 py-3 rounded-2xl text-white font-semibold bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition"
                        >
                          Approve Claim
                        </button>

                        <button
                          onClick={() => handleClaimAction(claim, "rejected")}
                          className="w-full px-5 py-3 rounded-2xl text-white font-semibold bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg transition"
                        >
                          Reject Claim
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`px-4 py-4 rounded-2xl text-center font-bold text-base shadow-sm ${
                          claim.status === "approved"
                            ? "bg-green-100 text-green-700 border border-green-300"
                            : "bg-red-100 text-red-700 border border-red-300"
                        }`}
                      >
                        {claim.status === "approved"
                          ? "✅ Claim Approved"
                          : "❌ Claim Rejected"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-center text-gray-500 py-8">No claims to review</p>
    )}
  </div>
)}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div>
            <div className="mb-6 flex space-x-4">
              <input
                type="text"
                placeholder="Search groups..."
                value={groupSearch}
                onChange={(e) => { setGroupSearch(e.target.value); setGroupsPage(1); }}
                className="px-4 py-2 border border-gray-300 rounded-lg flex-1"
              />
            </div>
            {groupsLoading ? (
              <p className="text-center py-8">Loading...</p>
            ) : groups.length > 0 ? (
              <div className="space-y-4">
                {groups.map((group) => (
                  <div key={group._id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            group.status === 'active' ? 'bg-green-100 text-green-800' :
                            group.status === 'archived' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {group.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-2">{group.description}</p>
                        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Creator</p>
                            <p className="font-semibold text-gray-900">{group.creator?.name}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Members</p>
                            <p className="font-semibold text-gray-900">{group.members?.length || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Type</p>
                            <p className="font-semibold text-gray-900">{group.isPrivate ? 'Private' : 'Public'}</p>
                          </div>
                        </div>
                        {group.members && group.members.length > 0 && (
                          <div className="mt-4">
                            <p className="text-gray-500 text-sm mb-2">Members:</p>
                            <div className="flex flex-wrap gap-2">
                              {group.members.slice(0, 5).map((member) => (
                                <span key={member.userId?._id} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                  {member.userId?.name}
                                </span>
                              ))}
                              {group.members.length > 5 && (
                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                  +{group.members.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No groups found</p>
            )}
          </div>
        )}
      </div>

      {/* User Edit Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-bold">Edit User</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={userFormData.fullName || ''}
                  onChange={(e) => setUserFormData({...userFormData, fullName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={userFormData.email || ''}
                  onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={userFormData.role || ''}
                  onChange={(e) => setUserFormData({...userFormData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 px-6 py-4 border-t">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="px-4 py-2 bg-primary-teal text-white rounded hover:bg-opacity-90"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-bold">Process Claim</h3>
              <button
                onClick={() => setShowClaimModal(false)}
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-700 mb-4">
                Are you sure you want to <strong>{claimAction}</strong> this claim from <strong>{selectedClaim?.name}</strong>?
              </p>
            </div>
            <div className="flex justify-end space-x-3 px-6 py-4 border-t">
              <button
                onClick={() => setShowClaimModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessClaim}
                className={`px-4 py-2 text-white rounded hover:bg-opacity-90 ${
                  claimAction === 'approved' ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                {claimAction.charAt(0).toUpperCase() + claimAction.slice(1)}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
  <div
    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
    onClick={() => setPreviewImage(null)}
  >
    <div
      className="relative max-w-4xl w-full px-4"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => setPreviewImage(null)}
        className="absolute top-2 right-6 bg-white text-black rounded-full w-10 h-10 text-lg font-bold shadow hover:bg-gray-100"
      >
        ✕
      </button>

      <div className="bg-white rounded-2xl p-4 shadow-2xl">
        <img
          src={previewImage}
          alt="Preview"
          className="w-full max-h-[80vh] object-contain rounded-xl"
        />
      </div>
    </div>
  </div>
)}
    </div>
  );
}
