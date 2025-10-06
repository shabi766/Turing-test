import mongoose from 'mongoose';

/**
 * @function connectDB
 * @description Establishes a connection to the MongoDB database using the MONGO_URI
 * from environment variables. Exits the process if connection fails.
 */
const connectDB = async () => {
    try {
        // We rely on dotenv being loaded in server.js before this function is called.
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in environment variables. Please check your .env file.');
        }

        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;
