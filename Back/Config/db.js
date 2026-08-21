const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connexion à MongoDB réussie !');
  } catch (error) {
    console.log('Connexion à MongoDB échouée !', error);
    process.exit(1);
  }
};

module.exports = connectDB;