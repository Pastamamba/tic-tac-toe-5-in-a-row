import React, { useState, useRef, useEffect, MouseEvent } from 'react';

type Player = 'blue' | 'red';

// Constants for the infinite board
const GRID_MIN = -20;
const GRID_MAX = 20;
const NUM_CELLS = GRID_MAX - GRID_MIN + 1;
const CELL_SIZE = 50; // pixels

const getKey = (x: number, y: number) => `${x},${y}`;

interface BoardProps {
    onGameOver: () => void;
}

const Board: React.FC<BoardProps> = ({ onGameOver }) => {
    const [moves, setMoves] = useState<Map<string, Player>>(new Map());
    const [currentPlayer, setCurrentPlayer] = useState<Player>('blue');
    const [winner, setWinner] = useState<Player | null>(null);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
    const isDraggingRef = useRef(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            panX: pan.x,
            panY: pan.y,
        };
        isDraggingRef.current = false;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragStartRef.current) return;
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;
        if (!isDraggingRef.current && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
            isDraggingRef.current = true;
        }
        if (isDraggingRef.current) {
            setPan({
                x: dragStartRef.current.panX + deltaX,
                y: dragStartRef.current.panY + deltaY,
            });
        }
    };

    const handleMouseUp = () => {
        dragStartRef.current = null;
    };

    const handleContainerClick = (e: MouseEvent<HTMLDivElement>) => {
        if (isDraggingRef.current) return;
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const adjustedX = clickX - pan.x;
        const adjustedY = clickY - pan.y;
        const cellX = GRID_MIN + Math.floor(adjustedX / CELL_SIZE);
        const cellY = GRID_MIN + Math.floor(adjustedY / CELL_SIZE);
        const key = getKey(cellX, cellY);
        if (moves.has(key) || winner) return;
        const newMoves = new Map(moves);
        newMoves.set(key, currentPlayer);
        setMoves(newMoves);
        if (checkWin(newMoves, cellX, cellY, currentPlayer)) {
            setWinner(currentPlayer);
        } else {
            setCurrentPlayer(currentPlayer === 'blue' ? 'red' : 'blue');
        }
    };

    const checkWin = (
        movesMap: Map<string, Player>,
        row: number,
        col: number,
        player: Player
    ): boolean => {
        const directions = [
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 1, dy: 1 },
            { dx: 1, dy: -1 }
        ];
        for (const { dx, dy } of directions) {
            let count = 1;
            count += countDirection(movesMap, row, col, dx, dy, player);
            count += countDirection(movesMap, row, col, -dx, -dy, player);
            if (count >= 5) return true;
        }
        return false;
    };

    const countDirection = (
        movesMap: Map<string, Player>,
        row: number,
        col: number,
        dx: number,
        dy: number,
        player: Player
    ): number => {
        let count = 0;
        let r = row + dx;
        let c = col + dy;
        while (movesMap.get(getKey(r, c)) === player) {
            count++;
            r += dx;
            c += dy;
        }
        return count;
    };

    useEffect(() => {
        if (winner) {
            const timer = setTimeout(() => {
                onGameOver();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [winner, onGameOver]);

    const cells = [];
    for (let x = GRID_MIN; x <= GRID_MAX; x++) {
        for (let y = GRID_MIN; y <= GRID_MAX; y++) {
            const key = getKey(x, y);
            const left = (x - GRID_MIN) * CELL_SIZE;
            const top = (y - GRID_MIN) * CELL_SIZE;
            const move = moves.get(key);
            let content = null;
            if (move === 'blue') {
                content = <span className="text-blue-500 text-2xl font-bold">✕</span>;
            } else if (move === 'red') {
                content = <span className="text-red-500 text-2xl font-bold">◯</span>;
            }
            cells.push(
                <div
                    key={key}
                    style={{
                        position: 'absolute',
                        left,
                        top,
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                    }}
                    className="border border-gray-300 flex items-center justify-center select-none"
                >
                    {content}
                </div>
            );
        }
    }

    const gridWidth = NUM_CELLS * CELL_SIZE;
    const gridHeight = NUM_CELLS * CELL_SIZE;

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden bg-gray-50"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleContainerClick}
        >
            <div
                style={{
                    width: gridWidth,
                    height: gridHeight,
                    position: 'absolute',
                    transform: `translate(${pan.x}px, ${pan.y}px)`,
                    userSelect: 'none',
                }}
            >
                {cells}
            </div>
            {winner && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-10">
                    <div className="bg-white p-6 rounded shadow-lg text-center">
                        <h2 className="text-3xl font-bold mb-4">
                            {winner === 'blue' ? (
                                <span className="text-blue-500">Blue (Cross) Wins!</span>
                            ) : (
                                <span className="text-red-500">Red (Circle) Wins!</span>
                            )}
                        </h2>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => {
                                    setMoves(new Map());
                                    setCurrentPlayer('blue');
                                    setWinner(null);
                                    setPan({ x: 0, y: 0 });
                                }}
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

export default Board;
