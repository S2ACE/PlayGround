import React, { useState } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
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
} from '@mui/material';

const NavigationBar = () => {
const [mobileOpen, setMobileOpen] = useState(false);
const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

const menuItems = [
    { text: 'Word Guess', path: '/wordguess' },
    { text: 'About', path: '/about' },
    { text: 'test', path: '/contact' },
];

const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
};

const drawer = (
  <List>
    {menuItems.map((item) => (
      <ListItem key={item.text} disablePadding>
        <ListItemButton
          component={Link}
          to={item.path}
          onClick={handleDrawerToggle}
        >
          <ListItemText primary={item.text} />
        </ListItemButton>
      </ListItem>
    ))}
  </List>
);

return (
    <>
        <AppBar position="static">
            <Toolbar>
                {isMobile && (
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                )}
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Ace Playground
                </Typography>
                {!isMobile && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {menuItems.map((item) => (
                            <Button
                                color="inherit"
                                component={Link}
                                to={item.path}
                                key={item.text}
                            >
                                {item.text}
                            </Button>
                        ))}
                    </Box>
                )}
            </Toolbar>
        </AppBar>

        <Drawer
            variant="temporary"
            anchor="left"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
                keepMounted: true, // Better mobile performance
            }}
        >
            {drawer}
        </Drawer>
    </>
);
};

export default NavigationBar;