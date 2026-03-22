import express from 'express';
import { createPost, getPosts, getPostFeed, getPostsByAuthor, updatePost, deletePost } from '../controllers/postController.js';

const router = express.Router();

router.get('/', getPosts);
router.get('/feed', getPostFeed);
router.get('/author/:authorId', getPostsByAuthor);
router.post('/', createPost);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);

export default router;
