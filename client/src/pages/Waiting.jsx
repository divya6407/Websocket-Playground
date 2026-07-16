import React, { useEffect, useState } from 'react';
import Header from '../Components/Header.jsx';
import Loading from '../Components/Loading.jsx';
import { socket } from '../socket.js';
import { useNavigate, useLocation } from 'react-router-dom';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';

const Waiting = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = location?.state || {};
  const game = stateData.game;
  const difficulty = stateData.difficulty || 'Hard';
  const [status, setStatus] = useState('Searching for opponent...');
  const [isTypingGame, setIsTypingGame] = useState(game === 'typing');

  useEffect(() => {
    if (!game) {
      navigate('/select-game');
      return;
    }

    if (!socket.connected) socket.connect();

    const gameData = game === 'typing' ? { game, difficulty } : { game };
    socket.emit("playnow", gameData);

    const handleMatchFound = (data) => {
      setStatus('Match found! Starting game...');
      const { roomId, game: matchedGame } = data;
      const resolvedGame = matchedGame?.game || matchedGame?.type || game;
      const resolvedDifficulty = matchedGame?.difficulty || difficulty;

      if (resolvedGame === 'typing') {
        setTimeout(() => {
          navigate(`/typing/${roomId}/instructions`, {
            state: {
              game: {
                type: 'typing',
                difficulty: resolvedDifficulty,
                timeLimit: resolvedDifficulty === 'Easy' ? 60 : resolvedDifficulty === 'Medium' ? 90 : 120,
              },
            },
          });
        }, 500);
      } else {
        setTimeout(() => {
          navigate(`/${resolvedGame}/${roomId}`);
        }, 500);
      }
    };

    socket.on("matchfound", handleMatchFound);

    return () => {
      socket.off("matchfound", handleMatchFound);
    };
  }, [game, navigate, difficulty]);

  return (
    <div className='font-poppins min-h-screen'>
      <Header />
      <div className='flex-1 flex flex-col items-center justify-center min-h-[80vh] px-4'>
        <SportsEsportsIcon sx={{ fontSize: 80, color: '#006D77', mb: 3 }} />
        <h2 className='text-navy text-2xl font-extrabold mb-2 text-center'>Finding Opponent</h2>
        <p className='text-gray-secondary mb-6 text-center'>{status}</p>
        <Loading />
        <p className='text-gray-secondary mt-8 text-sm text-center'>
          {isTypingGame ? `Difficulty: ${difficulty}` : `Game: ${game}`}
        </p>
        <button
          onClick={() => navigate('/select-game')}
          className='mt-8 text-red-500 border border-red-500 rounded-md px-6 py-2 font-semibold hover:bg-red-50 transition-all'
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default Waiting;