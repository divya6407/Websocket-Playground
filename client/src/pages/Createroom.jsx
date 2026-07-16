import React, { useEffect, useState, useRef } from 'react';
import Header from '../Components/Header.jsx';
import Loading from '../Components/Loading.jsx';
import { socket } from '../socket.js';
import { useNavigate, useLocation } from 'react-router-dom';

const Createroom = () => {
    const [roomId, setroomId] = useState(() => {
        return sessionStorage.getItem('activeroomid') || "";
    });
    const [difficulty, setDifficulty] = useState("Hard");
    const difficultyRef = useRef(difficulty);
    useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);
    // When difficulty dropdown changes, send update to server
    useEffect(() => {
        if (roomIdRef.current) {
            socket.emit("update-difficulty", roomIdRef.current, difficulty);
        }
    }, [difficulty]);
    const roomIdRef = useRef(roomId);
    const navigate = useNavigate();
    const location = useLocation();
    const roomCreatedRef = React.useRef(false);
    const gameData = location?.state?.game || location?.state || {};
    const game = typeof gameData === 'object' && gameData !== null ? (gameData.type || gameData.game || gameData) : gameData;
    useEffect(() => {
        if (!socket.connected) socket.connect();
        if (game && !roomCreatedRef.current) {
            roomCreatedRef.current = true;
            sessionStorage.removeItem('activeroomid');
            setroomId("");
            const roomData = game === 'typing' ? { game, difficulty: difficultyRef.current } : { game };
            socket.emit("createroom", roomData);
        }
        const handleRoomCode = (id) => {
            setroomId(id);
            roomIdRef.current = id;
            sessionStorage.setItem('activeroomid', id);
            // Do not navigate to instructions yet. Wait for another player to join.
        };
        const handleSuccessfulDelete = (msg) => {
            if (msg === 'deleted') {
                sessionStorage.removeItem('activeroomid');
                setroomId("");
                navigate('/home');
            }
        };
        const handlePlayerJoin = (data) => {
            console.log("Player joined payload:", data);

            let targetGame = "";
            if (data?.game) {
                targetGame = typeof data.game === 'object' ? data.game.type : data.game;
            }

            if (!targetGame || typeof targetGame !== 'string') {
                targetGame = game;
            }
            if (targetGame && typeof targetGame === 'string' && targetGame !== '[object Object]') {
                if (targetGame === 'typing') {
                    navigate(`/typing/${roomIdRef.current}/instructions`, { state: { game: { type: 'typing', difficulty: difficultyRef.current, timeLimit: 60 } } });
                } else {
                    navigate(`/${targetGame}/${roomIdRef.current}`);
                }
            } else {
                console.error("Navigation stopped: target route string evaluation failed.", targetGame);
            }
        };
        socket.on("setroomcode", handleRoomCode);
        socket.on("successfuldeleteroom", handleSuccessfulDelete);
        socket.on("playerJoin", handlePlayerJoin);
        socket.on("playerJoined", handlePlayerJoin);
        socket.on("joinSuccess", handlePlayerJoin);
        return () => {
            socket.off("setroomcode", handleRoomCode);
            socket.off("successfuldeleteroom", handleSuccessfulDelete);
            socket.off("playerJoin", handlePlayerJoin);
            socket.off("playerJoined", handlePlayerJoin);
            socket.off("joinSuccess", handlePlayerJoin);
        };
    }, [navigate, game]); 
    const handlecopy = () => {
        if (roomId) {
            navigator.clipboard.writeText(roomId);
            alert("Code copied!");
        }
    };
    const handleleaveroom = () => {
        if (roomId) {
            socket.emit('deleteroom', roomId);
        } else {
            navigate('/home');
        }
    };
    return (
        <div className='font-poppins text-navy min-h-screen flex flex-col'>
            <Header />

            <div className='flex-1 flex items-center justify-center p-4'>
                <div className='w-full max-w-[1000px] flex flex-col justify-center px-8 py-12 border border-gray-200 rounded-xl shadow-2xl text-center bg-white'>

                    {game === 'typing' && (
                      <div className='flex flex-col gap-4 items-center mb-6'>
                        <label className='text-navy font-semibold text-lg'>Select Difficulty</label>
                        <select
                          className='border-2 border-gray p-3 rounded-lg w-full max-w-xs text-center text-lg'
                          value={difficulty}
                          onChange={(e) => setDifficulty((e.target.value))}
                        >
                          <option value='Easy'>Easy</option>
                          <option value='Medium'>Medium</option>
                          <option value='Hard'>Hard</option>
                        </select>
                      </div>
                    )}

                    <div className='p-6 mb-6 border-2 border-gray-200 rounded-lg bg-gray-50/50'>
                        <p className='text-navy font-bold text-lg mb-3'>Room Code</p>

                        <div className='border-gray border-2 rounded-lg flex justify-between items-center px-6 py-4 bg-white max-w-xl mx-auto'>
                            <p className='text-xl font-mono tracking-wider font-semibold text-gray-700'>
                                {roomId || "Generating..."}
                            </p>
                            <button
                                className='text-primary font-bold text-lg hover:underline transition-all disabled:opacity-50'
                                onClick={handlecopy}
                                disabled={!roomId}
                            >
                                Copy Code
                            </button>
                        </div>

                        <p className='mt-4 text-gray-500 text-base'>
                            Share this Code with your friends
                        </p>
                    </div>

                    <button
                        className='text-white font-bold bg-primary p-4 rounded-lg w-full max-w-xl mx-auto text-lg hover:bg-primary/90 transition-colors'
                        onClick={handleleaveroom}
                    >
                        Leave Room
                    </button>

                </div>
            </div>
        </div>
    );
};

export default Createroom;