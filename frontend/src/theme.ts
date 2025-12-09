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
      prompt: string,
      buttonBackground: string,
      divider: string,
    };
    wordCard: {
      fontColor: string;
    },
    paper: {
      background: string;
    },
    button: {
      hover: string;
    }    
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
      prompt?: string,
      buttonBackground?: string,
      divider?: string,
      paperBackground?: string,
    };
    wordCard?: {
      fontColor?: string;
    },
    paper?: {
      background: string;
    },
    button?: {
      hover?: string;
    }        
  }
}

// Dark Theme
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      light: '#FF9800',      // 亮黃橘色（按鈕主色）
      main:  '#ED6C02',    
      dark: '#E65100',
      contrastText: '#000', // 黑字
    },
    secondary: {
      main: '#525252',      // 灰色（副色/強調）
      dark: '#424242',
    },
    background: {
      default: '#181515',   // 深黑色背景#242424
      paper: '#2a2a2a',     // 卡片/面板背景
    },
    text: {
      primary: '#f5f0e6',   // 白色文字
      secondary: '#2b2118',
    },
    success: {
      main: '#1b5e20',      // 綠色（正確按鈕）
    },
    error: {
      main: '#c62828',      // 紅色（錯誤按鈕）
    },
    wordGuess: {
      slotBorder: '#F9F4DA',   // 白色格子邊框
      slotBackground: '#323232',
      buttonBorder: '#ffffff', // 白色按鈕邊框
      inactiveKey: '#424242',  // 深灰色不可用按鍵
      disable: '#242323',  // 黑色禁用文字
    },
    share: {
      prompt: '#666666', // 深灰色分享提示文字
      buttonBackground: '#fff3e0', // 淺橘色分享按鈕背景
      divider: '#FF9800',
    },   
    wordCard: {
      fontColor: '#2b2118',
    },
    paper: {
      background: '#2A2A2A',
    },
    button: {
      hover: 'rgba(255, 152, 0, 0.18)', // dark 專用 hover
    },
  },
  typography: {
    fontFamily: '"Press Start 2P", "Roboto", sans-serif', // 像素風格字體
  },
});

// Light Theme
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      light: '#FF9800',
      main:  '#ED6C02',  
      dark: '#E65100',
      contrastText: '#000', // 黑字
    },
    secondary: {
      main: '#bdbdbd',      // 藍灰色（副色/強調）
      dark: '#757575',
    },
    background: {
      default: '#f5f5f5',   // 淺灰白背景
      paper: '#f5f5f5',     // 純白卡片
    },
    text: {
      primary: '#212121',   // 深灰黑文字
      secondary: '#424242', // 中灰文字
    },
    success:{
      main: '#4caf50',      // 綠色（正確按鈕）
    },
    error: {
      main: '#ef5350',      // 紅色（錯誤按鈕）
    },
    wordGuess: {
      slotBorder: '#000000',   // 黑色格子邊框
      slotBackground: '#bdbdbd',
      buttonBorder: '#000000', // 黑色按鈕邊框
      inactiveKey: '#bdbdbd',  // 淺灰色不可用按鍵
      disable: '#242323',  // 黑色禁用文字
    },
    share: {
      prompt: '#666666', // 深灰色分享提示文字
      buttonBackground: '#fff3e0', // 淺橘色分享按鈕背景
      divider: '#FF9800',
    },
    wordCard: {
      fontColor: '#2b2118',
    },
    paper: {
      background: '#fff3e0',
    },    
    button: {
      hover: 'rgba(255, 152, 0, 0.35)', // light 專用 hover（在白底也看得見）
    },    
  },
  typography: {
    fontFamily: '"Press Start 2P", "Roboto", sans-serif',
  },
});
