const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitalae', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Create indexes for better performance
        await createIndexes();
        
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

const createIndexes = async () => {
    try {
        // Get all models
        const User = require('../models/User');
        const HealthProfile = require('../models/HealthProfile');
        const HealthData = require('../models/HealthData');
        const Report = require('../models/Report');
        const File = require('../models/File');

        // Create indexes
        await User.createIndexes();
        await HealthProfile.createIndexes();
        await HealthData.createIndexes();
        await Report.createIndexes();
        await File.createIndexes();

        console.log('Database indexes created successfully');
    } catch (error) {
        console.error('Error creating indexes:', error);
    }
};

const disconnectDB = async () => {
    try {
        await mongoose.disconnect();
        console.log('MongoDB Disconnected');
    } catch (error) {
        console.error('Error disconnecting from database:', error);
    }
};

module.exports = { connectDB, disconnectDB };
