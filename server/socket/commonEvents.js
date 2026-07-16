import { EVENTS } from "../constants/events.js";

export default function registerCommonEvents(socket, io, playerManager, roomManager, gameManager) {
  socket.on(EVENTS.HELLO_SERVER, (message) => {
    console.log("Received :", message);
    socket.emit(EVENTS.HELLO_CLIENT, "Hello client");
  });

  socket.on(EVENTS.SET_USERNAME, (playerName) => {
    playerManager.addPlayer(socket.id, playerName);
    io.emit("active-player-count", playerManager.getActiveCount());
    console.log("Updated Player Pool:", playerManager.getAllPlayers());
  });

  socket.on("get-active-count", () => {
    socket.emit("active-player-count", playerManager.getActiveCount());
  });

  socket.on(EVENTS.CONNECTION, () => {
    socket.emit("active-player-count", playerManager.getActiveCount());
  });

  socket.on(EVENTS.DISCONNECT, () => {
    playerManager.removePlayer(socket.id);
    // Broadcast updated active count to all clients
    io.emit("active-player-count", playerManager.getActiveCount());

    const roomData = roomManager.findRoomBySocketId(socket.id);
    if (!roomData) return;

    const { roomId } = roomData;
    const updatedRoom = roomManager.removePlayer(roomId, socket.id);
    gameManager.endGame(roomId);

    if (updatedRoom) {
      io.to(roomId).emit(EVENTS.PLAYER_LEFT, {
        message: "Opponent disconnected",
      });
    }
    console.log(`[DISCONNECT] Socket ${socket.id} cleaned from room ${roomId}`);
  });
}
