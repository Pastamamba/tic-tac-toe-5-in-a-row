import React, { useState } from 'react'
import MainMenu from './components/MainMenu'
import Board from './components/Board'

const App: React.FC = () => {
    // Manage which screen is active: "menu" or "game"
    const [screen, setScreen] = useState<'menu' | 'game'>('menu');

    const startGame = () => {
        setScreen('game');
    };

    const handleGameOver = () => {
        setScreen('menu');
    };

    return (
        <div className="w-full h-screen">
            {screen === 'menu' && <MainMenu onStart={startGame} />}
            {screen === 'game' && <Board onGameOver={handleGameOver} />}
        </div>
    );
};

export default App;
