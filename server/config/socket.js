import { Server } from "socket.io";

export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
  });
  return io;
}