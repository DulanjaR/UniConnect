import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { groupsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import GroupFeedSection from '../components/GroupFeedSection';
import {
  getApiErrorDetails,
  GROUP_DESCRIPTION_MAX_LENGTH,
  GROUP_NAME_MAX_LENGTH,
  validateGroupForm,
  validateMemberEmail
} from '../utils/groupValidation';

export default function GroupDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [managementForm, setManagementForm] = useState({
    name: '',
    description: '',
    image: '',
    privacy: 'public'
  });
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [managementErrors, setManagementErrors] = useState({});
  const [memberErrors, setMemberErrors] = useState({});
  const [busyAction, setBusyAction] = useState('');

  const canManage = user?.role === 'admin' || group?.currentUserRole === 'group_admin';

  const loadGroup = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const [groupResponse, membersResponse] = await Promise.all([
        groupsAPI.getById(id),
        groupsAPI.getMembers(id)
      ]);

      const nextGroup = groupResponse.data.group;
      setGroup(nextGroup);
      setMembers(membersResponse.data.members || []);
      setManagementForm({
        name: nextGroup.name || '',
        description: nextGroup.description || '',
        image: nextGroup.image || '',
        privacy: nextGroup.privacy || 'public'
      });

      if (user?.role === 'admin' || nextGroup.currentUserRole === 'group_admin') {
        const requestsResponse = await groupsAPI.getJoinRequests(id);
        setJoinRequests(requestsResponse.data.requests || []);
      } else {
        setJoinRequests([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroup();
  }, [id, user?.role]);

  const handleJoin = async () => {
    try {
      setBusyAction('join');
      setError('');
      setSuccessMessage('');
      await groupsAPI.join(id);
      await loadGroup();
      setSuccessMessage(group?.privacy === 'private' ? 'Join request submitted.' : 'Joined group successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join group');
    } finally {
      setBusyAction('');
    }
  };

  const handleLeave = async () => {
    try {
      setBusyAction('leave');
      setError('');
      setSuccessMessage('');
      await groupsAPI.leave(id);
      navigate('/groups');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to leave group');
    } finally {
      setBusyAction('');
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    const nextErrors = validateGroupForm(managementForm);
    if (Object.keys(nextErrors).length > 0) {
      setSuccessMessage('');
      setManagementErrors(nextErrors);
      setError('Please fix the highlighted group fields.');
      return;
    }

    try {
      setBusyAction('update');
      setError('');
      setSuccessMessage('');
      setManagementErrors({});
      await groupsAPI.update(id, managementForm);
      await loadGroup();
      setSuccessMessage('Group updated successfully.');
    } catch (err) {
      const { message, errors } = getApiErrorDetails(err);
      setManagementErrors(errors);
      setError(message || 'Failed to update group');
    } finally {
      setBusyAction('');
    }
  };

  const handleDelete = async () => {
    try {
      setBusyAction('delete');
      setError('');
      setSuccessMessage('');
      await groupsAPI.delete(id);
      navigate('/groups');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete group');
    } finally {
      setBusyAction('');
    }
  };

  const handleAddMember = async (event) => {
    event.preventDefault();
    const emailError = validateMemberEmail(inviteEmail);
    if (emailError) {
      setSuccessMessage('');
      setMemberErrors({ email: emailError });
      setError('Please fix the highlighted member field.');
      return;
    }

    try {
      setBusyAction('add-member');
      setError('');
      setSuccessMessage('');
      setMemberErrors({});
      await groupsAPI.addMember(id, { email: inviteEmail });
      setInviteEmail('');
      await loadGroup();
      setSuccessMessage('Member added successfully.');
    } catch (err) {
      const { message, errors } = getApiErrorDetails(err);
      setMemberErrors({
        email: errors.email || errors.memberIdentifier || message || 'Failed to add member'
      });
      setError(message || 'Failed to add member');
    } finally {
      setBusyAction('');
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      setBusyAction(`remove-${userId}`);
      setError('');
      setSuccessMessage('');
      await groupsAPI.removeMember(id, userId);
      await loadGroup();
      setSuccessMessage('Member removed successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setBusyAction('');
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      setBusyAction(`role-${userId}`);
      setError('');
      setSuccessMessage('');
      await groupsAPI.updateMemberRole(id, userId, { role });
      await loadGroup();
      setSuccessMessage('Member role updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update member role');
    } finally {
      setBusyAction('');
    }
  };

  const handleJoinRequest = async (requestId, status) => {
    try {
      setBusyAction(`request-${requestId}`);
      setError('');
      setSuccessMessage('');
      await groupsAPI.reviewJoinRequest(id, requestId, { status });
      await loadGroup();
      setSuccessMessage(`Join request ${status}.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to review join request');
    } finally {
      setBusyAction('');
    }
  };

  if (loading) {
    return <div className="card text-gray-500">Loading group...</div>;
  }

  if (!group) {
    return <div className="card text-red-700">{error || 'Group not found'}</div>;
  }

  const groupAdmins = members.filter((member) => member.role === 'group_admin');

  return (
    <div className="space-y-8">
      {error && <div className="rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-red-700">{error}</div>}
      {successMessage && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-100 px-4 py-3 text-emerald-700">
          {successMessage}
        </div>
      )}

      <section className="card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="section-title">{group.name}</h1>
              <span className={group.privacy === 'private' ? 'badge-secondary' : 'badge-primary'}>
                {group.privacy}
              </span>
              {group.currentUserRole && <span className="badge-primary">Your role: {group.currentUserRole}</span>}
            </div>
            <p className="max-w-3xl text-gray-700">{group.description || 'No description provided.'}</p>
            <div className="text-sm text-gray-500">
              Created by {group.createdBy?.name || 'Unknown'} • {group.memberCount} members • {group.adminCount} admins • {group.messageCount || 0} messages
            </div>
            {group.image && (
              <img
                src={group.image}
                alt={group.name}
                className="h-52 w-full max-w-2xl rounded-2xl object-cover"
              />
            )}
          </div>

          <div className="flex flex-wrap gap-3 lg:max-w-sm">
            {!group.isMember && !group.joinRequestStatus && user && (
              <button className="btn-primary" type="button" onClick={handleJoin} disabled={busyAction === 'join'}>
                {group.privacy === 'private' ? 'Request to Join' : 'Join Group'}
              </button>
            )}
            {!user && (
              <button className="btn-primary" type="button" onClick={() => navigate('/login')}>
                Login to Join
              </button>
            )}
            {group.joinRequestStatus === 'pending' && <span className="badge-secondary">Join request pending</span>}
            {group.isMember && (
              <button className="btn-outline" type="button" onClick={handleLeave} disabled={busyAction === 'leave'}>
                Leave Group
              </button>
            )}
            {canManage && (
              <button className="btn-outline border-red-600 text-red-700 hover:bg-red-700 hover:text-white" type="button" onClick={handleDelete} disabled={busyAction === 'delete'}>
                Delete Group
              </button>
            )}
          </div>
        </div>
      </section>

      <GroupFeedSection group={group} currentUser={user} />

      <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <div className="card space-y-5">
          <div>
            <h2 className="section-title text-2xl">Members</h2>
            <p className="text-sm text-gray-600">Group admins and members currently in this community.</p>
          </div>

          <div className="space-y-3">
            {members.map((member) => (
              <div key={member._id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-semibold text-primary-teal">{member.user?.name}</div>
                    <div className="text-sm text-gray-500">{member.user?.email}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={member.role === 'group_admin' ? 'badge-primary' : 'badge-secondary'}>
                        {member.role}
                      </span>
                      {group.createdBy?._id === member.user?._id && <span className="badge-secondary">Creator</span>}
                    </div>
                  </div>

                  {canManage && member.user?._id !== user?.id && (
                    <div className="flex flex-wrap gap-2">
                      {member.role === 'member' ? (
                        <button
                          className="btn-outline"
                          type="button"
                          onClick={() => handleRoleChange(member.user._id, 'group_admin')}
                          disabled={busyAction === `role-${member.user._id}`}
                        >
                          Promote Admin
                        </button>
                      ) : (
                        <button
                          className="btn-outline"
                          type="button"
                          onClick={() => handleRoleChange(member.user._id, 'member')}
                          disabled={busyAction === `role-${member.user._id}`}
                        >
                          Demote
                        </button>
                      )}
                      <button
                        className="btn-outline border-red-600 text-red-700 hover:bg-red-700 hover:text-white"
                        type="button"
                        onClick={() => handleRemoveMember(member.user._id)}
                        disabled={busyAction === `remove-${member.user._id}`}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            Admins: {groupAdmins.map((member) => member.user?.name).filter(Boolean).join(', ') || 'No admins listed'}
          </div>
        </div>

        <div className="space-y-8">
          {canManage && (
            <section className="card space-y-5">
              <div>
                <h2 className="section-title text-2xl">Manage Group</h2>
                <p className="text-sm text-gray-600">Only this group's admins and system admins can change these settings.</p>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Name</label>
                  <input
                    className="input-field"
                    value={managementForm.name}
                    onChange={(event) => {
                      setManagementForm((current) => ({ ...current, name: event.target.value }));
                      setManagementErrors((current) => ({ ...current, name: '' }));
                    }}
                    maxLength={GROUP_NAME_MAX_LENGTH}
                    required
                  />
                  <div className="mt-1 flex items-center justify-between gap-3 text-xs">
                    <span className="text-red-600">{managementErrors.name || ''}</span>
                    <span className="text-gray-500">
                      {managementForm.name.length}/{GROUP_NAME_MAX_LENGTH}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Description</label>
                  <textarea
                    className="input-field min-h-32"
                    value={managementForm.description}
                    onChange={(event) => {
                      setManagementForm((current) => ({ ...current, description: event.target.value }));
                      setManagementErrors((current) => ({ ...current, description: '' }));
                    }}
                    maxLength={GROUP_DESCRIPTION_MAX_LENGTH}
                  />
                  <div className="mt-1 flex items-center justify-between gap-3 text-xs">
                    <span className="text-red-600">{managementErrors.description || ''}</span>
                    <span className="text-gray-500">
                      {managementForm.description.length}/{GROUP_DESCRIPTION_MAX_LENGTH}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Image URL</label>
                  <input
                    className="input-field"
                    value={managementForm.image}
                    onChange={(event) => {
                      setManagementForm((current) => ({ ...current, image: event.target.value }));
                      setManagementErrors((current) => ({ ...current, image: '' }));
                    }}
                  />
                  {managementErrors.image && (
                    <p className="mt-1 text-sm text-red-600">{managementErrors.image}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Privacy</label>
                  <select
                    className="input-field"
                    value={managementForm.privacy}
                    onChange={(event) => {
                      setManagementForm((current) => ({ ...current, privacy: event.target.value }));
                      setManagementErrors((current) => ({ ...current, privacy: '' }));
                    }}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                  {managementErrors.privacy && (
                    <p className="mt-1 text-sm text-red-600">{managementErrors.privacy}</p>
                  )}
                </div>

                <button className="btn-primary" type="submit" disabled={busyAction === 'update'}>
                  Save Changes
                </button>
              </form>

              <form onSubmit={handleAddMember} className="space-y-3 border-t border-gray-200 pt-5">
                <div>
                  <label className="mb-2 block text-sm font-medium">Add Member by Email</label>
                  <input
                    className="input-field"
                    type="email"
                    value={inviteEmail}
                    onChange={(event) => {
                      setInviteEmail(event.target.value);
                      setMemberErrors((current) => ({ ...current, email: '' }));
                    }}
                    placeholder="student@university.edu"
                    required
                  />
                  {memberErrors.email && <p className="mt-1 text-sm text-red-600">{memberErrors.email}</p>}
                </div>
                <button className="btn-outline" type="submit" disabled={busyAction === 'add-member'}>
                  Add Member
                </button>
              </form>
            </section>
          )}

          {canManage && group.privacy === 'private' && (
            <section className="card space-y-5">
              <div>
                <h2 className="section-title text-2xl">Join Requests</h2>
                <p className="text-sm text-gray-600">Approve or reject pending requests for this private group.</p>
              </div>

              {joinRequests.length === 0 ? (
                <p className="text-gray-500">No pending join requests.</p>
              ) : (
                <div className="space-y-3">
                  {joinRequests.map((request) => (
                    <div key={request._id} className="rounded-xl border border-gray-200 p-4">
                      <div className="mb-3">
                        <div className="font-semibold text-primary-teal">{request.user?.name}</div>
                        <div className="text-sm text-gray-500">{request.user?.email}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="btn-primary"
                          type="button"
                          onClick={() => handleJoinRequest(request._id, 'approved')}
                          disabled={busyAction === `request-${request._id}`}
                        >
                          Approve
                        </button>
                        <button
                          className="btn-outline border-red-600 text-red-700 hover:bg-red-700 hover:text-white"
                          type="button"
                          onClick={() => handleJoinRequest(request._id, 'rejected')}
                          disabled={busyAction === `request-${request._id}`}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </section>
    </div>
  );
}
