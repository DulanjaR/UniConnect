import './config/env.js'; // Load env vars FIRST
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import lostItemRoutes from './routes/lostItemRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/uniconnect';

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'uniconnect-backend' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/lost-items', lostItemRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

connectDB(mongoUri).then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});

