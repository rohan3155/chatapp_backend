import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const rooms = new Map();
const users = new Map();

app.get('/', (req, res) => {
    res.send('Hello World!');
});

io.on('connection', (socket) => {
    console.log('a user connected', socket.id);

    // Store the socket id in the users map
    users.set(socket.id, { isAdmin: false, rooms: new Set() });

    // Listen for messages
    socket.on('message', (msg) => {
        console.log('message: ' + msg);
        io.emit('message', msg);
    });

    // Listen for private messages
    socket.on('private_message', (id, msg) => {
        console.log('private_message: ' + msg);
        socket.to(id).emit('private_message', msg);
    });

    // Create a room
    socket.on('createRoom', (roomName) => {
        if (rooms.has(roomName)) {
            socket.emit('roomError', 'Room already exists.');
            return;
        }

        // Create the room
        rooms.set(roomName, new Set());
        socket.join(roomName);
        // Add the room to the user's joined rooms
        users.get(socket.id).rooms.add(roomName);
        socket.emit('roomCreated', roomName);
    });

    // Join a room
    socket.on('joinRoom', (room) => {
        socket.join(room);
        // Add the room to the user's joined rooms
        users.get(socket.id).rooms.add(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
    });

    // Get the list of rooms joined by any user
    socket.on('getRooms', () => {
        const userRooms = [];
        for (const [room, usersInRoom] of rooms.entries()) {
            if (usersInRoom.has(socket.id)) {
                userRooms.push(room);
            }
        }
        socket.emit('userRooms', userRooms);
    });

    // Send a message to a room
    socket.on('sendMessageToRoom', (room, message) => {
        console.log(`Socket ${socket.id} sent message to room ${room}: ${message}`);
        io.to(room).emit('sendMessageToRoom', message);
    });

    // Delete a room (only admin can delete)
    socket.on('deleteRoom', (roomName) => {
        const user = users.get(socket.id);
        if (!user || !user.isAdmin) {
            socket.emit('roomError', 'Only admin can delete a room.');
            return;
        }

        if (!rooms.has(roomName)) {
            socket.emit('roomError', 'Room does not exist.');
            return;
        }

        rooms.delete(roomName);
        io.to(roomName).emit('roomDeleted', roomName);
    });

    // Leave a room
    socket.on('leaveRoom', (roomName) => {
        if (!rooms.has(roomName)) {
            socket.emit('roomError', 'Room does not exist.');
            return;
        }

        socket.leave(roomName);
        users.get(socket.id).rooms.delete(roomName);
        socket.emit('roomLeft', roomName);
    });

    // Set user as admin
    socket.on('setAdmin', () => {
        const user = users.get(socket.id);
        if (user) {
            user.isAdmin = true;
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        // Remove the user from the users map
        users.delete(socket.id);
    });
});

server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
});
