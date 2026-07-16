import { GAMES, GAME_CONFIGS } from "../constants/games.js";
import RockPaperScissorsState from "../games/RockPaperScissors/state.js";
import GuessNumberState from "../games/GuessNumber/state.js";
import { isValidMove, determineRoundWinner, determineMatchWinner} from "../games/RockPaperScissors/logic.js";
import { generateUnique4DigitString, validateGuess, evaluateGuess, determine_winner, guess_left } from "../games/GuessNumber/logic.js";
import { handleCalculation, handleprogress } from '../games/TypingRace/logic.js'
import TypingRaceState from "../games/TypingRace/state.js";

class GameManager {
  constructor() {
    this.gameInstances = new Map();
  }

  createGame(gameType, roomId, playerIds) {
    let state;
    switch (gameType) {
      case GAMES.ROCK_PAPER_SCISSORS:
        state = new RockPaperScissorsState(playerIds);
        break;
      case GAMES.GUESS_NUMBER:
        state = new GuessNumberState(playerIds);
        state.secretNumber = generateUnique4DigitString();
        break;
      case GAMES.TYPING_RACE:
        state = new TypingRaceState(playerIds);
        break;
      default:
        throw new Error(`Unknown game type: ${gameType}`);
    }

    const gameConfig = GAME_CONFIGS[gameType];
    this.gameInstances.set(roomId, {
      type: gameType,
      config: gameConfig,
      state,
    });

    return this.gameInstances.get(roomId);
  }

  getGame(roomId) {
    return this.gameInstances.get(roomId) || null;
  }

  submitMove(roomId, socketId, move) {
    const game = this.getGame(roomId);
    if (!game) return { success: false, msg: "Room Not Found" };

    const rpsState = game.state;
    if (rpsState.playerMoves.size >= 2) {
      return { success: false, msg: "Moves can't be Made" };
    }
    if (rpsState.playerMoves.has(socketId)) {
      return { success: false, msg: "You already submitted your move." };
    }
    if (!isValidMove(move)) {
      return { success: false, msg: "Invalid Move" };
    }

    rpsState.playerMoves.set(socketId, move);
    return { success: true, state: rpsState };
  }

  calculateRoundWinner(roomId) {
    const game = this.getGame(roomId);
    if (!game) return { success: false, msg: "Game Not Found" };

    const rpsState = game.state;
    if (rpsState.playerMoves.size !== 2) {
      return { success: false, msg: "Waiting for players moves" };
    }

    const players = [...rpsState.playerMoves.keys()];
    const moves = [...rpsState.playerMoves.values()];

    const winnerIndex = determineRoundWinner(moves[0], moves[1]);

    if (winnerIndex === "draw") {
      rpsState.status = "draw";
      rpsState.playerMoves = new Map();
      return { success: true, state: rpsState, draw: true };
    }

    rpsState.winner = players[winnerIndex];
    rpsState.score[players[winnerIndex]]++;
    rpsState.status = "completed";
    rpsState.roundCount++;

    if (rpsState.isMatchOver()) {
      rpsState.matchWinner = determineMatchWinner(rpsState.score, players);
    }

    rpsState.playerMoves = new Map();
    return { success: true, state: rpsState, draw: false };
  }

  resetGame(roomId) {
    const game = this.getGame(roomId);
    if (!game) return { success: false, msg: "Game Not Found" };
    game.state.resetMatch();
    if (game.type === GAMES.GUESS_NUMBER) {
      game.state.secretNumber = generateUnique4DigitString();
    }
    return { success: true, state: game.state };
  }

  resetRound(roomId) {
    const game = this.getGame(roomId);
    if (!game) return { success: false, msg: "Game Not Found" };
    game.state.resetRound();
    return { success: true, state: game.state };
  }

  endGame(roomId) {
    this.gameInstances.delete(roomId);
  }

  getGameSummary(roomId) {
    const game = this.getGame(roomId);
    if (!game) return null;
    if (game.type === GAMES.ROCK_PAPER_SCISSORS) {
      const rpsState = game.state;
      return {
        roundCount: rpsState.roundCount,
        score: rpsState.score,
        winner: rpsState.winner,
        matchWinner: rpsState.matchWinner,
        status: rpsState.status,
      };
    }
    if (game.type === GAMES.GUESS_NUMBER) {
      const guessState = game.state;
      return {
        playerIds: guessState.playerIds,
        secretNumber: guessState.secretNumber,
        guessHistory: Array.from(guessState.guessHistory.entries()),
        winner: guessState.winner,
        status: guessState.status,
      };
    }
  }

  submitGuess(guess, socketId, roomId) {
    const game = this.getGame(roomId);
    if (!game) return { success: false, msg: "Room Not Found" };

    const guessState = game.state;
    const history = guessState.guessHistory.get(socketId) ?? [];
    if (history.length >= 8) {
      return { success: false, msg: "You can't Guess Maximum Guess 8 Reached" };
    }
    if (!validateGuess(guess)) {
      return { success: false, msg: "Invalid Move" };
    }

    const alreadyGuessed = history.some((entry) => entry.guess === guess);
    if (alreadyGuessed) {
      return { success: false, msg: "You already guessed that number!" };
    }

    const data = evaluateGuess(guessState.secretNumber, guess);
    if (!data.success) {
      return { success: false, msg: data.msg };
    }

    history.push({
      guess,
      correctDigits: data.correct_number,
      correctPositions: data.correct_position,
    });

    if (!guessState.guessHistory.has(socketId)) {
      guessState.guessHistory.set(socketId, history);
    } else {
      guessState.guessHistory.set(socketId, history);
    }

    return {
      success: true,
      state: guessState,
      result: data,
    };
  }

  calculateResult(socketId, correct_position, roomId) {
    const game = this.getGame(roomId);
    if (!game) return { success: false, msg: "Room Not Found" };

    const guessState = game.state;
    const data = determine_winner(correct_position, socketId);
    if (!data) {
      return {
        success: true,
        state: guessState,
        winner: null,
        status: guessState.status,
      };
    }

    guessState.winner = data.winner;
    guessState.status = data.status;
    return { success: true, state: guessState, winner: data.winner, status: data.status };
  }

  guessSummary(guessHistory, playerIds) {
    const data = guess_left(guessHistory, playerIds);
    return data;
  }



  playerReady(roomId, socketId){
    const game = this.getGame(roomId);
    if (!game) return { success: false, msg: "Room Not Found" };
    const typeState = game.state;
    typeState.markAsReady(socketId)
    if (typeState.isEveryoneReady()){
      typeState.moveToCountdown();
      return true; 
    }
    
    return false;
  }

  configureTypingGame(roomId, difficulty, timer){
    const game = this.getGame(roomId);
    if (!game) return { success: false, msg: "Room Not Found" };
    const typeState = game.state;
    typeState.setDifficulty(difficulty,timer);
    // Only generate paragraph once — if already set, reuse the same one
    if (!typeState.text) {
      const para = typeState.generateText(difficulty);
      typeState.settext(para);
    }
    return {success:true,state:typeState}
  }

  handlecalculation(para,typedpara){
    const data=handleCalculation(para,typedpara);
    return data;
  }

  handleProgress(roomId,socketId,typed,para){
    const progress=handleprogress(typed,para);
    const game = this.getGame(roomId);
    if (!game) return { success: false, msg: "Room Not Found" };
    const typeState = game.state;
    typeState.progress[socketId]=progress;
    return { success: true, progress: typeState.progress };
  }
}






export default GameManager;