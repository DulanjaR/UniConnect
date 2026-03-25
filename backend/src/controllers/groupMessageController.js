import mongoose from 'mongoose';
import { GroupMessage } from '../models/GroupMessage.js';
import { GroupMember } from '../models/GroupMember.js';
import { createNotification } from '../utils/notifications.js';

const parseNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const ensurePathIds = (res, { messageId, replyId } = {}) => {
  if (messageId && !isValidObjectId(messageId)) {
    res.status(400).json({ message: 'Invalid message id' });
    return false;
  }

  if (replyId && !isValidObjectId(replyId)) {
    res.status(400).json({ message: 'Invalid reply id' });
    return false;
  }

  return true;
};

const toUserSummary = (user) => {
  if (!user) {
    return null;
  }

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    profilePicture: user.profilePicture,
    university: user.university
  };
};

const serializeReply = (reply, currentUserId, messageId) => ({
  _id: reply._id,
  messageId,
  user: toUserSummary(reply.userId),
  content: reply.content,
  likes: reply.likes,
  likeCount: reply.likes?.length || 0,
  likedByCurrentUser: Boolean(
    currentUserId && reply.likes?.some((userId) => userId.toString() === currentUserId)
  ),
  createdAt: reply.createdAt,
  updatedAt: reply.updatedAt
});

const serializeMessage = (message, currentUserId) => ({
  _id: message._id,
  groupId: message.groupId,
  user: toUserSummary(message.userId),
  content: message.content,
  attachments: message.attachments || [],
  likes: message.likes,
  likeCount: message.likes?.length || 0,
  likedByCurrentUser: Boolean(
    currentUserId && message.likes?.some((userId) => userId.toString() === currentUserId)
  ),
  replyCount: message.replies?.length || 0,
  replies: (message.replies || []).map((reply) =>
    serializeReply(reply, currentUserId, message._id)
  ),
  createdAt: message.createdAt,
  updatedAt: message.updatedAt
});

const populateMessage = async (messageId) =>
  GroupMessage.findById(messageId)
    .populate('userId', 'name email profilePicture university')
    .populate('replies.userId', 'name email profilePicture university');

const getMembership = (groupId, userId) =>
  GroupMember.findOne({
    groupId,
    userId
  });

const canAccessGroupMessages = async (group, user) => {
  if (group.privacy === 'public') {
    return true;
  }

  if (!user) {
    return false;
  }

  if (user.role === 'admin') {
    return true;
  }

  const membership = await getMembership(group._id, user.userId);
  return Boolean(membership);
};

const requireGroupMember = async (groupId, userId) => {
  const membership = await getMembership(groupId, userId);
  if (!membership) {
    return null;
  }

  return membership;
};

const canModerateGroupContent = async (groupId, user) => {
  if (user.role === 'admin') {
    return true;
  }

  const membership = await getMembership(groupId, user.userId);
  return membership?.role === 'group_admin';
};

