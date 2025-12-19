import type { JSX } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	IconButton,
	Typography,
	Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SlideTransition from '../common/SlideTransition';

interface HowToPlayDialogProps {
	open: boolean;
	onClose: () => void;
}

const HowToPlayDialog = ({ open, onClose }: HowToPlayDialogProps): JSX.Element => {
	return (
		<Dialog
			open={open}
			onClose={onClose}
			slots={{
				transition: SlideTransition
			}}
			slotProps={{
				paper: {
					sx: {
						width: '90%',
						maxWidth: '500px',
					}
				}
			}}
			keepMounted
			aria-labelledby="how-to-play-dialog-title"
			aria-describedby="how-to-play-dialog-description"
		>
			<DialogTitle 
				id="how-to-play-dialog-title" 
				sx={{ 
					m: 0, 
					p: 2,
					fontWeight: 'bold', 
					fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }, 
					color: 'text.primary',
				}}
			>
				How to Play
				<IconButton
					aria-label="close"
					onClick={onClose}
					sx={{
						position: 'absolute',
						right: 8,
						top: 8,
						color: 'text.',
					}}
				>
					<CloseIcon />
				</IconButton>
			</DialogTitle>
			
			<DialogContent dividers>
				<DialogContentText
					id="how-to-play-dialog-description"
					component="div"
					sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
				>
					<Typography variant="h4" component="h4" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' } , color: 'text.primary' }}>
						Guess the hidden word!
					</Typography>
					<Box component="ul" sx={{ pl: 2.5 }}>
						{[
							"Guess one letter at a time.",
							"You start with 5 lives. For every 3 letters in the word, you get an extra life.",
							"You lose one life for each incorrect guess of a letter not in the word.",
							"Guess all the letters in the word before you run out of lives to win!"
						].map((text, index) => (
							<Typography
								component="li"
								variant="body2"
								key={index}
								sx={{ fontSize: { xs: '1rem', sm: '1.2rem' }, pb: 1, color: 'text.primary' }}
							>
								{text}
							</Typography>
						))}
					</Box>
				</DialogContentText>
			</DialogContent>
		</Dialog>
	);
};

export default HowToPlayDialog;