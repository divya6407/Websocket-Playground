import React, { useEffect, useState } from 'react';
import Header from '../Components/Header';
import { useParams, useNavigate } from 'react-router-dom';
import AdsClickIcon from '@mui/icons-material/AdsClick';
import HistoryIcon from '@mui/icons-material/History';
import win from '../assets/win.png';
import lose from '../assets/lose.png';
import draw from '../assets/draw.png';
import { Box } from '@mui/material';

import { socket } from '../socket';

const Guess = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState(id);
  const [key, setKey] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [winner, setWinner] = useState(null);
  const [players, setPlayers] = useState([]);
  const [status, setStatus] = useState("waiting");
  const [opponentReady, setOpponentReady] = useState(false);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [guessLeft, setGuessLeft] = useState([]);
  const [secretNumber, setSecretNumber] = useState(null);

  useEffect(() => {
    setRoomId(id);
  }, [id]);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const handleGuessError = (err) => setError(err);

    const handleGuessFeedback = (data) => {
      setWinner(data.winner ?? null);
      setPlayers(data.playerIds ?? []);
      setHistory(Array.isArray(data.guessHistory) ? data.guessHistory : []);
      setStatus(data.status ?? 'waiting');
      setError('');
      setGuessLeft(Array.isArray(data.guessLeft) ? data.guessLeft : []);
      setSecretNumber(data.secretNumber ?? null);
    };

    const handleOpponentLeft = (data) => {
      setOpponentLeft(true);
      setError(data.message || "Your opponent has left the room.");
    };

    const handleOpponentReady = () => {
      setOpponentReady(true);
    };

    const handleGameReset = () => {
      setKey([]);
      setHistory([]);
      setError("");
      setWinner(null);
      setStatus("waiting");
      setOpponentReady(false);
      setGuessLeft([]);
      setSecretNumber(null);
    };

    socket.on('playguess-error', handleGuessError);
    socket.on('send-guess-feedback', handleGuessFeedback);
    socket.on('opponent-left-room', handleOpponentLeft);
    socket.on('opponent-ready-to-play-again', handleOpponentReady);
    socket.on('game-resetted', handleGameReset);

    return () => {
      socket.off('playguess-error', handleGuessError);
      socket.off('send-guess-feedback', handleGuessFeedback);
      socket.off('opponent-left-room', handleOpponentLeft);
      socket.off('opponent-ready-to-play-again', handleOpponentReady);
      socket.off('game-resetted', handleGameReset);
    };
  }, [roomId]);

  const handleNumberPad = (num) => {
    if (key.length >= 4) return;
    setKey([...key, num]);
  };

  const handleClear = () => {
    setKey([]);
  };

  const handleSubmit = () => {
    if (key.length !== 4) {
      alert('Please enter exactly 4 digits before submitting.');
      return;
    }

    socket.emit('playguess', key.join(''), socket.id, roomId);
    setKey([]);
  };

  const handlePlayAgain = () => {
    socket.emit("guess-play-again", roomId);
  };

  const handleLeaveRoom = () => {
    socket.emit("leave-room", roomId);
    sessionStorage.removeItem("activeroomid");
    navigate('/home');
  };

  const currentPlayerHistory = history.flatMap(([playerId, guesses]) =>
    playerId === socket.id ? guesses : []
  );

  // Compute guess left values for display
  const maxGuesses = 8;
  const myGuessCount = guessLeft.find((g) => g.id === socket.id)?.guessCount ?? 0;
  const opponentId = players.find((id) => id !== socket.id);
  const opponentGuessCount = guessLeft.find((g) => g.id === opponentId)?.guessCount ?? 0;
  const myGuessesLeft = maxGuesses - myGuessCount;
  const opponentGuessesLeft = maxGuesses - opponentGuessCount;

  const getLastGuessOfPlayer = (history, targetPlayerId) => {
    const playerRecord = history.find(([playerId]) => playerId === targetPlayerId);

    if (playerRecord && playerRecord[1] && playerRecord[1].length > 0) {
      const guesses = playerRecord[1];
      return guesses[guesses.length - 1];
    }
    return null;
  };

  // Determine game boundaries based on local actions
  const hasMaxGuesses = currentPlayerHistory.length >= 8;
  const isMatchOver = status === "completed" || winner !== null || hasMaxGuesses;

  // Determine actual display status for the local player
  const isWinner = winner === socket.id;
  const isDraw = status === "draw" || winner === "draw";
  const isLoser = (winner !== null && winner !== socket.id) || (hasMaxGuesses && !isWinner && !isDraw);

  return (
    <div>
      <Header />
      <div className='ml-4 mr-4 text-navy'>

        {/* Opponent Left Banner Screen State */}
        {opponentLeft ? (
          <div className="text-center mt-8 p-6 bg-red-50 rounded-lg border border-red-200">
            <h2 className="text-xl text-red-600 font-bold mb-4">Opponent Left</h2>
            <p className="text-gray-700 mb-4">{error || "Your opponent has left the room. The game is over."}</p>
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
        ) : (
          <>
            <div className='flex justify-between items-start mt-4 mb-8'>
              <div className='text-navy font-semibold'>
                <p>Status: {status}</p>
                {error ? <p className='text-red-500 mt-2'>{error}</p> : null}
                <p className='mt-2 font-semibold'>
                  Guess Left: <span className='text-primary'>You: {myGuessesLeft}</span> |{' '}
                  <span className='text-rose-600'>Opponent: {opponentGuessesLeft}</span>
                </p>
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

            <div className='flex gap-2 justify-center items-center'>
              <AdsClickIcon sx={{ fontSize: 40, color: '#006D77' }} />
              <h3 className='text-navy font-semibold text-lg flex items-center gap-2 mb-3'>Guess the 4-Digit Number</h3>
            </div>

            {/* Main Interactive Gameplay View */}
            {!isMatchOver && (
              <div className='flex flex-row gap-4 justify-around mt-4'>
                <div className='border-gray border-2 p-4 rounded-md h-fit'>
                  <div className='text-center'>
                    <h3 className='text-navy font-semibold mb-4'>Enter Your Number</h3>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }} className="mb-4">
                      {[0, 1, 2, 3].map((index) => (
                        <input
                          key={index}
                          type="text"
                          readOnly
                          value={key[index] || ''}
                          placeholder="_"
                          style={{
                            width: '56px',
                            height: '56px',
                            fontSize: '24px',
                            fontWeight: '600',
                            textAlign: 'center',
                            border: '2px solid #e2e8f0',
                            borderRadius: '12px',
                            outline: 'none',
                            color: '#1e293b',
                            backgroundColor: '#f8fafc',
                          }}
                        />
                      ))}
                    </div>

                    <div className="grid grid-cols-5 gap-3 w-full max-w-[450px] mx-auto p-4 rounded-xl">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((num) => (
                        <button
                          key={num}
                          onClick={() => handleNumberPad(num)}
                          className="aspect-square text-xl font-semibold text-navy bg-white border border-gray rounded-md shadow-sm outline-none select-none transition-all active:scale-95 active:bg-slate-100 cursor-pointer flex items-center justify-center"
                        >
                          {num}
                        </button>
                      ))}

                      <button
                        onClick={handleClear}
                        className="col-span-2 py-3 text-base font-semibold text-rose-600 bg-white border border-rose-200 rounded-md shadow-sm outline-none select-none transition-all active:scale-95 active:bg-rose-50 cursor-pointer flex items-center justify-center"
                      >
                        Clear
                      </button>

                      <button
                        onClick={handleSubmit}
                        className="col-span-3 py-3 text-white font-semibold bg-primary rounded-md shadow-sm outline-none select-none transition-all active:scale-95 active:bg-blue-700 cursor-pointer flex items-center justify-center"
                      >
                        Submit Guess
                      </button>
                    </div>
                  </div>
                </div>

                <div className='border-gray border-2 p-4 rounded-md w-full max-w-[650px]'>
                  <div className='flex gap-2 justify-center items-center mb-4'>
                    <HistoryIcon sx={{ fontSize: 40, color: '#006D77' }} />
                    <h3 className='text-navy font-semibold text-lg flex items-center gap-2'>Guess History</h3>
                  </div>

                  <div className="w-full mx-auto bg-white font-sans">
                    <div className="w-full overflow-x-auto">
                      <table className="w-full min-w-[500px] border-collapse text-sm text-left">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-800 font-bold">
                            <th className="py-4 px-2 w-[10%] text-center">#</th>
                            <th className="py-4 px-2 w-[40%] text-center">Your Guess</th>
                            <th className="py-4 px-2 w-[25%] text-center">
                              <span className="inline-flex items-center gap-2 justify-center w-full">
                                Correct Position
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                              </span>
                            </th>
                            <th className="py-4 px-2 w-[25%] text-center">
                              <span className="inline-flex items-center gap-2 justify-center w-full">
                                Correct Number
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                              </span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentPlayerHistory.length > 0 ? (
                            currentPlayerHistory.map((entry, index) => (
                              <tr key={`${entry.guess}-${index}`} className="border-b border-slate-100">
                                <td className="py-4 px-2 text-center">{index + 1}</td>
                                <td className="py-4 px-2 text-center font-mono font-semibold">{entry.guess}</td>
                                <td className="py-4 px-2 text-center">{entry.correctPositions}</td>
                                <td className="py-4 px-2 text-center">{entry.correctDigits}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="py-8 text-center text-slate-500">No guesses yet</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-8 p-5 bg-slate-50 border border-slate-100 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                      <div className="flex gap-3 items-start">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
                        <div>
                          <p className="font-bold text-slate-800 mb-0.5">Correct Position</p>
                          <p>Digit is correct and in the right place.</p>
                        </div>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0"></span>
                        <div>
                          <p className="font-bold text-slate-800 mb-0.5">Correct Number</p>
                          <p>Digit is correct but in the wrong place.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Match Over Banner View */}
            {isMatchOver && (
              <div className="match-over-banner mt-4 text-center text-gray-secondary">
                <h2 className='text-primary text-lg font-semibold'>Match Over!</h2>
                <Box
                  className='mb-4'
                  component="img"
                  src={
                    isDraw
                      ? draw
                      : isWinner
                        ? win
                        : lose
                  }
                  sx={{
                    width: 160,
                    height: 160,
                    objectFit: "contain",
                    display: 'block',
                    mx: 'auto'
                  }}
                />
                <h3>
                  {isDraw
                    ? "It's a Draw!"
                    : isWinner
                      ? "You are the Ultimate Winner!"
                      : hasMaxGuesses && !winner
                        ? "Out of Turns! You Lose!"
                        : "Opponent Wins the Match!"}
                </h3>

                {(winner || hasMaxGuesses) && secretNumber && (
                  <p className="mt-2 text-sm font-medium">
                    The Secret Code was:{" "}
                    <span className="font-mono font-bold text-lg text-primary">
                      {secretNumber}
                    </span>
                  </p>
                )}

                {opponentReady && (
                  <p className="text-green-600 font-semibold mb-2 animate-pulse mt-2">
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
          </>
        )}
      </div>
    </div>
  );
};

export default Guess;