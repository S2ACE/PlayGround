import Header from "./Header";
import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import { getRandomWord } from "../../utils";
import Keyboard from "./Keyboard";
import GuessTile from "./GuessTile";
import ConfettiContainer from "./ConfettiContainer";
import confettiUrl from '../../assets/confetti.svg';
import NewGameButton from "./NewGameButton";
import { getAllVocabulary, type Vocabulary } from "../../api/vocabulary";


const AssemblyEndgame = () => {
    // State variables
    const [vocabList, setVocabList] = useState<Vocabulary[]>([]);
    const [currentWord, setCurrentWord] = useState<string>('');
    const [guessedLetters, setGuessedLetters] = useState<string[]>([]); //letters guessed by the user
    const [showConfetti, setShowConfetti] = useState<boolean>(true);    //show confetti on game win
    const [isReady, setIsReady] = useState(false); //game is ready to play

    useEffect(() => {
        async function fetchAndPick() {
            try {
                const list = await getAllVocabulary('en');
                setVocabList(list);
                if (list.length > 0) {
                    const word = getRandomWord(list);
                    setCurrentWord(word);
                    setIsReady(true);
                }
            } catch (error) {
                console.error("Fetch failed:", error);
            }
        }
        fetchAndPick();
    }, []);
    //Derived variables
    const maxLives: number = getLives(currentWord);
    const wrongGuesses: number = guessedLetters.filter((letter: string): boolean => !currentWord.includes(letter)).length;
    const livesLeft: number = maxLives - wrongGuesses;
    const isGameWon: boolean = currentWord.split("").every((letter: string): boolean => guessedLetters.includes(letter));
    const isGameLost: boolean = wrongGuesses >= maxLives;
    const isGameOver: boolean = isGameWon || isGameLost;

    function addGuessedLetter(letter: string): void {
        setGuessedLetters((prevLetters:string[]): string[] =>
            prevLetters.includes(letter) ?
                prevLetters :
                [...prevLetters, letter]
        );
    }

    function startNewGame(): void {
        setCurrentWord(getRandomWord(vocabList));
        setGuessedLetters([]);
    }

    function getLives(word: string): number {
        const baseLives = 5;
        const bonus = Math.floor(word.length / 3);
        return baseLives + bonus;
    }

    if (!isReady) {
        return null;
    }
    return (
        <Box
            sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                my: 4,
                mx: 'auto',
                maxWidth: '100%',
                width: '100%',
                gap:2,
            }}
        >
            {showConfetti && <ConfettiContainer isGameWon={ isGameWon }/>}
            <Box
                onClick={() => setShowConfetti(prevShowConfetti => !prevShowConfetti)}
                sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    right: 0, 
                    cursor: 'pointer', 
                }}
            >         
                <img
                    src={confettiUrl}
                    alt="Confetti Icon"
                    style={{                                       
                        top: 0,
                        right: 0,
                        width: 25,
                        height: 25,
                        filter: showConfetti ? 'none' : 'grayscale(100%)',
                    }}
                />
            </Box>  
            <Header 
                maxLives={maxLives}
                livesLeft={livesLeft}
            />
            <GuessTile
                currentWord={currentWord}
                guessedLetters={guessedLetters}
                isGameLost={isGameLost}
            />
            <Keyboard 
                guessedLetters={guessedLetters}
                currentWord={currentWord}
                isGameOver={isGameOver}
                addGuessedLetter={addGuessedLetter}
            />
            <NewGameButton 
                isGameOver={isGameOver}
                startNewGame={startNewGame}
            />

        </Box>
    );
};

export default AssemblyEndgame;