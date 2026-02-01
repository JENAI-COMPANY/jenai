const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/network-marketing');
    console.log('MongoDB Connected');

    // Get the User collection
    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // List all indexes
    const indexes = await collection.indexes();
    console.log('\nCurrent indexes:');
    indexes.forEach(index => {
      console.log('- ', index.name, ':', JSON.stringify(index.key));
    });

    // Drop the email index if it exists
    try {
      await collection.dropIndex('email_1');
      console.log('\n✓ Successfully dropped email_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('\n- email_1 index does not exist (already removed)');
      } else {
        throw error;
      }
    }

    // List indexes after removal
    const indexesAfter = await collection.indexes();
    console.log('\nIndexes after removal:');
    indexesAfter.forEach(index => {
      console.log('- ', index.name, ':', JSON.stringify(index.key));
    });

    console.log('\n✓ Email field is now optional and non-unique');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

connectDB();
