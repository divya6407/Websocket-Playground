import test from 'node:test';
import assert from 'node:assert/strict';
import { determine_winner } from '../games/GuessNumber/logic.js';

test('determine_winner returns a completed result when all positions are correct', () => {
  const result = determine_winner(4, 4, 'socket-1');

  assert.deepEqual(result, {
    winner: 'socket-1',
    status: 'completed',
  });
});
