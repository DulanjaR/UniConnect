import { User } from '../models/User.js';

export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { search } = req.query;
    
    const query = search 
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { university: { $regex: search, $options: 'i' } },
            { itNumber: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const users = await User.find(query)
      .select('-password')
      .limit(20);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const searchUsersByItNumber = async (req, res) => {
  try {
    const { itNumber } = req.query;

    if (!itNumber || itNumber.trim().length === 0) {
      return res.json([]);
    }

    // Search for users with similar IT numbers
    const users = await User.find({
      itNumber: { $regex: '^' + itNumber.trim(), $options: 'i' },
      isActive: true
    })
      .select('_id itNumber name email academicYear semester university')
      .limit(10);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
