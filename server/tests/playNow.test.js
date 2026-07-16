import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePlayNowPayload } from '../utils/normalizePlayNowPayload.js';

test('normalizePlayNowPayload extracts the game type and difficulty from a matchmaking payload', () => {
  const result = normalizePlayNowPayload({ game: 'typing', difficulty: 'Hard' });

  assert.deepEqual(result, {
    gameType: 'typing',
    difficulty: 'Hard',
  });
});
