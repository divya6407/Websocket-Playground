import { EVENTS } from "../constants/events.js";
import { normalizePlayNowPayload } from "../utils/normalizePlayNowPayload.js";

export default function registerRoomEvents(socket, io, roomManager, matchmakingManager, gameManager) {
  socket.on(EVENTS.PLAY_NOW, (data = {}) => {
    const { gameType, difficulty } = normalizePlayNowPayload(data);
    matchmakingManager.addPlayer(socket, gameType);

    if (!matchmakingManager.isMatchAvailable(gameType)) return;

    console.log("Match Found 🥳🥳🥳");
    const [player1, player2] = matchmakingManager.getNextPlayers(gameType);
    console.log(player1.id, player2.id);

    const payload = gameType === "typing" && difficulty ? { game: gameType, difficulty } : { game: gameType };
    const roomId = roomManager.createRoom([player1, player2], payload);
    console.log(roomId);

    player1.join(roomId);
    player2.join(roomId);

    // Game has both players — create the game session immediately
    gameManager.createGame(gameType, roomId, [player1.id, player2.id]);

    io.to(roomId).emit(EVENTS.MATCH_FOUND, { roomId, game: payload });
    console.log(player1.rooms, player2.rooms);
  });

  socket.on(EVENTS.CREATE_ROOM, (data) => {
    console.log("CREATE_ROOM received:", JSON.stringify(data));
    const roomId = roomManager.createRoom([socket.id], data);
    const room = roomManager.getRoom(roomId);
    console.log("Room created:", roomId, "game data:", JSON.stringify(room?.game));
    socket.join(roomId);
    socket.emit(EVENTS.SET_ROOM_CODE, roomId);
  });

  socket.on("update-difficulty", (roomId, difficulty) => {
    console.log("UPDATE_DIFFICULTY:", roomId, difficulty);
    const room = roomManager.getRoom(roomId);
    if (room && room.game) {
      room.game.difficulty = difficulty;
    }
  });

  socket.on(EVENTS.DELETE_ROOM, (roomId) => {
    roomManager.removePlayer(roomId, socket.id);
    gameManager.endGame(roomId);
    socket.leave(roomId);
    socket.emit(EVENTS.SUCCESSFUL_DELETE_ROOM, "deleted");
  });

  socket.on(EVENTS.JOIN_ROOM, (roomId) => {
    const result = roomManager.joinPlayer(roomId, socket);
    if (!result.success) {
      socket.emit(EVENTS.ROOM_ERROR, result.message);
      return;
    }

    socket.emit(EVENTS.JOIN_SUCCESS, {
      roomId: result.roomId,
      game: result.game,
    });

    socket.to(result.roomId).emit(EVENTS.PLAYER_JOIN, {
      roomId: result.roomId,
      game: result.game,
    });

    // If the room now has 2 players, create the game session
    const room = roomManager.getRoom(roomId);
    if (room && room.players.length === 2) {
      const gameType = typeof result.game === "object" ? result.game.type : result.game;
      gameManager.createGame(gameType, roomId, room.players);
    }
  });

  socket.on(EVENTS.GET_ROOM, (roomId) => {
    const room = roomManager.getRoom(roomId);
    if (room) {
      socket.emit(EVENTS.SEND_ROOM, room);
    } else {
      socket.emit(EVENTS.SEND_ROOM, "error");
    }
  });

  socket.on(EVENTS.LEAVE_ROOM, (roomId) => {
    const room = roomManager.getRoom(roomId);
    if (room) {
      socket.to(roomId).emit(EVENTS.OPPONENT_LEFT_ROOM, {
        message: "Your opponent has left the room.",
      });
      socket.leave(roomId);
    }
    roomManager.removePlayer(roomId, socket.id);
    gameManager.endGame(roomId);
  });
}