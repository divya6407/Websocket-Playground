import { generateRoomCode } from "../utils/generateRoomCode.js";

class RoomManager {
  rooms = new Map();

  generateRoomID() {
    let id;
    do {
      id = generateRoomCode();
    } while (this.rooms.has(id));
    return id;
  }

  createRoom(players, game, options = {}) {
    const roomId = this.generateRoomID();

    const formattedPlayers = players.map((p) =>
      typeof p === "string" ? p : p.id
    );

    this.rooms.set(roomId, {
      players: formattedPlayers,
      status: "waiting",
      game: {
        type: typeof game === 'object' ? game.game || game.type : game,
        ...(typeof game === 'object' && game.difficulty ? { difficulty: game.difficulty } : {}),
      },
    });

    return roomId;
  }

  isPlayerInRoom(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    return room.players.includes(socketId);
  }

  deleteRoom(roomId) {
    return this.rooms.delete(roomId);
  }

  findRoomBySocketId(socketId) {
    for (const [roomId, room] of this.rooms) {
      if (room.players.includes(socketId)) {
        return { roomId, ...room };
      }
    }
    return null;
  }

  removePlayer(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.players = room.players.filter((id) => id !== socketId);

    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      return null;
    }

    room.status = "waiting";
    return room;
  }

  joinPlayer(roomId, socket) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, message: "Room Not Found" };
    }
    if (room.players.length >= 2) {
      return { success: false, message: "Room Full" };
    }
    if (room.players.includes(socket.id)) {
      return { success: false, message: "Player already in room" };
    }

    room.players.push(socket.id);
    room.status = "playing";
    socket.join(roomId);

    return {
      success: true,
      roomId,
      game: room.game,
    };
  }

  getRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    return room;
  }
}

export default RoomManager;