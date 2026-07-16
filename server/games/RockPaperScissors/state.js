class RockPaperScissorsState {
  constructor(playerIds) {
    this.playerIds = playerIds;
    this.playerMoves = new Map();
    this.winner = null;
    this.matchWinner = null;
    this.score = {};
    this.roundCount = 1;
    this.status = "waiting"; // waiting, completed, draw
    this.playAgain = new Set();

    // Initialize scores
    playerIds.forEach((id) => {
      this.score[id] = 0;
    });
  }

  resetRound() {
    this.playerMoves = new Map();
    this.winner = null;
    this.status = "waiting";
  }

  resetMatch() {
    this.resetRound();
    this.roundCount = 1;
    this.matchWinner = null;
    this.playAgain = new Set();
    this.playerIds.forEach((id) => {
      this.score[id] = 0;
    });
  }

  isMatchOver() {
    return this.roundCount > 3;
  }
}

export default RockPaperScissorsState;