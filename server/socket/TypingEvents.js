import { EVENTS } from "../constants/events.js";


export default function registerTypingEvents(socket, io, gameManager, roomManager) {
    socket.on(EVENTS.READY_REQUEST,(roomId)=>{
        const isplayerready=gameManager.playerReady(roomId,socket.id);
        if(isplayerready)
        io.to(roomId).emit(EVENTS.START_COUNTDOWN);
        else
            socket.to(roomId).emit(EVENTS.OPPONENT_READY);
        
    }) 

  socket.on(EVENTS.SET_PARAGRAPH,(roomId, difficulty)=>{
    const time={'Easy':60,'Medium':90,'Hard':120}
    const data = gameManager.configureTypingGame(roomId,difficulty,time[difficulty]);
    if (data && data.success) {
      io.to(roomId).emit(EVENTS.SEND_PARAGRAPH, data.state.text);
      // Timer starts ONLY when both players are done with countdown,
      // but for simplicity we start it here with a safety: don't restart if already running.
      // The timer interval will only tick when status is "playing".
      // Actually, the timer should start when the game actually begins (after countdown).
      // For this implementation, we start it on first set-paragraph call.
      if (!data.state.timerInterval) {
        startGameTimer(roomId, io, gameManager);
      }
    } else {
      socket.emit("PLAY_TYPE_ERROR",data?.msg ||"Falied to set Paragraph");
      console.error("Failed to set paragraph:", data?.msg || "Unknown error");
    }
  })
  socket.on(EVENTS.SET_CALCULATION, (roomId, para, typedpara) => {
    const data = gameManager.handlecalculation(para, typedpara);
    const game = gameManager.getGame(roomId);
    if (game) {
      const typeState = game.state;
      typeState.setPlayerCalc(socket.id, data);
      // If progress is 100%, mark this player as finished
      if (typeState.progress[socket.id] >= 100) {
        typeState.markPlayerFinished(socket.id);
      }
    }
    socket.emit(EVENTS.SEND_CALCULATION, data);
  });

  socket.on(EVENTS.SET_PROGRESS, (roomId, socketId, typed, para) => {
    const data = gameManager.handleProgress(roomId, socketId, typed, para);
    if (!data.success) {
      socket.emit("playtype-error", data?.msg);
      return;
    }
    io.to(roomId).emit(EVENTS.SEND_PROGRESS, data.progress);
  });

  // Play Again
  socket.on(EVENTS.TYPING_PLAY_AGAIN, (roomId) => {
    const game = gameManager.getGame(roomId);
    if (!game) return;
    const typeState = game.state;
    typeState.addPlayAgainVote(socket.id);
    socket.to(roomId).emit(EVENTS.TYPING_OPPONENT_READY);
    if (typeState.allPlayersReady()) {
      typeState.resetMatch();
      io.to(roomId).emit(EVENTS.TYPING_GAME_RESTARTED);
    }
  });

}

/**
 * Starts a 1-second interval timer for the room.
 * Broadcasts remaining time each second.
 * When timer hits 0, emits game-over with final results.
 * Edge-case safe: uses gameEnded flag to prevent double-call.
 */
function startGameTimer(roomId, io, gameManager) {
  const game = gameManager.getGame(roomId);
  if (!game) return;
  const typeState = game.state;
  if (typeState.timerInterval) return; // already running

  typeState.status = "playing";
  typeState.gameEnded = false;

  typeState.timerInterval = setInterval(() => {
    // Don't tick if game already ended (safety guard)
    if (typeState.gameEnded) return;

    typeState.currentTime--;

    // Broadcast remaining time to the room
    io.to(roomId).emit(EVENTS.SEND_TIMER, typeState.currentTime);

    // Check if time is up
    if (typeState.currentTime <= 0) {
      clearInterval(typeState.timerInterval);
      typeState.timerInterval = null;
      typeState.status = "completed";
      if (!typeState.gameEnded) {
        typeState.gameEnded = true;
        endGame(roomId, io, gameManager);
      }
      return;
    }

    // Check if both players have finished typing (paragraph complete)
    if (typeState.finishedCount >= typeState.playerIds.length) {
      clearInterval(typeState.timerInterval);
      typeState.timerInterval = null;
      typeState.status = "completed";
      if (!typeState.gameEnded) {
        typeState.gameEnded = true;
        endGame(roomId, io, gameManager);
      }
    }
  }, 1000);
}

/**
 * Collects final results for all players, determines winner,
 * and broadcasts game-over event to the room.
 * Edge-case safe: uses latest calc data from state.
 */
function endGame(roomId, io, gameManager) {
  const game = gameManager.getGame(roomId);
  if (!game) return;
  const typeState = game.state;

  // Determine winner based on progress
  const [player1, player2] = typeState.playerIds;
  const p1Progress = typeState.progress[player1] || 0;
  const p2Progress = typeState.progress[player2] || 0;

  let winner = null;
  if (p1Progress > p2Progress) {
    winner = player1;
  } else if (p2Progress > p1Progress) {
    winner = player2;
  }

  // Get calculations for each player (use latest stored, default to 0s)
  const p1Calc = typeState.playerCalcs[player1] || { correctWord: 0, wrongWord: 0 };
  const p2Calc = typeState.playerCalcs[player2] || { correctWord: 0, wrongWord: 0 };

  const result = {
    winner,
    paragraph: typeState.text,
    player1: {
      id: player1,
      progress: p1Progress,
      correct: p1Calc.correctWord,
      wrong: p1Calc.wrongWord,
    },
    player2: {
      id: player2,
      progress: p2Progress,
      correct: p2Calc.correctWord,
      wrong: p2Calc.wrongWord,
    },
    status: "completed",
  };

  io.to(roomId).emit(EVENTS.GAME_OVER, result);
}