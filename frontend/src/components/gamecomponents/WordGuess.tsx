import Header from "./Header";
import { Box } from "@mui/material";
import { useEffect, useState, useMemo, useCallback } from "react";
import Keyboard from "./Keyboard";
import GuessTile from "./GuessTile";
import NewGameButton from "./NewGameButton";
import LoadingSpinner from '../common/LoadingSpinner';
import { useVocabulary } from '../../contexts/VocabularyContext';
import ConfettiContainer from "./ConfettiContainer";
import confettiUrl from '../../assets/confetti.svg';
import HowToPlayDialog from './HowToPlayDialog';

const WordGuess = () => {
    // State variables
    const { getNewWord, loading, isReady } = useVocabulary(); 
    const [currentVocabularty, setCurrentWord] = useState<string>('');
    const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
    const [showConfetti, setShowConfetti] = useState<boolean>(true);
    // How to play dialog state
    const [isHowToPlayOpen, setHowToPlayOpen] = useState(false);

    useEffect(() => {
        if (isReady) {
            const word = getNewWord();
            setCurrentWord(word);
            setGuessedLetters([]);
        }
    }, [isReady]);

    //Derived variables
    const gameStats = useMemo(() => {
        const maxLives: number = getLives(currentVocabularty);
        const wrongGuesses: number = guessedLetters.filter((letter: string): boolean => !currentVocabularty.includes(letter)).length;
        const livesLeft: number = maxLives - wrongGuesses;
        const isGameWon: boolean = currentVocabularty.split("").every((letter: string): boolean => guessedLetters.includes(letter));
        const isGameLost: boolean = wrongGuesses >= maxLives;
        const isGameOver: boolean = isGameWon || isGameLost;
        return { maxLives, wrongGuesses, livesLeft, isGameWon, isGameLost, isGameOver };
    }, [currentVocabularty, guessedLetters]);

    function addGuessedLetter (letter: string): void {
        setGuessedLetters(prevLetters => 
            prevLetters.includes(letter) ? prevLetters : [...prevLetters, letter]
        );
    }
    const startNewGame = useCallback((): void => {
        const newWord = getNewWord();
        setCurrentWord(newWord);
        setGuessedLetters([]);
    }, [getNewWord]);

    function getLives(word: string): number {
        const baseLives = 5;
        const bonus = Math.floor(word.length / 3);
        return baseLives + bonus;
    }

    if (loading || !currentVocabularty) {
        return <LoadingSpinner message="Loading word" />;
    }

    const { maxLives, livesLeft, isGameWon, isGameLost, isGameOver } = gameStats;

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
            <Header 
                maxLives={maxLives}
                livesLeft={livesLeft}
                showConfetti={showConfetti}
                onToggleConfetti={() => setShowConfetti(prev => !prev)}
                confettiUrl={confettiUrl}
                onOpenHowToPlay={() => setHowToPlayOpen(true)}
            />
            <GuessTile
                currentVocabularty={currentVocabularty}
                guessedLetters={guessedLetters}
                isGameLost={isGameLost}
            />
            <Keyboard 
                guessedLetters={guessedLetters}
                currentVocabularty={currentVocabularty}
                isGameOver={isGameOver}
                addGuessedLetter={addGuessedLetter}
            />
            <NewGameButton 
                isGameOver={isGameOver}
                startNewGame={startNewGame}
            />
			<HowToPlayDialog 
				open={isHowToPlayOpen} 
				onClose={() => setHowToPlayOpen(false)} 
			/>
        </Box>
    );
};

export default WordGuess;