import dotenv from "dotenv";
import connectDB from "./database/index.js";
import { app } from "./app.js";

dotenv.config({ path: "./.env" });


connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.error("Server error:", error);
            throw error; // Rethrow the error to stop the server from starting
        })
        app.listen(portProcess || 3000, () => {
            console.log(`server is running on port ${portProcess || 3000}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed :", error);
    });



const portProcess = process.env.PORT;








/*
    import express from 'express';
const app = express();


    ; (async () => {
        try {
            await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
            app.on('error', (error) => {
                console.error('Server error:', error);
                throw error; 
            })
            app.listen(process.env.PORT, () => {
                console.log(`server is running on port ${process.env.PORT}`)
            })
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
            throw error; // Rethrow the error to stop the server from starting
        }
    })()
*/