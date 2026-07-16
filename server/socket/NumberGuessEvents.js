import { EVENTS } from "../constants/events.js";

export default function registerNumberGuessEvent(socket, io, gameManager) {
  socket.on(EVENTS.PLAY_GUESS, (guess, socketId, roomId) => {
    const data = gameManager.submitGuess(guess, socketId, roomId);
    if (!data.success) {
      socket.emit(EVENTS.PLAY_GUESS_ERROR, data.msg);
      return;
    }

    const correct_position = data.result.correct_position;
    const result = gameManager.calculateResult(socketId, correct_position, roomId);
    if (!result.success) {
      socket.emit(EVENTS.PLAY_GUESS_ERROR, result.msg);
      return;
    }

    const summary = gameManager.getGameSummary(roomId);

    const guessLeftData = gameManager.guessSummary(summary?.guessHistory ?? [], summary?.playerIds ?? []);

    io.to(roomId).emit(EVENTS.SEND_GUESS_FEEDBACK, {
      winner: summary?.winner ?? null,
      playerIds: summary?.playerIds ?? [],
      guessHistory: summary?.guessHistory ?? [],
      status: summary?.status ?? "waiting",
      guessLeft: guessLeftData?.guesses ?? [],
      secretNumber: summary?.secretNumber ?? null,
    });
  });

  socket.on(EVENTS.GUESS_PLAY_AGAIN, (roomId) => {
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
}
