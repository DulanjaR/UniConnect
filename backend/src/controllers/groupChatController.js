import { Group } from '../models/Group.js';
import { GroupMessage } from '../models/GroupMessage.js';
import { User } from '../models/User.js';

const CHAT_MESSAGE_LIMIT = 100;
const PINNED_LIMIT = 5;
const FILE_LIMIT = 10;
const TASK_LIMIT = 10;
const TYPING_TTL_MS = 5000;
const typingState = new Map();

const populateMessage = (query) =>
  query.populate('sender', 'name email profilePicture itNumber');

const buildSourcePreview = (message) => {
  if (message.type === 'poll') {
    return message.poll?.question || 'Poll';
  }

  if (message.type === 'file') {
    return message.file?.name || 'Shared file';
  }

  if (message.type === 'task') {
    return message.task?.title || 'Task';
  }

  return message.content || 'Group message';
};

const buildReplySnapshot = (message) => ({
  messageId: message._id,
  text: buildSourcePreview(message).trim() || 'Group message',
  user: message.sender?.name || 'Group member'
});

const cleanupTypingState = () => {
  const now = Date.now();

  for (const [key, value] of typingState.entries()) {
    if (value.expiresAt <= now) {
      typingState.delete(key);
    }
  }
};

const getTypingUsers = (groupId, currentUserId) => {
  cleanupTypingState();

  return Array.from(typingState.values())
    .filter(
      (entry) =>
        entry.groupId === String(groupId) &&
        entry.userId !== String(currentUserId)
    )
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ userId, name, itNumber }) => ({ userId, name, itNumber }));
};

const getGroupForMember = async (groupId, userId) => {
  const group = await Group.findById(groupId)
    .populate('creator', 'name email profilePicture itNumber')
    .populate('members.userId', 'name email profilePicture itNumber');

  if (!group || group.status !== 'active') {
    return null;
  }

  const isMember = group.members.some((member) => {
    const memberId = member.userId?._id || member.userId;
    return String(memberId) === String(userId);
  });

  return isMember ? group : null;
};

const buildMentions = (content, group) => {
  const mentionMatches = Array.from(content.matchAll(/@([A-Za-z0-9]+)/g));
  if (mentionMatches.length === 0) {
    return [];
  }

  const memberLookup = new Map(
    group.members.map((member) => [
      member.itNumber?.toUpperCase(),
      {
        userId: member.userId?._id || member.userId,
        name: member.userId?.name || member.itNumber,
        itNumber: member.itNumber
      }
    ])
  );

  return [...new Set(mentionMatches.map((match) => match[1].toUpperCase()))]
    .map((token) => memberLookup.get(token))
    .filter(Boolean);
};

const getCurrentUser = async (userId) =>
  User.findById(userId).select('name email profilePicture itNumber');

const getGroupAdminId = (group) => group.creator?._id || group.creator;

const isMessageSender = (message, userId) =>
  String(message.sender) === String(userId);

const isGroupAdmin = (group, userId) =>
  String(getGroupAdminId(group)) === String(userId);

const getGroupMessage = async (groupId, messageId) =>
  GroupMessage.findOne({ _id: messageId, group: groupId });

