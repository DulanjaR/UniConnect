import { Group } from '../models/Group.js';
import { GroupMember } from '../models/GroupMember.js';

export const loadGroupById = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id).populate('createdBy', 'name email role');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    req.group = group;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const groupManagerMiddleware = async (req, res, next) => {
  try {
    if (req.user?.role === 'admin') {
      return next();
    }

    const membership = await GroupMember.findOne({
      groupId: req.params.id,
      userId: req.user.userId
    });

    if (!membership || membership.role !== 'group_admin') {
      return res.status(403).json({ message: 'Group admin access required' });
    }

    req.groupMembership = membership;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const groupMemberMiddleware = async (req, res, next) => {
  try {
    const membership = await GroupMember.findOne({
      groupId: req.params.id,
      userId: req.user.userId
    });

    if (!membership) {
      return res.status(403).json({ message: 'Group membership required' });
    }

    req.groupMembership = membership;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
