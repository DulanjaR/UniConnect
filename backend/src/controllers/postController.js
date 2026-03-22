import { Post } from '../models/Post.js';
import { PostStatus } from '../models/PostStatus.js';

export const createPost = async (req, res) => {
  try {
    const { authorId, title, body, tags, category, imageUrl, year, semester, status } = req.body;

    // create the main post document (content + module-2 fields)
    const post = await Post.create({
      author: authorId,
      title,
      body,
      tags,
      category,
      imageUrl
    });

    // create a separate status/metadata record for this post
    const postStatus = await PostStatus.create({
      post: post._id,
      user: authorId,
      year,
      semester,
      status
    });

    res.status(201).json({ post, postStatus });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'name email');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Feed endpoint: posts for a given year/semester plus common posts (no year/semester)
export const getPostFeed = async (req, res) => {
  try {
    const { year, semester } = req.query;

    const numericYear = year ? Number(year) : undefined;
    const numericSemester = semester ? Number(semester) : undefined;

    const orConditions = [];

    if (numericYear && numericSemester) {
      orConditions.push({ year: numericYear, semester: numericSemester });
    }

    // common posts: no specific year/semester
    orConditions.push({ year: { $exists: false }, semester: { $exists: false } });

    const statuses = await PostStatus.find({ $or: orConditions })
      .populate({ path: 'post', populate: { path: 'author', select: 'name email' } })
      .lean();

    res.json(statuses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPostsByAuthor = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.authorId }).populate('author', 'name email');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
