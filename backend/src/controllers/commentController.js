import { Comment } from '../models/Comment.js';
import { Post } from '../models/Post.js';
import { AdminLog } from '../models/AdminLog.js';
import { CommentReport } from '../models/CommentReport.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { moderateCommentText } from '../utils/commentModeration.js';

const VISIBLE_COMMENT_STATUSES = ['active', 'reported', 'flagged'];

const createNotification = async ({ receiver, sender, post, comment, type, message }) => {
  if (!receiver || !sender || receiver.toString() === sender.toString()) {
    return;
  }

  await Notification.create({
    receiver,
    sender,
    post,
    comment,
    type,
    message
  });
};

const buildCommentTree = (comments, sort) => {
  const map = new Map();
  const rootComments = [];

  comments.forEach((comment) => {
    map.set(comment._id.toString(), {
      ...comment,
      replies: []
    });
  });

  const sortItems = (items) => {
    const compare = {
      newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      liked: (a, b) => (b.likes?.length || 0) - (a.likes?.length || 0) || new Date(b.createdAt) - new Date(a.createdAt),
      default: (a, b) => {
        if (a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
        }
        if (a.isAcceptedAnswer !== b.isAcceptedAnswer) {
          return a.isAcceptedAnswer ? -1 : 1;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
    };

    items.sort(compare[sort] || compare.default);
    items.forEach((item) => {
      if (item.replies?.length) {
        item.replies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }
    });
  };

  map.forEach((comment) => {
    if (comment.parentComment) {
      const parent = map.get(comment.parentComment.toString());
      if (parent) {
        parent.replies.push(comment);
        return;
      }
    }

    rootComments.push(comment);
  });

  sortItems(rootComments);
  return rootComments;
};

const getCommentWithAuth = async (commentId, userId, role) => {
  const comment = await Comment.findById(commentId);

  if (!comment) {
    return { error: { status: 404, message: 'Comment not found' } };
  }

  if (comment.author.toString() !== userId && role !== 'admin') {
    return { error: { status: 403, message: 'Not authorized for this comment' } };
  }

  return { comment };
};

export const createComment = async (req, res) => {
  try {
    const { postId, text, parentCommentId } = req.body;
    const authorId = req.user.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const moderation = moderateCommentText(text);
    if (moderation.reject) {
      return res.status(400).json({ message: moderation.reason });
    }

    let parentComment = null;
    if (parentCommentId) {
      parentComment = await Comment.findById(parentCommentId);
      if (!parentComment || parentComment.post.toString() !== postId) {
        return res.status(400).json({ message: 'Invalid parent comment' });
      }
    }

    const comment = new Comment({
      post: postId,
      author: authorId,
      text,
      parentComment: parentCommentId || null,
      status: moderation.flagged ? 'flagged' : 'active',
      moderationReason: moderation.flagged ? moderation.reason : ''
    });

    await comment.save();
    await comment.populate('author', 'name email profilePicture');

    if (parentCommentId) {
      await Comment.findByIdAndUpdate(
        parentCommentId,
        { $push: { replies: comment._id } }
      );
    }

    await createNotification({
      receiver: post.author,
      sender: authorId,
      post: postId,
      comment: comment._id,
      type: 'post-comment',
      message: parentCommentId ? 'Someone replied in your post discussion.' : 'Someone commented on your post.'
    });

    if (parentComment && parentComment.author.toString() !== post.author.toString()) {
      await createNotification({
        receiver: parentComment.author,
        sender: authorId,
        post: postId,
        comment: comment._id,
        type: 'comment-reply',
        message: 'Someone replied to your comment.'
      });
    }

    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { sort = 'default' } = req.query;

    const comments = await Comment.find({
      post: postId,
      status: { $in: VISIBLE_COMMENT_STATUSES }
    })
      .populate('author', 'name email profilePicture')
      .lean();

    res.json({
      comments: buildCommentTree(comments, sort),
      total: comments.filter((comment) => !comment.parentComment).length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateComment = async (req, res) => {
  try {
    const commentId = req.params.commentId || req.params.id;
    const { text } = req.body;

    const { comment, error } = await getCommentWithAuth(commentId, req.user.userId, req.user.role);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const moderation = moderateCommentText(text);
    if (moderation.reject) {
      return res.status(400).json({ message: moderation.reason });
    }

    comment.text = text;
    comment.editedAt = new Date();
    comment.status = moderation.flagged ? 'flagged' : 'active';
    comment.moderationReason = moderation.flagged ? moderation.reason : '';
    await comment.save();
    await comment.populate('author', 'name email profilePicture');

    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const commentId = req.params.commentId || req.params.id;

    const { comment, error } = await getCommentWithAuth(commentId, req.user.userId, req.user.role);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    comment.status = 'deleted';
    comment.text = '[Comment deleted]';
    await comment.save();

    if (req.user.role === 'admin') {
      await AdminLog.create({
        admin: req.user.userId,
        action: 'delete-comment',
        targetType: 'comment',
        targetId: commentId,
        reason: 'Admin deletion'
      });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const likeComment = async (req, res) => {
  try {
    const commentId = req.params.commentId || req.params.id;
    const userId = req.user.userId;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const likeIndex = comment.likes.indexOf(userId);

    if (likeIndex > -1) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(userId);
    }

    await comment.save();
    res.json({ likes: comment.likes.length, liked: likeIndex === -1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markAsAcceptedAnswer = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { postId } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only post author can mark accepted answer' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Remove previous accepted answer if exists
    if (post.acceptedAnswer) {
      await Comment.findByIdAndUpdate(post.acceptedAnswer, { isAcceptedAnswer: false });
    }

    // Mark new accepted answer
    comment.isAcceptedAnswer = true;
    await comment.save();

    post.acceptedAnswer = commentId;
    await post.save();

    await comment.populate('author', 'name email profilePicture');

    await Notification.updateMany(
      { post: postId, comment: commentId, type: 'comment-top' },
      { isRead: true }
    );

    await createNotification({
      receiver: comment.author,
      sender: req.user.userId,
      post: postId,
      comment: commentId,
      type: 'comment-top',
      message: 'Your comment was marked as the top comment.'
    });

    res.json({
      message: 'Answer marked as accepted',
      comment
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const replyToComment = async (req, res) => {
  req.body.parentCommentId = req.params.id;
  return createComment(req, res);
};

export const unlikeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.likes = comment.likes.filter((userId) => userId.toString() !== req.user.userId);
    await comment.save();

    res.json({ likes: comment.likes.length, liked: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleTopComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { postId, isTopComment } = req.body;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only post owner can set top comment' });
    }

    const comment = await Comment.findById(id);
    if (!comment || comment.post.toString() !== postId) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (post.acceptedAnswer && post.acceptedAnswer.toString() !== id) {
      await Comment.findByIdAndUpdate(post.acceptedAnswer, { isAcceptedAnswer: false });
    }

    comment.isAcceptedAnswer = Boolean(isTopComment);
    await comment.save();

    post.acceptedAnswer = isTopComment ? comment._id : null;
    await post.save();

    if (isTopComment) {
      await createNotification({
        receiver: comment.author,
        sender: req.user.userId,
        post: postId,
        comment: id,
        type: 'comment-top',
        message: 'Your comment was selected as the top comment.'
      });
    }

    res.json({ message: isTopComment ? 'Top comment selected' : 'Top comment removed', comment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const togglePinComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPinned } = req.body;

    const comment = await Comment.findById(id).populate('post', 'author');
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const isPostOwner = comment.post.author.toString() === req.user.userId;
    if (!isPostOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only post owner or admin can pin comments' });
    }

    comment.isPinned = Boolean(isPinned);
    await comment.save();

    if (comment.isPinned) {
      await createNotification({
        receiver: comment.author,
        sender: req.user.userId,
        post: comment.post._id,
        comment: comment._id,
        type: 'comment-pin',
        message: 'Your comment was pinned.'
      });
    }

    res.json({ message: comment.isPinned ? 'Comment pinned' : 'Comment unpinned', comment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const reportComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;

    const comment = await Comment.findById(id).populate('post', 'author');
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() === req.user.userId) {
      return res.status(400).json({ message: 'You cannot report your own comment' });
    }

    let report;
    try {
      report = await CommentReport.create({
        comment: id,
        reportedBy: req.user.userId,
        reason,
        description
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ message: 'You already reported this comment' });
      }

      throw err;
    }

    comment.reportCount += 1;
    if (comment.status === 'active') {
      comment.status = 'reported';
    }
    await comment.save();

    await User.findByIdAndUpdate(comment.author, { $inc: { commentViolationCount: 1 } });

    await createNotification({
      receiver: comment.post.author,
      sender: req.user.userId,
      post: comment.post._id,
      comment: comment._id,
      type: 'comment-report',
      message: 'A comment on your post was reported.'
    });

    res.status(201).json({ message: 'Comment reported successfully', report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
