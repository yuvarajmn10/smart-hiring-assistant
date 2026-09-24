const mongoose = require('mongoose');
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB error: ${error.message}`);
        process.exit(1);
        // process.exit(1) means: if DB fails, crash the server
        // An app with no DB is broken — better to know immediately
    }
};
module.exports = connectDB;