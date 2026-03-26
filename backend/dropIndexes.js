import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/uniconnect';

const dropIndexes = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    const collection = mongoose.connection.collection('posts');
    
    // Get all current indexes
    const indexes = await collection.getIndexes();
    console.log('\nCurrent indexes:');
    Object.keys(indexes).forEach(key => console.log('  -', key));

    // Drop the problematic old text index
    try {
      await collection.dropIndex('title_text_body_text_tags_1_category_1');
      console.log('\n✓ Dropped old index: title_text_body_text_tags_1_category_1');
    } catch (err) {
      console.log('\n✓ Old index not found (already dropped or never existed)');
    }

    // Also try to drop by field spec
    try {
      await collection.dropIndex({ title: 'text', body: 'text', tags: 1, category: 1 });
      console.log('✓ Dropped old index by field spec');
    } catch (err) {
      // Ignore if not found
    }

    console.log('\n✓ Cleanup complete. Server will recreate correct indexes on restart.');
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

dropIndexes();
