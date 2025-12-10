import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
	useMemo,
	memo,
	type JSX,
	useEffect,
	useRef,
	useState,
} from 'react';
import filledHeartImgLight from '../../assets/filled_heart_light.png';
import emptyHeartBreakImgLight from '../../assets/empty_heart_break_light.png';
import filledHeartImgDark from '../../assets/filled_heart_dark.png';
import emptyHeartBreakImgDark from '../../assets/empty_heart_break_dark.png';

export interface LifeBarProps {
	maxLives: number;
	livesLeft: number;
}

const HIT_DURATION = 350;

const LifeBar = memo(({ maxLives, livesLeft }: LifeBarProps): JSX.Element => {
	const theme = useTheme();
	const prevLivesRef = useRef(livesLeft);
	const [hitHeartId, setHitHeartId] = useState<number | null>(null);

	// Detect which heart just got lost (life decreased)
	useEffect(() => {
		const prevLives = prevLivesRef.current;

		if (livesLeft < prevLives) {
			const hitIndex = livesLeft;
			if (hitIndex >= 0 && hitIndex < maxLives) {
				setHitHeartId(hitIndex);
				setTimeout(() => setHitHeartId(null), HIT_DURATION);
			}
		}

		prevLivesRef.current = livesLeft;
	}, [livesLeft, maxLives]);

	const hearts = useMemo(
		() =>
			Array.from({ length: maxLives }).map((_, index) => ({
				id: index,
				isFilled: index < livesLeft,
			})),
		[maxLives, livesLeft],
	);

	const filledHeartSrc =
		theme.palette.mode === 'dark' ? filledHeartImgDark : filledHeartImgLight;
	const emptyHeartSrc =
		theme.palette.mode === 'dark'
			? emptyHeartBreakImgDark
			: emptyHeartBreakImgLight;

	return (
		<Box
			display="flex"
			flexWrap="wrap"
			gap={1}
			justifyContent="flex-start"
		>
			{hearts.map(({ id, isFilled }) => {
				const isHit = id === hitHeartId;

				return (
					<Box
						key={id}
						component="img"
						src={isFilled ? filledHeartSrc : emptyHeartSrc}
						alt="Heart"
						sx={{
							width: { xs: '31px', sm: '41px' },
							height: { xs: '28px', sm: '38px' },
							transformOrigin: 'center center',

							// Normal heartbeat animation
							'@keyframes heartbeat': {
								'0%': { transform: 'scale(1)' },
								'20%': { transform: 'scale(1.15)' },
								'40%': { transform: 'scale(1)' },
								'60%': { transform: 'scale(1.1)' },
								'80%': { transform: 'scale(1)' },
								'100%': { transform: 'scale(1)' },
							},

							// Hit animation: small jump up, then fall back and fade
							'@keyframes hitHeart': {
								'0%': {
									transform: 'translateY(0) scale(1)',
									opacity: 1,
								},
								'30%': {
									transform: 'translateY(-6px) scale(1.1)',
									opacity: 1,
								},
								'100%': {
									transform: 'translateY(0) scale(0.9)',
									opacity: 0.4,
								},
							},

							animation: isHit
								? `hitHeart ${HIT_DURATION}ms ease-out`
								: isFilled
								? 'heartbeat 1.2s ease-in-out infinite'
								: 'none',
						}}
					/>
				);
			})}
		</Box>
	);
});

LifeBar.displayName = 'LifeBar';
export default LifeBar;