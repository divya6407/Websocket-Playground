import React from 'react';
import Header from '../Components/Header.jsx';
import { useNavigate } from 'react-router-dom';
import typingIcon from '../assets/computer.png';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Box } from '@mui/material';

const TypingDifficulty = () => {
  const navigate = useNavigate();

  const difficulties = [
    { key: 'Easy', time: '60s', desc: 'Short paragraph' },
    { key: 'Medium', time: '90s', desc: 'Medium paragraph' },
    { key: 'Hard', time: '120s', desc: 'Long paragraph' },
  ];

  return (
    <div className='font-poppins min-h-screen'>
      <Header />
      <div className='m-4 sm:m-8'>
        <h2 className='text-navy text-2xl font-extrabold mb-1'>Select Difficulty</h2>
        <p className='text-gray-secondary mb-6'>Choose your typing challenge level</p>

        <div className='flex flex-col sm:flex-row gap-4 sm:gap-6'>
          {difficulties.map((diff) => (
            <div
              key={diff.key}
              onClick={() => navigate('/waiting', { state: { game: 'typing', difficulty: diff.key } })}
              className='shadow-xl p-5 sm:p-6 flex-1 cursor-pointer border border-gray-200 rounded-xl hover:border-primary hover:border-2 transition-all duration-200'
            >
              <div className='flex justify-between mb-4'>
                <Box
                  component="img"
                  src={typingIcon}
                  alt={diff.key}
                  sx={{ width: { xs: 60, sm: 70 }, height: 'auto' }}
                />
                <ArrowForwardIosIcon sx={{ fontSize: 20, color: '#006D77' }} />
              </div>
              <h3 className='text-navy font-semibold text-lg'>{diff.key}</h3>
              <p className='text-gray-secondary'>{diff.time} — {diff.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TypingDifficulty;