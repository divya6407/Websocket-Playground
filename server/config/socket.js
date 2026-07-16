import { Server } from "socket.io";

export const createSocketServer = (httpServer) => {
  return new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://vercel.app"
      ],
      methods: ["GET", "POST"],
      credentials: true
    }
  });
};
