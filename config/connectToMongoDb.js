const mongoose = require('mongoose');

const DB_URL = process.env.DB_URL || "mongodb://127.0.0.1:27017/pak-auto";

async function connectToMongoDB() {
  try {
    await mongoose.connect(DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB!');
  } catch (error) {
    console.error(error);
  }
}

module.exports = connectToMongoDB;