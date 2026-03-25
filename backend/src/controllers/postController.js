import { Post } from '../models/Post.js';
import { AdminLog } from '../models/AdminLog.js';

const parseNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const createPost = async (req, res) => {
  try {
    const { title, body, tags = [], category, imageUrl, year, semester } = req.body;

    if (!title || !body || !category) {
      return res.status(400).json({ message: 'Title, body, and category are required' });
    }

    if (!['study', 'lost', 'found'].includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const post = await Post.create({
      author: req.user.userId,
      title,
      body,
      tags,
      category,
      imageUrl,
      year,
      semester
    });

    const populatedPost = await Post.findById(post._id).populate(
      'author',
      'name email profilePicture university'
    );

    res.status(201).json(populatedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getPosts = async (req, res) => {
  try {
    const page = parseNumber(req.query.page, 1);
    const limit = parseNumber(req.query.limit, 10);
    const skip = (page - 1) * limit;
    const { category, tags, search, sort = '-createdAt' } = req.query;

    const filter = { status: 'active' };

    if (category) {
      filter.category = category;
    }

    if (tags) {
      const tagList = Array.isArray(tags) ? tags : String(tags).split(',').map((tag) => tag.trim());
      filter.tags = { $in: tagList.filter(Boolean) };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } }
      ];
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'name email profilePicture university')
        .populate({
          path: 'acceptedAnswer',
          populate: { path: 'author', select: 'name email profilePicture' }
        })
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Post.countDocuments(filter)
    ]);

    res.json({
      posts,
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

export const getPostFeed = async (req, res) => {
  try {
    const page = parseNumber(req.query.page, 1);
    const limit = parseNumber(req.query.limit, 10);
    const skip = (page - 1) * limit;
    const year = req.query.year ? parseNumber(req.query.year, null) : null;
    const semester = req.query.semester ? parseNumber(req.query.semester, null) : null;
    const filter = { status: 'active' };

    if (year || semester) {
      const scopedConditions = [];
      if (year && semester) {
        scopedConditions.push({ year, semester });
        scopedConditions.push({ year: null, semester: null });
      } else if (year) {
        scopedConditions.push({ year });
        scopedConditions.push({ year: null });
      }

      if (scopedConditions.length) {
        filter.$or = scopedConditions;
      }
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'name email profilePicture university')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      Post.countDocuments(filter)
    ]);

    res.json({
      posts,
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

export const getPostsByAuthor = async (req, res) => {
  try {
    const page = parseNumber(req.query.page, 1);
    const limit = parseNumber(req.query.limit, 10);
    const skip = (page - 1) * limit;

    const filter = { author: req.params.authorId, status: 'active' };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'name email profilePicture')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      Post.countDocuments(filter)
    ]);

    res.json({
      posts,
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

export const getPost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('author', 'name email profilePicture university bio')
      .populate({
        path: 'acceptedAnswer',
        populate: { path: 'author', select: 'name email profilePicture' }
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
    const { title, body, tags, category, imageUrl } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { title, body, tags, category, imageUrl },
      { new: true }
    ).populate('author', 'name email profilePicture university');

    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndUpdate(req.params.id, { status: 'deleted' });

    if (req.user.role === 'admin') {
      await AdminLog.create({
        admin: req.user.userId,
        action: 'delete-post',
        targetType: 'post',
        targetId: req.params.id,
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
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likedIndex = post.likes.findIndex((userId) => userId.toString() === req.user.userId);
    if (likedIndex > -1) {
      post.likes.splice(likedIndex, 1);
    } else {
      post.likes.push(req.user.userId);
    }

    await post.save();

    res.json({
      likes: post.likes.length,
      liked: likedIndex === -1
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
