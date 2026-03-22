import { Post } from '../models/Post.js';
import { PostStatus } from '../models/PostStatus.js';
import { AdminLog } from '../models/AdminLog.js';

export const createPost = async (req, res) => {
  try {
    const { title, body, tags, category, imageUrl, year, semester } = req.body;
    const authorId = req.user.userId;

    // Validate category
    if (!['study', 'lost', 'found'].includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const post = await Post.create({
      author: authorId,
      title,
      body,
      tags: tags || [],
      category,
      imageUrl,
      year,
      semester,
      status: 'active'
    });

    const populatedPost = await post.populate('author', 'name email profilePicture');
    res.status(201).json(populatedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, tags, search, sort = '-createdAt' } = req.query;
    const skip = (page - 1) * limit;

    const filter = { status: 'active' };

    if (category) {
      filter.category = category;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } }
      ];
    }

    const posts = await Post.find(filter)
      .populate('author', 'name email profilePicture university')
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
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPostFeed = async (req, res) => {
  try {
    const { year, semester, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { status: 'active' };

    if (year || semester) {
      const orConditions = [];
      
      if (year && semester) {
        orConditions.push({ year: parseInt(year), semester: parseInt(semester) });
        orConditions.push({ year: null, semester: null });
      } else if (year) {
        orConditions.push({ year: parseInt(year) });
        orConditions.push({ year: null });
      }

      if (orConditions.length > 0) {
        filter.$or = orConditions;
      }
    }

    const posts = await Post.find(filter)
      .populate('author', 'name email profilePicture university')
      .sort('-createdAt')
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

export const getPostsByAuthor = async (req, res) => {
  try {
    const { authorId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: authorId, status: 'active' })
      .populate('author', 'name email profilePicture')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({ author: authorId, status: 'active' });

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

export const getPost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('author', 'name email profilePicture university bio')
      .populate({
        path: 'acceptedAnswer',
        populate: {
          path: 'author',
          select: 'name email profilePicture'
        }
      });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, tags, category, imageUrl } = req.body;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { title, body, tags, category, imageUrl },
      { new: true }
    ).populate('author', 'name email profilePicture');

    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndUpdate(id, { status: 'deleted' });

    // Log admin action if admin deleted
    if (req.user.role === 'admin') {
      await AdminLog.create({
        admin: req.user.userId,
        action: 'delete-post',
        targetType: 'post',
        targetId: id,
        reason: 'Admin deletion'
      });
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.json({ likes: post.likes.length, liked: likeIndex === -1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
