import React, { useState, useEffect } from 'react';
import Header from '../Components/Header';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';

const Joinroom = () => {
    const [roomId, setroomId] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const extractGame = (data) => {
            if (!data || !data.game) return null;
            return typeof data.game === 'object' && data.game !== null
                ? data.game.type
                : data.game;
        };

        const handleJoinSuccess = (data) => {
            const game = extractGame(data);
            const targetRoomId = data?.roomId || roomId;
            const difficulty = (typeof data?.game === 'object' && data.game?.difficulty) || 'Hard';

            if (game && typeof game === 'string' && game !== '[object Object]' && targetRoomId) {
                if (game === 'typing') {
                    navigate(`/${game}/${targetRoomId}/instructions`, { state: { game: { type: 'typing', difficulty, timeLimit: 60 } } });
                } else {
                    navigate(`/${game}/${targetRoomId}`);
                }
            } else {
                console.error("Navigation skipped due to missing or invalid params", { game, targetRoomId });
            }
        };

        const handlePlayerJoined = (data) => {
            const game = extractGame(data);
            const targetRoomId = data?.roomId || roomId;
            const difficulty = (typeof data?.game === 'object' && data.game?.difficulty) || 'Hard';

            if (game && typeof game === 'string' && game !== '[object Object]' && targetRoomId) {
                if (game === 'typing') {
                    navigate(`/${game}/${targetRoomId}/instructions`, { state: { game: { type: 'typing', difficulty, timeLimit: 60 } } });
                } else {
                    navigate(`/${game}/${targetRoomId}`);
                }
            }
        };

        const handleRoomError = (message) => {
            alert(message);
        };

        socket.on("joinSuccess", handleJoinSuccess);
        socket.on("playerJoined", handlePlayerJoined);
        socket.on("roomError", handleRoomError);

        return () => {
            socket.off("joinSuccess", handleJoinSuccess);
            socket.off("playerJoined", handlePlayerJoined);
            socket.off("roomError", handleRoomError);
        };

    }, [navigate, roomId]); // FIXED: Added roomId dependency so listeners capture current typed value

    const handlecancel = () => {
        setroomId("");
        navigate('/home');
    };

    const handleJoin = (e) => {
        e.preventDefault();
        const trimmedId = roomId.trim().replace(/^:/, ''); // Extra guard: cleans colons out of inputs
        if (!trimmedId) return;

        socket.emit("joinroom", trimmedId);
    };

    return (
        <div>
            <Header />
            <div className='flex min-h-screen items-center justify-center'>
                <div className='m-4 flex w-full max-w-[1000px] flex-col justify-center font-poppins px-8 py-12 border border-gray-200 rounded-xl shadow-sm'>
                    <p className='text-center text-3xl font-bold text-navy mb-8'>Join the Room</p>
                    <form className='flex flex-col justify-center gap-6' onSubmit={handleJoin}>
                        <label htmlFor="code" className="text-lg font-medium">Enter Room code</label>
                        <input
                            className='border-2 border-gray p-4 w-full rounded-lg text-lg focus:outline-none focus:border-primary'
                            id="code"
                            placeholder="e.g. ABC123"
                            value={roomId}
                            onChange={(e) => setroomId(e.target.value)}
                        />
                        <button type='submit' className='rounded-lg bg-primary p-4 font-bold text-white w-full text-lg hover:bg-primary/90 transition-colors' >
                            Join Now
                        </button>
                    </form>
                    <button className="text-primary mt-6 self-center text-lg font-medium hover:underline " onClick={handlecancel}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Joinroom;