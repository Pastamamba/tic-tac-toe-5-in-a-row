import React, { useState } from 'react';

type Player = 'blue' | 'red';

interface MyllyBoardProps {
    onGameOver: () => void;
}

interface Position {
    id: number;
    x: number; // Ristikko-koordinaatti (kerrotaan cellSizella piirtämistä varten)
    y: number;
}

// 24 risteyskohtaa (vastaavat standardia Nine Men's Morris -lautaa).
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

// Kaikki mylly-kombinaatiot (kolme risteyskohtaa, joissa on sama pelaaja).
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

// Apu: mitkä risteyskohdat ovat yhteydessä toisiinsa.
const ADJACENT: number[][] = [
    [1, 9],        // 0
    [0, 2, 4],     // 1
    [1, 14],       // 2
    [4, 10],       // 3
    [1, 3, 5, 7],  // 4
    [4, 13],       // 5
    [7, 11],       // 6
    [4, 6, 8],     // 7
    [7, 12],       // 8
    [0, 10, 21],   // 9
    [3, 9, 11, 18],// 10
    [6, 10, 15],   // 11
    [8, 13, 17],   // 12
    [5, 12, 14, 20],//13
    [2, 13, 23],   // 14
    [11, 16],      // 15
    [15, 17, 19],  // 16
    [12, 16, 20],  // 17
    [10, 19],      // 18
    [16, 18, 20, 22], // 19
    [13, 17, 19],  // 20
    [9, 22],       // 21
    [19, 21, 23],  // 22
    [14, 22],      // 23
];

const cellSize = 60; // pikseliä yhtä "ruutua" kohti

