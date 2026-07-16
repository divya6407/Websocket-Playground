import test from 'node:test';
import assert from 'node:assert/strict';
import MatchmakingManager from '../managers/MatchmakingManager.js';

test('matchmaking keeps separate queues for different game types', () => {
  const manager = new MatchmakingManager();
  const socketA = { id: 'socket-a' };
  const socketB = { id: 'socket-b' };
  const socketC = { id: 'socket-c' };

  manager.addPlayer(socketA, 'rps');
  manager.addPlayer(socketB, 'guess');
  manager.addPlayer(socketC, 'rps');

  assert.equal(manager.isMatchAvailable('rps'), true);
  assert.equal(manager.isMatchAvailable('guess'), false);

  const rpsMatch = manager.getNextPlayers('rps');
  assert.deepEqual(rpsMatch.map((player) => player.id), ['socket-a', 'socket-c']);
  assert.equal(manager.isMatchAvailable('rps'), false);
});
