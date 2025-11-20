import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import clsx from 'clsx';
import { useMemo, memo, type JSX } from 'react';

type GuessTileProps = {
    currentVocabularty: string;
    guessedLetters: string[];
    isGameLost: boolean;
};

  const StyledTile = styled('span')(({ theme }) => ({
    fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
    fontWeight: 'bold',
    transition: 'opacity 0.2s ease-in-out',
    '&.missed': {
      color: theme.palette.error.dark,
    },
  }));

const GuessTile = memo(({ currentVocabularty, guessedLetters, isGameLost }: GuessTileProps): JSX.Element => {
  const letterData = useMemo(() => {
        return currentVocabularty.split('').map((letter: string, index: number) => ({
          letter,
          index,
          shouldReveal: isGameLost || guessedLetters.includes(letter),
          isMissed: isGameLost && !guessedLetters.includes(letter)
        }));
    }, [currentVocabularty, guessedLetters, isGameLost]);

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
      {letterData.map(({ letter, index, shouldReveal, isMissed }) => (
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
            <StyledTile className={clsx(isMissed && 'missed')}>
                {shouldReveal ? letter.toUpperCase() : ''}
            </StyledTile>
        </Box>
      ))}
    </Box>
  );
});

GuessTile.displayName = 'GuessTile';
export default GuessTile;