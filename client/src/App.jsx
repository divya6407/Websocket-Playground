import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { socket } from './socket';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Createroom from './pages/Createroom.jsx';
import Joinroom from './pages/Joinroom.jsx';
import Rps from './pages/Rps.jsx';
import Guess from './pages/Guess.jsx'
import Typing from './pages/Typing.jsx'
import TypingInstructions from './pages/TypingInstructions.jsx'
import SelectGame from './pages/SelectGame.jsx';
import TypingDifficulty from './pages/TypingDifficulty.jsx';
import Waiting from './pages/Waiting.jsx';

function App() {
  useEffect(() => {
    socket.connect();
    socket.emit("hello-server", "Hello Server");
    socket.on("hello-client", (message) => {
      console.log(message);
    });
    return () => {
      socket.off('hello-client');
      socket.disconnect();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/' element={<Login />} />
        <Route path='/home' element={<Home/>}/>
        <Route path='/createroom' element={<Createroom/>}/>
        <Route path='/joinroom' element={<Joinroom/>}/>
        <Route path='/rps/:id' element={<Rps/>}/>
        <Route path='/guess/:id' element={<Guess />} />
        <Route path='/typing/:id/:difficulty' element={<Typing />} />
        <Route path='/typing/:id/instructions' element={<TypingInstructions/>} />
        <Route path='/select-game' element={<SelectGame />} />
        <Route path='/typing-difficulty' element={<TypingDifficulty />} />
        <Route path='/waiting' element={<Waiting />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
