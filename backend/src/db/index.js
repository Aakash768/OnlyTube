import mongoose from 'mongoose';
import { DB_NAME } from "../constant.js"

const connectionDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log(`MongoDB connected on port ${connectionInstance.connection.host}`);
    }
    catch (error) {
        console.log("Error Found", error);
        process.exit(1) //This code indicates a failure or error in the process. By convention, 1 is used to signal a general erro
    }
}

export default connectionDB;