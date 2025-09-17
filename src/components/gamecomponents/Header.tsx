import type { JSX } from 'react';
import { Typography}  from '@mui/material';
import LifeBar from './LifeBar';
import type { LifeBarProps } from './LifeBar';



const Header = ({ maxLives, livesLeft }: LifeBarProps): JSX.Element => {
    const statusString = livesLeft > 0 ? "💡 You still have " + (livesLeft) + " chances to get it wrong." : "🔥 Game Over!!";
    
    return (
        <>
            <Typography variant="h1" component="h1" sx={{ fontSize : '3rem'}}>
                Word Guess
            </Typography>
            <Typography variant="body1" component="p" sx={{ fontSize : '1.2rem'}}>
                Lives: 5 + 1 per 3 letters. Think fast—can you guess the word?
            </Typography>
            <LifeBar maxLives={maxLives} livesLeft={livesLeft} />
            <Typography
                variant="body1"
                component="p"
                sx={{
                    fontSize: '1.2rem',
                    ...(livesLeft <= 0 && {
                    color: '#FF3D00',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    animation: 'gameOverFlash 1.2s ease-out forwards',
                    '@keyframes gameOverFlash': {
                        '0%': {
                        opacity: 0,
                        transform: 'scale(0.5) rotate(0deg)',
                        filter: 'blur(4px)',
                        },
                        '60%': {
                        opacity: 1,
                        transform: 'scale(1.2) rotate(5deg)',
                        filter: 'blur(0)',
                        },
                        '80%': {
                        transform: 'scale(0.9) rotate(-5deg)',
                        },
                        '100%': {
                        transform: 'scale(1) rotate(0deg)',
                        },
                    },
                    }),
                }}
            >
            {statusString}
            </Typography>
        </>
    );
};

export default Header;