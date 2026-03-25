import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/User.js';

const loadUserFromToken = async (authorizationHeader) => {
  const token = authorizationHeader?.split(' ')[1];
  if (!token) {
    return { error: { status: 401, message: 'No token provided' } };
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return { error: { status: 401, message: 'Invalid token' } };
  }

  const user = await User.findById(decoded.userId).select(
    'name email role isActive commentModerationStatus'
  );

  if (!user) {
    return { error: { status: 401, message: 'User not found' } };
  }

  if (!user.isActive || user.commentModerationStatus === 'suspended') {
    return { error: { status: 403, message: 'Your account has been restricted' } };
  }

  return {
    user: {
      ...decoded,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      commentModerationStatus: user.commentModerationStatus
    }
  };
};

export const authMiddleware = async (req, res, next) => {
  try {
    const { user, error } = await loadUserFromToken(req.headers.authorization);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return next();
    }

    const { user } = await loadUserFromToken(req.headers.authorization);
    if (user) {
      req.user = user;
    }

    next();
  } catch (err) {
    next();
  }
};

export const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