const MyllyBoard: React.FC<MyllyBoardProps> = ({ onGameOver }) => {
    // Laudan tila: jokainen indeksi edustaa yhtä 24:stä risteyskohdasta, arvo = 'blue', 'red' tai null
    const [board, setBoard] = useState<(Player | null)[]>(Array(24).fill(null));
    // Kumpi pelaaja on vuorossa
    const [currentPlayer, setCurrentPlayer] = useState<Player>('blue');
    // Montako nappulaa on jo asetettu laudalle (per pelaaja)
    const [placedCount, setPlacedCount] = useState<{ [key in Player]: number }>({
        blue: 0,
        red: 0,
    });
    // Montako nappulaa kullakin pelaajalla on laudalla (poistoja varten)
    const [piecesOnBoard, setPiecesOnBoard] = useState<{ [key in Player]: number }>({
        blue: 0,
        red: 0,
    });
    // Onko pelaajan poistettava vastustajan nappula? (jos mylly muodostui)
    const [mustRemove, setMustRemove] = useState<boolean>(false);
    // Valittu nappula siirtovaiheessa
    const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
    // Peli päättynyt ja voittaja
    const [winner, setWinner] = useState<Player | null>(null);

    // Palauttaa true, jos annettu nappula (boardIndex) kuuluu johonkin myllyyn (käytetään kun estetään poistamasta nappulaa, jos on muita vaihtoehtoja).
    const isPartOfMill = (boardState: (Player | null)[], index: number): boolean => {
        const player = boardState[index];
        if (!player) return false;
        // Käy läpi kaikki myllyt, joissa index on mukana
        const possibleMills = MILLS.filter(mill => mill.includes(index));
        for (const mill of possibleMills) {
            if (mill.every(pos => boardState[pos] === player)) {
                return true;
            }
        }
        return false;
    };

    // Tarkistaa, muodostuuko uudella siirrolla mylly (käy vain ne myllyt, jotka sisältävät positionin).
    const formsNewMill = (
        boardState: (Player | null)[],
        position: number,
        player: Player
    ): boolean => {
        // Suodatus: katsotaan vain mylly-yhdistelmät, joissa 'position' on mukana
        const relevantMills = MILLS.filter(mill => mill.includes(position));
        // Palauttaa true, jos jokin niistä on kokonaan saman pelaajan nappuloita
        return relevantMills.some(mill => mill.every(idx => boardState[idx] === player));
    };

    // Yrittää poistaa nappulan idx. Palauttaa true, jos onnistui
    const tryRemovePiece = (idx: number): boolean => {
        if (board[idx] === null) return false;
        const opponent = board[idx] as Player;
        if (opponent === currentPlayer) return false; // ei voi poistaa omaa nappulaa

        // Tarkista, saako nappulan poistaa:
        // - Ensisijaisesti pitää poistaa nappula, joka ei ole myllyssä (jos sellainen löytyy)
        // - Jos vastustajan kaikki nappulat ovat myllyissä, saa poistaa myllyssä olevan
        const opponentPieces = board
            .map((val, i) => (val === opponent ? i : null))
            .filter((v) => v !== null) as number[];

        // Onko yhtään vapaan myllyn ulkopuolista nappulaa?
        const nonMillPieces = opponentPieces.filter(i => !isPartOfMill(board, i));
        // Jos valittu idx on myllyssä, varmistetaan että ei ole muita kuin mylly-nappuloita
        const clickedPieceInMill = isPartOfMill(board, idx);

        if (clickedPieceInMill && nonMillPieces.length > 0) {
            // Yritetään poistaa myllyssä olevaa nappulaa, vaikka muita nappuloita on
            return false;
        }

        // Kaikki ok, poistetaan nappula
        const newBoard = [...board];
        newBoard[idx] = null;
        setBoard(newBoard);

        // Päivitä laskurit
        setPiecesOnBoard(prev => ({
            ...prev,
            [opponent]: prev[opponent] - 1,
        }));

        // Tarkista, johtaako poisto voittoon (vastustajan nappuloita < 3)
        if (piecesOnBoard[opponent] - 1 < 3) {
            setWinner(currentPlayer);
        }

        return true;
    };

    // Palauttaa true, jos pelaaja ei voi tehdä yhtään laillista siirtoa
    // (Kun kaikki nappulat on asetettu, eikä ole vain 3 kappaletta → ei voi lentää).
    const playerHasNoMoves = (player: Player, boardState: (Player | null)[]): boolean => {
        // Jos pelaajalla on 3 tai vähemmän nappuloita, hän voi hypätä mihin tahansa tyhjään
        // ja sitä kautta hänellä on aina siirtomahdollisuus, jos laudalla on yksikin vapaa ruutu.
        // (Poikkeuksena: jos ei ole tilaa vapaana, mutta se on harvinainen tilanne.)
        if (piecesOnBoard[player] === 3) {
            // Jos yksikin tyhjä ruutu löytyy, pelaajalla on siirto
            return !boardState.some(pos => pos === null);
        }

        // Muussa tapauksessa tarkistetaan, onko jokaiselle pelaajan nappulalle adjacency-luettelossa vapaita kohtia
        // Jos yhdellekin nappulalle löytyy vapaa viereinen kohta, siirtoja on.
        for (let i = 0; i < boardState.length; i++) {
            if (boardState[i] === player) {
                // katso viereiset
                for (const adj of ADJACENT[i]) {
                    if (boardState[adj] === null) {
                        return false; // löytyi siirto
                    }
                }
            }
        }
        return true;
    };

    // Klikkaustapahtuman käsittely
    const handlePositionClick = (id: number) => {
        if (winner) return;

        // Jos meidän on poistettava vastustajan nappula:
        if (mustRemove) {
            if (tryRemovePiece(id)) {
                // Poisto onnistui, lopetetaan remove-tila
                setMustRemove(false);
                // Tarkista vielä, onko vastustaja jo hävinnyt (esim. nappuloita < 3)
                if (!winner) {
                    // Vaihdetaan vuoro
                    endTurn();
                }
            }
            return;
        }

        // OLLAAN JOKO ASETTELU- TAI SIIRTO/ HYPPI-VAIHEESSA

        // 1) Asetteluvaihe: jos tämä pelaaja ei ole vielä laittanut 9 nappulaa laudalle
        if (placedCount[currentPlayer] < 9) {
            // Yritetään asettaa nappulaa
            if (board[id] !== null) return; // ruutu ei ole tyhjä
            const newBoard = [...board];
            newBoard[id] = currentPlayer;
            setBoard(newBoard);

            // Päivitä laskurit
            setPlacedCount(prev => ({
                ...prev,
                [currentPlayer]: prev[currentPlayer] + 1,
            }));
            setPiecesOnBoard(prev => ({
                ...prev,
                [currentPlayer]: prev[currentPlayer] + 1,
            }));

            // Tarkista mylly
            if (formsNewMill(newBoard, id, currentPlayer)) {
                setMustRemove(true); // pelaaja poistaa vastustajan nappulan
            } else {
                endTurn();
            }
        }
        // 2) Siirtovaihe / Hyppimisvaihe
        else {
            // Onko jo valittu nappula siirtoon?
            if (selectedPiece === null) {
                // Yritetään valita oma nappula
                if (board[id] === currentPlayer) {
                    setSelectedPiece(id);
                }
            } else {
                // Yritetään siirtää jo valittua nappulaa
                const from = selectedPiece;
                const to = id;

                // Jos sama ruutu, perutaan valinta
                if (from === to) {
                    setSelectedPiece(null);
                    return;
                }

                // Tarkistetaan, onko siirto laillinen
                // 1) Kohde on tyhjä
                if (board[to] !== null) {
                    return;
                }
                // 2) Jos pelaajalla > 3 nappulaa, siirron täytyy olla ADJACENT-listalla
                //    Jos pelaajalla on 3 nappulaa, voi siirtää minne tahansa tyhjään.
                const canFly = (piecesOnBoard[currentPlayer] === 3);
                if (!canFly && !ADJACENT[from].includes(to)) {
                    return; // ei sallittu siirto
                }

                // Suoritetaan siirto
                const newBoard = [...board];
                newBoard[from] = null;
                newBoard[to] = currentPlayer;
                setBoard(newBoard);
                setSelectedPiece(null);

                // Tarkista, syntyykö mylly
                if (formsNewMill(newBoard, to, currentPlayer)) {
                    setMustRemove(true);
                } else {
                    endTurn();
                }
            }
        }
    };

    // Vuoron vaihdon lopussa tarkistetaan, voiko vastustaja liikkua.
    // Jos vastustajalla on vain 2 nappulaa tai ei lainkaan laillisia siirtoja, peli päättyy.
    const endTurn = () => {
        const nextPlayer = currentPlayer === 'blue' ? 'red' : 'blue';

        // Jos nextPlayer ei ole vielä saanut 9 nappulaa laudalle,
        // hän ei ole "siirtovaiheessa", joten ei kannata tarkistaa siirtojen puuttumista.
        const nextPlayerStillPlacing = (placedCount[nextPlayer] < 9);

        if (!nextPlayerStillPlacing) {
            // Vasta kun nextPlayer on lopettanut asettelun (tai esim. on 3 nappulaa -> lentovaihe)
            // voimme turvallisesti katsoa, pystyykö hän siirtymään.
            if (playerHasNoMoves(nextPlayer, board)) {
                setWinner(currentPlayer);
                return;
            }
        }

        // Muuten vain jatketaan peliä
        setCurrentPlayer(nextPlayer);
    };

    // Uusi peli
    const handlePlayAgain = () => {
        setBoard(Array(24).fill(null));
        setCurrentPlayer('blue');
        setWinner(null);
        setMustRemove(false);
        setSelectedPiece(null);
        setPlacedCount({ blue: 0, red: 0 });
        setPiecesOnBoard({ blue: 0, red: 0 });
    };

    // Lasketaan laudan pikselikoko
    const boardWidth = 7 * cellSize;
    const boardHeight = 7 * cellSize;

    return (
        <div className="relative w-full h-full bg-green-100 flex flex-col items-center justify-center">
            <div
                className="relative bg-white border border-gray-400"
                style={{ width: boardWidth, height: boardHeight }}
            >
                {positions.map((pos) => {
                    const left = pos.x * cellSize;
                    const top = pos.y * cellSize;
                    const isSelected = selectedPiece === pos.id;
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
                                backgroundColor: isSelected ? '#ffeeba' : 'transparent',
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

            {/* Viesti pelaajille */}
            {!winner ? (
                <div className="mt-4 text-lg">
                    {mustRemove ? (
                        <p>
              <span className={currentPlayer === 'blue' ? 'text-blue-500' : 'text-red-500'}>
                {currentPlayer}
              </span>{' '}
                            muodostit myllyn – valitse vastustajan nappula poistettavaksi!
                        </p>
                    ) : (
                        <p>
                            Vuoro: <span className={currentPlayer === 'blue' ? 'text-blue-500' : 'text-red-500'}>
                {currentPlayer}
              </span>
                        </p>
                    )}
                </div>
            ) : (
                <div className="mt-4 text-2xl font-bold">
                    {winner === 'blue' ? (
                        <span className="text-blue-500">Blue Wins!</span>
                    ) : (
                        <span className="text-red-500">Red Wins!</span>
                    )}
                </div>
            )}

            {/* Lopetustekstien modali */}
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
