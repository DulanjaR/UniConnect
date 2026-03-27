import mongoose from 'mongoose';
import { Group } from '../models/Group.js';
import { GroupMember } from '../models/GroupMember.js';
import { GroupJoinRequest } from '../models/GroupJoinRequest.js';
import { GroupMessage } from '../models/GroupMessage.js';
import { User } from '../models/User.js';
import { AdminLog } from '../models/AdminLog.js';
import { createNotification } from '../utils/notifications.js';
import {
  ensureObjectId,
  validateAddMemberPayload,
  validateGroupPayload,
  validateGroupRole,
  validationError
} from '../utils/validation.js';

const parseNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const buildGroupPayload = async (groupDoc, currentUserId) => {
  const group = groupDoc.toObject ? groupDoc.toObject() : groupDoc;

  const [memberCount, adminCount, messageCount, membership, joinRequest] = await Promise.all([
    GroupMember.countDocuments({ groupId: group._id }),
    GroupMember.countDocuments({ groupId: group._id, role: 'group_admin' }),
    GroupMessage.countDocuments({ groupId: group._id }),
    currentUserId ? GroupMember.findOne({ groupId: group._id, userId: currentUserId }) : null,
    currentUserId
      ? GroupJoinRequest.findOne({ groupId: group._id, userId: currentUserId, status: 'pending' })
      : null
  ]);

  return {
    ...group,
    memberCount,
    adminCount,
    messageCount,
    isMember: Boolean(membership),
    currentUserRole: membership?.role || null,
    joinRequestStatus: joinRequest?.status || null
  };
};

const canAccessPrivateGroup = async (group, user) => {
  if (group.privacy === 'public') {
    return true;
  }

  if (!user) {
    return false;
  }

  if (user.role === 'admin') {
    return true;
  }

  const membership = await GroupMember.findOne({ groupId: group._id, userId: user.userId });
  return Boolean(membership);
};

const deleteGroupRecords = async (groupId) => {
  await Promise.all([
    Group.deleteOne({ _id: groupId }),
    GroupMember.deleteMany({ groupId }),
    GroupJoinRequest.deleteMany({ groupId }),
    GroupMessage.deleteMany({ groupId })
  ]);
};

const assertGroupAdminRemovalAllowed = async (groupId, userId) => {
  const membership = await GroupMember.findOne({ groupId, userId });
  if (!membership || membership.role !== 'group_admin') {
    return { allowed: true };
  }

  const [adminCount, memberCount] = await Promise.all([
    GroupMember.countDocuments({ groupId, role: 'group_admin' }),
    GroupMember.countDocuments({ groupId })
  ]);

  if (adminCount <= 1 && memberCount > 1) {
    return {
      allowed: false,
      message: 'Promote another member to group admin before removing the last group admin.'
    };
  }

  return { allowed: true };
};

const getTargetUser = async (userId, email) => {
  if (userId && isValidObjectId(userId)) {
    return User.findById(userId);
  }

  if (email) {
    return User.findOne({ email });
  }

  return null;
};

