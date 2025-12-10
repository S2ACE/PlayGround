import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import clsx from 'clsx';
import { useMemo, memo, type JSX } from 'react';

interface GuessTileProps {
	currentVocabularty: string;
	guessedLetters: string[];
	isGameLost: boolean;
}

	const StyledTile = styled('span')(({ theme }) => ({
	fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
    fontWeight: 'bold',
    transition: 'opacity 0.2s ease-in-out',
    '&.missed': {
      color: theme.palette.error.main,
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
        maxWidth: { xs: '600px', sm: '700px'},
      }}
    >
      {letterData.map(({ letter, index, shouldReveal, isMissed }) => (
        <Box
            key={index}
            sx={(theme) => ({
                width: { xs: 32, sm: 45 },
                height: { xs: 32, sm: 45 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: theme.palette.wordGuess.slotBackground,
                borderBottom: '2px solid',
                borderColor: theme.palette.text.primary,
            })}
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