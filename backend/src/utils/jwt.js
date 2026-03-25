import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'replace-this-secret';

export const generateToken = (userId, email, role) =>
  jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '7d' });

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};