export const getGroupChat = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;

    const group = await getGroupForMember(groupId, userId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found or access denied' });
    }

    const [latestMessages, pinnedMessages, sharedFiles, tasks] = await Promise.all([
      populateMessage(
        GroupMessage.find({ group: groupId }).sort({ createdAt: -1 }).limit(CHAT_MESSAGE_LIMIT)
      ),
      populateMessage(
        GroupMessage.find({ group: groupId, isPinned: true })
          .sort({ pinnedAt: -1, createdAt: -1 })
          .limit(PINNED_LIMIT)
      ),
      populateMessage(
        GroupMessage.find({ group: groupId, type: 'file' })
          .sort({ createdAt: -1 })
          .limit(FILE_LIMIT)
      ),
      populateMessage(
        GroupMessage.find({ group: groupId, type: 'task' })
          .sort({ createdAt: -1 })
          .limit(TASK_LIMIT)
      )
    ]);

    const messages = [...latestMessages].reverse();

    res.json({
      group,
      messages,
      pinnedMessages,
      sharedFiles,
      tasks,
      typingUsers: getTypingUsers(groupId, userId)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createGroupChatMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;
    const {
      type = 'text',
      content = '',
      file,
      poll,
      replyTo,
      replyToMessageId,
      name,
      note
    } = req.body;

    const group = await getGroupForMember(groupId, userId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found or access denied' });
    }

    if (!(await getCurrentUser(userId))) {
      return res.status(404).json({ message: 'Sender not found' });
    }

    const normalizedType = req.file
      ? 'file'
      : ['text', 'file', 'poll'].includes(type) ? type : 'text';
    const normalizedContent = typeof content === 'string' ? content.trim() : '';
    const messageData = {
      group: groupId,
      sender: userId,
      type: normalizedType,
      content: normalizedContent
    };

    const replyTargetId = replyTo?.messageId || replyToMessageId;

    if (replyTargetId) {
      const sourceMessage = await populateMessage(
        GroupMessage.findOne({ _id: replyTargetId, group: groupId })
      );

      if (!sourceMessage) {
        return res.status(404).json({ message: 'Reply target message not found' });
      }

      messageData.replyTo = buildReplySnapshot(sourceMessage);
    }

    if (normalizedType === 'text') {
      if (!normalizedContent) {
        return res.status(400).json({ message: 'Message content is required' });
      }

      messageData.mentions = buildMentions(normalizedContent, group);
    }

    if (normalizedType === 'file') {
      const uploadedFileName = typeof name === 'string' ? name.trim() : '';
      const uploadedFileNote = typeof note === 'string' ? note.trim() : normalizedContent;
      const fileName = uploadedFileName || req.file?.originalname || file?.name?.trim();
      const fileUrl = req.file?.path || file?.url?.trim();
      const fileNote = uploadedFileNote || file?.note?.trim() || '';

      if (!fileName || !fileUrl) {
        return res.status(400).json({ message: 'A file upload is required' });
      }

      messageData.file = {
        name: fileName,
        url: fileUrl,
        note: fileNote
      };
      messageData.content = fileNote || fileName;
      messageData.mentions = buildMentions(fileNote || fileName, group);
    }

    if (normalizedType === 'poll') {
      const question = poll?.question?.trim();
      const options = (poll?.options || [])
        .map((option) => option?.trim())
        .filter(Boolean);

      if (!question || options.length < 2) {
        return res.status(400).json({ message: 'Poll question and at least two options are required' });
      }

      messageData.poll = {
        question,
        options: options.map((option) => ({ text: option, votes: [] }))
      };
      messageData.content = question;
      messageData.mentions = buildMentions(question, group);
    }

    const message = await GroupMessage.create(messageData);
    const populatedMessage = await populateMessage(
      GroupMessage.findById(message._id)
    );

    typingState.delete(`${groupId}:${userId}`);

    res.status(201).json(populatedMessage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateGroupChatMessage = async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const userId = req.user.userId;
    const { content = '', file, poll, task } = req.body;

    const group = await getGroupForMember(groupId, userId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found or access denied' });
    }

    const message = await getGroupMessage(groupId, messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (!isMessageSender(message, userId)) {
      return res.status(403).json({ message: 'Only the original sender can edit this message' });
    }

    const normalizedContent = typeof content === 'string' ? content.trim() : '';

    if (message.type === 'text') {
      if (!normalizedContent) {
        return res.status(400).json({ message: 'Message content is required' });
      }

      message.content = normalizedContent;
      message.mentions = buildMentions(normalizedContent, group);
    }

    if (message.type === 'file') {
      const fileName = file?.name?.trim();
      const fileUrl = file?.url?.trim();
      const fileNote = typeof file?.note === 'string' ? file.note.trim() : normalizedContent;

      if (!fileName || !fileUrl) {
        return res.status(400).json({ message: 'File name and URL are required' });
      }

      message.file = {
        name: fileName,
        url: fileUrl,
        note: fileNote
      };
      message.content = fileNote;
      message.mentions = buildMentions(fileNote, group);
    }

    if (message.type === 'poll') {
      const question = poll?.question?.trim();
      const options = (poll?.options || [])
        .map((option) => option?.trim())
        .filter(Boolean);

      if (!question || options.length < 2) {
        return res.status(400).json({ message: 'Poll question and at least two options are required' });
      }

      message.poll = {
        question,
        options: options.map((option, index) => ({
          text: option,
          votes: message.poll?.options?.[index]?.votes || []
        }))
      };
      message.content = question;
      message.mentions = buildMentions(question, group);
    }

    if (message.type === 'task') {
      const taskTitle = task?.title?.trim() || normalizedContent;

      if (!taskTitle) {
        return res.status(400).json({ message: 'Task title is required' });
      }

      message.task.title = taskTitle;
      message.content = `Task created from: ${message.task.sourcePreview || taskTitle}`;
    }

    await message.save();

    const populatedMessage = await populateMessage(
      GroupMessage.findById(message._id)
    );

    res.json(populatedMessage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteGroupChatMessage = async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const userId = req.user.userId;

    const group = await getGroupForMember(groupId, userId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found or access denied' });
    }

    const message = await getGroupMessage(groupId, messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (!isMessageSender(message, userId) && !isGroupAdmin(group, userId)) {
      return res.status(403).json({ message: 'Only the sender or group admin can delete this message' });
    }

    await GroupMessage.deleteOne({ _id: messageId, group: groupId });

    res.json({
      message: 'Message deleted successfully',
      messageId
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const togglePinnedMessage = async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const userId = req.user.userId;

    const group = await getGroupForMember(groupId, userId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found or access denied' });
    }

    const message = await GroupMessage.findOne({ _id: messageId, group: groupId });
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.isPinned = !message.isPinned;
    message.pinnedAt = message.isPinned ? new Date() : null;
    message.pinnedBy = message.isPinned ? userId : null;
    await message.save();

    const populatedMessage = await populateMessage(
      GroupMessage.findById(message._id)
    );

    res.json(populatedMessage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const voteOnPollMessage = async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const { optionId } = req.body;
    const userId = req.user.userId;

    const group = await getGroupForMember(groupId, userId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found or access denied' });
    }

    const message = await GroupMessage.findOne({
      _id: messageId,
      group: groupId,
      type: 'poll'
    });

    if (!message || !message.poll?.options?.length) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    let selectedOption = null;
    for (const option of message.poll.options) {
      option.votes = option.votes.filter((vote) => String(vote) !== String(userId));
      if (String(option._id) === String(optionId)) {
        selectedOption = option;
      }
    }

    if (!selectedOption) {
      return res.status(404).json({ message: 'Poll option not found' });
    }

    selectedOption.votes.push(userId);
    await message.save();

    const populatedMessage = await populateMessage(
      GroupMessage.findById(message._id)
    );

    res.json(populatedMessage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const convertMessageToTask = async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const userId = req.user.userId;

    const group = await getGroupForMember(groupId, userId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found or access denied' });
    }

    const sourceMessage = await GroupMessage.findOne({ _id: messageId, group: groupId });
    if (!sourceMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (sourceMessage.type === 'task') {
      return res.status(400).json({ message: 'This message is already a task' });
    }

    const existingTask = await GroupMessage.findOne({
      group: groupId,
      type: 'task',
      'task.sourceMessageId': sourceMessage._id
    });

    if (existingTask) {
      const populatedTask = await populateMessage(
        GroupMessage.findById(existingTask._id)
      );
      return res.json(populatedTask);
    }

    if (!(await getCurrentUser(userId))) {
      return res.status(404).json({ message: 'Sender not found' });
    }

    const sourcePreview = buildSourcePreview(sourceMessage);
    const taskMessage = await GroupMessage.create({
      group: groupId,
      sender: userId,
      type: 'task',
      content: `Task created from: ${sourcePreview}`,
      task: {
        title: sourcePreview,
        completed: false,
        sourceMessageId: sourceMessage._id,
        sourceType: sourceMessage.type,
        sourcePreview
      }
    });

    const populatedTask = await populateMessage(
      GroupMessage.findById(taskMessage._id)
    );

    res.status(201).json(populatedTask);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const toggleTaskMessage = async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const userId = req.user.userId;

    const group = await getGroupForMember(groupId, userId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found or access denied' });
    }

    const currentUser = await getCurrentUser(userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const message = await GroupMessage.findOne({
      _id: messageId,
      group: groupId,
      type: 'task'
    });

    if (!message || !message.task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    message.task.completed = !message.task.completed;
    message.task.completedAt = message.task.completed ? new Date() : null;
    message.task.completedBy = message.task.completed ? currentUser._id : null;
    message.task.completedByName = message.task.completed ? currentUser.name : '';
    await message.save();

    const populatedMessage = await populateMessage(
      GroupMessage.findById(message._id)
    );

    res.json(populatedMessage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateTypingStatus = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;
    const { isTyping } = req.body;

    const group = await getGroupForMember(groupId, userId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found or access denied' });
    }

    const key = `${groupId}:${userId}`;
    if (isTyping) {
      const currentUser = await getCurrentUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      typingState.set(key, {
        groupId: String(groupId),
        userId: String(userId),
        name: currentUser.name,
        itNumber: currentUser.itNumber,
        expiresAt: Date.now() + TYPING_TTL_MS
      });
    } else {
      typingState.delete(key);
    }

    res.json({ typingUsers: getTypingUsers(groupId, userId) });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
