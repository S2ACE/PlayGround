import { Box, Toolbar, useTheme } from "@mui/material";

const PageLayout = ({ children }: { children: React.ReactNode }) => {
	const theme = useTheme();
	return (
		<Box
			sx={{
				backgroundColor: theme.palette.background.default,
				color: theme.palette.text.primary,
				width: '100%',
				minHeight: '100vh',
				overflow: 'auto',
				px: 2,
				boxSizing: 'border-box',
			}}
		>
			<Toolbar />
			{children}
		</Box>
	);
};

export default PageLayout;
