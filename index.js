import express from 'express';
import connectDB from './config/db.js';
import cors from 'cors';
import User from './routes/User.js';
import mongoose from 'mongoose';
import Message from './models/Message.js';
import { Server } from 'socket.io';
import Group from './routes/Group.js';
import GroupMessage from './models/GroupMessage.js';

const app = express();
app.use(express.json());
app.use(cors());

connectDB();

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use('/api/user', User);
app.use('/api/groups', Group);

const server = app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

io.on('connection', async (socket) => {
    console.log('Connected to socket.io');

    socket.on('join chat', async ({ senderId, receiverId }) => {
        const roomId = `${senderId}_${receiverId}`;
        socket.join(roomId);
        console.log('User Joined Room: ' + roomId);

        try {
            const messages = await Message.find({
                $or: [
                    { sender: senderId, receiver: receiverId },
                    { sender: receiverId, receiver: senderId },
                ],
            }).sort({ createdAt: 1 });
            console.log(messages);
            io.to(roomId).emit('messages', messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    });

    socket.on('typing', (room) => {


        socket.in(room).emit('typing');
    });

    socket.on('stop typing', (room) => {
        socket.in(room).emit('stop typing');
    });

    socket.on('new message', async (newMessageReceived) => {
        try {
            const message = new Message({
                sender: newMessageReceived.senderId,
                receiver: newMessageReceived.receiverId,
                content: newMessageReceived.content,
            });

            await message.save();

            const SenderroomId = `${newMessageReceived.senderId}_${newMessageReceived.receiverId}`;

            const ReceiverroomId = `${newMessageReceived.receiverId}_${newMessageReceived.senderId}`;
            io.to(SenderroomId).emit('message received', newMessageReceived);
            io.to(ReceiverroomId).emit('message received', newMessageReceived);

            try {
                const messages = await Message.find({
                    $or: [
                        { sender: newMessageReceived.senderId, receiver: newMessageReceived.receiverId },
                        { sender: newMessageReceived.receiverId, receiver: newMessageReceived.senderId },
                    ],
                }).sort({ createdAt: 1 });
                console.log(messages);
                io.to(SenderroomId).emit('messages', messages);
                io.to(ReceiverroomId).emit('messages', messages);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }

            console.log('Message saved:', message);
        } catch (error) {
            console.error(error);
        }
    });

    socket.on('join group', async (groupId) => {
        socket.join(groupId);
    
        try {
            const messages = await GroupMessage.find({ groupId: groupId }).populate('senderId').sort({ createdAt: 1 });
            // console.log("messages------------------------------", messages);
            messages.forEach(message => {
                io.to(groupId).emit('group message', message); // Emit each message individually
            });
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
        console.log('User Joined Group: ' + groupId);
    });
    
    socket.on('group message', async (data) => {
        try {
            console.log(data.senderId); // Ensure senderId is received correctly
            const message = new GroupMessage({
                senderId: data.senderId, // Use data.senderId for the sender's ID
                content: data.content,
                groupId: data.groupId,
            });
    
            await message.save();
            io.to(data.groupId).emit('group message', message); // Emit the new message
            // console.log("message saved", message);
        } catch (error) {
            console.error('Error saving group message:', error);
        }
    });
     
});