export const createGroup = async (req, res) => {
  try {
    const { errors, value } = validateGroupPayload(req.body);
    if (Object.keys(errors).length > 0) {
      return validationError(res, errors);
    }

    const group = await Group.create({
      ...value,
      createdBy: req.user.userId
    });

    await GroupMember.create({
      groupId: group._id,
      userId: req.user.userId,
      role: 'group_admin'
    });

    const populatedGroup = await Group.findById(group._id).populate('createdBy', 'name email profilePicture');
    const payload = await buildGroupPayload(populatedGroup, req.user.userId);

    res.status(201).json({
      message: 'Group created successfully',
      group: payload
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const listGroups = async (req, res) => {
  try {
    const page = parseNumber(req.query.page, 1);
    const limit = parseNumber(req.query.limit, 12);
    const skip = (page - 1) * limit;
    const { search, privacy } = req.query;

    const conditions = [];

    if (privacy && !['public', 'private'].includes(privacy)) {
      return validationError(res, {
        privacy: 'Privacy must be either "public" or "private"'
      });
    }

    if (search) {
      conditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (privacy) {
      conditions.push({ privacy });
    } else if (req.user?.role !== 'admin') {
      if (req.user) {
        const memberships = await GroupMember.find({ userId: req.user.userId }).select('groupId');
        const memberGroupIds = memberships.map((membership) => membership.groupId);
        conditions.push({
          $or: [{ privacy: 'public' }, { _id: { $in: memberGroupIds } }]
        });
      } else {
        conditions.push({ privacy: 'public' });
      }
    }

    const filter = conditions.length ? { $and: conditions } : {};

    const [groups, total] = await Promise.all([
      Group.find(filter)
        .populate('createdBy', 'name email profilePicture')
        .sort('-updatedAt')
        .skip(skip)
        .limit(limit),
      Group.countDocuments(filter)
    ]);

    const serializedGroups = await Promise.all(
      groups.map((group) => buildGroupPayload(group, req.user?.userId))
    );

    res.json({
      groups: serializedGroups,
      pagination: {
        total,
        pages: Math.ceil(total / limit) || 1,
        currentPage: page,
        limit
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyGroups = async (req, res) => {
  try {
    const memberships = await GroupMember.find({ userId: req.user.userId }).select('groupId role');
    const groupIds = memberships.map((membership) => membership.groupId);

    const groups = await Group.find({ _id: { $in: groupIds } })
      .populate('createdBy', 'name email profilePicture')
      .sort('-updatedAt');

    const serializedGroups = await Promise.all(
      groups.map((group) => buildGroupPayload(group, req.user.userId))
    );

    res.json({ groups: serializedGroups });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getGroup = async (req, res) => {
  try {
    const group = req.group;

    const allowed = await canAccessPrivateGroup(group, req.user);
    if (!allowed) {
      return res.status(403).json({ message: 'This private group is only available to members' });
    }

    const payload = await buildGroupPayload(group, req.user?.userId);

    res.json({ group: payload });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { errors, value } = validateGroupPayload(req.body, { partial: true });
    if (Object.keys(errors).length > 0) {
      return validationError(res, errors);
    }

    const group = await Group.findByIdAndUpdate(
      req.params.id,
      {
        ...(Object.prototype.hasOwnProperty.call(value, 'name') ? { name: value.name } : {}),
        ...(Object.prototype.hasOwnProperty.call(value, 'description')
          ? { description: value.description }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(value, 'image') ? { image: value.image } : {}),
        ...(Object.prototype.hasOwnProperty.call(value, 'privacy')
          ? { privacy: value.privacy }
          : {})
      },
      { new: true }
    ).populate('createdBy', 'name email profilePicture');

    const payload = await buildGroupPayload(group, req.user.userId);

    res.json({
      message: 'Group updated successfully',
      group: payload
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    await deleteGroupRecords(group._id);

    if (req.user.role === 'admin') {
      await AdminLog.create({
        admin: req.user.userId,
        action: 'delete-group',
        targetType: 'group',
        targetId: group._id,
        reason: 'Admin deleted group'
      });
    }

    res.json({ message: 'Group deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const joinGroup = async (req, res) => {
  try {
    const group = req.group;

    const existingMembership = await GroupMember.findOne({
      groupId: group._id,
      userId: req.user.userId
    });

    if (existingMembership) {
      return validationError(res, {
        membership: 'You are already a member of this group'
      });
    }

    const existingRequest = await GroupJoinRequest.findOne({
      groupId: group._id,
      userId: req.user.userId
    });

    if (group.privacy === 'public') {
      await GroupMember.create({
        groupId: group._id,
        userId: req.user.userId,
        role: 'member'
      });

      if (existingRequest) {
        existingRequest.status = 'approved';
        existingRequest.reviewedBy = req.user.userId;
        existingRequest.reviewedAt = new Date();
        await existingRequest.save();
      }

      const payload = await buildGroupPayload(group, req.user.userId);

      return res.status(201).json({
        message: 'Joined group successfully',
        group: payload
      });
    }

    if (existingRequest?.status === 'pending') {
      return res.status(200).json({
        message: 'Join request already pending',
        request: existingRequest
      });
    }

    const request = existingRequest
      ? await GroupJoinRequest.findByIdAndUpdate(
          existingRequest._id,
          {
            status: 'pending',
            reviewedBy: null,
            reviewedAt: null
          },
          { new: true }
        )
      : await GroupJoinRequest.create({
          groupId: group._id,
          userId: req.user.userId,
          status: 'pending'
        });

    res.status(202).json({
      message: 'Join request submitted',
      request
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const membership = await GroupMember.findOne({
      groupId: req.group._id,
      userId: req.user.userId
    });

    if (!membership) {
      return res.status(404).json({ message: 'You are not a member of this group' });
    }

    const permission = await assertGroupAdminRemovalAllowed(req.group._id, req.user.userId);
    if (!permission.allowed) {
      return validationError(res, {
        membership: permission.message
      });
    }

    await GroupMember.deleteOne({ _id: membership._id });
    await GroupJoinRequest.deleteMany({ groupId: req.group._id, userId: req.user.userId });

    const remainingMembers = await GroupMember.countDocuments({ groupId: req.group._id });
    if (remainingMembers === 0) {
      await deleteGroupRecords(req.group._id);
      return res.json({ message: 'You left the group and it was archived because it had no members' });
    }

    res.json({ message: 'You left the group successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const listGroupMembers = async (req, res) => {
  try {
    const allowed = await canAccessPrivateGroup(req.group, req.user);
    if (!allowed) {
      return res.status(403).json({ message: 'This private group is only available to members' });
    }

    const members = await GroupMember.find({ groupId: req.group._id })
      .populate('userId', 'name email profilePicture university role')
      .sort({ role: 1, joinedAt: 1 });

    res.json({
      members: members.map((member) => ({
        _id: member._id,
        role: member.role,
        joinedAt: member.joinedAt,
        user: member.userId
      })),
      total: members.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addGroupMember = async (req, res) => {
  try {
    const { errors, value } = validateAddMemberPayload(req.body);
    if (Object.keys(errors).length > 0) {
      return validationError(res, errors);
    }

    const { userId, email, role = 'member' } = value;
    const targetUser = await getTargetUser(userId, email);
    if (!targetUser) {
      return validationError(res, {
        [email ? 'email' : 'userId']: email
          ? 'No user found with that email address'
          : 'User not found'
      });
    }

    const existingMembership = await GroupMember.findOne({
      groupId: req.group._id,
      userId: targetUser._id
    });

    if (existingMembership) {
      return validationError(res, {
        [email ? 'email' : 'userId']: 'User is already a member of this group'
      });
    }

    const membership = await GroupMember.create({
      groupId: req.group._id,
      userId: targetUser._id,
      role
    });

    await GroupJoinRequest.findOneAndUpdate(
      { groupId: req.group._id, userId: targetUser._id },
      {
        status: 'approved',
        reviewedBy: req.user.userId,
        reviewedAt: new Date()
      }
    );

    await createNotification({
      receiver: targetUser._id,
      sender: req.user.userId,
      group: req.group._id,
      type: 'group-member-added',
      message: `${req.user.name} added you to the group "${req.group.name}".`
    });

    await membership.populate('userId', 'name email profilePicture university role');

    res.status(201).json({
      message: 'Member added successfully',
      member: {
        _id: membership._id,
        role: membership.role,
        joinedAt: membership.joinedAt,
        user: membership.userId
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const removeGroupMember = async (req, res) => {
  try {
    if (!ensureObjectId(res, req.params.userId, 'userId', 'member id')) {
      return;
    }

    const membership = await GroupMember.findOne({
      groupId: req.group._id,
      userId: req.params.userId
    });

    if (!membership) {
      return res.status(404).json({ message: 'Member not found in this group' });
    }

    const permission = await assertGroupAdminRemovalAllowed(req.group._id, req.params.userId);
    if (!permission.allowed) {
      return validationError(res, {
        userId: permission.message
      });
    }

    await GroupMember.deleteOne({ _id: membership._id });
    await GroupJoinRequest.deleteMany({
      groupId: req.group._id,
      userId: req.params.userId
    });

    const remainingMembers = await GroupMember.countDocuments({ groupId: req.group._id });
    if (remainingMembers === 0) {
      await deleteGroupRecords(req.group._id);
      return res.json({ message: 'Member removed and empty group deleted' });
    }

    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateGroupMemberRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!ensureObjectId(res, req.params.userId, 'userId', 'member id')) {
      return;
    }

    const roleErrors = validateGroupRole(role);
    if (Object.keys(roleErrors).length > 0) {
      return validationError(res, roleErrors);
    }

    const membership = await GroupMember.findOne({
      groupId: req.group._id,
      userId: req.params.userId
    });

    if (!membership) {
      return res.status(404).json({ message: 'Member not found in this group' });
    }

    if (membership.role === role) {
      await membership.populate('userId', 'name email profilePicture university role');
      return res.json({
        message: 'Member role unchanged',
        member: {
          _id: membership._id,
          role: membership.role,
          joinedAt: membership.joinedAt,
          user: membership.userId
        }
      });
    }

    if (membership.role === 'group_admin' && role !== 'group_admin') {
      const permission = await assertGroupAdminRemovalAllowed(req.group._id, req.params.userId);
      if (!permission.allowed) {
        return validationError(res, {
          role: permission.message
        });
      }
    }

    membership.role = role;
    await membership.save();
    await membership.populate('userId', 'name email profilePicture university role');

    if (req.user.role === 'admin') {
      await AdminLog.create({
        admin: req.user.userId,
        action: 'update-group-role',
        targetType: 'group-member',
        targetId: membership._id,
        reason: `Changed member role to ${role} in group ${req.group._id}`
      });
    }

    res.json({
      message: 'Member role updated successfully',
      member: {
        _id: membership._id,
        role: membership.role,
        joinedAt: membership.joinedAt,
        user: membership.userId
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const listGroupJoinRequests = async (req, res) => {
  try {
    const requests = await GroupJoinRequest.find({
      groupId: req.group._id,
      status: 'pending'
    })
      .populate('userId', 'name email profilePicture university')
      .sort('createdAt');

    res.json({
      requests: requests.map((request) => ({
        _id: request._id,
        status: request.status,
        createdAt: request.createdAt,
        user: request.userId
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const reviewGroupJoinRequest = async (req, res) => {
  try {
    const { status } = req.body;
    if (!ensureObjectId(res, req.params.requestId, 'requestId', 'join request id')) {
      return;
    }

    if (!['approved', 'rejected'].includes(status)) {
      return validationError(res, {
        status: 'Status must be either "approved" or "rejected"'
      });
    }

    const request = await GroupJoinRequest.findOne({
      _id: req.params.requestId,
      groupId: req.group._id
    });

    if (!request) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    request.status = status;
    request.reviewedBy = req.user.userId;
    request.reviewedAt = new Date();
    await request.save();

    if (status === 'approved') {
      await GroupMember.updateOne(
        { groupId: req.group._id, userId: request.userId },
        {
          $setOnInsert: {
            groupId: req.group._id,
            userId: request.userId,
            role: 'member',
            joinedAt: new Date()
          }
        },
        { upsert: true }
      );

      await createNotification({
        receiver: request.userId,
        sender: req.user.userId,
        group: req.group._id,
        type: 'group-join-approved',
        message: `Your request to join "${req.group.name}" was approved.`
      });
    }

    res.json({
      message: `Join request ${status}`,
      request
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
