import React, { useState, type JSX } from 'react';
import { Link } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    useTheme,
    useMediaQuery,
    Menu,
    MenuItem,
    CssBaseline,
    Divider,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    Alert,
    Stack,
    CircularProgress,
    DialogActions,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import ExitToApp from '@mui/icons-material/ExitToApp';
import LoginIcon from '@mui/icons-material/Login';
import { Google, Close, ArrowBack, Link as LinkIcon, Settings } from '@mui/icons-material';
import WoodBar from '../assets/wood_bar.png';

// 導入認證相關
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/AuthService';

const drawerWidth = 240;

const navItems = [
    { text: 'Word Guess', path: '/wordguess' },
    {
        text: '五十音表',
        type: 'kana',
        submenu: [
            { text: '清音', path: '/kanatable/seion' },
            { text: '濁音和半濁音', path: '/kanatable/dakuon&handakuon' },
            { text: '拗音', path: '/kanatable/youon' },
        ],
    },
    { text: 'Vocabulary', path: '/vocabulary/level' },
];

const NavigationBar = () : JSX.Element => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const { user } = useAuth();

    // 登入表單狀態
    //Login Step 1：Email 階段, Login Step 2：密碼階段
    const [loginStep, setLoginStep] = useState(1);
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailCheckLoading, setEmailCheckLoading] = useState(false);
    const [error, setError] = useState('');

    // Email 檢查結果狀態
    const [emailCheckResult, setEmailCheckResult] = useState<{
        exists: boolean;
        hasEmailProvider?: boolean;
    } | null>(null);

    const [showEmailVerificationDialog, setShowEmailVerificationDialog] = useState(false);
    const [verificationEmail, setVerificationEmail] = useState('');

    // 選單狀態
    const [kanaMenuAnchor, setKanaMenuAnchor] = useState<HTMLElement | null>(null);
    const [accountMenuAnchor, setAccountMenuAnchor] = useState<HTMLElement | null>(null);

    const [showGoogleSuggestionDialog, setShowGoogleSuggestionDialog] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // 共用的 TextField 樣式
    const textFieldSx = {
        '& .MuiInputLabel-root': {
            backgroundColor: 'white',
            paddingX: 1,
        },
        '& .MuiInputLabel-shrink': {
            backgroundColor: 'white',
            paddingX: 1,
        },
        '& .MuiOutlinedInput-input': {
            '&:-webkit-autofill': {
                WebkitTextFillColor: 'rgba(0, 0, 0, 0.87) !important',
            }
        }
    };

    const handleDrawerToggle = () => {
        setMobileOpen((prevState) => !prevState);
    };

    const handleKanaMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setKanaMenuAnchor(event.currentTarget);
    };

    const handleKanaMenuClose = () => {
        setKanaMenuAnchor(null);
    };

    const handleAccountMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAccountMenuAnchor(event.currentTarget);
    };

    const handleAccountMenuClose = () => {
        setAccountMenuAnchor(null);
    };

    // Firebase 登出功能
    const handleSignOut = async () => {
        try {
            await authService.signOut();
            handleAccountMenuClose();
        } catch (error) {
            console.error('登出失敗:', error);
        }
    };

    // 開啟登入模態框
    const handleGoToLogin = () => {
        setShowLoginModal(true);
        setLoginStep(1);
        setError('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setIsLogin(true);
        setEmailCheckResult(null);
    };

    // 關閉登入模態框
    const handleCloseLoginModal = () => {
        setShowLoginModal(false);
        setShowGoogleSuggestionDialog(false);
        setLoginStep(1);
        setError('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setLoading(false);
        setEmailCheckLoading(false);
        setEmailCheckResult(null);
    };

    const handleEmailContinue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError('請輸入電子郵件地址');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('請輸入有效的電子郵件地址');
            return;
        }

        console.log('🔍 開始檢查 Email:', email);
        setError('');
        setEmailCheckLoading(true);
        setEmailCheckResult(null);

        try {
            const accountStatus = await authService.checkEmailRegistrationStatus(email);
            console.log('📋 Email 檢查完整結果:', accountStatus);

            if (!accountStatus.exists) {
                // 完全新的用戶
                console.log('✅ 新用戶，允許註冊');
                setIsLogin(false);
                setLoginStep(2);
            } else {
                // 帳戶已存在 - 根據提供者決定
                console.log('⚠️ 帳戶已存在，分析登入方式...', {
                    hasEmail: accountStatus.hasEmailProvider,
                    hasGoogle: accountStatus.hasGoogleProvider,
                    providers: accountStatus.providers,
                    totalProviders: accountStatus.databaseInfo?.providerCount
                });
                
                if (accountStatus.hasEmailProvider) {
                    console.log('🔄 帳戶支持email登入方式，引導密碼登入');
                    setIsLogin(true);
                    setLoginStep(2);
                } else if(accountStatus.hasGoogleProvider) {
                    console.log('🔍 Email 已用 Google 註冊，提示用戶使用 Google 登入');
                    setError('');
                    setShowGoogleSuggestionDialog(true); // 顯示 Google 建議對話框
                    setEmailCheckLoading(false);
                    return;
                }
                else {
                    // 異常狀態
                    console.log('❓ 帳戶狀態異常');
                    setError('帳戶狀態異常，請聯繫客服');
                    setEmailCheckLoading(false);
                    return;
                }
            }

            setEmailCheckResult({
                exists: accountStatus.exists,
                hasEmailProvider: accountStatus.hasEmailProvider
            });

        } catch (error: any) {
            console.error('❌ Email 檢查失敗:', error);
            console.log('⚠️ 檢查失敗，允許用戶嘗試註冊作為備用方案');
            setIsLogin(false);
            setLoginStep(2);
        } finally {
            setEmailCheckLoading(false);
        }
    };

    // ✅ 修正：處理帳戶存在時的註冊嘗試
    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // ✅ 如果是註冊但帳戶已存在，提供連結選項
        if (!isLogin && emailCheckResult?.exists) {
            setError('此帳戶已存在並支援 Google 登入。您可以：\n1. 使用 Google 登入\n2. 連結此帳戶以同時支援密碼和 Google 登入');
            return;
        }
        
        if (!isLogin && password !== confirmPassword) {
            setError('密碼確認不相符');
            return;
        }

        if (password.length < 6) {
            setError('密碼至少需要6個字元');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                await authService.signInWithEmail(email, password);
                handleCloseLoginModal();
            } else {
                // ✅ 修改註冊處理
                const result = await authService.registerWithEmail(email, password);
                
                if (result.emailVerificationSent) {
                    // 關閉登入 modal
                    handleCloseLoginModal();
                    
                    // 顯示驗證 Email 通知
                    setVerificationEmail(email);
                    setShowEmailVerificationDialog(true);
                }
            }
        } catch (error: any) {
            console.error('❌ 認證失敗:', error);
            setError(getErrorMessage(error.code));
        } finally {
            setLoading(false);
        }
    };

    // ✅ 修正：返回第一步重新輸入 Email
    const handleBackToEmailInput = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setError('');
        setLoginStep(1);
        setIsLogin(true);
        setEmailCheckResult(null);
    };

    // 修正的 Google 登入處理 - 使用 4 個空格縮進
    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        
        try {
            console.log('🚀 開始 Google 登入...');
            await authService.signInWithGoogle();
            console.log('✅ Google 登入成功');
            handleCloseLoginModal();
        } catch (error: any) {
            console.log('❌ Google 登入遇到問題:', error);
            
            if (error.needsLinking) {
                console.log('🔗 檢測到需要帳戶連結:', error.email);
                console.log('📋 現有登入方式:', error.existingMethods);
                
                if (error.requiresPassword) {
                    // 需要密碼來連結帳戶
                    console.log('🔑 需要密碼驗證以連結帳戶');

                    handleCloseLoginModal();
                    
                    // 提供清楚的指引
                    setTimeout(() => {
                        console.log('💡 顯示帳戶連結提示');
                    }, 100);
                } else {
                    // 其他連結情況
                    console.log('❓ 未知的連結需求');
                    setError('帳戶連結失敗，請聯繫客服');
                }
            } else {
                // 處理其他 Google 登入錯誤
                console.log('🔍 處理 Google 登入的其他錯誤');
                switch (error.code) {
                    case 'auth/popup-closed-by-user':
                    case 'auth/cancelled-popup-request':
                        console.log('👤 用戶取消 Google 登入');
                        // 不顯示錯誤，用戶主動取消
                        break;
                    case 'auth/popup-blocked':
                        setError('彈出視窗被阻擋，請允許彈出視窗後重試');
                        break;
                    case 'auth/network-request-failed':
                        setError('網路連接失敗，請檢查網路後重試');
                        break;
                    case 'auth/account-exists-with-different-credential':
                        // 這種情況應該被 needsLinking 捕獲，但作為備用
                        setError('此 Email 已有其他登入方式，請使用原本的方式登入');
                        break;
                    default:
                        setError('Google 登入失敗，請稍後重試');
                        console.error('🔥 Google 登入未知錯誤:', error);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    // 返回第一步
    const handleBackToEmail = () => {
        setLoginStep(1);
        setError('');
        setPassword('');
        setConfirmPassword('');
        setIsLogin(true);
        // 保留 emailCheckResult，因為用戶可能只是想切換登入/註冊
    };

    // 錯誤訊息處理
    const getErrorMessage = (errorCode: string): string => {
        switch (errorCode) {
            // ✅ 註冊錯誤
            case 'auth/email-already-in-use':
                setIsLogin(true); // 自動切換到登入模式
                return '此電子郵件已被註冊，請嘗試登入或使用其他電子郵件。';
            case 'auth/weak-password':
                return '密碼強度太弱，請設定至少 6 個字元的密碼。';
            // ✅ 主要的登入/認證錯誤（現代 Firebase 主要錯誤）
            case 'auth/invalid-credential':
                return 'Email 或密碼錯誤，請確認後重試。';
                //setShowForgotPassword(true); // 顯示忘記密碼選項
            // ✅ 格式錯誤
            case 'auth/invalid-email':
                return '電子郵件格式無效，請輸入正確的 Email 格式。';
            // ✅ 限制和安全錯誤
            case 'auth/too-many-requests':
                return '嘗試次數過多，請稍後再試或重設密碼。';
            case 'auth/user-disabled':
                return '此帳戶已被停用，請聯繫客服。';
            // ✅ 網路和服務錯誤
            case 'auth/network-request-failed':
                return '網路連線失敗，請檢查網路後重試。';
            case 'auth/operation-not-allowed':
                return '此登入方式尚未啟用，請聯繫客服。';
            // ✅ 社交登入錯誤（如果有使用 Google 登入）
            case 'auth/account-exists-with-different-credential':
                return '此 Email 已使用其他方式註冊，請嘗試 Google 登入。';
            // ✅ 預設錯誤
            default:
                console.error('未處理的 Firebase 錯誤:', errorCode);
                return (isLogin ? '登入失敗，請稍後再試。' : '註冊失敗，請稍後再試。');
        }
    };

    // 切換登入/註冊模式
    const switchMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setPassword('');
        setConfirmPassword('');
    };

    const drawer = (
        <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ my: 2 }}>
                Ace Playground
            </Typography>
            <Divider />
            <List>
                {navItems.map((item) => {
                    if (item.submenu) {
                        return item.submenu.map((sub) => (
                            <ListItem key={sub.text} disablePadding>
                                <ListItemButton component={Link} to={sub.path} sx={{ textAlign: 'center' }}>
                                    <ListItemText primary={`${item.text} - ${sub.text}`} />
                                </ListItemButton>
                            </ListItem>
                        ));
                    } else {
                        return (
                            <ListItem key={item.text} disablePadding>
                                <ListItemButton component={Link} to={item.path} sx={{ textAlign: 'center' }}>
                                    <ListItemText primary={item.text} />
                                </ListItemButton>
                            </ListItem>
                        );
                    }
                })}
            </List>

            {/* 手機版登入/用戶資訊 */}
            <Divider />
            <Box sx={{ p: 2 }}>
                {user ? (
                    <>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            {user.displayName || user.email}
                        </Typography>
                        <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={handleSignOut}
                            startIcon={<ExitToApp />}
                        >
                            登出
                        </Button>
                    </>
                ) : (
                    <Button 
                        variant="outlined" 
                        size="small" 
                        onClick={handleGoToLogin}
                        startIcon={<LoginIcon />}
                    >
                        登入
                    </Button>
                )}
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />

            <AppBar
                component="nav"
                sx={{
                    backgroundImage: `url(${WoodBar})`,
                    backgroundColor: '#242424',
                    backgroundRepeat: 'repeat',
                    backgroundSize: 'auto',
                    imageRendering: 'pixelated',
                    backgroundPosition: 'top left',
                    color: '#fff',
                }}
            >
                <Toolbar
                    sx={{
                        minHeight: { xs: 56, sm: 64 },
                        paddingLeft: { xs: 2, sm: 3 },
                        paddingRight: { xs: 2, sm: 3 },
                    }}
                >
                    {isMobile && (
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ 
                                mr: 2,
                                ml: -1,
                            }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                    
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{ 
                            flexGrow: 1, 
                            display: { xs: 'none', sm: 'block' },
                            marginLeft: { sm: isMobile ? 0 : -1 }
                        }}
                    >
                        Ace Playground
                    </Typography>

                    {/* 桌面版導航選單 */}
                    <Box sx={{ 
                        display: { xs: 'none', sm: 'flex' }, 
                        gap: 2,
                        alignItems: 'center',
                        height: 48,
                    }}>
                        {navItems.map((item) => {
                            if (item.submenu) {
                                return (
                                    <React.Fragment key={item.text}>
                                        <Button 
                                            sx={{ 
                                                color: '#fff',
                                                height: 36,
                                                minWidth: 'auto',                                         
                                            }} 
                                            onClick={handleKanaMenuOpen}
                                        >
                                            {item.text}
                                        </Button>
                                        <Menu
                                            anchorEl={kanaMenuAnchor}
                                            open={Boolean(kanaMenuAnchor)}
                                            onClose={handleKanaMenuClose}
                                            anchorOrigin={{
                                                vertical: 'bottom',
                                                horizontal: 'center',
                                            }}
                                            transformOrigin={{
                                                vertical: 'top',
                                                horizontal: 'center',
                                            }}
                                            slotProps={{
                                                paper: {
                                                    sx: {
                                                        mt: 1,
                                                        minWidth: 150,
                                                        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                                                        borderRadius: 2,
                                                    }
                                                }
                                            }}
                                        >
                                            {item.submenu.map((sub) => (
                                                <MenuItem
                                                    key={sub.text}
                                                    component={Link}
                                                    to={sub.path}
                                                    onClick={handleKanaMenuClose}
                                                >
                                                    {sub.text}
                                                </MenuItem>
                                            ))}
                                        </Menu>
                                    </React.Fragment>
                                );
                            } else {
                                return (
                                    <Button
                                        key={item.text}
                                        component={Link}
                                        to={item.path}
                                        sx={{ 
                                            color: '#fff',
                                            height: 36,
                                            minWidth: 'auto',                                       
                                        }}
                                    >
                                        {item.text}
                                    </Button>
                                );
                            }
                        })}
                    </Box>

                    {/* 桌面版登入/用戶資訊區域 */}
                    <Box sx={{ 
                        display: { xs: 'none', sm: 'flex' }, 
                        alignItems: 'center', 
                        gap: 1,
                        height: 48,
                    }}>
                        {user ? (
                            <>
                                <Typography variant="body2" sx={{ display: { xs: 'none', md: 'block' } }}>
                                    {user.displayName || user.email}
                                </Typography>

                                <IconButton
                                    size="large"
                                    edge="end"
                                    color="inherit"
                                    onClick={handleAccountMenuOpen}
                                    sx={{
                                        width: 40,
                                        height: 40,
                                    }}
                                >
                                    {user.photoURL ? (
                                        <Avatar 
                                            src={user.photoURL} 
                                            sx={{ width: 32, height: 32 }} 
                                        />
                                    ) : (
                                        <AccountCircle />
                                    )}
                                </IconButton>

                                <Menu
                                    anchorEl={accountMenuAnchor}
                                    open={Boolean(accountMenuAnchor)}
                                    onClose={handleAccountMenuClose}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'center',
                                    }}
                                    transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'center',
                                    }}
                                    slotProps={{
                                        paper: {
                                            sx: {
                                                mt: 1,
                                                minWidth: 200,
                                                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                                                borderRadius: 2,
                                            }
                                        }
                                    }}
                                >
                                    <MenuItem disabled>
                                        <Box>
                                            <Typography variant="subtitle2">
                                                {user.displayName || '用戶'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {user.email}
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                    <Divider />

                                    <MenuItem 
                                        component={Link} 
                                        to="/settings"
                                        onClick={handleAccountMenuClose}
                                    >
                                        <Settings sx={{ mr: 1 }} />
                                        設定
                                    </MenuItem>
                                    <Divider />
                                    <MenuItem onClick={handleSignOut}>
                                        <ExitToApp sx={{ mr: 1 }} />
                                        登出
                                    </MenuItem>
                                </Menu>
                            </>
                        ) : (
                            <Button 
                                variant="outlined" 
                                sx={{ 
                                    color: '#fff', 
                                    borderColor: '#fff',
                                    '&:hover': { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' },
                                    height: 36,
                                }}
                                startIcon={<LoginIcon />}
                                onClick={handleGoToLogin}
                            >
                                登入
                            </Button>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>

            {/* 手機版 Drawer */}
            <Box component="nav">
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* 登入模態框 */}
            <Dialog 
                open={showLoginModal} 
                onClose={(_, reason) => {
                    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
                        return;
                    }
                    handleCloseLoginModal();
                }}
                maxWidth="sm"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 2,
                            p: 1
                        }
                    }
                }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {loginStep === 2 && (
                                <IconButton onClick={handleBackToEmail} sx={{ mr: 1 }}>
                                    <ArrowBack />
                                </IconButton>
                            )}
                            <Typography variant="h5">
                                {loginStep === 1 ? '登入或建立帳號' : (isLogin ? '登入' : '建立帳號')}
                            </Typography>
                        </Box>
                        <IconButton onClick={handleCloseLoginModal} size="small">
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                
                <DialogContent sx={{ pb: 3 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
                            {error}
                        </Alert>
                    )}

                    {/* 第一步：輸入Email + Google登入 */}
                    {loginStep === 1 && (
                        <>
                            <form onSubmit={handleEmailContinue}>
                                <Stack spacing={3} sx={{ mt: 1 }}>
                                    <TextField
                                        fullWidth
                                        type="email"
                                        label="電子郵件"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={emailCheckLoading || loading}
                                        variant="outlined"
                                        sx={textFieldSx}
                                        autoFocus
                                    />

                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        disabled={emailCheckLoading || loading}
                                        sx={{ py: 1.5 }}
                                        startIcon={emailCheckLoading ? <CircularProgress size={20} /> : undefined}
                                    >
                                        {emailCheckLoading ? '檢查中...' : '繼續'}
                                    </Button>
                                </Stack>
                            </form>

                            <Divider sx={{ my: 3 }}>或</Divider>

                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<Google />}
                                onClick={handleGoogleSignIn}
                                disabled={loading || emailCheckLoading}
                                sx={{ py: 1.5 }}
                            >
                                使用 Google 登入
                            </Button>
                        </>
                    )}

                    {/* 第二步：密碼輸入 */}
                    {loginStep === 2 && (
                        <>
                            {/* Email 資訊顯示 */}
                            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {email}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {isLogin ? '請輸入密碼登入' : '請建立密碼完成註冊'}
                                </Typography>
                                
                                {/* ✅ 修正：返回重新輸入 Email 按鈕 */}
                                <Box sx={{ mt: 1 }}>
                                    <Button
                                        variant="text"
                                        size="small"
                                        onClick={handleBackToEmailInput}
                                        sx={{ textDecoration: 'underline' }}
                                    >
                                        使用其他電子郵件
                                    </Button>
                                </Box>
                                {/* 
                                {/* ✅ 顯示帳戶已存在且支援 Google 的提示
                                {!isLogin && emailCheckResult?.exists && (
                                    <Alert severity="info" sx={{ mt: 1, py: 0.5 }}>
                                        <Typography variant="caption">
                                            此帳戶已支援 Google 登入。建立密碼後，您可同時使用 Google 和密碼登入。
                                        </Typography>
                                    </Alert>
                                )}
                                */}
                            </Box>

                            <form onSubmit={handleAuthSubmit}>
                                <Stack spacing={3}>
                                    <TextField
                                        fullWidth
                                        type="password"
                                        label={isLogin ? "密碼" : "建立密碼"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        variant="outlined"
                                        helperText={!isLogin ? "至少 6 個字元" : ""}
                                        sx={textFieldSx}
                                        autoFocus
                                    />

                                    {!isLogin && (
                                        <TextField
                                            fullWidth
                                            type="password"
                                            label="確認密碼"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            disabled={loading}
                                            variant="outlined"
                                            sx={textFieldSx}
                                        />
                                    )}

                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        disabled={loading}
                                        sx={{ py: 1.5 }}
                                    >
                                        {loading ? (isLogin ? '登入中...' : '建立帳號中...') : (isLogin ? '登入' : '建立帳號')}
                                    </Button>
                                </Stack>
                            </form>
                            
                            {/* ✅ 修正：建立新帳號按鈕返回第一步 */}
                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                {isLogin ? (
                                    <Button
                                        variant="text"
                                        onClick={switchMode}
                                        disabled={loading}
                                        size="small"
                                    >
                                        需要建立新帳號？
                                    </Button>
                                ) : (
                                    <Button
                                        variant="text"
                                        onClick={handleBackToEmailInput}
                                        disabled={loading}
                                        size="small"
                                    >
                                        已經有帳號？
                                    </Button>
                                )}
                            </Box>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* ✅ 在這裡加入 Email 驗證通知 Dialog */}
            <Dialog 
                open={showEmailVerificationDialog} 
                onClose={() => setShowEmailVerificationDialog(false)}
                maxWidth="sm"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 2,
                            p: 1
                        }
                    }
                }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box 
                            sx={{ 
                                width: 48, 
                                height: 48, 
                                borderRadius: '50%', 
                                bgcolor: 'success.light',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            ✅
                        </Box>
                        <Typography variant="h6">
                            註冊成功！
                        </Typography>
                    </Box>
                </DialogTitle>
                
                <DialogContent sx={{ pb: 2 }}>
                    <Alert severity="success" sx={{ mb: 2 }}>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>帳戶建立成功！</strong>
                        </Typography>
                        <Typography variant="body2">
                            我們已發送驗證郵件到：
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {verificationEmail}
                        </Typography>
                    </Alert>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        請檢查您的電子郵箱（包括垃圾郵件資料夾），並點擊驗證連結以啟用您的帳戶。
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                        💡 <strong>提示：</strong>驗證 Email 後，您就可以同時使用 Google 和密碼登入了！
                    </Typography>
                </DialogContent>
                
                <DialogActions>
                    <Button 
                        onClick={() => setShowEmailVerificationDialog(false)} 
                        variant="contained"
                        fullWidth
                    >
                        我知道了
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog 
                open={showGoogleSuggestionDialog} 
                onClose={() => setShowGoogleSuggestionDialog(false)}
                maxWidth="sm"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 2,
                            p: 1
                        }
                    }
                }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box 
                            sx={{ 
                                width: 48, 
                                height: 48, 
                                borderRadius: '50%', 
                                bgcolor: 'primary.light',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Google sx={{ color: 'white', fontSize: 24 }} />
                        </Box>
                        <Typography variant="h6">
                            此 Email 已註冊
                        </Typography>
                    </Box>
                    <IconButton 
                        onClick={() => setShowGoogleSuggestionDialog(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                
                <DialogContent sx={{ pb: 2 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>{email}</strong> 已使用 Google 帳戶註冊
                        </Typography>
                        <Typography variant="body2">
                            請使用 Google 登入以存取您的帳戶
                        </Typography>
                    </Alert>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        如果您想使用密碼登入，請使用其他 Email 地址註冊。
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                        💡 <strong>提示：</strong>使用 Google 登入更快速且安全！
                    </Typography>
                </DialogContent>
                
                <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 3 }}>
                    <Button 
                        variant="contained"
                        fullWidth
                        startIcon={<Google />}
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        sx={{ py: 1.5 }}
                    >
                        {loading ? '登入中...' : '使用 Google 登入'}
                    </Button>
                    
                    <Button 
                        variant="outlined"
                        fullWidth
                        onClick={() => {
                            setShowGoogleSuggestionDialog(false);
                            // 清空 Email 讓用戶重新輸入
                            setEmail('');
                            setLoginStep(1);
                        }}
                        sx={{ py: 1 }}
                    >
                        使用其他 Email
                    </Button>
                    
                    <Button 
                        variant="text"
                        size="small"
                        onClick={() => setShowGoogleSuggestionDialog(false)}
                        sx={{ mt: 1 }}
                    >
                        取消
                    </Button>
                </DialogActions>
            </Dialog>



        </Box>
    );
};

export default NavigationBar;