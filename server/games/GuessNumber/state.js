class GuessNumberState {
  constructor(playerIds) {
    this.playerIds = playerIds;
    this.secretNumber = "";
    this.guessHistory = new Map();
    this.winner = null;
    this.status = "waiting"; // waiting, completed, draw
    this.playAgain = new Set();

    playerIds.forEach((id) => {
      this.guessHistory.set(id, []);
    });
  }

  resetMatch() {
    this.secretNumber = "";
    this.winner = null;
    this.playAgain = new Set();
    this.status = "waiting";
    this.guessHistory = new Map();

    this.playerIds.forEach((id) => {
      this.guessHistory.set(id, []);
    });
  }
}

export default GuessNumberState;
