const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


let rooms = {};

io.on("connection", (socket) => {

  socket.on("joinRoom", ({ roomID, playerName }) => {

    socket.join(roomID);

    if (!rooms[roomID]) rooms[roomID] = [];

    rooms[roomID].push({
      id: socket.id,
      name: playerName,
      score: 0
    });

    io.to(roomID).emit("roomUpdate", rooms[roomID]);
  });

  socket.on("scoreUpdate", ({ roomID, score }) => {
    if (!rooms[roomID]) return;

    rooms[roomID] = rooms[roomID].map(p =>
      p.id === socket.id ? { ...p, score } : p
    );

    socket.to(roomID).emit("opponentScore", score);
  });

  socket.on("disconnect", () => {
    for (let roomID in rooms) {
      rooms[roomID] = rooms[roomID].filter(p => p.id !== socket.id);
      io.to(roomID).emit("roomUpdate", rooms[roomID]);
    }
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
