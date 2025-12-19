import type { JSX } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import LifeBar from './LifeBar';
import type { LifeBarProps } from './LifeBar';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'; // Import the question mark icon

interface HeaderProps extends LifeBarProps {
	showConfetti?: boolean;
	onToggleConfetti?: () => void;
	confettiUrl?: string;
	onOpenHowToPlay: () => void;
}

const Header = ({ maxLives, livesLeft, showConfetti, onToggleConfetti, confettiUrl, onOpenHowToPlay }: HeaderProps): JSX.Element => {
	const statusString = livesLeft > 0 ? "💡 You still have " + (livesLeft) + " chances to get it wrong." : "🔥 Game Over!!";
	
	return (
		<>
			<Box sx={{ 
				display: 'flex', 
				alignItems: 'center', 
				justifyContent: 'center',
				position: 'relative',
				width: '100%',
				minHeight: 60
			}}>
				
				<Typography variant="h1" component="h1" sx={{ fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }}}>
					Word Guess
				</Typography>

				{/* Container for the icons on the right */}
				<Box sx={{
					position: 'absolute',
					right: {
						xs: 10,
						sm: 20,
						md: 'calc(50% - 250px)' // Adjust positioning relative to the center for larger screens
					},
					top: {
						xs: -15,
						md: -15
					},
					display: 'flex',
					alignItems: 'center',
					gap: 1.5
				}}>
					{/* Confetti Toggle Button */}
					{confettiUrl && onToggleConfetti && (
						<Box
							onClick={onToggleConfetti}
							sx={{ 
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',                                
								'&:hover': {
									transform: 'scale(1.1)',
									transition: 'transform 0.2s ease-in-out'
								}
							}}
						>
							<img
								src={confettiUrl}
								alt="Toggle Confetti"
								style={{
									width: 25,
									height: 25,
									filter: showConfetti ? 'none' : 'grayscale(100%)',
								}}
							/>
						</Box>
					)}
					
					{/* "How to Play" Button */}
					<IconButton
						aria-label="how to play"
						onClick={onOpenHowToPlay}
						sx={{ 
							padding: 0.5,
							'&:hover': {
								transform: 'scale(1.1)',
								transition: 'transform 0.2s ease-in-out',
								backgroundColor: 'transparent' // Prevent background color on hover
							}
						}}
					>
						<HelpOutlineIcon sx={{ fontSize: 28, color: 'text.primary' }} />
					</IconButton>
				</Box>
			</Box>
			<LifeBar maxLives={maxLives} livesLeft={livesLeft} />
			<Typography
				variant="body1"
				component="p"
				sx={(theme) => ({
					fontSize: { xs: '1.0rem', sm: '1.2rem', md: '1.3rem' },
					color: theme.palette.text.primary,
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
				})}
			>
				{statusString}
			</Typography>
		</>
	);
};

export default Header;