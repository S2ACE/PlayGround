// pages/Settings.tsx
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

const Settings = () : JSX.Element | null => {
    // ✅ 重新命名認證載入狀態
    const { user, loading: authLoading } = useAuth();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false); // 操作載入狀態
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

    // 統一的 TextField 樣式（配合網站風格）
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
            setSuccess('✓ 顯示名稱已更新');
            setEditing(false);
        } catch (err: any) {
            setError('更新失敗：' + (err.message || '請稍後再試'));
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

    // ✅ 使用 authLoading 檢查認證狀態
    if (authLoading) {
        return <LoadingSpinner message="Loading settings..." />;
    }

    if (!user) {
        return null;
    }

    return (
        <Box sx={{ 
            maxWidth: 800, 
            mx: 'auto', 
            p: 3,
            minHeight: '100vh',
            bgcolor: '#1a1a1a',
        }}>
            <Typography 
                variant="h4" 
                gutterBottom
                sx={{ 
                    color: '#fff',
                    fontWeight: 'bold',
                    mb: 3,
                    borderBottom: '3px solid #ff9800',
                    pb: 1,
                    display: 'inline-block'
                }}
            >
                ⚙️ 帳戶設定
            </Typography>

            {/* 成功/錯誤訊息 */}
            {success && (
                <Alert 
                    severity="success" 
                    sx={{ 
                        mb: 2,
                        bgcolor: 'rgba(76, 175, 80, 0.1)',
                        color: '#81c784',
                        border: '1px solid #4caf50'
                    }} 
                    onClose={() => setSuccess('')}
                >
                    {success}
                </Alert>
            )}
            {error && (
                <Alert 
                    severity="error" 
                    sx={{ 
                        mb: 2,
                        bgcolor: 'rgba(244, 67, 54, 0.1)',
                        color: '#e57373',
                        border: '1px solid #f44336'
                    }} 
                    onClose={() => setError('')}
                >
                    {error}
                </Alert>
            )}

            {/* 個人資料區塊 */}
            <Paper sx={{ 
                p: 3, 
                mb: 3,
                bgcolor: '#2a2a2a',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                border: '1px solid #444'
            }}>
                <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ 
                        color: '#ff9800',
                        fontWeight: 'bold',
                        mb: 2
                    }}
                >
                    👤 個人資料
                </Typography>
                
                <Stack spacing={3}>
                    {/* 頭像和 Email */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                            src={user?.photoURL || ''}
                            sx={{ 
                                width: 64, 
                                height: 64,
                                border: '2px solid #ff9800'
                            }}
                        >
                            {displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box>
                            <Typography variant="body1" fontWeight="bold" sx={{ color: '#fff' }}>
                                {user?.email}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#888' }}>
                                {user?.emailVerified ? '✓ Email 已驗證' : '⚠ Email 未驗證'}
                            </Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ borderColor: '#444' }} />

                    {/* 顯示名稱 */}
                    <Box>
                        <Typography variant="subtitle2" sx={{ color: '#aaa', mb: 1 }}>
                            顯示名稱
                        </Typography>
                        {editing ? (
                            <Stack direction="row" spacing={2} alignItems="center">
                                <TextField
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="輸入顯示名稱"
                                    fullWidth
                                    size="small"
                                    autoFocus
                                    sx={textFieldSx}
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleSaveDisplayName}
                                    disabled={loading}
                                    startIcon={loading ? <CircularProgress size={16} /> : <Save />}
                                    sx={{
                                        bgcolor: '#ff9800',
                                        '&:hover': { bgcolor: '#f57c00' }
                                    }}
                                >
                                    儲存
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleCancelEdit}
                                    disabled={loading}
                                    startIcon={<Cancel />}
                                    sx={{
                                        borderColor: '#555',
                                        color: '#aaa',
                                        '&:hover': { borderColor: '#888', bgcolor: 'rgba(255,255,255,0.05)' }
                                    }}
                                >
                                    取消
                                </Button>
                            </Stack>
                        ) : (
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Typography variant="body1" sx={{ color: '#fff' }}>
                                    {displayName || '未設定'}
                                </Typography>
                                <Button
                                    size="small"
                                    startIcon={<Edit />}
                                    onClick={() => setEditing(true)}
                                    sx={{
                                        color: '#ff9800',
                                        '&:hover': { bgcolor: 'rgba(255, 152, 0, 0.1)' }
                                    }}
                                >
                                    編輯
                                </Button>
                            </Stack>
                        )}
                    </Box>
                </Stack>
            </Paper>

            {/* 登入方式區塊 */}
            <Paper sx={{ 
                p: 3, 
                mb: 3,
                bgcolor: '#2a2a2a',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                border: '1px solid #444'
            }}>
                <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ 
                        color: '#ff9800',
                        fontWeight: 'bold',
                        mb: 2
                    }}
                >
                    🔐 登入方式
                </Typography>

                <Stack spacing={2}>
                    {/* Google 綁定 */}
                    {hasGoogleProvider && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 2,
                                bgcolor: '#1a1a1a',
                                borderRadius: 1,
                                border: '1px solid #444'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Google sx={{ color: '#4285f4' }} />
                                <Box>
                                    <Typography variant="body1" fontWeight="bold" sx={{ color: '#fff' }}>
                                        Google
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#888' }}>
                                        {googleEmail}
                                    </Typography>
                                </Box>
                            </Box>
                            <Chip 
                                label="已連結" 
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(76, 175, 80, 0.2)',
                                    color: '#81c784',
                                    border: '1px solid #4caf50'
                                }}
                            />
                        </Box>
                    )}

                    {hasGoogleProvider && <Divider sx={{ borderColor: '#444' }} />}

                    {/* 密碼設定 */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 2,
                            bgcolor: '#1a1a1a',
                            borderRadius: 1,
                            border: '1px solid #444'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {hasPasswordProvider ? 
                                <Lock sx={{ color: '#ff9800' }} /> : 
                                <LockOpen sx={{ color: '#666' }} />
                            }
                            <Box>
                                <Typography variant="body1" fontWeight="bold" sx={{ color: '#fff' }}>
                                    密碼
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#888' }}>
                                    {hasPasswordProvider 
                                        ? '使用密碼登入' 
                                        : '新增密碼以使用 Email 登入'
                                    }
                                </Typography>
                            </Box>
                        </Box>
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
                                }
                            }}
                        >
                            {hasPasswordProvider ? '更改密碼' : '新增密碼'}
                        </Button>
                    </Box>
                </Stack>
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
                            boxShadow: '0 8px 32px rgba(0,0,0,0.7)'
                        }
                    }
                }}
            >
                <DialogTitle sx={{ color: '#fff', borderBottom: '1px solid #444' }}>
                    {hasPasswordProvider ? '🔑 更改密碼' : '🔑 新增密碼'}
                </DialogTitle>
                
                <DialogContent sx={{ pt: 3 }}>
                    {passwordError && (
                        <Alert 
                            severity="error" 
                            sx={{ 
                                mb: 2,
                                bgcolor: 'rgba(244, 67, 54, 0.1)',
                                color: '#e57373',
                                border: '1px solid #f44336'
                            }}
                        >
                            {passwordError}
                        </Alert>
                    )}

                    <Stack spacing={2}>
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
                                    sx: { color: '#888' }
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

                <DialogActions sx={{ borderTop: '1px solid #444', p: 2 }}>
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
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                        }}
                    >
                        取消
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handlePasswordSubmit}
                        disabled={loading}
                        sx={{
                            bgcolor: '#ff9800',
                            '&:hover': { bgcolor: '#f57c00' }
                        }}
                    >
                        {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : '確認'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Settings;