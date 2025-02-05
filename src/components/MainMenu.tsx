// MainMenu.tsx
import React, { useState } from 'react';

export type GameType = 'tic-tac-toe' | 'mylly' | 'mutka-mato';

interface MainMenuProps {
    onStart: (game: GameType) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart }) => {
    const [selectedGame, setSelectedGame] = useState<GameType>('tic-tac-toe');

    return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-100">
            <h1 className="text-5xl font-bold mb-8">Game Hub</h1>
            <div className="mb-4">
                <label htmlFor="game-select" className="mr-2 text-lg">
                    Select Game:
                </label>
                <select
                    id="game-select"
                    value={selectedGame}
                    onChange={(e) => setSelectedGame(e.target.value as GameType)}
                    className="px-4 py-2 border border-gray-300 rounded"
                >
                    <option value="tic-tac-toe">Tic Tac Toe 5-in-a-Row</option>
                    <option value="mylly">Mylly (Nine Men's Morris)</option>
                    <option value="mutka-mato">MutkaMato</option>
                </select>
            </div>
            <button
                onClick={() => onStart(selectedGame)}
                className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
                Play
            </button>
        </div>
    );
};

export default MainMenu;
