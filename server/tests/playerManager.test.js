import test from 'node:test';
import assert from 'node:assert/strict';
import PlayerManager from '../managers/PlayerManager.js';

test('getActiveCount returns the number of registered players', () => {
  const manager = new PlayerManager();
  manager.addPlayer('socket-1', 'Alice');
  manager.addPlayer('socket-2', 'Bob');

  assert.equal(manager.getActiveCount(), 2);
});
