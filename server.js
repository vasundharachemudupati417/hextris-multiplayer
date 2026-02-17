const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let rooms = {};

io.on('connection', (socket) => {
    console.log("User connected:", socket.id);

    socket.on('createRoom', (roomCode, playerName) => {
        socket.join(roomCode);
        rooms[roomCode] = {
            players: [{ id: socket.id, name: playerName, score: 0 }]
        };
        socket.emit('roomCreated', roomCode);
    });

    socket.on('joinRoom', (roomCode, playerName) => {
        if (rooms[roomCode]) {
            socket.join(roomCode);
            rooms[roomCode].players.push({
                id: socket.id,
                name: playerName,
                score: 0
            });

            io.to(roomCode).emit('updatePlayers', rooms[roomCode].players);
        } else {
            socket.emit('errorMessage', "Room does not exist");
        }
    });

    socket.on('scoreUpdate', ({ roomCode, score }) => {
        if (rooms[roomCode]) {
            const player = rooms[roomCode].players.find(p => p.id === socket.id);
            if (player) player.score = score;

            io.to(roomCode).emit('updatePlayers', rooms[roomCode].players);
        }
    });

    socket.on('disconnect', () => {
        for (let roomCode in rooms) {
            rooms[roomCode].players =
                rooms[roomCode].players.filter(p => p.id !== socket.id);

            io.to(roomCode).emit('updatePlayers', rooms[roomCode].players);
        }
    });
});


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
