import { io } from "socket.io-client";

const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const LOCAL_BACKEND = "http://localhost:3000";
const PROD_BACKEND = "https://websocket-playground-backend.onrender.com"; // Your live Render URL

const socketUrl = isLocal ? LOCAL_BACKEND : PROD_BACKEND;

export const socket = io(socketUrl, {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket", "polling"]
});
