import './App.css';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, CssBaseline } from '@mui/material';
import NavigationBar from './components/NavigationBar';
import PageLayout from './components/PageLayout';
//dark,light theme
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from './theme';
import { useState, useEffect, type JSX } from 'react';
// WordGuesss
import WordGuess from './components/gamecomponents/WordGuess';
import WordLearning from './components/vocabularycomponents/WordLearning';
// KanaTable
import KanaTable from './components/japanesecomponents/KanaTable';
// English Vocabulary
import LetterSelection from './components/vocabularycomponents/LetterSelection';
import LevelSelection from './components/vocabularycomponents/LevelSelection';
import TestSetup from './components/vocabularycomponents/TestSetup';
import TestSession from './components/vocabularycomponents/TestSession';
import TestResults from './components/vocabularycomponents/TestResults';
// Context
import { VocabularyProvider } from './contexts/VocabularyContext';
// Auth
import { AuthProvider, useAuth } from './contexts/AuthContext';
// Members
import Settings from './components/memberscomponents/Setting';
//Protected Route
import ProtectedRoute from './components/common/ProtectedRoute';
import { authService } from './services/AuthService';

type AppContentProps = {
	isDark: boolean;
	setIsDark: (value: boolean) => void;
};

const KanaTableWithKey = (): JSX.Element => {
  const { type } = useParams();
  return <KanaTable key={type} />;
};


function AppContent({ isDark, setIsDark }: AppContentProps) {
	const { loading, user } = useAuth();

	useEffect(() => {
		if (!user) return;

		(async () => {
			try {
				const member = await authService.getMember();
				if (member && typeof member.darkMode === 'boolean') {
					setIsDark(member.darkMode);
					localStorage.setItem('theme', member.darkMode ? 'dark' : 'light');
				}
			} catch (e) {
			console.error('讀取會員資料失敗', e);
			}
		})();
	}, [user, setIsDark]);	
		

	if (loading) {
		return (
			<Box
				display="flex"
				flexDirection="column"
				justifyContent="center"
				alignItems="center"
				minHeight="100dvh"
				gap={2}
			>
				<CircularProgress size={60} />
				<Typography variant="h6" color="text.secondary">
					載入中...
				</Typography>
			</Box>
		);
	}

	return (
		<VocabularyProvider>
			<BrowserRouter>
				<NavigationBar
					isDark={isDark}
					setIsDark={setIsDark}
				/>
				<PageLayout>
					<Routes>
						<Route path="/" element={<Navigate to="/wordguess" replace />} />
						<Route path="/wordguess" element={<WordGuess />} />
						<Route path="/kanatable/:type" element={<KanaTableWithKey />} />
						<Route path="/vocabulary/level" element={<LevelSelection />} />
						<Route path="/vocabulary/level/:level" element={<LetterSelection />} />
						<Route path="/vocabulary/level/:level/words/:range" element={<WordLearning />} />
						<Route path="/test/setup" element={<TestSetup />} />
						<Route path="/test/session" element={<TestSession />} />
						<Route path="/test/results" element={<TestResults />} />
						{/*
						<Route path="/auth" element={<AuthRoute />} />
						*/}
						<Route
							path="/settings"
							element={
								<ProtectedRoute redirectTo="/wordguess">
									<Settings />
								</ProtectedRoute>
							}
						/>
						<Route path="*" element={<Navigate to="/wordguess" replace />} />
					</Routes>
				</PageLayout>
			</BrowserRouter>
		</VocabularyProvider>
	);
}

function App() {
	const [isDark, setIsDark] = useState(() => {
		const stored = localStorage.getItem('theme');
		return stored === 'dark';
	});

	return (
		<AuthProvider>
			<ThemeProvider theme={isDark ? darkTheme : lightTheme}>
				<CssBaseline />
				<AppContent isDark={isDark} setIsDark={setIsDark} />
			</ThemeProvider>
		</AuthProvider>
	);
}

export default App;