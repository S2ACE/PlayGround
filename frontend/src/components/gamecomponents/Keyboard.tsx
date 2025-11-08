import type { JSX } from 'react';
import { styled } from "@mui/material/styles";
import { Box, Button } from "@mui/material";

type KeyboardProps = {
    guessedLetters: string[];
    currentWord: string;
    isGameOver: boolean;
    addGuessedLetter: (letter:string) => void;
};

const Keyboard = ({ guessedLetters,currentWord,isGameOver,addGuessedLetter }: KeyboardProps): JSX.Element => {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const StyledKeyboard = styled(Button)<{ status?: string }>(({ theme, status }) => ({
        margin: theme.spacing(0.5),
        minWidth: 'clamp(32px, 8vw, 42px)',
        minHeight: 'clamp(32px, 8vw, 42px)', 
        borderRadius: 6,
        fontSize: 'clamp(1rem, 2.2vw, 1.3rem)',
        border: '2px solid #ffffff',
        backgroundColor: '#ff9800',
        color: '#000000',
        '&:hover': {
            backgroundColor: '#e65100',
            color: '#212121',
        },
        ...(status === 'correct' && {
            backgroundColor: theme.palette.success.light,
            color: theme.palette.success.contrastText,
        }),
        ...(status === 'wrong' && {
            backgroundColor: theme.palette.error.light,
            color: theme.palette.error.contrastText,
        }),
        ...(status === 'inactive' && {
            backgroundColor: '#424242',
           
        }),
        '&.Mui-disabled': {
             color: '#242323ff',
        },       
    }));

    const KeyboardElements: JSX.Element[] = alphabet.split('').map((letter) => {
        const isGuessed: boolean = guessedLetters.includes(letter)
        const isCorrect: boolean = isGuessed && currentWord.includes(letter)


        return (
            <StyledKeyboard
                key={letter}
                status={
                    isGuessed
                    ? isCorrect
                        ? 'correct'
                        : 'wrong'
                    : isGameOver
                    ? 'inactive'
                    : ''
                }
                disabled={isGameOver}
                onClick={() => addGuessedLetter(letter)}
            >
            {letter.toUpperCase()}
        </StyledKeyboard>

        );
    });
    return(
        <Box sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 0.5,
            width: '100%',
            maxWidth: '600px',
            padding: 1,
            overflowX: 'auto',
        }}>
            {KeyboardElements}
        </Box>

    );
};

export default Keyboard;