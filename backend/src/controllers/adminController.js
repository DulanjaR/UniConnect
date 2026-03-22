import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { LostItem } from '../models/LostItem.js';
import { AdminLog } from '../models/AdminLog.js';
import { User } from '../models/User.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments({ status: 'active' });
    const totalComments = await Comment.countDocuments({ status: 'active' });
    const totalLostItems = await LostItem.countDocuments({ status: 'active' });

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
    const { page = 1, limit = 10, status, search, sort = '-createdAt' } = req.query;
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
    const { page = 1, limit = 10, status, postId, sort = '-createdAt' } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (postId) {
      filter.post = postId;
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

export const getAllLostItems = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, itemType, flagged, sort = '-createdAt' } = req.query;
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
    const { page = 1, limit = 10, role, search, sort = '-createdAt' } = req.query;
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
    const { page = 1, limit = 20, action, admin, sortBy = '-createdAt' } = req.query;
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
