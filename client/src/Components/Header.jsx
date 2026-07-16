import React, { useEffect, useState } from 'react';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { socket } from '../socket';

const Header = () => {
    // Instantly read from sessionStorage so the name doesn't vanish on refresh
    const [username, setUsername] = useState(
        sessionStorage.getItem("username") || ""
    );

    useEffect(() => {
        const storedUsername = sessionStorage.getItem("username");

        if (storedUsername) {
            // Keep the UI state updated
            setUsername(storedUsername);
            // Re-bind this new connection's socket.id to the username on the server
            socket.emit("set-username", storedUsername);
        }
    }, []);

    return (
        <div className='font-poppins m-4'>
            <div className='flex justify-between'>
                <div className='flex flex-row gap-[2px]'>
                    <SportsEsportsIcon sx={{ fontSize: 60, color: '#006D77' }} />
                    <div className='flex flex-col p-2'>
                        <h3 className='text-navy font-semibold'>WebSocket</h3>
                        <h3 className='text-primary '>PlayGround</h3>
                    </div>
                </div>
                <div>
                    <div className='flex justify-center'>
                        <AccountCircleIcon sx={{ fontSize: 60, color: '#006D77' }} />
                        <div>
                            <h3 className='p-4 font-semibold text-navy'>{username || "Guest"}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;