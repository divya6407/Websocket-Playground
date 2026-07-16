import React from 'react'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { useState } from 'react';
import { socket } from '../socket';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();
    const [name, setname] = useState("");

    const handlesubmit = (e) => {
        e.preventDefault();
        const trimmedName = name.trim();

        if (trimmedName === "") {
            alert("Enter a valid user name");
            return;
        }

        // 1. Save the username locally so it survives page refreshes
        sessionStorage.setItem("username", trimmedName);

        // 2. Register the name with the current socket ID
        socket.emit("set-username", trimmedName);
        console.log(trimmedName);

        // 3. Move into the application dashboard/home
        navigate('/home');
    }

    return (
        <div className="font-poppins min-h-screen bg-mint flex flex-col items-center justify-center p-4">
            <div className="flex flex-col items-center w-full max-w-[440px] text-center bg-white p-8 rounded-2xl border-2 border-primary-light/40 shadow-xl">
                <SportsEsportsIcon sx={{ fontSize: 80, color: '#006D77' }} />
                <h1 className="text-4xl font-bold text-navy flex items-center gap-2 mb-3">
                    Welcome <span className="animate-pulse">👋🏻</span>
                </h1>
                <p className="text-lg text-navy/80 font-medium mb-6">
                    Enter your User Name to get Started
                </p>
                <form className='flex flex-col gap-[20px]' onSubmit={handlesubmit}>
                    <input
                        className='border-2 border-primary-light p-4 rounded-md'
                        placeholder='Enter your name'
                        value={name}
                        onChange={(e) => setname(e.target.value)}
                    />
                    <button type='submit' className='border-2 border-primary-light bg-primary text-white p-2 rounded-md'>
                        CONTINUE
                    </button>
                </form>
                <p className="mt-6 text-base font-semibold text-navy flex items-center gap-1.5">
                    Lets the game begin <span>🎮</span>
                </p>
            </div>
        </div>
    )
}

export default Login;