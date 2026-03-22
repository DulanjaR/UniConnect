import jwt from 'jsonwebtoken';

export const generateToken = (userId, email, role) => {
  const token = jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
  return token;
};

export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return decoded;
  } catch (err) {
    return null;
  }
};
