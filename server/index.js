import express from "express";
import cors from "cors";
import http from "http";
import PlayerManager from "./managers/PlayerManager.js";
import MatchmakingManager from "./managers/MatchmakingManager.js";
import RoomManager from "./managers/RoomManager.js";
import GameManager from "./managers/GameManager.js";
import { createSocketServer } from "./config/socket.js";
import registerSocketEvents from "./socket/registerSocketEvents.js";

// Initialize managers
const playerManager = new PlayerManager();
const matchmakingManager = new MatchmakingManager();
const roomManager = new RoomManager();
const gameManager = new GameManager();

const app = express();

// Multi-origin setup for regular HTTP routes
const allowedOrigins = [
  "http://localhost:5173",
  "https://websocket-playground.vercel.app" 
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.get("/", (req, res) => {
  res.send("Backend is Running");
});

// Render dynamically sets process.env.PORT. Fallback to 3000 locally.
const PORT = process.env.PORT || 3000; 
const httpServer = http.createServer(app);
const io = createSocketServer(httpServer);

io.on("connection", (socket) => {
  console.log("Client Connected, socket ID:", socket.id);

  registerSocketEvents(socket, io, {
    playerManager,
    roomManager,
    matchmakingManager,
    gameManager,
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