export const createGroupMessage = async (req, res) => {
  try {
    const membership = await requireGroupMember(req.group._id, req.user.userId);
    if (!membership) {
      return res.status(403).json({ message: 'Only group members can post messages' });
    }

    const { content, attachments = [] } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = await GroupMessage.create({
      groupId: req.group._id,
      userId: req.user.userId,
      content: content.trim(),
      attachments: Array.isArray(attachments) ? attachments : []
    });

    const populatedMessage = await populateMessage(message._id);

    res.status(201).json({
      message: 'Group message created successfully',
      groupMessage: serializeMessage(populatedMessage, req.user.userId)
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const listGroupMessages = async (req, res) => {
  try {
    const allowed = await canAccessGroupMessages(req.group, req.user);
    if (!allowed) {
      return res.status(403).json({ message: 'This group feed is only visible to members' });
    }

    const page = parseNumber(req.query.page, 1);
    const limit = parseNumber(req.query.limit, 20);
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      GroupMessage.find({ groupId: req.group._id })
        .populate('userId', 'name email profilePicture university')
        .populate('replies.userId', 'name email profilePicture university')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      GroupMessage.countDocuments({ groupId: req.group._id })
    ]);

    res.json({
      messages: messages.map((message) => serializeMessage(message, req.user?.userId)),
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

export const getGroupMessage = async (req, res) => {
  try {
    if (!ensurePathIds(res, { messageId: req.params.messageId })) {
      return;
    }

    const allowed = await canAccessGroupMessages(req.group, req.user);
    if (!allowed) {
      return res.status(403).json({ message: 'This group feed is only visible to members' });
    }

    const groupMessage = await populateMessage(req.params.messageId);
    if (!groupMessage || groupMessage.groupId.toString() !== req.group._id.toString()) {
      return res.status(404).json({ message: 'Group message not found' });
    }

    res.json({
      groupMessage: serializeMessage(groupMessage, req.user?.userId)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateGroupMessage = async (req, res) => {
  try {
    if (!ensurePathIds(res, { messageId: req.params.messageId })) {
      return;
    }

    const message = await GroupMessage.findOne({
      _id: req.params.messageId,
      groupId: req.group._id
    });

    if (!message) {
      return res.status(404).json({ message: 'Group message not found' });
    }

    const isModerator = await canModerateGroupContent(req.group._id, req.user);
    const isOwner = message.userId.toString() === req.user.userId;

    if (!isOwner && !isModerator) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    if (!req.body.content?.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    message.content = req.body.content.trim();
    if (Array.isArray(req.body.attachments)) {
      message.attachments = req.body.attachments;
    }
    await message.save();

    const populatedMessage = await populateMessage(message._id);
    res.json({
      message: 'Group message updated successfully',
      groupMessage: serializeMessage(populatedMessage, req.user.userId)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteGroupMessage = async (req, res) => {
  try {
    if (!ensurePathIds(res, { messageId: req.params.messageId })) {
      return;
    }

    const message = await GroupMessage.findOne({
      _id: req.params.messageId,
      groupId: req.group._id
    });

    if (!message) {
      return res.status(404).json({ message: 'Group message not found' });
    }

    const isModerator = await canModerateGroupContent(req.group._id, req.user);
    const isOwner = message.userId.toString() === req.user.userId;

    if (!isOwner && !isModerator) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await GroupMessage.deleteOne({ _id: message._id });

    res.json({ message: 'Group message deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleGroupMessageLike = async (req, res) => {
  try {
    if (!ensurePathIds(res, { messageId: req.params.messageId })) {
      return;
    }

    const membership = await requireGroupMember(req.group._id, req.user.userId);
    if (!membership) {
      return res.status(403).json({ message: 'Only group members can like messages' });
    }

    const message = await GroupMessage.findOne({
      _id: req.params.messageId,
      groupId: req.group._id
    });

    if (!message) {
      return res.status(404).json({ message: 'Group message not found' });
    }

    const existingLikeIndex = message.likes.findIndex(
      (userId) => userId.toString() === req.user.userId
    );

    if (existingLikeIndex > -1) {
      message.likes.splice(existingLikeIndex, 1);
    } else {
      message.likes.push(req.user.userId);
    }

    await message.save();

    if (existingLikeIndex === -1) {
      await createNotification({
        receiver: message.userId,
        sender: req.user.userId,
        group: req.group._id,
        groupMessage: message._id,
        type: 'group-message-like',
        message: `${req.user.name} liked your group message in ${req.group.name}.`
      });
    }

    res.json({
      likes: message.likes.length,
      liked: existingLikeIndex === -1
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createGroupMessageReply = async (req, res) => {
  try {
    if (!ensurePathIds(res, { messageId: req.params.messageId })) {
      return;
    }

    const membership = await requireGroupMember(req.group._id, req.user.userId);
    if (!membership) {
      return res.status(403).json({ message: 'Only group members can reply in this group' });
    }

    const message = await GroupMessage.findOne({
      _id: req.params.messageId,
      groupId: req.group._id
    });

    if (!message) {
      return res.status(404).json({ message: 'Group message not found' });
    }

    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    message.replies.push({
      userId: req.user.userId,
      content: content.trim(),
      likes: []
    });
    await message.save();

    const populatedMessage = await populateMessage(message._id);
    const reply = populatedMessage.replies[populatedMessage.replies.length - 1];

    await createNotification({
      receiver: message.userId,
      sender: req.user.userId,
      group: req.group._id,
      groupMessage: message._id,
      type: 'group-message-reply',
      message: `${req.user.name} replied to your group message in ${req.group.name}.`
    });

    res.status(201).json({
      message: 'Reply created successfully',
      reply: serializeReply(reply, req.user.userId, populatedMessage._id)
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateGroupMessageReply = async (req, res) => {
  try {
    if (!ensurePathIds(res, { messageId: req.params.messageId, replyId: req.params.replyId })) {
      return;
    }

    const message = await GroupMessage.findOne({
      _id: req.params.messageId,
      groupId: req.group._id
    });

    if (!message) {
      return res.status(404).json({ message: 'Group message not found' });
    }

    const reply = message.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    const isModerator = await canModerateGroupContent(req.group._id, req.user);
    const isOwner = reply.userId.toString() === req.user.userId;

    if (!isOwner && !isModerator) {
      return res.status(403).json({ message: 'Not authorized to edit this reply' });
    }

    if (!req.body.content?.trim()) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    reply.content = req.body.content.trim();
    await message.save();

    const populatedMessage = await populateMessage(message._id);
    const populatedReply = populatedMessage.replies.id(req.params.replyId);

    res.json({
      message: 'Reply updated successfully',
      reply: serializeReply(populatedReply, req.user.userId, populatedMessage._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteGroupMessageReply = async (req, res) => {
  try {
    if (!ensurePathIds(res, { messageId: req.params.messageId, replyId: req.params.replyId })) {
      return;
    }

    const message = await GroupMessage.findOne({
      _id: req.params.messageId,
      groupId: req.group._id
    });

    if (!message) {
      return res.status(404).json({ message: 'Group message not found' });
    }

    const reply = message.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    const isModerator = await canModerateGroupContent(req.group._id, req.user);
    const isOwner = reply.userId.toString() === req.user.userId;

    if (!isOwner && !isModerator) {
      return res.status(403).json({ message: 'Not authorized to delete this reply' });
    }

    reply.deleteOne();
    await message.save();

    res.json({ message: 'Reply deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleGroupMessageReplyLike = async (req, res) => {
  try {
    if (!ensurePathIds(res, { messageId: req.params.messageId, replyId: req.params.replyId })) {
      return;
    }

    const membership = await requireGroupMember(req.group._id, req.user.userId);
    if (!membership) {
      return res.status(403).json({ message: 'Only group members can like replies' });
    }

    const message = await GroupMessage.findOne({
      _id: req.params.messageId,
      groupId: req.group._id
    });

    if (!message) {
      return res.status(404).json({ message: 'Group message not found' });
    }

    const reply = message.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    const existingLikeIndex = reply.likes.findIndex(
      (userId) => userId.toString() === req.user.userId
    );

    if (existingLikeIndex > -1) {
      reply.likes.splice(existingLikeIndex, 1);
    } else {
      reply.likes.push(req.user.userId);
    }

    await message.save();

    res.json({
      likes: reply.likes.length,
      liked: existingLikeIndex === -1
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
