import { Box } from "@mui/material";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import type { JSX } from "react";

const ConfettiContainer = ({ isGameWon }: { isGameWon: boolean }): JSX.Element | null => {
	const { width, height } = useWindowSize();

	if (!isGameWon || !width || !height) 
    	return null;

	return (
		<Box
			sx={{
				position: 'fixed',
				top: 0,
				left: 0,
				width: '100vw',
				height: '100vh',
				pointerEvents: 'none',
				overflow: 'hidden',
				zIndex: 9999,
			}}
		>
			<Confetti width={width} height={height} numberOfPieces={1000} recycle />
		</Box>
	);
};

export default ConfettiContainer;