const WINNING_RULES = {
  rock: "scissor",
  paper: "rock",
  scissor: "paper",
};

const VALID_MOVES = new Set(["rock", "paper", "scissor"]);

export function isValidMove(move) {
  return VALID_MOVES.has(move);
}

export function determineRoundWinner(move1, move2) {
  if (move1 === move2) return "draw";
  if (WINNING_RULES[move1] === move2) return 0; // player 0 wins
  return 1; // player 1 wins
}

export function determineMatchWinner(score, playerIds) {
  if (score[playerIds[0]] > score[playerIds[1]]) return playerIds[0];
  return playerIds[1];
}