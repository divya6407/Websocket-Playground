class MatchmakingManager {
    queues = new Map();

    addPlayer(socket, gameType = 'rps') {
        const queueKey = gameType || 'rps';
        const queue = this.queues.get(queueKey) || [];

        if (!queue.some((entry) => entry.socket.id === socket.id)) {
            queue.push({ socket, gameType: queueKey });
            this.queues.set(queueKey, queue);
        }

        return queue;
    }

    isMatchAvailable(gameType = 'rps') {
        const queue = this.queues.get(gameType) || [];
        return queue.length >= 2;
    }

    getNextPlayers(gameType = 'rps') {
        const queue = this.queues.get(gameType) || [];
        const player1 = queue.shift();
        const player2 = queue.shift();
        this.queues.set(gameType, queue);
        return [player1?.socket, player2?.socket].filter(Boolean);
    }

    removePlayer(socket, gameType = 'rps') {
        const queueKey = gameType || 'rps';
        const queue = this.queues.get(queueKey) || [];
        const nextQueue = queue.filter((entry) => entry.socket.id !== socket.id);
        this.queues.set(queueKey, nextQueue);
        return nextQueue;
    }
}

export default MatchmakingManager;