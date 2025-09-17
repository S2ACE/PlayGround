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
    fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
    fontWeight: 'bold',
    '&.missed': {
      color: theme.palette.error.dark,
    },
  }));

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 1,
        padding: 1,
        width: '100%',
        maxWidth: '600px',
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
              width: { xs: 30, sm: 40 },
              height: { xs: 30, sm: 40 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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