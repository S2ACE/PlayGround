import React, { useState } from 'react';
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
    Switch,
    FormControlLabel,
    Menu,
    MenuItem,
    CssBaseline,
    Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import WoodBar from '../assets/wood_bar.png';

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
    { text: 'Vocabulary', path: '/vocabulary' },
];


const NavigationBar = () => {
    const [mobileOpen, setMobileOpen] = useState(false); //mobile drawer state
    const [auth, setAuth] = useState(true);

    //menu
    const [menuState, setMenuState] = useState<{
        type: string | null;
        anchorEl: HTMLElement | null;
    }>({ type: null, anchorEl: null });

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleDrawerToggle = () => {
        setMobileOpen((prevState) => !prevState);
    };

    const handleAuthToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAuth(event.target.checked);
        setMenuState({ type: null, anchorEl: null });
    };

    const handleMenuOpen = (type: string) => (event: React.MouseEvent<HTMLElement>) => {
    setMenuState({ type, anchorEl: event.currentTarget });
    };


    const handleMenuClose = () => {
        setMenuState({ type: null, anchorEl: null });
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
        <Toolbar>
            {isMobile && (
            <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, }}
            >
                <MenuIcon />
            </IconButton>
            )}
            <Typography
                variant="h6"
                component="div"
                sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
                >
                Ace Playground
            </Typography>

            <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 2 }}>
                {navItems.map((item) => {
                    if (item.submenu) {
                        return (
                            <React.Fragment key={item.text}>
                                <Button sx={{ color: '#fff' }} onClick={handleMenuOpen(item.type || item.text)}>
                                {item.text}
                                </Button>
                                <Menu
                                    anchorEl={menuState.anchorEl}
                                    open={menuState.type === (item.type || item.text)}
                                    onClose={handleMenuClose}
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                >
                                {item.submenu.map((sub) => (
                                    <MenuItem
                                        key={sub.text}
                                        component={Link}
                                        to={sub.path}
                                        onClick={handleMenuClose}
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
                            sx={{ color: '#fff' }}
                        >
                            {item.text}
                        </Button>
                        );
                    }
                })}
            </Box>
            <FormControlLabel
                control={
                    <Switch
                    checked={auth}
                    onChange={handleAuthToggle}
                    aria-label="login switch"
                    />
                }
                label={auth ? 'Logout' : 'Login'}
                sx={{ ml: 2 }}
            />

            {auth && (
                <>
                    <IconButton
                        size="large"
                        edge="end"
                        color="inherit"
                        onClick={handleMenuOpen('account')}
                    >
                        <AccountCircle />
                    </IconButton>
                    <Menu
                        anchorEl={menuState.anchorEl}
                        open={menuState.type === 'account'}
                        onClose={handleMenuClose}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                    >
                        <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
                        <MenuItem onClick={handleMenuClose}>My account</MenuItem>
                    </Menu>
                </>
            )}
        </Toolbar>
        </AppBar>

        {/* Drawer for mobile */}
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

    </Box>
    );
};

export default NavigationBar;