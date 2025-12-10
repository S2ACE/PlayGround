import { Grid, Typography, Box } from '@mui/material';
import type { JSX } from 'react';
import KanaSpeak from './KanaSpeak';

interface KanaGridCellProps {
	char: string;
	romaji: string;
	onClick: () => void;
	gridColumns?: number;
	isInteractive: boolean;
}

const KanaGridCell = ({
    char,
	romaji,
	onClick,
	gridColumns = 5,
	isInteractive,
}: KanaGridCellProps): JSX.Element => {
	const hasKana = !!char;

	return (
		<Grid
			size={{ xs: 1 }}
			sx={(theme) => ({
				textAlign: 'center',
				border: '1px solid',
				borderColor: '#999999',
				minHeight: 64,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: theme.palette.primary.light,
				color: theme.palette.primary.contrastText,
				cursor: hasKana ? 'pointer' : 'default',
				opacity: hasKana ? 1 : 0.5,
				p: 0,
				transition: 'background 0.2s',
				minWidth: gridColumns === 3 ? '33.333%' : 'auto',
				...(hasKana && {
					'&:hover': {
						backgroundColor: theme.palette.primary.dark,
					},
				}),
			})}
			onClick={hasKana && isInteractive ? onClick : undefined}
		>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					width: '100%',
					px: 1,
				}}
			>
				{/* Left: kana character & romaji */}
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<Typography
						variant="h4"
						sx={{
							userSelect: 'none',
							lineHeight: 0.9,
							fontSize: {
								xs: '1.8rem',
								sm: '2.2rem',
							},
						}}
					>
						{char}
					</Typography>
					<Typography
						variant="body1"
						sx={(theme) => ({
							color: theme.palette.share.prompt,
							userSelect: 'none',
							lineHeight: 0.9,
							fontSize: {
								xs: '1rem',
								sm: '1.2rem',
							},
						})}
					>
						{romaji}
					</Typography>
				</Box>

				{/* Right: pronunciation button */}
				{hasKana && (
					<Box
						sx={{
							ml: -1,
							display: 'flex',
							alignItems: 'center',
						}}
					>
						<KanaSpeak char={char} />
					</Box>
				)}
			</Box>
		</Grid>
	);
};

export default KanaGridCell;
