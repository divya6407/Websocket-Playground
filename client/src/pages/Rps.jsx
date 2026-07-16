import React, { useState, useEffect } from 'react';
import Header from '../Components/Header';
import rock from '../assets/fist.png';
import paper from '../assets/hand-paper.png';
import scissor from '../assets/scissors.png';
import win from '../assets/win.png';
import lose from '../assets/lose.png';
import draw from '../assets/draw.png';
import { Box } from '@mui/material';
import { socket } from '../socket';
import { useParams, useNavigate } from 'react-router-dom';

const Rps = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [room, setRoom] = useState(null);
    const [move, setMove] = useState("");
    const [round, setRound] = useState(1);
    const [moves, setMoves] = useState({});
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const [winner, setWinner] = useState("");
    const [waiting, setWaiting] = useState(false);
    const [scores, setScores] = useState({ player: 0, opponent: 0 });
    const [isGameOver, setIsGameOver] = useState(false);
    const [matchWinner, setMatchWinner] = useState("");
    const [opponentReady, setOpponentReady] = useState(false);
    const [opponentLeft, setOpponentLeft] = useState(false);

    const [roomId, setroomId] = useState(id || sessionStorage.getItem("activeroomid") || "");

    useEffect(() => {
        if (!socket) return;
        if (!socket.connected) socket.connect();

        const cleanId = id ? id.replace(/^:/, '') : '';
        const activeRoom = cleanId || sessionStorage.getItem("activeroomid")?.replace(/^:/, '') || "";

        if (!activeRoom) {
            navigate('/home');
            return;
        }

        setroomId(activeRoom);
        sessionStorage.setItem("activeroomid", activeRoom);

        const handlesendroom = (data) => {
            if (data === "error") return;
            setRoom(data);
        };

        const handleError = (msg) => {
            setError(msg);
            setWaiting(false);
        };

        const handleWaiting = (data) => {
            setMove(data.yourMove);
            setWaiting(true);
        };

        const handleFinalDetails = (data) => {
            setWinner(data.winner);
            setMoves(data.moves);
            setStatus(data.status);
            setWaiting(false);
            setIsGameOver(data.isGameOver);
            setMatchWinner(data.matchWinner);
            if (data.scoreTable) {
                setScores(data.scoreTable);
            }
            setRound(prev => prev + 1);
            setMove("");
        };

        const handleGameReset = () => {
            console.log("Game successfully resetted for all players");
            setMove("");
            setRound(1);
            setMoves({});
            setError("");
            setStatus("");
            setWinner("");
            setWaiting(false);
            setScores({ player: 0, opponent: 0 });
            setIsGameOver(false);
            setMatchWinner("");
            setOpponentReady(false);
        };

        const handleOpponentReady = () => {
            setOpponentReady(true);
        };

        const handleOpponentLeft = (data) => {
            setOpponentLeft(true);
            setError(data.message || "Your opponent has left the room.");
            setWaiting(false);
        };

        // Attach all active room pipelines
        socket.on("game-resetted", handleGameReset);
        socket.on("opponent-ready-to-play-again", handleOpponentReady);
        socket.on("playrpserror", handleError);
        socket.on("waiting-opponent-move", handleWaiting);
        socket.on("send-finaldetails-rps", handleFinalDetails);
        socket.on("sendroom", handlesendroom);
        socket.on("opponent-left-room", handleOpponentLeft);

        socket.emit("getroom", activeRoom);

        return () => {
            socket.off("game-resetted", handleGameReset);
            socket.off("opponent-ready-to-play-again", handleOpponentReady);
            socket.off("sendroom", handlesendroom);
            socket.off("playrpserror", handleError);
            socket.off("waiting-opponent-move", handleWaiting);
            socket.off("send-finaldetails-rps", handleFinalDetails);
            socket.off("opponent-left-room", handleOpponentLeft);
        };
    }, [id, navigate, socket]);

    const handlemove = (selectedMove) => {
        setWaiting(true);
        setError("")
        setMove(selectedMove);
        socket.emit("playrps", roomId, selectedMove);
    };

    const handlePlayAgain = () => {
        socket.emit("rps-play-again", roomId);
    };

    const handleLeaveRoom = () => {
        socket.emit("leave-room", roomId);
        sessionStorage.removeItem("activeroomid");
        navigate('/home');
    };

    const handleAdvanceRound = () => {
        setStatus("");
        setWinner("");
        setMoves({});
        setError("");
    };

    // Compute display scores from the scores object (keyed by socket.id)
    const myScore = scores[socket.id] || 0;
    const opponentId = Object.keys(scores).find(id => id !== socket.id);
    const opponentScore = opponentId ? scores[opponentId] : 0;
    const resultImage = status === "draw" || winner === "draw" || !winner
        ? draw
        : winner === socket.id
            ? win
            : lose;
    const resultTitle = status === "draw" || winner === "draw" || !winner
        ? "Draw"
        : winner === socket.id
            ? "Win"
            : "Lose";

    return (
        <div className='m-4 font-poppins'>
            <Header />
            {opponentLeft && (
                <div className="text-center mt-8 p-6 bg-red-50 rounded-lg border border-red-200">
                    <h2 className="text-xl text-red-600 font-bold mb-4">Opponent Left</h2>
                    <p className="text-gray-700 mb-4">Your opponent has left the room. The game is over.</p>
                    <button
                        onClick={() => {
                            sessionStorage.removeItem("activeroomid");
                            navigate('/home');
                        }}
                        className="bg-primary text-white px-6 py-2 rounded font-semibold hover:bg-primary/90 transition-all"
                    >
                        Back to Lobby
                    </button>
                </div>
            )}
            {!opponentLeft && !isGameOver && (
                <div>
                    <div className='flex justify-between items-start mt-4 mb-8'>
                        <div>
                            <h3 className='text-xl font-bold text-navy'>Round {round}</h3>
                            <p className='text-sm font-semibold text-navy mt-1'>
                                Score — You: {myScore} | Opponent: {opponentScore}
                            </p>
                            <p className='text-gray-secondary text-sm mt-1'>
                                {waiting ? "Waiting for opponent..." : "Make Your Move"}
                            </p>
                            {error && (
                                <p className="text-red-500 mt-2">
                                    {error}
                                </p>
                            )}
                        </div>
                        <div className='flex flex-col items-end gap-2'>
                            <p className='text-gray-secondary font-medium'>
                                Room Number : <span className='text-navy font-mono font-bold'>{roomId}</span>
                            </p>
                            <button
                                onClick={handleLeaveRoom}
                                className="text-red-500 border border-red-500 px-4 py-1 rounded text-sm font-semibold hover:bg-red-50 transition-all"
                            >
                                Leave Room
                            </button>
                        </div>
                    </div>

                    <div className='flex justify-center gap-12 mt-12 max-w-2xl mx-auto'>
                        <div
                            className={`flex flex-col items-center group ${waiting || isGameOver || status === "completed" || status === "draw" ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
                            onClick={() => {
                                if (!waiting && status !== "completed" && !isGameOver) {
                                    handlemove('rock');
                                }
                            }}
                        >
                            <div className={`border-2 p-5 rounded-full flex items-center justify-center transition-all ${move === 'rock' ? 'border-primary bg-primary/10 scale-110' : 'border-gray-200 hover:border-primary'}`}>
                                <Box component="img" src={rock} alt="Rock" sx={{ width: 60, height: 60, objectFit: 'contain' }} />
                            </div>
                            <p className={`mt-3 font-semibold ${move === 'rock' ? 'text-primary' : 'text-navy'}`}>Rock</p>
                        </div>

                        <div
                            className={`flex flex-col items-center group ${waiting || isGameOver || status === "completed" || status === "draw" ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
                            onClick={() => {
                                if (!waiting && status !== "completed" && !isGameOver) {
                                    handlemove('paper');
                                }
                            }}
                        >
                            <div className={`border-2 p-5 rounded-full flex items-center justify-center transition-all ${move === 'paper' ? 'border-primary bg-primary/10 scale-110' : 'border-gray-200 hover:border-primary'}`}>
                                <Box component="img" src={paper} alt="Paper" sx={{ width: 60, height: 60, objectFit: 'contain' }} />
                            </div>
                            <p className={`mt-3 font-semibold ${move === 'paper' ? 'text-primary' : 'text-navy'}`}>Paper</p>
                        </div>

                        <div
                            className={`flex flex-col items-center group ${waiting || isGameOver || status === "completed" || status === "draw" ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
                            onClick={() => {
                                if (!waiting && status !== "completed" && !isGameOver) {
                                    handlemove('scissor');
                                }
                            }}
                        >
                            <div className={`border-2 p-5 rounded-full flex items-center justify-center transition-all ${move === 'scissor' ? 'border-primary bg-primary/10 scale-110' : 'border-gray-200 hover:border-primary'}`}>
                                <Box component="img" src={scissor} alt="Scissor" sx={{ width: 60, height: 60, objectFit: 'contain' }} />
                            </div>
                            <p className={`mt-3 font-semibold ${move === 'scissor' ? 'text-primary' : 'text-navy'}`}>Scissor</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Round result display when status is completed or draw and the match is NOT over yet */}
            {!opponentLeft && (status === "completed" || status === "draw") && !isGameOver && (
                <div className="text-center mt-8">
                    <div className='flex flex-col justify-center items-center'>
                        <img
                            className='mb-4'
                            src={resultImage}
                            alt={resultTitle}
                            style={{
                                width: 160,
                                height: 160,
                                objectFit: 'contain',
                                display: 'block'
                            }}
                        />

                        <h2 className="text-2xl text-navy font-bold mb-4">
                            {status === "draw" ? " Draw" : winner === socket.id ? " You Win!" : " You Lose!"}
                        </h2>
                    </div>

                    <button
                        className="bg-primary text-white px-6 py-2 rounded font-semibold hover:bg-primary/90 transition-all"
                        onClick={handleAdvanceRound}
                    >
                        Advance to Round {round}
                    </button>
                </div>
            )}

            {!opponentLeft && Object.keys(moves).length > 0 && (
                <div className="mt-6 text-center border-2 border-gray p-4">
                    <p className='text-gray-secondary'>Your Move : {moves[socket.id]}</p>
                    <p className='text-gray-secondary'>
                        Opponent Move : {moves[Object.keys(moves).find(id => id !== socket.id)]}
                    </p>
                </div>
            )}

            {/* Match Over / Final Result Page */}
            {!opponentLeft && isGameOver && (
                <div className="match-over-banner mt-4 text-center text-gray-secondary">
                    <h2 className='text-primary text-lg font-semibold'>Match Over!</h2>
                    <img
                        className='mb-4'
                        src={matchWinner === socket.id ? win : matchWinner ? lose : draw}
                        alt={matchWinner === socket.id ? 'Win' : matchWinner ? 'Lose' : 'Draw'}
                        style={{
                            width: 160,
                            height: 160,
                            objectFit: 'contain',
                            display: 'block',
                            margin: '0 auto'
                        }}
                    />
                    <h3>{matchWinner === socket.id ? "You are the Ultimate Winner!" : "Opponent Wins the Match!"}</h3>
                    <p className='text-sm font-semibold text-navy mt-1'>
                        Score<br/>You: {myScore} | Opponent: {opponentScore}
                    </p>
                    {opponentReady && (
                        <p className="text-green-600 font-semibold mb-2 animate-pulse">
                            Opponent is ready! Waiting for you...
                        </p>
                    )}

                    <div className='flex justify-center gap-4 mt-6'>
                        <button
                            onClick={handlePlayAgain}
                            className='bg-primary text-white rounded-md px-6 py-3 font-semibold hover:bg-primary/90 transition-all'
                        >
                            Play Again
                        </button>
                        <button
                            onClick={handleLeaveRoom}
                            className='text-red-500 border border-red-500 rounded-md px-6 py-3 font-semibold hover:bg-red-50 transition-all'
                        >
                            Leave Room
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rps;