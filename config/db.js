import mongoose from 'mongoose'
import colors from 'colors';
import dotenv from "dotenv"

dotenv.config()
const connectDB = async ( ) => {
    try{
const conn = await mongoose.connect(process.env.MONGO_URL);
console.log(`Connected To Mongodb Database ${conn.connection.host}`.bgGreen.white)
    }
    catch (error){
console.log(`Error in MongoDb ${error}`.bgRed.white)
    }
}

export default  connectDB