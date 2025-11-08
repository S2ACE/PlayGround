import { useState, type JSX } from 'react';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    Stack
} from '@mui/material';
import { authService } from '../../services/AuthService';

const RegisterForm = () : JSX.Element => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError('密碼確認不相符');
            return;
        }

        if (password.length < 6) {
            setError('密碼至少需要 6 個字元');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await authService.registerWithEmail(email, password);
        } catch (error: any) {
            setError(getErrorMessage(error.code));
        } finally {
            setLoading(false);
        }
    };

    const getErrorMessage = (errorCode: string): string => {
        switch (errorCode) {
            case 'auth/email-already-in-use':
                return '此電子郵件已被使用';
            case 'auth/invalid-email':
                return '電子郵件格式無效';
            case 'auth/weak-password':
                return '密碼強度太弱';
            default:
                return '註冊失敗，請稍後再試';
        }
    };

    return (
        <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
            <Card>
                <CardContent>
                    <Typography variant="h4" align="center" sx={{ mb: 3 }}>
                        註冊
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleRegister}>
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
                                helperText="至少 6 個字元"
                            />

                            <TextField
                                fullWidth
                                type="password"
                                label="確認密碼"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
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
                                {loading ? '註冊中...' : '註冊'}
                            </Button>
                        </Stack>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};

export default RegisterForm;
