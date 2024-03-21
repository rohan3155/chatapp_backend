import express from 'express';
import connectDB from './config/db.js';
import cors from "cors";
import User from './routes/User.js';
import { errorHandler, notFound } from './middlewares/error.js';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import Message from './models/Message.js';

const app = express();
app.use(express.json());
app.use(cors());

connectDB();

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use('/api/user', User);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(3000, () => {
    console.log('server running at http://localhost:3000');
});

const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', async (socket) => {
    console.log('Connected to socket.io');
    
    socket.on('setup', (userData) => {
        socket.join(userData._id);
        socket.emit('connected setup');
    });

    socket.on('join chat', async ({ senderId, receiverId }) => {
        const roomId = `${senderId}_${receiverId}`;
        socket.join(roomId);
        console.log('User Joined Room: ' + roomId);
    
        // Fetch messages from the database for the joined room
        try {
            const messages = await Message.find({
                $or: [
                    { sender: senderId, receiver: receiverId },
                    { sender: receiverId, receiver: senderId }
                ]
            }).sort({ createdAt: 1 });
            console.log(messages)
            socket.emit('messages', messages); // Emit messages to the frontend
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    });
    

    socket.on('typing', (room) => socket.in(room).emit('typing'));
    socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

    socket.on('new message', async (newMessageReceived) => {
        const roomId = `${newMessageReceived.sender}_${newMessageReceived.receiver}`;
            io.to(roomId).emit('message received', newMessageReceived);
        try {
            console.log(newMessageReceived.senderId)
            const message = new Message({
                sender: newMessageReceived.senderId,
                receiver: newMessageReceived.receiverId,
                content: newMessageReceived.content,
            });

            await message.save();

            
            

            console.log('Message saved:', message);
        } catch (error) {
            console.error(error);
        }
    });
});

