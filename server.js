const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: "*",  //switch to production origin
        methods: ["GET", "POST"]
    }
});



app.use(express.static('public'));

const players = {};
let playerHoldingFlower = null;

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    // 1️⃣ Add new player immediately
    const newPlayerData = { x: 0, y: 0.5, z: 0 };
    players[socket.id] = newPlayerData;

    // 2️⃣ Send current players to new client
    socket.emit("currentPlayers", players);

    // 3️⃣ Send flower holder if any
    if (playerHoldingFlower) socket.emit("flowerPickedUp", { id: playerHoldingFlower });

    // 4️⃣ Notify all others about the new player (with position)
    socket.broadcast.emit("newPlayer", { id: socket.id, ...newPlayerData });

    // 5️⃣ Handle position updates
    socket.on("updatePosition", (data) => {
        players[socket.id] = data;
        socket.broadcast.emit("playerMoved", { id: socket.id, ...data });
    });

    // 6️⃣ Flower events
    socket.on("flowerPickedUp", (data) => {
        playerHoldingFlower = data.id;
        io.emit("flowerPickedUp", { id: data.id });
    });

    socket.on("flowerDropped", () => {
        playerHoldingFlower = null;
        io.emit("flowerDropped");
    });

    // 7️⃣ Disconnect
    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
        delete players[socket.id];
        if (playerHoldingFlower === socket.id) {
            playerHoldingFlower = null;
            io.emit("flowerDropped");
        }
        socket.broadcast.emit("playerDisconnected", socket.id);
    });
});

server.listen(3000, () => console.log("Server running on port 3000"));

//67