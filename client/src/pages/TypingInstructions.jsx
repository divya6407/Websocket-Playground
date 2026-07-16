import React, { useEffect, useState } from 'react';
import Header from '../Components/Header.jsx';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { socket } from '../socket.js';

const TypingInstructions = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [roomId, setroomId] = useState(id);
  const location = useLocation();
  const [msg, setmsg] = useState("");
  const [countdown, setcountdown] = useState(false);
  const [isready, setisready] = useState(false);
  const [count, setcount] = useState(3);

  const gameInfo = location?.state?.game || location?.state || {};
  const difficulty = gameInfo?.difficulty || 'Hard';
  const timeLimit = gameInfo?.timeLimit || 60;

  // Socket listener setup
  useEffect(() => {
    socket.on("opponent-ready", () => {
      setmsg("Your opponent is ready. Please Click ready Button");
    });

    socket.on("start-countdown", () => {
      setcountdown(true);
    });

    return () => {
      socket.off("opponent-ready");
      socket.off("start-countdown");
    };
  }, []);

  // Countdown & Delayed Navigation logic
  useEffect(() => {
    if (!countdown) return;

    // 1. When count hits 0, wait 2 seconds showing "GO!" then navigate
    if (count === 0) {
      const delayNav = setTimeout(() => {
        navigate(`/typing/${roomId}/${difficulty}`, {
          state: { game: { type: 'typing', difficulty: difficulty, timeLimit: timeLimit } }
        });
      }, 2000); // 2 second delay

      return () => clearTimeout(delayNav);
    }

    // 2. Countdown ticking mechanism
    const timer = setTimeout(() => {
      setcount((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, count, navigate, roomId, difficulty, timeLimit]);

  const handleReady = () => {
    setisready(true);
    socket.emit("ready-request", roomId);
  };

  return (
    <div className='font-poppins text-navy min-h-screen flex flex-col'>
      <Header />
      <div className='flex-1 flex items-center justify-center p-4'>

        {/* CONDITION 1: If countdown is active, ONLY show this screen */}
        {countdown ? (
          <div className='text-center animate-fade-in'>
            <h1 className="text-8xl font-black text-primary drop-shadow-md animate-ping [animation-duration:1s] [animation-iteration-count:infinite]">
              {count > 0 ? count : "GO!"}
            </h1>
            <p className="text-gray-secondary mt-6 font-semibold tracking-widest uppercase">
              {count > 0 ? "Get ready to type..." : "Starting Match!"}
            </p>
          </div>
        ) : (

          /* CONDITION 2: Normal layout shown before countdown begins */
          <div className='w-full max-w-[800px] flex flex-col justify-center px-8 py-12 border border-gray-200 rounded-xl shadow-2xl text-center bg-white'>
            <h2 className='text-2xl font-extrabold mb-4'>TYPING RACE</h2>

            <div className='mb-6'>
              <p className='text-gray-secondary font-medium'>Room Code : <span className='font-mono font-bold text-navy'>{id}</span></p>
              <p className='text-gray-secondary mt-4'>Time Limit : <span className='text-navy font-bold'>{timeLimit} Seconds</span></p>
              <p className='text-gray-secondary mt-4'>Difficulty : <span className='text-navy font-bold'>{difficulty} </span></p>
              <p className='text-gray-secondary mt-4'>{msg}</p>
            </div>

            <div className='text-left border border-gray-200 rounded-lg p-6 mb-6 bg-gray-50'>
              <h3 className='font-bold mb-2'>Rules</h3>
              <ul className='list-disc list-inside text-gray-700 space-y-1'>
                <li>Type the given paragraph.</li>
                <li>Backspace is disabled.</li>
                <li>Accuracy affects the final result.</li>
                <li>Game ends when:</li>
                <ul className='list-disc list-inside ml-6'>
                  <li>Timer reaches 0</li>
                  <li>A player completes the paragraph.</li>
                </ul>
              </ul>
            </div>

            <button
              onClick={handleReady}
              disabled={isready}
              className='bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:bg-gray-400'
            >
              {isready ? "WAITING FOR OPPONENT..." : "READY"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default TypingInstructions;
