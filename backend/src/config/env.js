import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from backend root (.env is 2 levels up from src/config/env.js)
const envPath = path.resolve(__dirname, '../../.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

console.log('✓ Environment variables loaded');
console.log('  CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('  CLOUDINARY_API_KEY length:', process.env.CLOUDINARY_API_KEY?.length);
console.log('  CLOUDINARY_API_SECRET length:', process.env.CLOUDINARY_API_SECRET?.length);
