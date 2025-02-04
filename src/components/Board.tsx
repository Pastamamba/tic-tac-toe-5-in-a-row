import React, { useState, useRef, useEffect, MouseEvent } from 'react';

type Player = 'blue' | 'red';

// These constants define the rendered grid and cell size.
const GRID_MIN = -20;
const GRID_MAX = 20;
const NUM_CELLS = GRID_MAX - GRID_MIN + 1;
const CELL_SIZE = 50; // in pixels

// Helper: get the unique key for a board coordinate.
const getKey = (x: number, y: number) => `${x},${y}`;

interface BoardProps {
    onGameOver: () => void;
}

const Board: React.FC<BoardProps> = ({ onGameOver }) => {
    // Store moves in a Map where keys are "x,y" and values are the player mark.
    const [moves, setMoves] = useState<Map<string, Player>>(new Map());
    const [currentPlayer, setCurrentPlayer] = useState<Player>('blue');
    const [winner, setWinner] = useState<Player | null>(null);

    // Pan offset (in pixels) for the grid container.
    const [pan, setPan] = useState({ x: 0, y: 0 });

    // Refs to track dragging state.
    const containerRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
    const isDraggingRef = useRef(false);

    // --- Panning Handlers ---
    const handleMouseDown = (e: React.MouseEvent) => {
        // Record the starting mouse position and current pan offset.
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
        // If movement exceeds a threshold, mark this as a drag.
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
        // Do nothing else here; cell clicks are handled in the container onClick.
    };

    // --- Click to Place Move ---
    const handleContainerClick = (e: MouseEvent<HTMLDivElement>) => {
        // If a drag occurred, do not treat this as a click.
        if (isDraggingRef.current) {
            return;
        }
        if (!containerRef.current) return;

        // Get container's bounding rectangle.
        const rect = containerRef.current.getBoundingClientRect();
        // Get click coordinates relative to the container.
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        // Adjust for the pan offset: the grid container is translated by pan.
        const adjustedX = clickX - pan.x;
        const adjustedY = clickY - pan.y;
        // Calculate board cell coordinates.
        // Our rendered grid starts at GRID_MIN (at position 0,0 in the grid container).
        const cellX = GRID_MIN + Math.floor(adjustedX / CELL_SIZE);
        const cellY = GRID_MIN + Math.floor(adjustedY / CELL_SIZE);
        const key = getKey(cellX, cellY);
        if (moves.has(key) || winner) {
            return;
        }
        // Record the move.
        const newMoves = new Map(moves);
        newMoves.set(key, currentPlayer);
        setMoves(newMoves);

        // Check for win.
        if (checkWin(newMoves, cellX, cellY, currentPlayer)) {
            setWinner(currentPlayer);
        } else {
            setCurrentPlayer(currentPlayer === 'blue' ? 'red' : 'blue');
        }
    };

    // --- Win Check Functions ---
    const checkWin = (movesMap: Map<string, Player>, x: number, y: number, player: Player): boolean => {
        // Check in four directions.
        const directions = [
            { dx: 1, dy: 0 },  // horizontal
            { dx: 0, dy: 1 },  // vertical
            { dx: 1, dy: 1 },  // diagonal down-right
            { dx: 1, dy: -1 }  // diagonal down-left
        ];

        for (const { dx, dy } of directions) {
            let count = 1;
            count += countDirection(movesMap, x, y, dx, dy, player);
            count += countDirection(movesMap, x, y, -dx, -dy, player);
            if (count >= 5) {
                return true;
            }
        }
        return false;
    };

    const countDirection = (
        movesMap: Map<string, Player>,
        x: number,
        y: number,
        dx: number,
        dy: number,
        player: Player
    ): number => {
        let count = 0;
        let currX = x + dx;
        let currY = y + dy;
        while (movesMap.get(getKey(currX, currY)) === player) {
            count++;
            currX += dx;
            currY += dy;
        }
        return count;
    };

    // --- Reset / Play Again Handler ---
    const handlePlayAgain = () => {
        setMoves(new Map());
        setCurrentPlayer('blue');
        setWinner(null);
        setPan({ x: 0, y: 0 });
    };

    // --- Render the Grid Cells ---
    // We pre-calculate the grid dimensions.
    const gridWidth = NUM_CELLS * CELL_SIZE;
    const gridHeight = NUM_CELLS * CELL_SIZE;
    // Render cells from GRID_MIN to GRID_MAX (both x and y).
    const cells = [];
    for (let x = GRID_MIN; x <= GRID_MAX; x++) {
        for (let y = GRID_MIN; y <= GRID_MAX; y++) {
            const key = getKey(x, y);
            // Calculate the position within the grid container.
            const left = (x - GRID_MIN) * CELL_SIZE;
            const top = (y - GRID_MIN) * CELL_SIZE;
            // Determine if a move has been played here.
            const move = moves.get(key);
            let content = null;
            if (move === 'blue') {
                content = <span className="text-blue-500 text-xl font-bold">✕</span>;
            } else if (move === 'red') {
                content = <span className="text-red-500 text-xl font-bold">◯</span>;
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

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden bg-gray-50"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleContainerClick}
        >
            {/* The grid container with pan translation */}
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

            {/* Winner Overlay */}
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

export default Board;
