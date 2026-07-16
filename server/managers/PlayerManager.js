class PlayerManager{
    players = new Map()

    addPlayer(id,playerName){
        this.players.set(id, {
            username: playerName
        });
        return this.players.get(id);
    }

    removePlayer(id){
        return this.players.delete(id) || null;
    }

    getPlayer(id){
        return this.players.get(id)
    }

    getAllPlayers(){
        return [...this.players.entries()];
    }

    getActiveCount(){
        return this.players.size;
    }
}

export default PlayerManager;