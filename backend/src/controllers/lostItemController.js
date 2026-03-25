import { LostItem } from '../models/LostItem.js';
import { AdminLog } from '../models/AdminLog.js';

const parseNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const createLostItem = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      itemType,
      location,
      dateOfIncident,
      contactEmail,
      contactPhone
    } = req.body;

    if (!title || !description || !category || !itemType || !dateOfIncident) {
      return res.status(400).json({ message: 'Missing required lost item fields' });
    }

    const item = await LostItem.create({
      reporter: req.user.userId,
      title,
      description,
      category,
      itemType,
      location,
      dateOfIncident,
      contactInfo: {
        email: contactEmail,
        phone: contactPhone
      }
    });

    const populatedItem = await LostItem.findById(item._id).populate(
      'reporter',
      'name email profilePicture phone university'
    );

    res.status(201).json(populatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getLostItems = async (req, res) => {
  try {
    const page = parseNumber(req.query.page, 1);
    const limit = parseNumber(req.query.limit, 10);
    const skip = (page - 1) * limit;
    const { itemType, category, status = 'active', search, sort = '-createdAt' } = req.query;

    const filter = { status };
    if (itemType) {
      filter.itemType = itemType;
    }
    if (category) {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const [items, total] = await Promise.all([
      LostItem.find(filter)
        .populate('reporter', 'name email profilePicture phone university')
        .populate('resolvedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      LostItem.countDocuments(filter)
    ]);

    res.json({
      items,
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

export const getLostItem = async (req, res) => {
  try {
    const item = await LostItem.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('reporter', 'name email profilePicture phone university bio')
      .populate('resolvedBy', 'name email')
      .populate('comments.user', 'name email profilePicture');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateLostItem = async (req, res) => {
  try {
    const item = await LostItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.reporter.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }

    const updatedItem = await LostItem.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        location: req.body.location,
        dateOfIncident: req.body.dateOfIncident
      },
      { new: true }
    ).populate('reporter', 'name email profilePicture');

    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteLostItem = async (req, res) => {
  try {
    const item = await LostItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.reporter.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }

    await LostItem.findByIdAndUpdate(req.params.id, { status: 'removed' });

    if (req.user.role === 'admin') {
      await AdminLog.create({
        admin: req.user.userId,
        action: 'delete-item',
        targetType: 'lostitem',
        targetId: req.params.id,
        reason: 'Admin deletion'
      });
    }

    res.json({ message: 'Item removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markAsResolved = async (req, res) => {
  try {
    const item = await LostItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.reporter.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to resolve this item' });
    }

    item.status = 'resolved';
    item.resolvedBy = req.body.resolvedById || req.user.userId;
    item.resolvedDate = new Date();
    await item.save();

    await item.populate('reporter', 'name email');
    await item.populate('resolvedBy', 'name email');

    res.json({ message: 'Item marked as resolved', item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addComment = async (req, res) => {
  try {
    if (!req.body.text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const item = await LostItem.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            user: req.user.userId,
            text: req.body.text,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    ).populate('comments.user', 'name email profilePicture');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const flagItem = async (req, res) => {
  try {
    const item = await LostItem.findByIdAndUpdate(
      req.params.id,
      { flagged: true, flagReason: req.body.reason || 'Flagged by admin' },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await AdminLog.create({
      admin: req.user.userId,
      action: 'flag-item',
      targetType: 'lostitem',
      targetId: req.params.id,
      reason: req.body.reason || 'Flagged by admin'
    });

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
