import { Complaint } from '../models/Complaint.js';
import { User } from '../models/User.js';

// Create a complaint/appeal
export const createComplaint = async (req, res) => {
  try {
    const { title, description, category, type, relatedItemId, relatedItemType, attachments } = req.body;
    const userId = req.user.userId;

    if (!title || !description || !category || !type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const complaint = new Complaint({
      complainant: userId,
      title,
      description,
      category,
      type,
      relatedItemId: relatedItemId || null,
      relatedItemType: relatedItemType || null,
      attachments: attachments || []
    });

    await complaint.save();
    await complaint.populate('complainant', 'name email');

    res.status(201).json({
      message: 'Complaint submitted successfully',
      data: complaint
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ message: 'Error creating complaint', error: error.message });
  }
};

// Get user's complaints/appeals
export const getUserComplaints = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, type } = req.query;

    let query = { complainant: userId };
    
    if (status) query.status = status;
    if (type) query.type = type;

    const complaints = await Complaint.find(query)
      .populate('complainant', 'name email')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ message: 'Error fetching complaints', error: error.message });
  }
};

// Get single complaint details
export const getComplaintDetails = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const userId = req.user.userId;

    const complaint = await Complaint.findById(complaintId)
      .populate('complainant', 'name email')
      .populate('resolvedBy', 'name email');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check if user is the complainant
    if (complaint.complainant._id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this complaint' });
    }

    res.status(200).json(complaint);
  } catch (error) {
    console.error('Error fetching complaint details:', error);
    res.status(500).json({ message: 'Error fetching complaint', error: error.message });
  }
};

// Update complaint status (admin only)
export const updateComplaintStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status, adminNotes } = req.body;

    if (!status || !['pending', 'under-review', 'resolved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      {
        status,
        adminNotes: adminNotes || complaint?.adminNotes,
        resolvedAt: status === 'resolved' ? new Date() : null,
        resolvedBy: req.user.userId
      },
      { new: true }
    ).populate('complainant', 'name email').populate('resolvedBy', 'name email');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.status(200).json({
      message: 'Complaint status updated',
      data: complaint
    });
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({ message: 'Error updating complaint', error: error.message });
  }
};

// Delete complaint (user only - pending complaints)
export const deleteComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const userId = req.user.userId;

    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.complainant.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this complaint' });
    }

    if (complaint.status !== 'pending') {
      return res.status(400).json({ message: 'Can only delete pending complaints' });
    }

    await Complaint.findByIdAndDelete(complaintId);

    res.status(200).json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({ message: 'Error deleting complaint', error: error.message });
  }
};

// Get all complaints (admin only)
export const getAllComplaints = async (req, res) => {
  try {
    const { status, type, priority } = req.query;
    let query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;

    const complaints = await Complaint.find(query)
      .populate('complainant', 'name email')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ message: 'Error fetching complaints', error: error.message });
  }
};
