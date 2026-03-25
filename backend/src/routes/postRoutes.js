import express from 'express';
import { 
  createPost, 
  getPosts, 
  getPostFeed, 
  getPostsByAuthor, 
  getPost,
  updatePost, 
  deletePost,
  likePost 
} from '../controllers/postController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getPosts);
router.get('/feed', getPostFeed);
router.get('/author/:authorId', getPostsByAuthor);
router.get('/:id', getPost);

// Protected routes (require authentication)
router.post('/', authMiddleware, createPost);

// Upload endpoint with error handling
router.post('/upload', authMiddleware, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({
      success: true,
      imageUrl: req.file.path,
      publicId: req.file.filename
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}, (err, req, res, next) => {
  // Multer and Cloudinary error handling
  console.error('Upload error:', err);
  res.status(500).json({ 
    message: err.message || 'Failed to upload image',
    details: err.toString()
  });
});

router.put('/:id', authMiddleware, updatePost);
router.delete('/:id', authMiddleware, deletePost);
router.post('/:id/like', authMiddleware, likePost);

export default router;
