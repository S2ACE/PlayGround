// pages/Settings.tsx - 完整版 (Responsive + 舊版樣式 + Box 黑色框層)
import { useState, type JSX } from 'react';
import {
    Box, Paper, Typography, TextField, Button,
    Stack, Alert, Divider, Chip, Avatar,
    Dialog, DialogTitle, DialogContent, DialogActions,
    CircularProgress
} from '@mui/material';
import { Google, Edit, Save, Cancel, Lock, LockOpen } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/AuthService';
import LoadingSpinner from '../common/LoadingSpinner';

const Settings = (): JSX.Element | null => {
    const { user, loading: authLoading, refreshUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const hasGoogleProvider = user?.providerData.some(p => p.providerId === 'google.com');
    const hasPasswordProvider = user?.providerData.some(p => p.providerId === 'password');
    const googleEmail = user?.providerData.find(p => p.providerId === 'google.com')?.email;

    const textFieldSx = {
        '& .MuiInputLabel-root': {
            backgroundColor: '#2a2a2a',
            paddingX: 1,
            color: '#ccc'
        },
        '& .MuiInputLabel-shrink': {
            backgroundColor: '#2a2a2a',
            paddingX: 1,
            color: '#fff'
        },
        '& .MuiOutlinedInput-root': {
            color: '#fff',
            '& fieldset': {
                borderColor: '#555',
            },
            '&:hover fieldset': {
                borderColor: '#888',
            },
            '&.Mui-focused fieldset': {
                borderColor: '#ff9800',
            },
        },
    };

    const handleSaveDisplayName = async () => {
        if (!displayName.trim()) {
            setError('顯示名稱不能為空');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await authService.updateDisplayName(displayName.trim());
            await refreshUser();
            setSuccess('✓ 顯示名稱已更新');
            setEditing(false);
        } catch (err: any) {
            setError(err.message || '更新失敗,請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setDisplayName(user?.displayName || '');
        setEditing(false);
        setError('');
    };

    const handlePasswordSubmit = async () => {
        setPasswordError('');
        if (newPassword.length < 6) {
            setPasswordError('密碼至少需要 6 個字元');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('密碼確認不相符');
            return;
        }

        setLoading(true);
        try {
            if (hasPasswordProvider) {
                await authService.updatePassword(newPassword);
                setSuccess('✓ 密碼已更新');
            } else {
                await authService.addPasswordToCurrentUser(newPassword);
                setSuccess('✓ 密碼已成功新增！現在您可以使用 Email 和密碼登入。');
            }

            setShowPasswordDialog(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPasswordError(err.message || '操作失敗，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return <LoadingSpinner />;
    }

    if (!user) {
        return null;
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: '#1a1a1a',
            p: { xs: 2, sm: 3, md: 4 }
        }}>
            <Box sx={{
                maxWidth: { xs: '100%', sm: 600 },
                mx: 'auto',
                width: '100%'
            }}>
                {/* 標題 */}
                <Typography
                    variant="h4"
                    sx={{
                        mb: { xs: 2, sm: 3 },
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                    }}
                >
                    ⚙️ 帳戶設定
                </Typography>

                {/* 成功/錯誤訊息 */}
                {success && (
                    <Alert
                        severity="success"
                        onClose={() => setSuccess('')}
                        sx={{
                            mb: { xs: 2, sm: 3 },
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}
                    >
                        {success}
                    </Alert>
                )}
                {error && (
                    <Alert
                        severity="error"
                        onClose={() => setError('')}
                        sx={{
                            mb: { xs: 2, sm: 3 },
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}
                    >
                        {error}
                    </Alert>
                )}

                {/* 個人資料區塊 */}
                <Paper sx={{
                    bgcolor: '#2a2a2a',
                    p: { xs: 2, sm: 3 },
                    mb: { xs: 2, sm: 3 },
                    border: '1px solid #444'
                }}>
                    <Typography
                        variant="h6"
                        sx={{
                            mb: { xs: 2, sm: 3 },
                            color: '#ff9800',
                            fontSize: { xs: '1.1rem', sm: '1.25rem' }
                        }}
                    >
                        👤 個人資料
                    </Typography>

                    {/* 頭像和 Email */}
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        sx={{ mb: { xs: 2, sm: 3 } }}
                    >
                        <Avatar
                            sx={{
                                width: { xs: 50, sm: 60 },
                                height: { xs: 50, sm: 60 },
                                bgcolor: '#ff9800',
                                fontSize: { xs: '1.2rem', sm: '1.5rem' }
                            }}
                        >
                            {displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                                sx={{
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    fontSize: { xs: '0.95rem', sm: '1rem' },
                                    wordBreak: 'break-all'
                                }}
                            >
                                {user?.email}
                            </Typography>
                            <Chip
                                label={user?.emailVerified ? '✓ Email 已驗證' : '⚠ Email 未驗證'}
                                size="small"
                                sx={{
                                    mt: 1,
                                    bgcolor: user?.emailVerified ? '#4caf50' : '#ff9800',
                                    color: 'white',
                                    fontSize: { xs: '0.75rem', sm: '0.8125rem' }
                                }}
                            />
                        </Box>
                    </Stack>

                    <Divider sx={{ my: { xs: 2, sm: 3 }, bgcolor: '#444' }} />

                    {/* 顯示名稱 */}
                    <Box>
                        <Typography
                            sx={{
                                color: '#aaa',
                                mb: 1,
                                fontSize: { xs: '0.875rem', sm: '1rem' }
                            }}
                        >
                            顯示名稱
                        </Typography>
                        {editing ? (
                            <Stack spacing={2}>
                                <TextField
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="輸入顯示名稱"
                                    fullWidth
                                    size="small"
                                    autoFocus
                                    sx={textFieldSx}
                                />
                                <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    spacing={2}
                                >
                                    <Button
                                        variant="contained"
                                        onClick={handleSaveDisplayName}
                                        disabled={loading}
                                        startIcon={<Save />}
                                        fullWidth
                                        sx={{
                                            bgcolor: '#ff9800',
                                            '&:hover': { bgcolor: '#f57c00' },
                                            fontSize: { xs: '0.875rem', sm: '0.9375rem' }
                                        }}
                                    >
                                        儲存
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={handleCancelEdit}
                                        disabled={loading}
                                        startIcon={<Cancel />}
                                        fullWidth
                                        sx={{
                                            borderColor: '#555',
                                            color: '#aaa',
                                            '&:hover': { borderColor: '#888', bgcolor: 'rgba(255,255,255,0.05)' },
                                            fontSize: { xs: '0.875rem', sm: '0.9375rem' }
                                        }}
                                    >
                                        取消
                                    </Button>
                                </Stack>
                            </Stack>
                        ) : (
                            <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                sx={{ flexWrap: 'wrap', gap: 1 }}
                            >
                                <Typography
                                    sx={{
                                        color: '#fff',
                                        fontSize: { xs: '0.95rem', sm: '1rem' }
                                    }}
                                >
                                    {displayName || '未設定'}
                                </Typography>
                                <Button
                                    variant="text"
                                    onClick={() => setEditing(true)}
                                    startIcon={<Edit />}
                                    sx={{
                                        color: '#ff9800',
                                        '&:hover': { bgcolor: 'rgba(255, 152, 0, 0.1)' },
                                        fontSize: { xs: '0.875rem', sm: '0.9375rem' }
                                    }}
                                >
                                    編輯
                                </Button>
                            </Stack>
                        )}
                    </Box>
                </Paper>

                {/* 登入方式區塊 */}
                <Paper sx={{
                    bgcolor: '#2a2a2a',
                    p: { xs: 2, sm: 3 },
                    border: '1px solid #444'
                }}>
                    <Typography
                        variant="h6"
                        sx={{
                            mb: { xs: 2, sm: 3 },
                            color: '#ff9800',
                            fontSize: { xs: '1.1rem', sm: '1.25rem' }
                        }}
                    >
                        🔐 登入方式
                    </Typography>

                    {/* ✅ Google 綁定 - 加上 Box 黑色框層 */}
                    {hasGoogleProvider && (
                        <Box
                            sx={{
                                bgcolor: '#1a1a1a',
                                border: '1px solid #333',
                                borderRadius: 1,
                                p: { xs: 1.5, sm: 2 },
                                mb: { xs: 2, sm: 3 }
                            }}
                        >
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={2}
                                alignItems={{ xs: 'flex-start', sm: 'center' }}
                            >
                                <Chip
                                    icon={<Google />}
                                    label="Google"
                                    sx={{
                                        bgcolor: '#4285f4',
                                        color: 'white',
                                        fontSize: { xs: '0.8125rem', sm: '0.875rem' }
                                    }}
                                />
                                <Typography
                                    sx={{
                                        color: '#aaa',
                                        fontSize: { xs: '0.875rem', sm: '1rem' },
                                        wordBreak: 'break-all',
                                        flex: 1
                                    }}
                                >
                                    {googleEmail}
                                </Typography>
                                <Chip
                                    label="已連結"
                                    size="small"
                                    sx={{
                                        bgcolor: '#4caf50',
                                        color: 'white',
                                        fontSize: { xs: '0.75rem', sm: '0.8125rem' }
                                    }}
                                />
                            </Stack>
                        </Box>
                    )}

                    {/* ✅ 密碼設定 - 加上 Box 黑色框層 */}
                    <Box
                        sx={{
                            bgcolor: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: 1,
                            p: { xs: 1.5, sm: 2 }
                        }}
                    >
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            alignItems={{ xs: 'flex-start', sm: 'center' }}
                        >
                            <Chip
                                icon={hasPasswordProvider ? <Lock /> : <LockOpen />}
                                label="密碼"
                                sx={{
                                    bgcolor: hasPasswordProvider ? '#4caf50' : '#555',
                                    color: 'white',
                                    fontSize: { xs: '0.8125rem', sm: '0.875rem' }
                                }}
                            />
                            <Typography
                                sx={{
                                    color: '#aaa',
                                    flex: 1,
                                    fontSize: { xs: '0.875rem', sm: '1rem' }
                                }}
                            >
                                {hasPasswordProvider ? '使用密碼登入' : '新增密碼以使用 Email 登入'}
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setShowPasswordDialog(true);
                                    setPasswordError('');
                                }}
                                sx={{
                                    borderColor: '#ff9800',
                                    color: '#ff9800',
                                    '&:hover': {
                                        borderColor: '#f57c00',
                                        bgcolor: 'rgba(255, 152, 0, 0.1)'
                                    },
                                    fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                                    minWidth: { sm: 120 },
                                    width: { xs: '100%', sm: 'auto' } // ✅ 小螢幕全寬,大螢幕自動寬度
                                }}
                            >
                                {hasPasswordProvider ? '更改密碼' : '新增密碼'}
                            </Button>
                        </Stack>
                    </Box>
                </Paper>

                {/* 密碼設定對話框 */}
                <Dialog
                    open={showPasswordDialog}
                    onClose={() => {
                        if (!loading) {
                            setShowPasswordDialog(false);
                            setNewPassword('');
                            setConfirmPassword('');
                            setPasswordError('');
                        }
                    }}
                    maxWidth="sm"
                    fullWidth
                    slotProps={{
                        paper: {
                            sx: {
                                bgcolor: '#2a2a2a',
                                border: '1px solid #444',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
                                m: { xs: 2, sm: 3 }
                            }
                        }
                    }}
                >
                    <DialogTitle
                        sx={{
                            color: '#fff',
                            fontSize: { xs: '1.25rem', sm: '1.5rem' }
                        }}
                    >
                        {hasPasswordProvider ? '🔑 更改密碼' : '🔑 新增密碼'}
                    </DialogTitle>
                    <DialogContent sx={{ pt: 2 }}>
                        {passwordError && (
                            <Alert severity="error" sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                {passwordError}
                            </Alert>
                        )}
                        <Stack spacing={2} sx = {{ mt: 2 }}>
                            <TextField
                                label="新密碼"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                fullWidth
                                helperText="至少 6 個字元"
                                autoFocus
                                sx={textFieldSx}
                                slotProps={{
                                    formHelperText: {
                                        sx: { color: '#888', fontSize: { xs: '0.75rem', sm: '0.875rem' } }
                                    }
                                }}
                            />
                            <TextField
                                label="確認密碼"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                fullWidth
                                sx={textFieldSx}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: { xs: 2, sm: 3 }, gap: 1 }}>
                        <Button
                            onClick={() => {
                                setShowPasswordDialog(false);
                                setNewPassword('');
                                setConfirmPassword('');
                                setPasswordError('');
                            }}
                            disabled={loading}
                            sx={{
                                color: '#aaa',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                                fontSize: { xs: '0.875rem', sm: '0.9375rem' }
                            }}
                        >
                            取消
                        </Button>
                        <Button
                            onClick={handlePasswordSubmit}
                            variant="contained"
                            disabled={loading}
                            sx={{
                                bgcolor: '#ff9800',
                                '&:hover': { bgcolor: '#f57c00' },
                                fontSize: { xs: '0.875rem', sm: '0.9375rem' }
                            }}
                        >
                            {loading ? <CircularProgress size={20} /> : '確認'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    );
};

export default Settings;
