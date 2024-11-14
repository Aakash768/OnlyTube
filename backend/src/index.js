import connectionDB from "./db/index.js";
import dotenv from 'dotenv';
import { app } from './app.js';

dotenv.config({
    path: "./.env"
});


connectionDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Port is running on: ${process.env.PORT}`)
        })
    })
    .catch((error) => {
        console.log(error)
    })
