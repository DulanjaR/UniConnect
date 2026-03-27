import { LostItem } from '../models/LostItem.js';
import { AdminLog } from '../models/AdminLog.js';

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
      contactPhone,
    } = req.body;

    const reporterId = req.user.userId;

    // ✅ HANDLE IMAGES
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map((file) => file.path);
    }

    const item = new LostItem({
      reporter: reporterId,
      title,
      description,
      category,
      itemType,
      location,
      dateOfIncident,
      images: imageUrls, // ✅ IMPORTANT
      contactInfo: {
        email: contactEmail,
        phone: contactPhone,
      },
      status: "active",
    });

    await item.save();
    await item.populate("reporter", "name email profilePicture phone");

    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

export const getLostItems = async (req, res) => {
  try {
    const { page = 1, limit = 10, itemType, category, status = 'active', search, sort = '-createdAt' } = req.query;
    const skip = (page - 1) * limit;

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

    const items = await LostItem.find(filter)
      .populate('reporter', 'name email profilePicture phone university')
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
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getLostItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await LostItem.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('reporter', 'name email profilePicture phone university bio')
      .populate('resolvedBy', 'name email');

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
    const { id } = req.params;

    const item = await LostItem.findById(id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (
      item.reporter.toString() !== req.user.userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // ✅ Update fields
    item.title = req.body.title || item.title;
    item.description = req.body.description || item.description;
    item.category = req.body.category || item.category;
    item.itemType = req.body.itemType || item.itemType;
    item.location = req.body.location || item.location;
    item.dateOfIncident =
      req.body.dateOfIncident || item.dateOfIncident;

    // ✅ Contact info
    item.contactInfo = {
      email: req.body.contactEmail || item.contactInfo?.email,
      phone: req.body.contactPhone || item.contactInfo?.phone,
    };

    // ✅ IMAGE UPDATE (IMPORTANT)
    if (req.files && req.files.length > 0) {
      const imageUrls = req.files.map((file) => file.path);
      item.images = imageUrls; // replace images
    }

    await item.save();

    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const deleteLostItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await LostItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.reporter.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }

    await LostItem.findByIdAndUpdate(id, { status: 'removed' });

    // Log admin action if admin deleted
    if (req.user.role === 'admin') {
      await AdminLog.create({
        admin: req.user.userId,
        action: 'delete-item',
        targetType: 'lostitem',
        targetId: id,
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
    const { id } = req.params;
    const { resolvedById } = req.body;

    const item = await LostItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.reporter.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to resolve this item' });
    }

    item.status = 'resolved';
    item.resolvedBy = resolvedById || req.user.userId;
    item.resolvedDate = new Date();

    await item.save();
    await item.populate('reporter', 'name email');
    await item.populate('resolvedBy', 'name email');

    res.json({
      message: 'Item marked as resolved',
      item
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const item = await LostItem.findByIdAndUpdate(
      id,
      {
        $push: {
          comments: {
            user: req.user.userId,
            text,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    )
      .populate('reporter', 'name email')
      .populate('comments.user', 'name email profilePicture');

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const flagItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can flag items' });
    }

    const item = await LostItem.findByIdAndUpdate(
      id,
      { flagged: true, flagReason: reason },
      { new: true }
    );

    await AdminLog.create({
      admin: req.user.userId,
      action: 'flag-item',
      targetType: 'lostitem',
      targetId: id,
      reason
    });

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyItems = async (req, res) => {
  try {
    const items = await LostItem.find({
      reporter: req.user.userId,
      status: { $ne: "removed" } // exclude deleted items
    }).sort({ createdAt: -1 });

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};