import type { JSX } from 'react';
import { Button } from '@mui/material';
type NewGameButtonProps = {
    isGameOver: boolean;
    startNewGame: () => void;
}

const NewGameButton = ({ isGameOver, startNewGame }: NewGameButtonProps): JSX.Element | null => {
    if (!isGameOver) {
        return null;
    }
    return (
<Button
  variant="contained"
  onClick={startNewGame}
  sx={{
    backgroundColor: '#ED6C02',
    color: '#fff',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    padding: '12px 24px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
    marginTop: '20px',
    transition: 'transform 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      backgroundColor: '#C75A02',
      animation: 'bounce 0.8s infinite',
      boxShadow: '0 0 15px rgba(255, 140, 0, 0.8)', // 橘色柔光暈
    },
    '@keyframes bounce': {
      '0%': { transform: 'translateY(0)' },
      '30%': { transform: 'translateY(-8px)' },
      '50%': { transform: 'translateY(4px)' },
      '70%': { transform: 'translateY(-4px)' },
      '100%': { transform: 'translateY(0)' },
    },
  }}
>
  Start New Game
</Button>
    );
}; 

export default NewGameButton;