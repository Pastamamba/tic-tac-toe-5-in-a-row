import React, { useState, useEffect } from 'react';

type Player = 'blue' | 'red';
const BOARD_SIZE = 15;

interface BoardProps {
    onGameOver: () => void;
}

const Board: React.FC<BoardProps> = ({ onGameOver }) => {
    // Create a 15x15 board filled with null values
    const emptyBoard: (Player | null)[][] = Array.from({ length: BOARD_SIZE }, () =>
        Array(BOARD_SIZE).fill(null)
    );
    const [board, setBoard] = useState<(Player | null)[][]>(emptyBoard);
    const [currentPlayer, setCurrentPlayer] = useState<Player>('blue');
    const [winner, setWinner] = useState<Player | null>(null);

    const handleCellClick = (row: number, col: number) => {
        // If the game is over or the cell is occupied, do nothing
        if (winner || board[row][col] !== null) return;

        // Create a new board state with the current move
        const newBoard = board.map((rowArr) => rowArr.slice());
        newBoard[row][col] = currentPlayer;
        setBoard(newBoard);

        // Check if the move wins the game
        if (checkWin(newBoard, row, col, currentPlayer)) {
            setWinner(currentPlayer);
        } else {
            // Switch players
            setCurrentPlayer(currentPlayer === 'blue' ? 'red' : 'blue');
        }
    };

    // Check for win condition by scanning in four directions
    const checkWin = (
        board: (Player | null)[][],
        row: number,
        col: number,
        player: Player
    ): boolean => {
        const directions = [
            { dx: 0, dy: 1 },  // horizontal
            { dx: 1, dy: 0 },  // vertical
            { dx: 1, dy: 1 },  // diagonal down-right
            { dx: 1, dy: -1 }  // diagonal down-left
        ];

        for (const { dx, dy } of directions) {
            let count = 1;
            count += countDirection(board, row, col, dx, dy, player);
            count += countDirection(board, row, col, -dx, -dy, player);
            if (count >= 5) {
                return true;
            }
        }
        return false;
    };

    const countDirection = (
        board: (Player | null)[][],
        row: number,
        col: number,
        dx: number,
        dy: number,
        player: Player
    ): number => {
        let count = 0;
        let r = row + dx;
        let c = col + dy;
        while (
            r >= 0 &&
            r < BOARD_SIZE &&
            c >= 0 &&
            c < BOARD_SIZE &&
            board[r][c] === player
            ) {
            count++;
            r += dx;
            c += dy;
        }
        return count;
    };

    // When a winner is set, wait 3 seconds then return to the main menu.
    useEffect(() => {
        if (winner) {
            const timer = setTimeout(() => {
                onGameOver();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [winner, onGameOver]);

    // Render a single cell
    const renderCell = (row: number, col: number) => {
        const cellValue = board[row][col];
        let content = null;
        if (cellValue === 'blue') {
            content = <span className="text-blue-500 text-2xl font-bold">✕</span>;
        } else if (cellValue === 'red') {
            content = <span className="text-red-500 text-2xl font-bold">◯</span>;
        }

        return (
            <div
                key={`${row}-${col}`}
                onClick={() => handleCellClick(row, col)}
                className="border border-gray-300 flex items-center justify-center cursor-pointer"
            >
                {content}
            </div>
        );
    };

    return (
        <div className="relative w-full h-full">
            {/* Winner Overlay */}
            {winner && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                    <div className="bg-white p-6 rounded shadow-lg text-center">
                        <h2 className="text-3xl font-bold mb-4">
                            {winner === 'blue' ? (
                                <span className="text-blue-500">Blue (Cross) Wins!</span>
                            ) : (
                                <span className="text-red-500">Red (Circle) Wins!</span>
                            )}
                        </h2>
                        <p>Returning to main menu...</p>
                    </div>
                </div>
            )}
            {/* Game Board */}
            <div
                className="grid w-full h-full"
                style={{
                    gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`
                }}
            >
                {board.map((rowArray, rowIndex) =>
                    rowArray.map((_, colIndex) => renderCell(rowIndex, colIndex))
                )}
            </div>
        </div>
    );
};

export default Board;
