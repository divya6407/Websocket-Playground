import React from 'react';
import Header from '../Components/Header.jsx';
import { useNavigate } from 'react-router-dom';
import rpsIcon from '../assets/rock-paper-scissors.png';
import numberIcon from '../assets/keypad.png';
import typingIcon from '../assets/computer.png';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Box } from '@mui/material';

const SelectGame = () => {
  const navigate = useNavigate();

  const games = [
    {
      key: 'rps',
      title: 'Rock Paper Scissor',
      desc: 'Best of 3',
      icon: rpsIcon,
      onClick: () => navigate('/waiting', { state: { game: 'rps' } }),
    },
    {
      key: 'guess',
      title: 'Guess the Number',
      desc: '4 Digit Challenge',
      icon: numberIcon,
      onClick: () => navigate('/waiting', { state: { game: 'guess' } }),
    },
    {
      key: 'typing',
      title: 'Typing Game',
      desc: 'Type Fast Win First',
      icon: typingIcon,
      onClick: () => navigate('/typing-difficulty'),
    },
  ];

  return (
    <div className='font-poppins min-h-screen'>
      <Header />
      <div className='m-4 sm:m-8'>
        <h2 className='text-navy text-2xl font-extrabold mb-1'>Select Game</h2>
        <p className='text-gray-secondary mb-6'>Choose a game to play with a random opponent</p>

        <div className='flex flex-col sm:flex-row gap-4 sm:gap-6'>
          {games.map((game) => (
            <div
              key={game.key}
              onClick={game.onClick}
              className='shadow-xl p-5 sm:p-6 flex-1 cursor-pointer border border-gray-200 rounded-xl hover:border-primary hover:border-2 transition-all duration-200'
            >
              <div className='flex justify-between mb-4'>
                <Box
                  component="img"
                  src={game.icon}
                  alt={game.title}
                  sx={{ width: { xs: 60, sm: 70 }, height: 'auto' }}
                />
                <ArrowForwardIosIcon sx={{ fontSize: 20, color: '#006D77' }} />
              </div>
              <h3 className='text-navy font-semibold text-lg'>{game.title}</h3>
              <p className='text-gray-secondary'>{game.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SelectGame;