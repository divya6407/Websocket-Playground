import React, { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import rpsIcon from '../assets/rock-paper-scissors.png';
import numberIcon from '../assets/keypad.png';
import typingIcon from '../assets/computer.png';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';

import Header from '../Components/Header.jsx'
import { socket } from '../socket.js';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [username, setusername] = useState(sessionStorage.getItem('username') || "Player 1");
    const [selectedgame, setselectedgame] = useState("");
    const [activePlayers, setActivePlayers] = useState(0);
    const navigate= useNavigate();

    useEffect(() => {
        const handleActiveCount = (count) => {
            setActivePlayers(Number(count) || 0);
        };

        socket.on("active-player-count", handleActiveCount);

        if (!socket.connected) {
            socket.connect();
        }

        socket.emit("get-active-count");

        return () => {
            socket.off("active-player-count", handleActiveCount);
        };
    }, []);

    const handleplaynowrps = ()=>{
        navigate('/createroom',{state:{game:'rps'}})
    }
    const handleplaynowguess = () => {
        navigate('/createroom', { state: { game: 'guess' } })
    }
    const handleplaynowtypying = () => {
        navigate('/createroom', { state: { game: 'typing' } })
    }

    const handlejoin=()=>{
        navigate('/joinroom')
    }

    const handlePlayNowQuickAction = () => {
        navigate('/select-game');
    }

    return (
        <div className='font-poppins min-h-screen'>
            <Header />
            <div className='m-4'>

                {/* Greeting + Active Player Count */}
                <div className='flex justify-between items-center mb-4'>
                    <div>
                        <h2 className='text-navy font-extrabold text-2xl'>Hi👋🏻, {username}</h2>
                        <p className='text-navy'>Choose a Game to Play</p>
                    </div>
                    <div className='flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg'>
                        <span className='w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse'></span>
                        <span className='text-navy font-semibold text-sm'>{activePlayers} online</span>
                    </div>
                </div>

                {/* Featured Games */}
                <div>
                    <p className='text-navy font-semibold mb-4'>Featured Games</p>
                    <div className='flex flex-col sm:flex-row gap-4'>

                        {/* Rock Paper Scissors Card */}
                        <div
                            onClick={() => setselectedgame('rps')}
                            className={`shadow-xl p-4 flex-1 cursor-pointer transition-all duration-200 ${(selectedgame === 'rps') ? 'border-primary border-2 rounded-lg' : 'border border-transparent'}`}
                        >
                            <div className='mb-4'>
                                <div className='flex justify-between mb-4'>
                                    <Box
                                        component="img"
                                        src={rpsIcon}
                                        alt="Rock Paper Scissors"
                                        sx={{ width: 70, height: 'auto' }}
                                    />
                                    <ArrowForwardIosIcon sx={{ fontSize: 20, color: '#006D77' }} />
                                </div>
                                <h3 className='text-navy font-semibold'>Rock Paper Scissor</h3>
                                <p className='text-gray-secondary'>Best of 3</p>
                            </div>
                            <button
                                disabled={selectedgame !== 'rps'}
                                className='pt-2 pb-2 pl-5 pr-5 border-primary border-2 font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed'
                                onClick={(e) => { e.stopPropagation(); handleplaynowrps(); }}
                            >
                                Play Now
                            </button>
                        </div>

                        {/* Guess the Number Card */}
                        <div
                            onClick={() => setselectedgame('guess')}
                            className={`shadow-xl p-4 flex-1 cursor-pointer transition-all duration-200 ${(selectedgame === 'guess') ? 'border-primary border-2 rounded-lg' : 'border border-transparent'}`}
                        >
                            <div className='mb-4'>
                                <div className='flex justify-between mb-4'>
                                    <Box
                                        component="img"
                                        src={numberIcon}
                                        alt="Bull and Cow"
                                        sx={{ width: 70, height: 'auto' }}
                                    />
                                    <ArrowForwardIosIcon sx={{ fontSize: 20, color: '#006D77' }} />
                                </div>
                                <h3 className='text-navy font-semibold'>Guess the Number</h3>
                                <p className='text-gray-secondary'>4 Digit Challenge</p>
                            </div>
                            <button
                                disabled={selectedgame !== 'guess'}
                                className='pt-2 pb-2 pl-5 pr-5 border-primary border-2 font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed'
                                onClick={(e) => { e.stopPropagation(); handleplaynowguess() }} 
                            >
                                Play Now
                            </button>
                        </div>

                        {/* Typing Game Card */}
                        <div
                            onClick={() => setselectedgame('typing')}
                            className={`shadow-xl p-4 flex-1 cursor-pointer transition-all duration-200 ${(selectedgame === 'typing') ? 'border-primary border-2 rounded-lg' : 'border border-transparent'}`}
                        >
                            <div className='mb-4'>
                                <div className='flex justify-between mb-4'>
                                    <Box
                                        component="img"
                                        src={typingIcon}
                                        alt="typing"
                                        sx={{ width: 70, height: 'auto' }}
                                    />
                                    <ArrowForwardIosIcon sx={{ fontSize: 20, color: '#006D77' }} />
                                </div>
                                <h3 className='text-navy font-semibold'>Typing Game</h3>
                                <p className='text-gray-secondary'>Type Fast Win First</p>
                            </div>
                            <button
                                disabled={selectedgame !== 'typing'}
                                className='pt-2 pb-2 pl-5 pr-5 border-primary border-2 font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed'
                                onClick={(e) => { e.stopPropagation(); handleplaynowtypying() }} 
                            >
                                Play Now
                            </button>
                        </div>

                    </div>
                </div>

                {/* Quick Actions Section */}
                <div className='mt-8'>
                    <h3 className='text-navy font-semibold mb-3'>Quick Actions</h3>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div className='shadow-2xl p-5 flex-1 cursor-pointer border border-gray-200 rounded-xl hover:border-primary transition-all' onClick={handlejoin}>
                            <div className='flex items-center gap-4'>
                                <GroupAddIcon sx={{ fontSize: 50, color: '#006D77' }} />
                                <div>
                                    <h3 className='text-navy font-semibold text-lg'>Join a Room</h3>
                                    <p className='text-gray-secondary text-sm'>Enter room code</p>
                                </div>
                            </div>
                        </div>

                        <div className='shadow-2xl p-5 flex-1 cursor-pointer border border-gray-200 rounded-xl hover:border-primary transition-all' onClick={handlePlayNowQuickAction}>
                            <div className='flex items-center justify-between gap-4'>
                                <div className='flex items-center gap-4'>
                                    <SportsEsportsIcon sx={{ fontSize: 50, color: '#006D77' }} />
                                    <div>
                                        <h3 className='text-navy font-semibold text-lg'>Play Now</h3>
                                        <p className='text-gray-secondary text-sm'>Find a random opponent and play instantly</p>
                                    </div>
                                </div>
                                <div className='text-right'>
                                    <p className='text-xs text-gray-secondary'>Active</p>
                                    <p className='text-lg font-bold text-primary'>{activePlayers}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default Home
