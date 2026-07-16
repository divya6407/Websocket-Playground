export const EVENTS = {
  // Connection
  CONNECTION: "connection",
  DISCONNECT: "disconnect",

  // Hello
  HELLO_SERVER: "hello-server",
  HELLO_CLIENT: "hello-client",

  // Player
  SET_USERNAME: "set-username",

  // Matchmaking
  PLAY_NOW: "playnow",
  MATCH_FOUND: "matchfound",

  // Room
  CREATE_ROOM: "createroom",
  DELETE_ROOM: "deleteroom",
  JOIN_ROOM: "joinroom",
  LEAVE_ROOM: "leave-room",
  GET_ROOM: "getroom",
  SEND_ROOM: "sendroom",
  SET_ROOM_CODE: "setroomcode",
  JOIN_SUCCESS: "joinSuccess",
  PLAYER_JOIN: "playerJoin",
  ROOM_ERROR: "roomError",
  PLAYER_LEFT: "playerLeft",
  OPPONENT_LEFT_ROOM: "opponent-left-room",
  SUCCESSFUL_DELETE_ROOM: "successfuldeleteroom",

  // RPS
  PLAY_RPS: "playrps",
  PLAY_RPS_ERROR: "playrpserror",
  WAITING_OPPONENT_MOVE: "waiting-opponent-move",
  SEND_FINAL_DETAILS_RPS: "send-finaldetails-rps",
  RPS_PLAY_AGAIN: "rps-play-again",
  OPPONENT_READY_TO_PLAY_AGAIN: "opponent-ready-to-play-again",
  GAME_RESETTED: "game-resetted",
  PLAY_RPS_RESTART: "playrps-restart",
  RPS_GAME_RESTARTED: "rps-game-restarted",

  // Guess Number Events

  PLAY_GUESS: "playguess",
  PLAY_GUESS_ERROR: "playguess-error",

  SUBMIT_GUESS: "submit-guess",
  SEND_GUESS_FEEDBACK: "send-guess-feedback",

  GUESS_PLAY_AGAIN: "guess-play-again",
  OPPONENT_READY_TO_PLAY_AGAIN: "opponent-ready-to-play-again",

  PLAY_GUESS_RESTART: "playguess-restart",
  GUESS_GAME_RESTARTED: "guess-game-restarted",

  GUESS_LEFT:"guess-left",
  SEND_GUESS_LEFT:"send-guess-left",

  //typing
  READY_REQUEST:"ready-request",
  START_COUNTDOWN:"start-countdown",
  OPPONENT_READY:"opponent-ready",
  SET_PARAGRAPH:"set-paragraph",
  SEND_PARAGRAPH:"send-paragraph",
  PLAY_TYPE_ERROR: "playtype-error",
  SET_CALCULATION:"set-calculation",
  SEND_CALCULATION:'send-calculation',
  SET_PROGRESS:"set-progress",
  SEND_PROGRESS: 'send-progress',
  SEND_TIMER: 'send-timer',
  GAME_OVER: 'game-over',
  TYPING_PLAY_AGAIN: 'typing-play-again',
  TYPING_GAME_RESTARTED: 'typing-game-restarted',
  TYPING_OPPONENT_READY: 'typing-opponent-ready',
};