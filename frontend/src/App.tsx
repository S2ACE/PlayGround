import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import NavigationBar from './components/NavigationBar';
import PageLayout from './components/PageLayout';
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
import AuthRoute from './components/auth/AuthRoute';
// Members
import Settings from './components/memberscomponents/Setting';
//Protected Route
import ProtectedRoute from './components/common/ProtectedRoute';

function AppContent() {
    const { loading } = useAuth();

    // 載入中畫面
    if (loading) {
        return (
            <Box 
                display="flex" 
                flexDirection="column"
                justifyContent="center" 
                alignItems="center" 
                minHeight="100vh"
                gap={2}
            >
                <CircularProgress size={60} />
                <Typography variant="h6" color="text.secondary">
                    載入中...
                </Typography>
            </Box>
        );
    }

    // 所有用戶都可以訪問主應用（使用 localStorage 或 database）
    return (
        <VocabularyProvider>
            <BrowserRouter>
                <NavigationBar />
                <PageLayout>
                    <Routes>
                        {/* default route */}
                        <Route path="/" element={<Navigate to="/wordguess" replace />} />

                        {/* wordguess route */}
                        <Route path="/wordguess" element={<WordGuess />} />
                        
                        {/* kanatable route */}
                        <Route path="/kanatable/:type" element={<KanaTable />} />

                        {/* vocabulary route - 不需要強制登入 */}
                        <Route path="/vocabulary/level" element={<LevelSelection />} />
                        <Route path="/vocabulary/level/:level" element={<LetterSelection />} />
                        <Route path="/vocabulary/level/:level/words/:range" element={<WordLearning />} />

                        {/* 測試相關路由 - 不需要強制登入 */}
                        <Route path="/test/setup" element={<TestSetup />} />
                        <Route path="/test/session" element={<TestSession />} />
                        <Route path="/test/results" element={<TestResults />} />

                        {/* 登入頁面 */}
                        <Route path="/auth" element={<AuthRoute />} />

                        {/* 會員設定頁面 - 需要登入 */}
                        <Route 
                            path="/settings" 
                            element={
                                <ProtectedRoute redirectTo="/wordguess">
                                    <Settings />
                                </ProtectedRoute>
                            } 
                        />

                        {/* 404 處理 */}
                        <Route path="*" element={<Navigate to="/wordguess" replace />} />
                    </Routes>
                </PageLayout>
            </BrowserRouter>
        </VocabularyProvider>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
