// App.tsx
import React, { useState } from 'react';
import MainMenu, { GameType } from './components/MainMenu';
import Board from './components/Board';
import MyllyBoard from './components/MyllyBoard';
import MutkaMatoBoard from './components/MutkaMatoBoard';

const App: React.FC = () => {
    const [screen, setScreen] = useState<'menu' | 'game'>('menu');
    const [gameType, setGameType] = useState<GameType>('tic-tac-toe');

    const startGame = (selectedGame: GameType) => {
        setGameType(selectedGame);
        setScreen('game');
    };

    const handleGameOver = () => {
        setScreen('menu');
    };

    return (
        <div className="w-full h-screen">
            {screen === 'menu' && <MainMenu onStart={startGame} />}
            {screen === 'game' && (
                <>
                    {gameType === 'tic-tac-toe' && <Board onGameOver={handleGameOver} />}
                    {gameType === 'mylly' && <MyllyBoard onGameOver={handleGameOver} />}
                    {gameType === 'mutka-mato' && <MutkaMatoBoard onGameOver={handleGameOver} />}
                </>
            )}
        </div>
    );
};

export default App;
