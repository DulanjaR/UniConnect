import { Comment } from '../models/Comment.js';
import { Post } from '../models/Post.js';
import { AdminLog } from '../models/AdminLog.js';

export const createComment = async (req, res) => {
  try {
    const { postId, text, parentCommentId } = req.body;
    const authorId = req.user.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = new Comment({
      post: postId,
      author: authorId,
      text,
      parentComment: parentCommentId || null
    });

    await comment.save();
    await comment.populate('author', 'name email profilePicture');

    // If this is a reply, add it to parent's replies
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(
        parentCommentId,
        { $push: { replies: comment._id } }
      );
    }

    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ post: postId, parentComment: null, status: 'active' })
      .populate('author', 'name email profilePicture')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'name email profilePicture'
        }
      })
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments({ post: postId, parentComment: null, status: 'active' });

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

export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this comment' });
    }

    comment.text = text;
    await comment.save();
    await comment.populate('author', 'name email profilePicture');

    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await Comment.findByIdAndUpdate(commentId, { status: 'deleted' });

    // Log admin action if admin deleted
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
    const { commentId } = req.params;
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

    res.json({
      message: 'Answer marked as accepted',
      comment
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
