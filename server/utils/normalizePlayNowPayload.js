export function normalizePlayNowPayload(payload = {}) {
  const gameType = typeof payload?.game === 'string' ? payload.game : payload?.game?.type || 'rps';
  const difficulty = typeof payload?.difficulty === 'string' ? payload.difficulty : null;

  return {
    gameType,
    difficulty,
  };
}
