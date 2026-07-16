import registerCommonEvents from "./commonEvents.js";
import registerRoomEvents from "./roomEvents.js";
import registerRpsEvents from "./rpsEvents.js";
import registerNumberGuessEvent from "./NumberGuessEvents.js";
import registerTypingEvent from "./TypingEvents.js"

export default function registerSocketEvents(socket, io, managers) {
  const { playerManager, roomManager, matchmakingManager, gameManager } = managers;

  registerCommonEvents(socket, io, playerManager, roomManager, gameManager);
  registerRoomEvents(socket, io, roomManager, matchmakingManager, gameManager);
  registerRpsEvents(socket, io, gameManager, roomManager);
  registerNumberGuessEvent(socket, io, gameManager, roomManager);
  registerTypingEvent(socket, io, gameManager, roomManager);

}