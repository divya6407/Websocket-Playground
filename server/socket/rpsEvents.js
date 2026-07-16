import { EVENTS } from "../constants/events.js";

export default function registerRpsEvents(socket, io, gameManager, roomManager) {
  socket.on(EVENTS.PLAY_RPS, (roomId, move) => {
    const submitResult = gameManager.submitMove(roomId, socket.id, move);
    if (!submitResult.success) {
      socket.emit(EVENTS.PLAY_RPS_ERROR, submitResult.msg);
      return;
    }

    const rpsState = submitResult.state;
    if (rpsState.playerMoves.size === 2) {
      const currentMoves = Object.fromEntries(rpsState.playerMoves);
      const result = gameManager.calculateRoundWinner(roomId);

      io.to(roomId).emit(EVENTS.SEND_FINAL_DETAILS_RPS, {
        winner: result.state.winner,
        moves: currentMoves,
        status: result.state.status,
        isGameOver: result.state.isMatchOver(),
        scoreTable: result.state.score,
        matchWinner: result.state.isMatchOver() ? result.state.matchWinner : null,
      });

      console.log("========== FINAL GAME ==========");
      console.log(gameManager.getGameSummary(roomId));
      console.log("===============================");
      return;
    }

    socket.emit(EVENTS.WAITING_OPPONENT_MOVE, {
      yourMove: move,
    });
  });

  socket.on(EVENTS.RPS_PLAY_AGAIN, (roomId) => {
    const game = gameManager.getGame(roomId);
    if (!game) return;

    game.state.playAgain.add(socket.id);
    if (game.state.playAgain.size === 2) {
      gameManager.resetGame(roomId);
      io.to(roomId).emit(EVENTS.GAME_RESETTED);
    } else {
      socket.to(roomId).emit(EVENTS.OPPONENT_READY_TO_PLAY_AGAIN);
    }
  });

  socket.on(EVENTS.PLAY_RPS_RESTART, (roomId) => {
    const result = gameManager.resetGame(roomId);
    if (!result?.success === false) {
      io.to(roomId).emit(EVENTS.RPS_GAME_RESTARTED);
    }
  });
}