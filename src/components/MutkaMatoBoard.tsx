// MutkaMatoBoard.tsx
import React, { useRef, useEffect, useState } from 'react';

interface MutkaMatoBoardProps {
    onGameOver: () => void;
}

interface Point {
    x: number;
    y: number;
}

// Apufunktio etäisyyden laskemiseen kahden pisteen välillä.
function distance(p1: Point, p2: Point): number {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

// Laskee etäisyyden pisteestä P viivasegmenttiin, jonka päät ovat A ja B.
function pointToSegmentDistance(P: Point, A: Point, B: Point): number {
    const AB = { x: B.x - A.x, y: B.y - A.y };
    const AP = { x: P.x - A.x, y: P.y - A.y };
    const ab2 = AB.x * AB.x + AB.y * AB.y;
    let t = ab2 === 0 ? 0 : (AP.x * AB.x + AP.y * AB.y) / ab2;
    t = Math.max(0, Math.min(1, t));
    const projection = { x: A.x + t * AB.x, y: A.y + t * AB.y };
    return distance(P, projection);
}

const MutkaMatoBoard: React.FC<MutkaMatoBoardProps> = ({ onGameOver }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameOver, setGameOver] = useState(false);
    const animationRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(performance.now());

    // Asetukset: kääntymisnopeus ja kasvunopeus (pikseleinä sekunnissa).
    const TURN_RATE = 2; // radiaania sekunnissa
    const GROWTH_RATE = 20; // pikseliä sekunnissa

    // Madon tila. Huomaa, että tallennamme myös "length"–arvon, joka määrittää piirrettävän polun pituuden.
    const snakeRef = useRef({
        x: 400,
        y: 300,
        angle: 0,
        speed: 100, // pikseliä sekunnissa
        length: 50, // aloituspituus (pikseleinä)
        body: [{ x: 400, y: 300 }] as Point[],
    });

    // Näppäinten tilan tallennus kääntymistä varten.
    const turningLeftRef = useRef(false);
    const turningRightRef = useRef(false);

    const animate = (timestamp: number) => {
        const dt = (timestamp - lastTimeRef.current) / 1000;
        lastTimeRef.current = timestamp;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Päivitetään kulman muutos näppäimistösyötteen perusteella.
        let turning = 0;
        if (turningLeftRef.current) turning -= 1;
        if (turningRightRef.current) turning += 1;
        snakeRef.current.angle += turning * TURN_RATE * dt;

        // Päivitetään madon pään sijainti.
        snakeRef.current.x += Math.cos(snakeRef.current.angle) * snakeRef.current.speed * dt;
        snakeRef.current.y += Math.sin(snakeRef.current.angle) * snakeRef.current.speed * dt;

        // Kasvatetaan madon pituutta ajan myötä.
        snakeRef.current.length += GROWTH_RATE * dt;

        // Lisätään uusi pään sijainti madon "historiaan".
        snakeRef.current.body.push({ x: snakeRef.current.x, y: snakeRef.current.y });

        // Tyhjennetään canvas.
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Lasketaan piirrettävä madon polku niin, että sen kokonaispituus on snakeRef.current.length.
        const fullBody = snakeRef.current.body;
        let displayedPoints: Point[] = [];
        let remaining = snakeRef.current.length;
        // Aloitetaan pään kohdasta (taulukon viimeinen alkio) ja kuljetaan taaksepäin.
        displayedPoints.push(fullBody[fullBody.length - 1]);
        for (let i = fullBody.length - 1; i > 0; i--) {
            const currentPoint = fullBody[i];
            const prevPoint = fullBody[i - 1];
            const segDist = distance(currentPoint, prevPoint);
            if (segDist < remaining) {
                displayedPoints.push(prevPoint);
                remaining -= segDist;
            } else {
                // Lasketaan lineaarisesti se piste, jossa jäljellä oleva matka loppuu.
                const t = segDist === 0 ? 0 : remaining / segDist;
                const interpPoint = {
                    x: currentPoint.x + t * (prevPoint.x - currentPoint.x),
                    y: currentPoint.y + t * (prevPoint.y - currentPoint.y),
                };
                displayedPoints.push(interpPoint);
                break;
            }
        }
        // Käännetään taulukko, jotta pisteet menevät häntästä päähän.
        displayedPoints.reverse();

        // Piirretään madon viiva.
        ctx.beginPath();
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'green';
        if (displayedPoints.length > 0) {
            ctx.moveTo(displayedPoints[0].x, displayedPoints[0].y);
            for (let i = 1; i < displayedPoints.length; i++) {
                ctx.lineTo(displayedPoints[i].x, displayedPoints[i].y);
            }
            ctx.stroke();
        }

        // Tarkistetaan törmäys reunojen kanssa.
        if (
            snakeRef.current.x < 0 ||
            snakeRef.current.x > canvas.width ||
            snakeRef.current.y < 0 ||
            snakeRef.current.y > canvas.height
        ) {
            setGameOver(true);
        }

        // Tarkistetaan törmäys itseensä.
        // Ohitetaan madon pään läheiset segmentit, jotta suora jatkumo ei aiheuta virheellistä törmäystä.
        const safeSegmentCount = 5; // ohitetaan viimeiset 5 segmenttiä
        const headPoint = displayedPoints[displayedPoints.length - 1];
        for (let i = 0; i < Math.max(0, displayedPoints.length - safeSegmentCount); i++) {
            const A = displayedPoints[i];
            const B = displayedPoints[i + 1];
            if (pointToSegmentDistance(headPoint, A, B) < ctx.lineWidth / 2) {
                setGameOver(true);
                break;
            }
        }

        // Jos peli loppui, ei jatketa animaatiota.
        if (gameOver) {
            return;
        }

        animationRef.current = requestAnimationFrame(animate);
    };

    // Rekisteröidään näppäimistötapahtumat.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') turningLeftRef.current = true;
            if (e.key === 'ArrowRight') turningRightRef.current = true;
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') turningLeftRef.current = false;
            if (e.key === 'ArrowRight') turningRightRef.current = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Käynnistetään animaatio.
    useEffect(() => {
        lastTimeRef.current = performance.now();
        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [gameOver]);

    // "Play Again" –napin toiminto: palautetaan madon tila alkuarvoihin.
    const restartGame = () => {
        snakeRef.current = {
            x: 400,
            y: 300,
            angle: 0,
            speed: 100,
            length: 50,
            body: [{ x: 400, y: 300 }],
        };
        setGameOver(false);
        lastTimeRef.current = performance.now();
        animationRef.current = requestAnimationFrame(animate);
    };

    // (Esimerkin mukaan voi automaattisesti palata päävalikkoon, jos peli loppuu)
    useEffect(() => {
        if (gameOver) {
            // setTimeout(() => onGameOver(), 2000);
        }
    }, [gameOver, onGameOver]);

    return (
        <div className="relative w-full h-full bg-gray-200 flex items-center justify-center">
            <canvas ref={canvasRef} width={800} height={600} className="border border-gray-500" />
            {gameOver && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-10">
                    <div className="bg-white p-6 rounded shadow-lg text-center">
                        <h2 className="text-3xl font-bold mb-4">Game Over</h2>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={restartGame}
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

export default MutkaMatoBoard;
