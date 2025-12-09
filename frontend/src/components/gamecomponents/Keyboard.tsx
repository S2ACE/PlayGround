import type { JSX } from 'react';
import { styled } from "@mui/material/styles";
import { Box, Button } from "@mui/material";

type KeyboardProps = {
    guessedLetters: string[];
    currentVocabularty: string;
    isGameOver: boolean;
    addGuessedLetter: (letter:string) => void;
};

const Keyboard = ({ guessedLetters,currentVocabularty,isGameOver,addGuessedLetter }: KeyboardProps): JSX.Element => {
    const row1 = 'qwertyuiop'.split('');
    const row2 = 'asdfghjkl'.split('');
    const row3 = 'zxcvbnm'.split('');

    const StyledKeyboard = styled(Button)<{ status?: string }>(({ theme, status }) => ({
        borderRadius: 6,
        border: '2px solid',
        borderColor: theme.palette.wordGuess.buttonBorder,
        backgroundColor: theme.palette.primary.light,
        color: theme.palette.primary.contrastText,
        '&:hover': {
            backgroundColor: theme.palette.primary.dark,
        },
        ...(status === 'correct' && {
            backgroundColor: theme.palette.success.main,
            color: theme.palette.success.contrastText,
        }),
        ...(status === 'wrong' && {
            backgroundColor: theme.palette.error.main,
            color: theme.palette.error.contrastText,
        }),
        ...(status === 'inactive' && {
            backgroundColor: theme.palette.wordGuess.inactiveKey,
        }),
        '&.Mui-disabled': {
             color: '#242323',
        },    
        [theme.breakpoints.down('sm')]: {
            margin: theme.spacing(0.3),
            minWidth: 30,
            minHeight: 46,
            fontSize: '1rem',
        },
        [theme.breakpoints.up('sm')]: {
            margin: theme.spacing(0.5),
            minWidth: 36,
            minHeight: 52,
            fontSize: '1.1rem',
        },
        [theme.breakpoints.up('md')]: {
    
            minWidth: 42,
            minHeight: 58,
            fontSize: '1.2rem',
        },          
        
    }));

    const renderRow = (row: string[]) =>
        row.map((letter) => {
        const isGuessed = guessedLetters.includes(letter);
        const isCorrect = isGuessed && currentVocabularty.includes(letter);

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

    return (
        <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: { xs: 0.25, sm: 0.5 },   // 手機行距更小
            width: '100%',
            maxWidth: 480,
            p: { sm: 1 },
        }}
        >
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            {renderRow(row1)}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            {renderRow(row2)}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            {renderRow(row3)}
        </Box>
        </Box>
    );
};

export default Keyboard;