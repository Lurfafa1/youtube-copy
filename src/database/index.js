import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js'

const connectDB = async () => {
    try {
        // consoleLog the conn asignment
        const conn = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`Connected to MongoDB at ${conn.connection.host}`)
        console.log(`${conn}`)
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1); // Exit the process with failure
    }
}

export default connectDB;