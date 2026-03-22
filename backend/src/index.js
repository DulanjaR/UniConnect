import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import postRoutes from './routes/postRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/uniconnect';

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'uniconnect-backend' });
});

app.use('/api/posts', postRoutes);

connectDB(mongoUri).then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});
