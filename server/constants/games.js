export const GAMES = {
  ROCK_PAPER_SCISSORS: "rps",
  GUESS_NUMBER: "guess",
  TYPING_RACE: "typing",
};

export const GAME_CONFIGS = {
  [GAMES.ROCK_PAPER_SCISSORS]: {
    type: GAMES.ROCK_PAPER_SCISSORS,
    name: "Rock Paper Scissors",
    maxRounds: 3,
    minPlayers: 2,
    maxPlayers: 2,
  },
  [GAMES.GUESS_NUMBER]:{
    type:GAMES.GUESS_NUMBER,
    name:"Guess The Number",
    maxGuess:8,
    minPlayers:2,
    maxPlayers:2,
  },
  [GAMES.TYPING_RACE]:{
    type:GAMES.TYPING_RACE,
    name:"Typing Race",
    minPlayers: 2,
    maxPlayers: 2,
    difficulty:['easy','medium','hard'],
    countDown: [30,90,240]
  }
};