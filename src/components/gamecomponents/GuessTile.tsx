import type { JSX } from 'react';
import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import clsx from 'clsx';

type GuessTileProps = {
    currentWord: string;
    guessedLetters: string[];
    isGameLost: boolean;
};

const GuessTile = ({ currentWord, guessedLetters, isGameLost }: GuessTileProps): JSX.Element => {
  const StyledTile = styled('span')(({ theme }) => ({
    fontSize: '1.2rem',
    fontWeight: 'bold',
    '&.missed': {
      color: theme.palette.error.dark,
    },
  }));

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {currentWord.split('').map((letter: string, index: number): JSX.Element => {
        const shouldRevealLetter: boolean = isGameLost || guessedLetters.includes(letter);
        const letterTile: string = clsx(
            isGameLost && !guessedLetters.includes(letter) && 'missed'
        );

        return (
          <Box
            key={index}
            sx={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: 0.5,
                background: '#323232',
                borderBottom: '1px solid #F9F4DA',
            }}
          >
            <StyledTile className={letterTile}>
              {shouldRevealLetter ? letter.toUpperCase() : ''}
            </StyledTile>
          </Box>
        );
      })}
    </Box>
  );
};

export default GuessTile;