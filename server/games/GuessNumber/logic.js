export function generateUnique4DigitString() {
  const digits = Array.from({ length: 10 }, (_, i) => i.toString());
  let code = "";

  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    code += digits.splice(randomIndex, 1)[0];
  }

  return code;
}

export function validateGuess(guess) {
  if (guess.length !== 4) {
    return false;
  }

  const regex = /^(?:([0-9])(?!.*\1)){4}$/;
  return regex.test(guess);
}

export function evaluateGuess(secret, guess) {
  if (!validateGuess(guess)) {
    return { success: false, msg: "Invalid Move" };
  }

  let correct_position = 0;
  let correct_number = 0;

  for (let i = 0; i < secret.length; i++) {
    if (secret.includes(guess[i])) {
      correct_number++;
      if (secret[i] === guess[i]) {
        correct_position++;
      }
    }
  }

  return {
    success: true,
    guess,
    correct_number,
    correct_position,
  };
}

export function determine_winner(correct_position, socketId) {
  if (correct_position === 4) {
    return {
      winner: socketId,
      status: "completed",
    };
  }

  return null;
}

export function guess_left(guessHistory, playerIds) {
  const entries = Array.isArray(guessHistory)
    ? guessHistory
    : Array.from(guessHistory?.entries?.() ?? []);

  const guesses = playerIds.map((playerId) => {
    const entry = entries.find(([id]) => id === playerId);
    return {
      id: playerId,
      guessCount: entry?.[1]?.length ?? 0,
    };
  });

  return { guesses };
}


