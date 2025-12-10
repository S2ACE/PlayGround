import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    wordGuess: {
      slotBorder: string;
      slotBackground: string;
      buttonBorder: string;
      inactiveKey: string;
      disable: string;
    };
    share: {
      prompt: string;
      buttonBackground: string;
      divider: string;
    };
    wordCard: {
      fontColor: string;
    };
    paper: {
      background: string;
    };
    button: {
      hover: string;
    };
  }

  interface PaletteOptions {
    wordGuess?: {
      slotBorder: string;
      slotBackground: string;
      buttonBorder?: string;
      inactiveKey: string;
      disable: string;
    };
    share?: {
      prompt?: string;
      buttonBackground?: string;
      divider?: string;
      paperBackground?: string;
    };
    wordCard?: {
      fontColor?: string;
    };
    paper?: {
      background: string;
    };
    button?: {
      hover?: string;
    };
  }
}

/* Dark theme configuration. */
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      light: '#FF9800',      // Bright orange (main button color)
      main: '#ED6C02',
      dark: '#E65100',
      contrastText: '#000',  // Black text
    },
    secondary: {
      main: '#525252',       // Gray (secondary/emphasis)
      dark: '#424242',
    },
    background: {
      default: '#181515',    // Deep dark background
      paper: '#2a2a2a',      // Card/panel background
    },
    text: {
      primary: '#f5f0e6',    // Light text
      secondary: '#2b2118',
    },
    success: {
      main: '#1b5e20',       // Green (success buttons)
    },
    error: {
      main: '#c62828',       // Red (error buttons)
    },
    wordGuess: {
      slotBorder: '#F9F4DA', // Slot border color
      slotBackground: '#323232',
      buttonBorder: '#ffffff',
      inactiveKey: '#424242',
      disable: '#242323',
    },
    share: {
      prompt: '#666666',          // Share prompt text
      buttonBackground: '#fff3e0',// Share button background
      divider: '#FF9800',
    },
    wordCard: {
      fontColor: '#2b2118',
    },
    paper: {
      background: '#2A2A2A',
    },
    button: {
      hover: 'rgba(255, 152, 0, 0.18)', // Dark-mode hover color
    },
  },
  typography: {
    fontFamily: '"Press Start 2P", "Roboto", sans-serif',
  },
});

/* Light theme configuration. */
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      light: '#FF9800',
      main: '#ED6C02',
      dark: '#E65100',
      contrastText: '#000', // Black text
    },
    secondary: {
      main: '#bdbdbd',
      dark: '#757575',
    },
    background: {
      default: '#f5f5f5',   // Light gray background
      paper: '#f5f5f5',     // Paper/card background
    },
    text: {
      primary: '#212121',   // Dark text
      secondary: '#424242',
    },
    success: {
      main: '#4caf50',
    },
    error: {
      main: '#ef5350',
    },
    wordGuess: {
      slotBorder: '#000000',
      slotBackground: '#bdbdbd',
      buttonBorder: '#000000',
      inactiveKey: '#bdbdbd',
      disable: '#242323',
    },
    share: {
      prompt: '#666666',
      buttonBackground: '#fff3e0',
      divider: '#FF9800',
    },
    wordCard: {
      fontColor: '#2b2118',
    },
    paper: {
      background: '#fff3e0',
    },
    button: {
      hover: 'rgba(255, 152, 0, 0.35)', // Light-mode hover color
    },
  },
  typography: {
    fontFamily: '"Press Start 2P", "Roboto", sans-serif',
  },
});