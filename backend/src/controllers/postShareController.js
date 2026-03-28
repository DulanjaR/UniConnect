import { PostShare } from '../models/PostShare.js';
import { Post } from '../models/Post.js';
import { Group } from '../models/Group.js';

// Share a post to a group
export const sharePostToGroup = async (req, res) => {
  try {
    const { postId, groupId, caption } = req.body;
    const userId = req.user.userId;

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Verify group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify user is member of group
    const isMember = group.members.some(m => m.userId.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    // Check if already shared
    const existingShare = await PostShare.findOne({
      post: postId,
      sharedToGroup: groupId,
      sharedBy: userId
    });

    if (existingShare) {
      return res.status(400).json({ message: 'Post already shared to this group' });
    }

    const share = await PostShare.create({
      post: postId,
      sharedBy: userId,
      sharedToGroup: groupId,
      caption,
      status: 'active'
    });

    // Update post shares array
    await Post.findByIdAndUpdate(postId, { $push: { shares: share._id } });

    const populatedShare = await share.populate([
      { path: 'post', select: 'title body images author' },
      { path: 'sharedBy', select: 'name profilePicture' },
      { path: 'sharedToGroup', select: 'name' }
    ]);

    res.status(201).json(populatedShare);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get posts shared with a group
export const getGroupSharedPosts = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Verify group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const sharedPosts = await PostShare.find({
      sharedToGroup: groupId,
      status: 'active'
    })
      .populate({ path: 'post', populate: { path: 'author', select: 'name profilePicture email' } })
      .populate('sharedBy', 'name profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PostShare.countDocuments({
      sharedToGroup: groupId,
      status: 'active'
    });

    res.json({
      shares: sharedPosts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all shares for a post
export const getPostShares = async (req, res) => {
  try {
    const { postId } = req.params;

    const shares = await PostShare.find({
      post: postId,
      status: 'active'
    })
      .populate('sharedBy', 'name profilePicture')
      .populate('sharedToGroup', 'name');

    res.json(shares);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Remove share
export const removeShare = async (req, res) => {
  try {
    const { shareId } = req.params;
    const userId = req.user.userId;

    const share = await PostShare.findById(shareId);
    if (!share) {
      return res.status(404).json({ message: 'Share not found' });
    }

    if (share.sharedBy.toString() !== userId) {
      return res.status(403).json({ message: 'You can only remove your own shares' });
    }

    await PostShare.findByIdAndUpdate(shareId, { status: 'deleted' });
    await Post.findByIdAndUpdate(share.post, { $pull: { shares: shareId } });

    res.json({ message: 'Share removed successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
