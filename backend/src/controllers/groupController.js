import { Group } from '../models/Group.js';
import { User } from '../models/User.js';

// Create a new group with IT numbers
export const createGroup = async (req, res) => {
  try {
    const { name, description, memberITNumbers, isPrivate } = req.body;
    const creatorId = req.user.userId;
    const normalizedName = name?.trim();
    const normalizedDescription = description?.trim() || '';
    const normalizedITNumbers = [
      ...new Set(
        (memberITNumbers || [])
          .map((itNumber) => itNumber?.trim().toUpperCase())
          .filter(Boolean)
      )
    ];

    if (!normalizedName || normalizedITNumbers.length === 0) {
      return res.status(400).json({ message: 'Group name and at least one IT number required' });
    }

    const creator = await User.findById(creatorId).select('_id itNumber');
    if (!creator) {
      return res.status(404).json({ message: 'Creator not found' });
    }

    // Find users by IT numbers
    const users = await User.find({ itNumber: { $in: normalizedITNumbers } });
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found with provided IT numbers' });
    }

    const foundITNumbers = new Set(users.map((user) => user.itNumber));
    const missingITNumbers = normalizedITNumbers.filter((itNumber) => !foundITNumbers.has(itNumber));
    if (missingITNumbers.length > 0) {
      return res.status(404).json({
        message: `Users not found for IT number(s): ${missingITNumbers.join(', ')}`
      });
    }

    // Create members array
    const members = users.map(user => ({
      userId: user._id,
      itNumber: user.itNumber,
      joinedAt: new Date()
    }));

    // Ensure creator is in the group
    const creatorExists = members.find(m => m.userId.toString() === creatorId);
    if (!creatorExists) {
      members.push({
        userId: creatorId,
        itNumber: creator.itNumber,
        joinedAt: new Date()
      });
    }

    const group = await Group.create({
      name: normalizedName,
      description: normalizedDescription,
      creator: creatorId,
      members,
      memberITNumbers: [...new Set(members.map((member) => member.itNumber))],
      isPrivate: Boolean(isPrivate),
      status: 'active'
    });

    // Add group to all members' groups array without duplicates
    await User.updateMany(
      { _id: { $in: members.map((member) => member.userId) } },
      { $addToSet: { groups: group._id } }
    );

    const populatedGroup = await group.populate('members.userId', 'name email profilePicture itNumber');
    res.status(201).json(populatedGroup);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all groups for current user
export const getMyGroups = async (req, res) => {
  try {
    const userId = req.user.userId;

    const groups = await Group.find({
      'members.userId': userId,
      status: 'active'
    })
      .populate('creator', 'name email profilePicture')
      .populate('members.userId', 'name email profilePicture itNumber')
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get group details
export const getGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;

    const group = await Group.findById(groupId)
      .populate('creator', 'name email profilePicture')
      .populate('members.userId', 'name email profilePicture itNumber');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is member
    const isMember = group.members.some(m => m.userId._id.toString() === userId);
    if (!isMember && group.isPrivate) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(group);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Add member to group by IT number
export const addMemberToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const normalizedITNumber = req.body.itNumber?.trim().toUpperCase();
    const userId = req.user.userId;

    if (!normalizedITNumber) {
      return res.status(400).json({ message: 'IT number is required' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is group creator
    if (group.creator.toString() !== userId) {
      return res.status(403).json({ message: 'Only group creator can add members' });
    }

    // Check if IT number already in group
    if (group.memberITNumbers.includes(normalizedITNumber)) {
      return res.status(400).json({ message: 'User already in group' });
    }

    // Find user by IT number
    const user = await User.findOne({ itNumber: normalizedITNumber });
    if (!user) {
      return res.status(404).json({ message: 'User with that IT number not found' });
    }

    // Add member
    group.members.push({
      userId: user._id,
      itNumber: user.itNumber,
      joinedAt: new Date()
    });

    group.memberITNumbers.push(user.itNumber);
    await group.save();

    // Add group to user's groups
    await User.findByIdAndUpdate(user._id, { $push: { groups: group._id } });

    await group.populate('members.userId', 'name email profilePicture itNumber');
    res.json(group);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Remove member from group
export const removeMemberFromGroup = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user.userId;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is group creator
    if (group.creator.toString() !== userId) {
      return res.status(403).json({ message: 'Only group creator can remove members' });
    }

    const memberIndex = group.members.findIndex(m => m.userId.toString() === memberId);
    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Member not found in group' });
    }

    const itNumber = group.members[memberIndex].itNumber;
    group.members.splice(memberIndex, 1);
    group.memberITNumbers = group.memberITNumbers.filter(it => it !== itNumber);

    await group.save();

    // Remove group from user's groups
    await User.findByIdAndUpdate(memberId, { $pull: { groups: group._id } });

    await group.populate('members.userId', 'name email profilePicture itNumber');
    res.json(group);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete group
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.creator.toString() !== userId) {
      return res.status(403).json({ message: 'Only group creator can delete group' });
    }

    // Remove group from all members
    await User.updateMany(
      { _id: { $in: group.members.map(m => m.userId) } },
      { $pull: { groups: group._id } }
    );

    await Group.findByIdAndUpdate(groupId, { status: 'deleted' });

    res.json({ message: 'Group deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
