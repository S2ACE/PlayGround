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
    ListItemButton,
    ListItemText,
    useTheme,
    useMediaQuery,
    Menu,
    MenuItem,
    CssBaseline,
    Divider,
    Avatar,
    Stack,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import ExitToApp from '@mui/icons-material/ExitToApp';
import LoginIcon from '@mui/icons-material/Login';
import { Settings } from '@mui/icons-material';
import WoodBar from '../assets/wood_bar.png';
// 導入認證相關
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/AuthService';

import AuthDialog from '../components/auth/AuthDialog'

type NavigationBarProps = {
	isDark: boolean;
	setIsDark: (value: boolean) => void;
};

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

const NavigationBar = ({ isDark, setIsDark }: NavigationBarProps) : JSX.Element => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const { user } = useAuth();

    // 選單狀態
    const [kanaMenuAnchor, setKanaMenuAnchor] = useState<HTMLElement | null>(null);
    const [accountMenuAnchor, setAccountMenuAnchor] = useState<HTMLElement | null>(null);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));



    const handleToggleTheme = async () => {
        const next = !isDark;
        setIsDark(next);

        localStorage.setItem('theme', next ? 'dark' : 'light');

        if (user) {
            try {
                await authService.updateDarkMode(next);
            } catch (e) {
                console.error('更新 darkMode 失敗:', e);
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
    };

    // 關閉登入模態框
    const handleCloseLoginModal = () => {
        setShowLoginModal(false);
    };

    //mobile drawer
    const drawer = (
    <Box
        sx={{
            bgcolor: (theme) => theme.palette.background.default,
            color: (theme) => theme.palette.text.primary,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
        }}
    >
        {/* 上方帳戶區塊（只留 avatar + 名稱） */}
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 1.5,
                bgcolor: (theme) => theme.palette.background.paper,
            }}
        >
        <Avatar
            src={user?.photoURL || undefined}
            sx={{ width: 40, height: 40, mr: 1.5 }}
        >
            {user?.displayName?.[0]?.toUpperCase() ||
                user?.email?.[0]?.toUpperCase() ||
                'A'}
        </Avatar>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
                variant="body1"
                sx={{
                    color: (theme) => theme.palette.text.primary,
                    fontSize: '0.95rem',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                }}
            >
            {user ? (user.displayName || user.email) : '未登入'}
            </Typography>
        </Box>
        </Box>

        <Divider sx={(theme) => ({ borderColor: theme.palette.share.divider })} />

        {/* 中間：導航清單，一格格 + 置中文字 */}
        <List sx={{ py: 0 }}>
        {navItems.map((item) =>
            item.submenu ? (
            item.submenu.map((sub) => (
                <ListItemButton
                key={sub.path}
                component={Link}
                to={sub.path}
                onClick={handleDrawerToggle}
                sx={{
                    px: 2,
                    py: 1.2,
                    color: (theme) => theme.palette.text.primary,
                    justifyContent: 'center',           // 讓內容置中
                    textAlign: 'center',
                    borderBottom: (theme) =>
                    `1px solid ${theme.palette.secondary.main}`, // 每項底部一條線
                }}
                >
                    <ListItemText
                        primary={sub.text}
                        slotProps={{
                            primary: {
                            sx: {
                                fontSize: '0.95rem',
                                textAlign: 'center',
                            },
                            },
                        }}
                    />
                </ListItemButton>
            ))
            ) : (
            <ListItemButton
                key={item.path}
                component={Link}
                to={item.path}
                onClick={handleDrawerToggle}
                sx={(theme) => ({
                    px: 2,
                    py: 1.2,
                    color: theme.palette.text.primary,
                    justifyContent: 'center',
                    textAlign: 'center',
                    borderBottom: `1px solid ${theme.palette.secondary.main}`,
                })}
            >
                <ListItemText
                    primary={item.text}
                    slotProps={{
                        primary: {
                        sx: {
                            fontSize: '0.95rem',
                            textAlign: 'center',
                        },
                        },
                    }}
                />
            </ListItemButton>
            ),
        )}
        </List>

        <Box sx={{ flexGrow: 1 }} />

        {/* 底部：登入 / 登出 + 主題切換（沿用你的樣式） */}
        <Box>
        <Divider sx={(theme) => ({ borderColor: theme.palette.share.divider })} />
        <Box sx={{ p: 2, bgcolor: (theme) => theme.palette.background.paper }}>
            {user ? (
            <Stack spacing={1} alignItems="stretch">
                <Button
                variant="outlined"
                size="small"
                component={Link}
                to="/settings"
                onClick={handleDrawerToggle}
                startIcon={<Settings />}
                sx={{
                    color: (theme) => theme.palette.text.primary,
                    borderColor: (theme) => theme.palette.share.divider,
                }}
                >
                設定
                </Button>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={handleSignOut}
                    startIcon={<ExitToApp />}
                    sx={{
                        color: (theme) => theme.palette.error.main,
                        borderColor: (theme) => theme.palette.error.main,
                    }}
                >
                登出
                </Button>
            </Stack>
            ) : (
            <Stack spacing={1} alignItems="stretch">
                <Button
                    variant="outlined"
                    size="small"
                    onClick={handleGoToLogin}
                    startIcon={<LoginIcon />}
                    sx={{
                        borderColor: (theme) => theme.palette.share.divider,
                        color: (theme) => theme.palette.text.primary,
                    }}
                >
                登入
                </Button>
            </Stack>
            )}

            <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={handleToggleTheme}
                sx={{
                    mt: 2,
                    color: (theme) => theme.palette.text.primary,
                    borderColor: (theme) => theme.palette.share.divider,
                    fontSize: '0.85rem',
                }}
            >
            {isDark ? '☀️ LIGHT' : '🌙 DARK'}
            </Button>
        </Box>
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
                    <Box sx={{ display: 'flex', flexGrow: 1 }}>
                        <Typography
                            variant="h6"
                            component="div"
                            sx={{ 
                                display: { xs: 'none', sm: 'block' },
                                marginLeft: { sm: isMobile ? 0 : -1 }
                            }}
                        >
                            Ace Playground
                        </Typography>
                        <Button
                            sx={{ 
                                ml: 2, color: 'inherit', 
                                borderColor: 'inherit',
                                display: { xs: 'none', sm: 'inline-flex' },
                                fontSize: { xs: '0.85rem', sm: '0.95rem' },
                            }}
                            onClick={handleToggleTheme}
                        >
                            {isDark ? '☀️ Light' : '🌙 Dark'}
                        </Button>
                    </Box>   
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
                                                fontSize: { xs: '0.85rem', sm: '0.95rem' },
                                                textTransform: 'uppercase',                                      
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
                                                    sx={{ 
                                                        color: 'text.primary',
                                                        fontSize: { xs: '0.85rem', sm: '1rem' },
                                                        textTransform: 'uppercase',
                                                    }}
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
                                            fontSize: { xs: '0.85rem', sm: '0.95rem' },
                                            textTransform: 'uppercase',                                               
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
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        display: { xs: 'none', md: 'block' },
                                        fontSize: { xs: '0.85rem', sm: '1rem' },
                                        ml: 1
                                        }}>
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
                                            <Typography 
                                                variant="subtitle2"
                                                color="text.primary"
                                                sx={{ 
                                                    fontSize: { xs: '0.85rem', sm: '0.9rem' }
                                                }}
                                            >
                                                {user.displayName || '用戶'}
                                            </Typography>
                                            <Typography 
                                                variant="body2" 
                                                color="text.primary"
                                                sx={{ fontSize: { xs: '0.85rem', sm: '0.85rem' } }}
                                            >
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
                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                    color: '#fff',
                                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                    textTransform: 'none',
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

            <AuthDialog open={showLoginModal} onClose={handleCloseLoginModal} />
        </Box>
    );
};

export default NavigationBar;