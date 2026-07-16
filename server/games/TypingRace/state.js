import { typingParagraphs } from './paragraphs.js';
class TypingRaceState {
    constructor(playerIds) {
        this.playerIds = playerIds;
        this.difficulty = "";          // easy, medium, hard
        this.timer = 0;               
        this.currentTime = 0;          
        this.text = "";
        this.progress = {};
        // waiting | countdown | playing | completed | draw
        this.status = "waiting";
        this.winner = null;
        this.playAgain = new Set();
        this.ready= {}
        this.playerCalcs = {};
        this.finishedPlayers = new Set();
        this.finishedCount = 0;
        this.timerInterval = null;
        playerIds.forEach((id) => {
            this.progress[id] = 0;
            this.ready[id]=false;
        });
    }

    setPlayerCalc(playerId, data) {
        this.playerCalcs[playerId] = data;
    }

    markPlayerFinished(playerId) {
        if (!this.finishedPlayers.has(playerId)) {
            this.finishedPlayers.add(playerId);
            this.finishedCount = this.finishedPlayers.size;
        }
    }

    markAsReady(playerId){
        this.ready[playerId]=true;
        return true
    }
    isEveryoneReady(){
        const areAllPlayersTrue = Object.values(this.ready).every(status => status === true);
        return areAllPlayersTrue;
    }
    moveToCountdown(){
        this.status="countdown";
        return true;
    }
    generateText(difficulty){
        const paragraphArray = typingParagraphs[difficulty] || typingParagraphs.Hard;
        const randomIndex = Math.floor(Math.random() * paragraphArray.length);
        return paragraphArray[randomIndex];

    }

     setDifficulty(difficulty, timer) {
    this.difficulty = difficulty;
    this.timer = timer;
    this.currentTime = timer;
}

settext(para){
    this.text=para
}

updateProgress(playerId, percentage) {
    if (!(playerId in this.progress)) return false;

    this.progress[playerId] = Math.max(0, Math.min(100, percentage));

    return true;
}
 getProgress(playerId) {
    return this.progress[playerId] ?? 0;
}

 isMatchOver() {
    return Object.values(this.progress).some(
        (progress) => progress === 100
    );
}

determineWinner() {
    const [player1, player2] = this.playerIds;

    const progress1 = this.progress[player1];
    const progress2 = this.progress[player2];

    if (progress1 > progress2) {
        this.winner = player1;
        this.status = "completed";
    } else if (progress2 > progress1) {
        this.winner = player2;
        this.status = "completed";
    } else {
        this.winner = null;
        this.status = "draw";
    }

    return this.winner;
}

 setWinner(playerId) {
    if (!(playerId in this.progress)) return;

    this.winner = playerId;
    this.progress[playerId] = 100;
    this.status = "completed";
}

 addPlayAgainVote(playerId) {
    this.playAgain.add(playerId);
}
 allPlayersReady() {
    return this.playAgain.size === this.playerIds.length;
}

 resetMatch() {
    this.currentTime = this.timer;
    this.text = "";

    this.status = "waiting";
    this.winner = null;

    this.playAgain.clear();
    this.playerCalcs = {};
    this.finishedPlayers = new Set();
    this.finishedCount = 0;
    this.gameEnded = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    Object.keys(this.progress).forEach((id) => {
        this.progress[id] = 0;
    });

}
}
export default TypingRaceState;
