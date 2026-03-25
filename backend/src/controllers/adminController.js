import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { LostItem } from '../models/LostItem.js';
import { AdminLog } from '../models/AdminLog.js';
import { User } from '../models/User.js';
import { CommentReport } from '../models/CommentReport.js';
import { Group } from '../models/Group.js';
import { GroupMember } from '../models/GroupMember.js';
import { GroupJoinRequest } from '../models/GroupJoinRequest.js';
import { GroupMessage } from '../models/GroupMessage.js';
import { ensureObjectId, validationError } from '../utils/validation.js';

const parseNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const deleteGroupRecords = async (groupId) => {
  await Promise.all([
    Group.deleteOne({ _id: groupId }),
    GroupMember.deleteMany({ groupId }),
    GroupJoinRequest.deleteMany({ groupId }),
    GroupMessage.deleteMany({ groupId })
  ]);
};

const buildAdminGroupPayload = async (groupDoc) => {
  const group = groupDoc.toObject ? groupDoc.toObject() : groupDoc;
  const [memberCount, adminCount, pendingJoinRequests, messageCount] = await Promise.all([
    GroupMember.countDocuments({ groupId: group._id }),
    GroupMember.countDocuments({ groupId: group._id, role: 'group_admin' }),
    GroupJoinRequest.countDocuments({ groupId: group._id, status: 'pending' }),
    GroupMessage.countDocuments({ groupId: group._id })
  ]);

  return {
    ...group,
    memberCount,
    adminCount,
    pendingJoinRequests,
    messageCount
  };
};

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments({ status: 'active' });
    const totalComments = await Comment.countDocuments({ status: 'active' });
    const totalLostItems = await LostItem.countDocuments({ status: 'active' });
    const totalGroups = await Group.countDocuments();

    const lostItems = await LostItem.countDocuments({ status: 'active', itemType: 'lost' });
    const foundItems = await LostItem.countDocuments({ status: 'active', itemType: 'found' });
    const resolvedItems = await LostItem.countDocuments({ status: 'resolved' });

    const flaggedItems = await LostItem.countDocuments({ flagged: true });

    const recentActivity = await AdminLog.find()
      .sort('-createdAt')
      .limit(10)
      .populate('admin', 'name email');

    res.json({
      users: totalUsers,
      posts: totalPosts,
      comments: totalComments,
      groups: totalGroups,
      lostItems: {
        total: totalLostItems,
        lost: lostItems,
        found: foundItems,
        resolved: resolvedItems,
        flagged: flaggedItems
      },
      recentActivity
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const { status, search, sort = '-createdAt' } = req.query;
    const page = parseNumber(req.query.page, 1);
    const limit = parseNumber(req.query.limit, 10);
    const skip = (page - 1) * limit;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } }
      ];
    }

    const posts = await Post.find(filter)
      .populate('author', 'name email university')
      .populate('acceptedAnswer')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(filter);

    res.json({
      posts,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllComments = async (req, res) => {
  try {
    const { status, postId, search, sort = '-createdAt' } = req.query;
    const page = parseNumber(req.query.page, 1);
    const limit = parseNumber(req.query.limit, 10);
    const skip = (page - 1) * limit;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (postId) {
      filter.post = postId;
    }

    if (search) {
      filter.text = { $regex: search, $options: 'i' };
    }

    const comments = await Comment.find(filter)
      .populate('author', 'name email')
      .populate('post', 'title')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments(filter);

    res.json({
      comments,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCommentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['active', 'reported', 'flagged', 'hidden', 'deleted'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid comment status' });
    }

    const comment = await Comment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate('author', 'name email')
      .populate('post', 'title');

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    await AdminLog.create({
      admin: req.user.userId,
      action: 'delete-comment',
      targetType: 'comment',
      targetId: id,
      reason: `Comment status changed to ${status}`
    });

    res.json({ message: 'Comment status updated', comment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const adminDeleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.status = 'deleted';
    comment.text = '[Removed by admin]';
    await comment.save();

    await AdminLog.create({
      admin: req.user.userId,
      action: 'delete-comment',
      targetType: 'comment',
      targetId: req.params.id,
      reason: 'Admin removed comment'
    });

    res.json({ message: 'Comment deleted by admin' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCommentReports = async (req, res) => {
  try {
    const { reason } = req.query;
    const page = parseNumber(req.query.page, 1);
    const limit = parseNumber(req.query.limit, 20);
    const skip = (page - 1) * limit;
    const filter = {};

    if (reason) {
      filter.reason = reason;
    }

    const reports = await CommentReport.find(filter)
      .populate({
        path: 'comment',
        populate: [
          { path: 'author', select: 'name email' },
          { path: 'post', select: 'title' }
        ]
      })
      .populate('reportedBy', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CommentReport.countDocuments(filter);

    res.json({
      reports,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const reviewComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status = 'active' } = req.body;

    const comment = await Comment.findByIdAndUpdate(id, { status }, { new: true });
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    await AdminLog.create({
      admin: req.user.userId,
      action: 'restore-content',
      targetType: 'comment',
      targetId: id,
      reason: `Comment reviewed and set to ${status}`
    });

    res.json({ message: 'Comment review updated', comment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUserCommentModeration = async (req, res) => {
  try {
    const { userId } = req.params;
    const { moderationStatus, incrementViolations = 0, suspend = false } = req.body;

    const update = {};
    if (moderationStatus) {
      update.commentModerationStatus = moderationStatus;
    }
    if (incrementViolations) {
      update.$inc = { commentViolationCount: incrementViolations };
    }
    if (suspend) {
      update.isActive = false;
      update.commentModerationStatus = 'suspended';
    }

    const user = await User.findByIdAndUpdate(userId, update, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await AdminLog.create({
      admin: req.user.userId,
      action: suspend ? 'suspend-user' : 'restore-content',
      targetType: 'user',
      targetId: userId,
      reason: `Comment moderation status updated to ${user.commentModerationStatus}`
    });

    res.json({ message: 'User moderation updated', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllLostItems = async (req, res) => {
  try {
    const { status, itemType, flagged, sort = '-createdAt' } = req.query;
    const page = parseNumber(req.query.page, 1);
    const limit = parseNumber(req.query.limit, 10);
    const skip = (page - 1) * limit;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (itemType) {
      filter.itemType = itemType;
    }

    if (flagged === 'true') {
      filter.flagged = true;
    }

    const items = await LostItem.find(filter)
      .populate('reporter', 'name email university')
      .populate('resolvedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await LostItem.countDocuments(filter);

    res.json({
      items,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { role, search, sort = '-createdAt' } = req.query;
    const page = parseNumber(req.query.page, 1);
    const limit = parseNumber(req.query.limit, 10);
    const skip = (page - 1) * limit;

    const filter = {};

    if (role) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAdminLogs = async (req, res) => {
  try {
    const { action, admin, sortBy = '-createdAt' } = req.query;
    const page = parseNumber(req.query.page, 1);
    const limit = parseNumber(req.query.limit, 20);
    const skip = (page - 1) * limit;

    const filter = {};

    if (action) {
      filter.action = action;
    }

    if (admin) {
      filter.admin = admin;
    }

    const logs = await AdminLog.find(filter)
      .populate('admin', 'name email')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AdminLog.countDocuments(filter);

    res.json({
      logs,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    ).select('-password');

    await AdminLog.create({
      admin: req.user.userId,
      action: 'suspend-user',
      targetType: 'user',
      targetId: userId,
      reason
    });

    res.json({
      message: 'User suspended successfully',
      user
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const restoreUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    ).select('-password');

    await AdminLog.create({
      admin: req.user.userId,
      action: 'restore-content',
      targetType: 'user',
      targetId: userId
    });

    res.json({
      message: 'User restored successfully',
      user
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getDetailedActivityReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const activityByAction = await AdminLog.aggregate([
      { $match: filter },
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]);

    const activityByAdmin = await AdminLog.aggregate([
      { $match: filter },
      { $group: { _id: '$admin', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'adminInfo' } }
    ]);

    res.json({
      activityByAction,
      activityByAdmin,
      totalLogs: await AdminLog.countDocuments(filter)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllGroups = async (req, res) => {
  try {
    const page = parseNumber(req.query.page, 1);
    const limit = parseNumber(req.query.limit, 20);
    const skip = (page - 1) * limit;
    const { privacy, search, sort = '-createdAt' } = req.query;

    const filter = {};

    if (privacy) {
      if (!['public', 'private'].includes(privacy)) {
        return validationError(res, {
          privacy: 'Privacy must be either "public" or "private"'
        });
      }

      filter.privacy = privacy;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const [groups, total] = await Promise.all([
      Group.find(filter)
        .populate('createdBy', 'name email profilePicture')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Group.countDocuments(filter)
    ]);

    const serializedGroups = await Promise.all(groups.map((group) => buildAdminGroupPayload(group)));

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

export const deleteAnyGroup = async (req, res) => {
  try {
    if (!ensureObjectId(res, req.params.id, 'id', 'group id')) {
      return;
    }

    const group = await Group.findById(req.params.id).populate('createdBy', 'name email');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    await deleteGroupRecords(group._id);
    await AdminLog.create({
      admin: req.user.userId,
      action: 'delete-group',
      targetType: 'group',
      targetId: group._id,
      reason: req.body.reason || 'Admin removed group',
      targetDetails: {
        name: group.name,
        createdBy: group.createdBy?.email
      }
    });

    res.json({ message: 'Group deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
