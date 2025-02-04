import React, { useState } from 'react';

type Player = 'blue' | 'red';

interface MyllyBoardProps {
    onGameOver: () => void;
}

interface Position {
    id: number;
    x: number; // grid coordinate (multiplied by cellSize for rendering)
    y: number;
}

// These positions represent the 24 valid points on a Nine Men's Morris board.
const positions: Position[] = [
    { id: 0, x: 0, y: 0 },
    { id: 1, x: 3, y: 0 },
    { id: 2, x: 6, y: 0 },
    { id: 3, x: 1, y: 1 },
    { id: 4, x: 3, y: 1 },
    { id: 5, x: 5, y: 1 },
    { id: 6, x: 2, y: 2 },
    { id: 7, x: 3, y: 2 },
    { id: 8, x: 4, y: 2 },
    { id: 9, x: 0, y: 3 },
    { id: 10, x: 1, y: 3 },
    { id: 11, x: 2, y: 3 },
    { id: 12, x: 4, y: 3 },
    { id: 13, x: 5, y: 3 },
    { id: 14, x: 6, y: 3 },
    { id: 15, x: 2, y: 4 },
    { id: 16, x: 3, y: 4 },
    { id: 17, x: 4, y: 4 },
    { id: 18, x: 1, y: 5 },
    { id: 19, x: 3, y: 5 },
    { id: 20, x: 5, y: 5 },
    { id: 21, x: 0, y: 6 },
    { id: 22, x: 3, y: 6 },
    { id: 23, x: 6, y: 6 },
];

// Winning mill combinations (each is a set of three position IDs).
const MILLS: number[][] = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [9, 10, 11],
    [12, 13, 14],
    [15, 16, 17],
    [18, 19, 20],
    [21, 22, 23],
    [0, 9, 21],
    [3, 10, 18],
    [6, 11, 15],
    [1, 4, 7],
    [16, 19, 22],
    [8, 12, 17],
    [5, 13, 20],
    [2, 14, 23],
];

const cellSize = 60; // pixels

const MyllyBoard: React.FC<MyllyBoardProps> = ({ onGameOver }) => {
    // Board state: index corresponds to a position's id.
    const [board, setBoard] = useState<(Player | null)[]>(Array(24).fill(null));
    const [currentPlayer, setCurrentPlayer] = useState<Player>('blue');
    const [winner, setWinner] = useState<Player | null>(null);
    // Track pieces placed for each player (max 9 per player in the placement phase)
    const [placedCount, setPlacedCount] = useState<{ blue: number; red: number }>({
        blue: 0,
        red: 0,
    });

    const handlePositionClick = (id: number) => {
        if (winner) return;
        if (board[id] !== null) return;
        if (placedCount[currentPlayer] >= 9) return;

        const newBoard = board.slice();
        newBoard[id] = currentPlayer;
        setBoard(newBoard);
        setPlacedCount({
            ...placedCount,
            [currentPlayer]: placedCount[currentPlayer] + 1,
        });

        // Check if the current move forms a mill.
        if (checkMill(newBoard, currentPlayer)) {
            setWinner(currentPlayer);
        } else {
            setCurrentPlayer(currentPlayer === 'blue' ? 'red' : 'blue');
        }
    };

    const checkMill = (board: (Player | null)[], player: Player): boolean => {
        return MILLS.some(mill => mill.every(index => board[index] === player));
    };

    const handlePlayAgain = () => {
        setBoard(Array(24).fill(null));
        setPlacedCount({ blue: 0, red: 0 });
        setCurrentPlayer('blue');
        setWinner(null);
    };

    // Calculate the board's pixel dimensions.
    const boardWidth = 7 * cellSize;
    const boardHeight = 7 * cellSize;

    return (
        <div className="relative w-full h-full bg-green-100 flex flex-col items-center justify-center">
            <div
                className="relative bg-white border border-gray-400"
                style={{ width: boardWidth, height: boardHeight }}
            >
                {positions.map(pos => {
                    const left = pos.x * cellSize;
                    const top = pos.y * cellSize;
                    return (
                        <div
                            key={pos.id}
                            onClick={() => handlePositionClick(pos.id)}
                            style={{
                                position: 'absolute',
                                left,
                                top,
                                width: cellSize,
                                height: cellSize,
                            }}
                            className="border border-gray-200 flex items-center justify-center cursor-pointer"
                        >
                            {board[pos.id] === 'blue' && (
                                <span className="text-blue-500 text-xl font-bold">●</span>
                            )}
                            {board[pos.id] === 'red' && (
                                <span className="text-red-500 text-xl font-bold">●</span>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="mt-4">
                {!winner ? (
                    <p className="text-lg">
                        {currentPlayer === 'blue' ? (
                            <span className="text-blue-500">Blue's turn</span>
                        ) : (
                            <span className="text-red-500">Red's turn</span>
                        )}
                    </p>
                ) : (
                    <p className="text-2xl font-bold">
                        {winner === 'blue' ? (
                            <span className="text-blue-500">Blue Wins!</span>
                        ) : (
                            <span className="text-red-500">Red Wins!</span>
                        )}
                    </p>
                )}
            </div>
            {winner && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-10">
                    <div className="bg-white p-6 rounded shadow-lg text-center">
                        <h2 className="text-3xl font-bold mb-4">
                            {winner === 'blue' ? (
                                <span className="text-blue-500">Blue Wins!</span>
                            ) : (
                                <span className="text-red-500">Red Wins!</span>
                            )}
                        </h2>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={handlePlayAgain}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                            >
                                Play Again
                            </button>
                            <button
                                onClick={onGameOver}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                            >
                                Return to Main Menu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyllyBoard;
