import React from 'react';

interface MainMenuProps {
    onStart: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-100">
            <h1 className="text-5xl font-bold mb-8">Tic Tac Toe 5-in-a-Row</h1>
            <button
                onClick={onStart}
                className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
                Start Game
            </button>
        </div>
    );
};

export default MainMenu;
