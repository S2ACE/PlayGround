// src/components/Auth/LoginForm.tsx
import { useState, type JSX } from 'react';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    Divider,
    Stack
} from '@mui/material';
import { Google } from '@mui/icons-material';
import { authService } from '../../services/AuthService';

const LoginForm = () : JSX.Element => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await authService.signInWithEmail(email, password);
        } catch (error: any) {
            setError(getErrorMessage(error.code));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');

        try {
            await authService.signInWithGoogle();
        } catch (error: any) {
            setError('Google 登入失敗');
        } finally {
            setLoading(false);
        }
    };

    const getErrorMessage = (errorCode: string): string => {
        switch (errorCode) {
            case 'auth/user-not-found':
                return '找不到此電子郵件對應的帳戶';
            case 'auth/wrong-password':
                return '密碼錯誤';
            case 'auth/invalid-email':
                return '電子郵件格式無效';
            case 'auth/user-disabled':
                return '此帳戶已被停用';
            default:
                return '登入失敗，請稍後再試';
        }
    };

    return (
        <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
            <Card>
                <CardContent>
                    <Typography variant="h4" align="center" sx={{ mb: 3 }}>
                        登入
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleEmailSignIn}>
                        <Stack spacing={2}>
                            <TextField
                                fullWidth
                                type="email"
                                label="電子郵件"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                            
                            <TextField
                                fullWidth
                                type="password"
                                label="密碼"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading}
                                sx={{ mt: 2 }}
                            >
                                {loading ? '登入中...' : '登入'}
                            </Button>
                        </Stack>
                    </form>

                    <Divider sx={{ my: 2 }}>或</Divider>

                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Google />}
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                    >
                        使用 Google 登入
                    </Button>
                </CardContent>
            </Card>
        </Box>
    );
};

export default LoginForm;
