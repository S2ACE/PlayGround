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
import AvatarEditor from 'react-avatar-editor';

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
    const [avatarUploading, setAvatarUploading] = useState(false);

    const hasGoogleProvider = user?.providerData.some(p => p.providerId === 'google.com');
    const hasPasswordProvider = user?.providerData.some(p => p.providerId === 'password');
    const googleEmail = user?.providerData.find(p => p.providerId === 'google.com')?.email;
    //avater
    const [showCropDialog, setShowCropDialog] = useState(false);
    const [rawImage, setRawImage] = useState<File | null>(null);
    const [editorScale, setEditorScale] = useState(2);
    const [editor, setEditor] = useState<AvatarEditor | null>(null);

    const textFieldSx = {
        '& .MuiInputLabel-root': {
            paddingX: 1,
            color: 'text.primary'
        },
        '& .MuiInputLabel-shrink': {
            paddingX: 1,
            color: 'primary.light'
        },
        '& .MuiOutlinedInput-root': {
            color: 'text.primary',
            '& fieldset': {
                borderColor: '#555',
            },
            '&:hover fieldset': {
                borderColor: '#888',
            },
            '&.Mui-focused fieldset': {
                borderColor: 'primary.light',
            },
            '& .MuiInputBase-input': {
            fontSize: { xs: '1rem', sm: '1.3rem' },
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

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSuccess('');
        setError('');

        // 檔案型別限制
        if (!file.type.startsWith('image/')) {
            setError('請上傳圖片檔案');
            e.target.value = '';
            return;
        }

        // 檔案大小限制
        if (file.size > 5 * 1024 * 1024) {
            setError('圖片大小請小於 5MB');
            e.target.value = '';
            return;
        }

        setRawImage(file);
        setEditorScale(2);
        setShowCropDialog(true);

        // 允許再次選同一檔
        e.target.value = '';
    };


    const handleConfirmCrop = async () => {
        if (!editor) return;

        setSuccess('');
        setError('');

        try {
            setAvatarUploading(true);
            setError('');
            setSuccess('');

            const canvas = editor.getImageScaledToCanvas();

            const blob: Blob | null = await new Promise((resolve) =>
                canvas.toBlob((b) => resolve(b), 'image/png')
            );

            if (!blob) {
                throw new Error('產生頭像失敗，請稍後再試');
            }

            const file = new File([blob], 'avatar.png', { type: 'image/png' });

            await authService.updateAvatar(file);
            await refreshUser();
            setSuccess('✓ 頭像已更新');
            setShowCropDialog(false);
            setRawImage(null);
        } catch (err: any) {
            setError(err.message || '更新頭像失敗，請稍後再試');
        } finally {
            setAvatarUploading(false);
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
                        color: 'text.primary',
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
                <Paper sx={(theme) => ({
                    bgcolor: 'background.paper',
                    p: { xs: 2, sm: 3 },
                    mb: { xs: 2, sm: 3 },
                    border: '2px solid',
                    borderRadius: 2,
                    borderColor: theme.palette.wordGuess.buttonBorder, 
                })}>
                    <Typography
                        variant="h6"
                        sx={{
                            mb: { xs: 2, sm: 3 },
                            color: 'primary.light',
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
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Avatar
                            src={user.photoURL || undefined}
                            sx={(theme) => ({
                                width: { xs: 64, sm: 72 },
                                height: { xs: 64, sm: 72 },
                                bgcolor: theme.palette.primary.light,
                                color: theme.palette.text.primary,
                                fontSize: { xs: '1.4rem', sm: '1.7rem' },
                            })}
                        >
                            {displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                        </Avatar>

                        <Button
                            component="label"
                            variant="text"
                            disabled={avatarUploading}
                            sx={(theme) => ({
                                color: 'primary.light',
                                fontSize: { xs: '0.8rem', sm: '0.85rem' },
                                '&:hover': { bgcolor: theme.palette.button.hover },
                            })}
                        >
                            {avatarUploading ? '上傳中...' : '更換頭像'}
                            <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
                        </Button>
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            sx={{
                                color: 'text.primary',
                                fontWeight: 'bold',
                                fontSize: { xs: '0.95rem', sm: '1rem' },
                                wordBreak: 'break-all',
                            }}
                            >
                            {user?.email}
                        </Typography>
                        <Chip
                            label={user?.emailVerified ? '✓ Email 已驗證' : '⚠ Email 未驗證'}
                            size="small"
                            sx={{
                                mt: 1,
                                bgcolor: user?.emailVerified ? 'success.main' : 'primary.main',
                                color: 'white',
                                fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                            }}
                        />
                    </Box>
                    </Stack>


                    <Divider sx={(theme) => ({ my: { xs: 2, sm: 3 }, borderColor: theme.palette.primary.light })} />

                    {/* 顯示名稱 */}
                    <Box>
                        <Typography
                            sx={{
                                color: 'text.primary',
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
                                        sx={(theme) => ({
                                            bgcolor: theme.palette.primary.light,
                                            '&:hover': { bgcolor: theme.palette.primary.dark },
                                            fontSize: { xs: '0.875rem', sm: '0.9375rem' }
                                        })}
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
                                            backgroundColor: 'secondary.main',
                                            borderColor: '#555',
                                            color: 'text.primary',
                                            '&:hover': { borderColor: '#888', backgroundColor: 'secondary.dark' },
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
                                        color: 'text.primary',
                                        fontSize: { xs: '0.95rem', sm: '1rem' }
                                    }}
                                >
                                    {displayName || '未設定'}
                                </Typography>
                                <Button
                                    variant="text"
                                    onClick={() => setEditing(true)}
                                    startIcon={<Edit />}
                                    sx={(theme) => ({
                                        color: 'primary.light',
                                        '&:hover': { bgcolor: theme.palette.button.hover },
                                        fontSize: { xs: '0.875rem', sm: '0.9375rem' }
                                    })}
                                >
                                    編輯
                                </Button>
                            </Stack>
                        )}
                    </Box>
                </Paper>

                {/* 登入方式區塊 */}
                <Paper sx={(theme) => ({
                    bgcolor: 'background.paper',
                    p: { xs: 2, sm: 3 },
                    border: '2px solid',
                    borderRadius: 2,
                    borderColor: theme.palette.wordGuess.buttonBorder,
                })}>
                    <Typography
                        variant="h6"
                        sx={{
                            mb: { xs: 2, sm: 3 },
                            color: 'primary.light',
                            fontSize: { xs: '1.1rem', sm: '1.25rem' }
                        }}
                    >
                        🔐 登入方式
                    </Typography>

                    {/* Google 綁定 */}
                    {hasGoogleProvider && (
                        <Box
                            sx={(theme) => ({
                                bgcolor: theme.palette.paper.background,
                                border: '1px solid',
                                borderColor: 'primary.main',
                                borderRadius: 1,
                                p: { xs: 1.5, sm: 2 },
                                mb: { xs: 2, sm: 3 }
                            })}
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
                                        color: 'text.primary',
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
                                        bgcolor: 'success.main',
                                        color: 'white',
                                        fontSize: { xs: '0.75rem', sm: '0.8125rem' }
                                    }}
                                />
                            </Stack>
                        </Box>
                    )}

                    {/* ✅ 密碼設定 - 加上 Box 黑色框層 */}
                    <Box
                        sx={(theme) => ({
                            bgcolor: theme.palette.paper.background,
                            border: '1px solid',
                            borderColor: 'primary.main',
                            borderRadius: 1,
                            p: { xs: 1.5, sm: 2 }
                        })}
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
                                    color: 'text.primary',
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
                                    backgroundColor: 'primary.light',

                                    color: 'primary.contrastText',
                                    '&:hover': {
                                        backgroundColor: 'primary.dark',
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
                            sx:(theme) => ({
                                backgroundColor: theme.palette.background.default,
                                border: '1px solid #444',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
                                m: { xs: 2, sm: 3 }
                            }
                        )}
                    }}
                >
                    <DialogTitle
                        sx={{
                            color: 'text.primary',
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
                                        sx: { color: 'text.primary', fontSize: { xs: '0.75rem', sm: '0.875rem' } }
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
                                backgroundColor: 'secondary.main',
                                color: 'text.primary',
                                '&:hover': { backgroundColor: 'secondary.dark' },
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
                                backgroundColor: 'primary.light',
                                '&:hover': { backgroundColor: 'primary.dark' },
                                fontSize: { xs: '0.875rem', sm: '0.9375rem' }
                            }}
                        >
                            {loading ? <CircularProgress size={20} /> : '確認'}
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog
                    open={showCropDialog}
                    onClose={(_, reason) => {
                        if (reason === 'backdropClick') return;
                        if (!avatarUploading) {
                            setShowCropDialog(false);
                            setRawImage(null);
                        }
                    }}
                    fullWidth
                    maxWidth="sm"
                    slotProps={{
                        paper: {
                            sx: {
                                m: { xs: 1.5, sm: 3 },
                                width: '100%',
                                maxWidth: { xs: '100%', sm: 600 },
                            },
                        },
                    }}
                >
                    <DialogTitle
                        sx={{
                            fontSize: { xs: '1.1rem', sm: '1.25rem' },
                        }}
                    >
                        調整頭像位置
                    </DialogTitle>

                    <DialogContent
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                            minHeight: { xs: 260, sm: 320 },
                            pt: { xs: 1, sm: 2 },
                        }}
                    >
                        {/* 裁剪區：touchAction 只包住 AvatarEditor，手機可拖動 */}
                        <Box 
                            sx={{ touchAction: 'none' }}
                            onTouchMove={(e) => e.preventDefault()}
                        >
                            {rawImage && (
                                <AvatarEditor
                                    ref={(ref: AvatarEditor | null) => setEditor(ref)}
                                    image={rawImage}
                                    width={120}
                                    height={120}
                                    border={80}
                                    borderRadius={120}
                                    color={[0, 0, 0, 0.6]}
                                    scale={editorScale}
                                    rotate={0}
                                />
                            )}
                        </Box>

                        {/* 縮放控制條 */}
                        <Box sx={{ width: '100%', px: { xs: 1, sm: 3 } }}>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'text.primary',
                                    mb: 1,
                                    fontSize: { xs: '0.8rem', sm: '1.0rem' },
                                }}
                            >
                                縮放
                            </Typography>
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.01}
                                value={editorScale}
                                onChange={(e) => setEditorScale(Number(e.target.value))}
                                style={{ width: '100%' }}
                            />
                        </Box>
                    </DialogContent>

                    <DialogActions
                        sx={{
                            px: { xs: 2, sm: 3 },
                            pb: { xs: 2, sm: 3 },
                            gap: 1,
                        }}
                    >
                        <Button
                            onClick={() => {
                                if (avatarUploading) return;
                                setShowCropDialog(false);
                                setRawImage(null);
                            }}
                            disabled={avatarUploading}
                            sx={(theme) => ({ 
                                fontSize: { xs: '0.875rem', sm: '1.0rem', 
                                '&:hover': {
                                    backgroundColor: theme.palette.button.hover,
                                }} 
                            })}
                        >
                            取消
                        </Button>
                        <Button
                            onClick={handleConfirmCrop}
                            disabled={avatarUploading}
                            variant="contained"
                            sx={{ 
                                fontSize: { xs: '0.875rem', sm: '1.0rem' },
                                backgroundColor: 'primary.light',
                                '&:hover': {
                                    backgroundColor: 'primary.dark',
                                }
                            }}
                        >
                            {avatarUploading ? <CircularProgress size={20} /> : '使用這個範圍'}
                        </Button>
                    </DialogActions>
                </Dialog>




            </Box>
        </Box>
    );
};

export default Settings;
