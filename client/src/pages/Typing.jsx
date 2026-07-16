import React, { useEffect, useRef, useState } from 'react'
import Header from '../Components/Header.jsx'
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../socket.js';
import win from '../assets/win.png';
import lose from '../assets/lose.png';
import draw from '../assets/draw.png';
import { Box } from '@mui/material';

const Typing = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const gameInfo = location?.state?.game || location?.state || {};
  const difficulty = gameInfo?.difficulty || 'Hard';
  const [paragraph, setParagraph] = useState("");
  const [roomId, setroomId] = useState(id);
  const [error, seterror] = useState("");
  const [typedPara, settypedPara] = useState("");
  const [iterator, setIterator] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);

  const [p1Progress, setP1Progress] = useState(0);
  const [p2Progress, setP2Progress] = useState(0);
  const [timer, setTimer] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [opponentReady, setOpponentReady] = useState(false);
  const paragraphReceived = useRef(false);
  const calcSentRef = useRef(false);
  const paragraphRef = useRef("");
  const typedParaRef = useRef("");

  paragraphRef.current = paragraph;
  typedParaRef.current = typedPara;

  useEffect(() => {
    setroomId(id);
  }, [id]);

  useEffect(() => {
    socket.on("playtype-error", (msg) => {
      seterror(msg);
    });

    socket.on("send-paragraph", (para) => {
      if (!paragraphReceived.current) {
        paragraphReceived.current = true;
        setParagraph(para);
      }
    });

    socket.on("send-calculation", (data) => {
      setCorrect(data.correctWord);
      setWrong(data.wrongWord);
    });

    socket.on("send-progress", (data) => {
      const myProgress = data[socket.id] || 0;
      setP1Progress(myProgress);

      const opponentId = Object.keys(data).find((id) => id !== socket.id);
      const opponentProgress = opponentId ? data[opponentId] : 0;
      setP2Progress(opponentProgress);
    });

    socket.on("send-timer", (timeLeft) => {
      setTimer(timeLeft);
    });

    socket.on("game-over", (result) => {
      setGameOver(result);
      setTimer(0);
      if (paragraphRef.current && !calcSentRef.current) {
        calcSentRef.current = true;
        socket.emit("set-calculation", roomId, paragraphRef.current, typedParaRef.current);
      }
    });

    socket.on("typing-opponent-ready", () => {
      setOpponentReady(true);
    });

    socket.on("typing-game-restarted", () => {
      setParagraph("");
      settypedPara("");
      setIterator(0);
      setCorrect(0);
      setWrong(0);
      setP1Progress(0);
      setP2Progress(0);
      setTimer(null);
      setGameOver(null);
      setOpponentReady(false);
      seterror("");
      paragraphReceived.current = false;
      calcSentRef.current = false;
      socket.emit("set-paragraph", roomId, difficulty);
    });

    socket.emit("set-paragraph", roomId, difficulty);

    return () => {
      socket.off("playtype-error");
      socket.off("send-paragraph");
      socket.off("send-calculation");
      socket.off("send-progress");
      socket.off("send-timer");
      socket.off("game-over");
      socket.off("typing-opponent-ready");
      socket.off("typing-game-restarted");
    };
  }, [roomId, difficulty]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (paragraph.length > 0 && !gameOver) {
      socket.emit("set-progress", roomId, socket.id, typedPara.length, paragraph.length);
      socket.emit("set-calculation", roomId, paragraph, typedPara);
    }
  }, [typedPara, paragraph, roomId, gameOver]);

  useEffect(() => {
    if (paragraph && iterator === paragraph.length && !gameOver && !calcSentRef.current) {
      calcSentRef.current = true;
      socket.emit("set-calculation", roomId, paragraph, typedPara);
    }
  }, [iterator, paragraph, typedPara, roomId, gameOver]);

  const handleKeyPress = (e) => {
    if (gameOver) {
      e.preventDefault();
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      return;
    }

    const ignoredKeys = ['CapsLock', 'Shift', 'Control', 'Alt', 'Meta', 'Escape'];
    if (ignoredKeys.includes(e.key)) {
      return;
    }

    setIterator((prev) => prev + 1);
  };

  const handleLeaveRoom = () => {
    socket.emit("leave-room", roomId);
    sessionStorage.removeItem("activeroomid");
    navigate('/home');
  };

  const handlePlayAgain = () => {
    socket.emit("typing-play-again", roomId);
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const renderWordDiff = (original, typed) => {
    if (!original) return null;
    const originalWords = original.trim().split(/\s+/);
    const typedWords = typed ? typed.trim().split(/\s+/) : [];
    return (
      <div className="flex flex-wrap gap-1.5 justify-center max-w-3xl mx-auto leading-relaxed">
        {originalWords.map((word, idx) => {
          const typedWord = typedWords[idx];
          let bg = 'bg-gray-100 text-gray-500';
          if (typedWord !== undefined) {
            bg = typedWord === word
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-red-100 text-red-800 border border-red-300 line-through';
          }
          return (
            <span key={idx} className={`px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono ${bg}`}>
              {word}
            </span>
          );
        })}
      </div>
    );
  };

  const myGameData = gameOver && (gameOver.player1.id === socket.id ? gameOver.player1 : gameOver.player2);
  const opponentGameData = gameOver && (gameOver.player1.id === socket.id ? gameOver.player2 : gameOver.player1);
  const isMyWinner = gameOver && gameOver.winner === socket.id;
  const isDraw = gameOver && gameOver.winner === null;
  const isLoser = gameOver && !isMyWinner && !isDraw;

  return (
    <div className="min-h-screen">
      <Header />
      <div className='mx-2 sm:mx-4 font-poppins flex flex-col items-center justify-center max-w-5xl'>

        {!gameOver && (
          <div className='w-full flex flex-col sm:flex-row justify-between items-center mb-4 px-2 sm:px-4 gap-2'>
            <p className='text-gray-secondary font-medium text-sm sm:text-base'>
              Room Number : <span className='text-navy font-mono font-bold'>{roomId}</span>
            </p>
            <div className='flex items-center gap-2'>
              <span className='text-gray-secondary font-medium text-sm sm:text-base'>Time:</span>
              <span className={`font-mono font-bold text-lg sm:text-xl ${timer !== null && timer <= 10 ? 'text-red-500 animate-pulse' : 'text-navy'}`}>
                {formatTime(timer)}
              </span>
            </div>
          </div>
        )}

        {error && <div className="text-red-500 font-semibold text-sm sm:text-base px-2">{error}</div>}

        {!gameOver ? (
          <div className='flex items-center flex-col w-full px-2 sm:px-0'>
            <p className='text-gray-secondary font-semibold text-center text-sm sm:text-base'>Type the following</p>

            <div className='border-gray border-2 m-3 sm:m-4 flex justify-center w-full max-w-[1000px]'>
              <p className="w-full max-w-full min-h-[80px] sm:h-[100px] overflow-y-auto border border-gray-300 p-2 sm:p-3 text-center text-sm sm:text-base">
                {paragraph}
              </p>
            </div>

            <div className='w-full flex justify-center mt-1 sm:mt-2'>
              <form className='w-full max-w-[1000px] flex justify-center px-1 sm:px-0'>
                <textarea
                  value={typedPara}
                  disabled={iterator === paragraph.length || timer === 0}
                  onKeyDown={(e) => handleKeyPress(e)}
                  onChange={(e) => settypedPara(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  className='w-full border border-gray-400 p-2 sm:p-3 rounded text-center resize-none focus:outline-none select-none text-sm sm:text-base'
                  rows="4"
                  placeholder="Start typing here..."
                />
              </form>
            </div>

            <div className='w-full max-w-[1000px] mt-5 sm:mt-8 space-y-4 sm:space-y-5 px-2 sm:px-4'>
              <div>
                <div className='flex justify-between mb-1 text-xs sm:text-sm font-bold text-gray-700'>
                  <span>Player 1 (You) - Correct: {correct} | Wrong: {wrong}</span>
                  <span className='text-primary'>{p1Progress}%</span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2.5 sm:h-3 overflow-hidden shadow-inner'>
                  <div className='bg-primary h-full rounded-full transition-all duration-200 ease-out' style={{ width: `${p1Progress}%` }}></div>
                </div>
              </div>
              <div>
                <div className='flex justify-between mb-1 text-xs sm:text-sm font-bold text-gray-700'>
                  <span>Player 2 (Opponent)</span>
                  <span className='text-primary'>{p2Progress}%</span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2.5 sm:h-3 overflow-hidden shadow-inner'>
                  <div className='bg-primary h-full rounded-full transition-all duration-200 ease-out' style={{ width: `${p2Progress}%` }}></div>
                </div>
              </div>
            </div>

            <div className='flex justify-center mt-6 sm:mt-8'>
              <button
                onClick={handleLeaveRoom}
                className='text-red-500 border border-red-500 rounded-md px-5 sm:px-6 py-2.5 sm:py-3 font-semibold hover:bg-red-50 transition-all text-sm sm:text-base'
              >
                Leave Room
              </button>
            </div>
          </div>
        ) : (
          <div className="match-over-banner mt-4 text-gray-secondary flex flex-col items-center justify-center w-full px-2 sm:px-4">
            <p className='text-gray-secondary font-medium mb-2 text-sm sm:text-base'>
              Room Number : <span className='text-navy font-mono font-bold'>{roomId}</span>
            </p>

            <h2 className='text-primary text-base sm:text-lg font-semibold'>Match Over!</h2>

            <Box
              component="img"
              src={isDraw ? draw : isMyWinner ? win : lose}
              alt={isDraw ? "Draw" : isMyWinner ? "Win" : "Lose"}
              sx={{
                width: { xs: 120, sm: 160 },
                height: { xs: 120, sm: 160 },
                objectFit: "contain",
                display: 'block',
                mx: 'auto',
                my: 2
              }}
            />

            <h3 className="text-center text-sm sm:text-base px-2">
              {isDraw
                ? "It's a Draw!"
                : isMyWinner
                  ? "You are the Ultimate Winner!"
                  : "Opponent Wins the Match!"}
            </h3>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-5 sm:mt-6 w-full max-w-2xl px-2 sm:px-4'>
              <div className={`border-2 rounded-xl p-4 sm:p-6 text-center ${isMyWinner ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                <h3 className='font-bold text-base sm:text-lg mb-2 sm:mb-3'>You</h3>
                <div className='space-y-1 sm:space-y-2 text-gray-700 text-sm sm:text-base'>
                  <p>Progress: <span className='font-bold text-primary'>{myGameData.progress}%</span></p>
                  <p>Correct Words: <span className='font-bold text-green-600'>{myGameData.correct}</span></p>
                  <p>Wrong Words: <span className='font-bold text-red-600'>{myGameData.wrong}</span></p>
                </div>
              </div>

              <div className={`border-2 rounded-xl p-4 sm:p-6 text-center ${isLoser ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                <h3 className='font-bold text-base sm:text-lg mb-2 sm:mb-3'>Opponent</h3>
                <div className='space-y-1 sm:space-y-2 text-gray-700 text-sm sm:text-base'>
                  <p>Progress: <span className='font-bold text-primary'>{opponentGameData.progress}%</span></p>
                  <p>Correct Words: <span className='font-bold text-green-600'>{opponentGameData.correct}</span></p>
                  <p>Wrong Words: <span className='font-bold text-red-600'>{opponentGameData.wrong}</span></p>
                </div>
              </div>
            </div>

            <div className='w-full max-w-2xl mt-6 sm:mt-8 px-2 sm:px-4'>
              <h3 className='font-bold text-base sm:text-lg mb-3 text-navy text-center'>Word-Level Accuracy</h3>
              <div className='border border-gray-300 rounded-lg p-3 sm:p-4 bg-white overflow-x-auto'>
                <div className='flex flex-wrap gap-2 sm:gap-3 mb-3 text-xs text-gray-500 justify-center'>
                  <span className='flex items-center gap-1'><span className='w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-green-100 border border-green-300 inline-block'></span> Correct</span>
                  <span className='flex items-center gap-1'><span className='w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-red-100 border border-red-300 inline-block'></span> Incorrect / Missed</span>
                  <span className='flex items-center gap-1'><span className='w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-gray-100 border border-gray-200 inline-block'></span> Not Typed</span>
                </div>
                {renderWordDiff(gameOver.paragraph, typedParaRef.current)}
              </div>
            </div>

            <div className='flex flex-col items-center gap-3 sm:gap-4 mt-5 sm:mt-6 mb-6 sm:mb-8'>
              {opponentReady && (
                <p className="text-green-600 font-semibold animate-pulse text-sm sm:text-base">
                  Opponent is ready! Waiting for you...
                </p>
              )}
              <div className='flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 w-full max-w-xs sm:max-w-none'>
                <button
                  onClick={handlePlayAgain}
                  className='bg-primary text-white rounded-md px-5 sm:px-6 py-2.5 sm:py-3 font-semibold hover:bg-primary/90 transition-all text-sm sm:text-base'
                >
                  Play Again
                </button>
                <button
                  onClick={handleLeaveRoom}
                  className='text-red-500 border border-red-500 rounded-md px-5 sm:px-6 py-2.5 sm:py-3 font-semibold hover:bg-red-50 transition-all text-sm sm:text-base'
                >
                  Leave Room
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Typing;